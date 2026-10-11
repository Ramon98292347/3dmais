import { products } from "./products.mock";
import type { Product } from "./types";
export interface CatalogSource {
  listProducts: () => Promise<Product[]>;
}
export const catalogService: CatalogSource = { listProducts: async () => products };
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
