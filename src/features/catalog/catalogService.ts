import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "./types";

type CategoryRow = { id: string; name: string };
type ProductRow = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  price: number | string;
  compare_at_price: number | string | null;
  is_active: boolean;
  is_featured: boolean;
  badge: string | null;
  material: string | null;
  dimensions: string | null;
  production_time: string | null;
  features: string[];
  notes: string | null;
  keywords: string[];
  created_at: string;
};
type ProductImageRow = {
  id: string;
  product_id: string;
  url: string;
  alt: string;
  sort_order: number;
  is_cover: boolean;
};
type ProductOptionRow = {
  id: string;
  product_id: string;
  label: string;
  option_type: "text" | "select" | "textarea";
  option_values: string[];
  is_required: boolean;
  sort_order: number;
};

const database = supabase as unknown as SupabaseClient;

async function fetchProducts(): Promise<Product[]> {
  const [categories, productRows, imageRows, optionRows] = await Promise.all([
    database.from("categories").select("id, name").eq("is_active", true),
    database
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    database.from("product_images").select("*").order("sort_order"),
    database.from("product_options").select("*").order("sort_order"),
  ]);

  for (const result of [categories, productRows, imageRows, optionRows]) {
    if (result.error) throw new Error(`Falha ao carregar o catálogo: ${result.error.message}`);
  }

  const categoryNames = new Map(
    (categories.data as CategoryRow[]).map((category) => [category.id, category.name]),
  );
  const imagesByProduct = new Map<string, ProductImageRow[]>();
  for (const image of imageRows.data as ProductImageRow[]) {
    const images = imagesByProduct.get(image.product_id) ?? [];
    images.push(image);
    imagesByProduct.set(image.product_id, images);
  }
  const optionsByProduct = new Map<string, ProductOptionRow[]>();
  for (const option of optionRows.data as ProductOptionRow[]) {
    const options = optionsByProduct.get(option.product_id) ?? [];
    options.push(option);
    optionsByProduct.set(option.product_id, options);
  }

  return (productRows.data as ProductRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    category: categoryNames.get(row.category_id) ?? "",
    price: Number(row.price),
    ...(row.compare_at_price === null ? {} : { compareAtPrice: Number(row.compare_at_price) }),
    isActive: row.is_active,
    isFeatured: row.is_featured,
    ...(row.badge ? { badge: row.badge } : {}),
    ...(row.material ? { material: row.material } : {}),
    ...(row.dimensions ? { dimensions: row.dimensions } : {}),
    ...(row.production_time ? { productionTime: row.production_time } : {}),
    features: row.features ?? [],
    ...(row.notes ? { notes: row.notes } : {}),
    images: (imagesByProduct.get(row.id) ?? []).map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      sortOrder: image.sort_order,
      isCover: image.is_cover,
    })),
    options: (optionsByProduct.get(row.id) ?? []).map((option) => ({
      id: option.id,
      label: option.label,
      type: option.option_type,
      values: option.option_values,
      required: option.is_required,
    })),
    keywords: row.keywords ?? [],
    createdAt: row.created_at,
  }));
}

export interface CatalogSource {
  listProducts: () => Promise<Product[]>;
  getProductBySlug: (slug: string) => Promise<Product | undefined>;
}
export const catalogService: CatalogSource = {
  listProducts: fetchProducts,
  getProductBySlug: async (slug) =>
    (await fetchProducts()).find((product) => product.slug === slug),
};
export const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export interface CatalogFilters {
  query: string;
  category: string;
  price: string;
  sort: string;
}
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function filterProducts(items: Product[], filters: CatalogFilters) {
  const result = items.filter(
    (p) =>
      p.isActive &&
      (filters.category === "Todos" || p.category === filters.category) &&
      normalize([p.name, p.category, ...p.keywords].join(" ")).includes(normalize(filters.query)) &&
      (filters.price === "all" ||
        (filters.price === "under50" && p.price <= 50) ||
        (filters.price === "50to100" && p.price >= 50 && p.price <= 100) ||
        (filters.price === "over100" && p.price > 100)),
  );
  return result.sort((a, b) =>
    filters.sort === "low"
      ? a.price - b.price
      : filters.sort === "high"
        ? b.price - a.price
        : filters.sort === "name"
          ? a.name.localeCompare(b.name, "pt-BR")
          : b.createdAt.localeCompare(a.createdAt),
  );
}
