export type ProductCategory = string;
export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
  isCover: boolean;
}
export interface ProductOption {
  id: string;
  label: string;
  type: "text" | "select" | "textarea";
  values?: string[];
  required?: boolean;
}
export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: ProductCategory;
  price: number;
  compareAtPrice?: number;
  isActive: boolean;
  isFeatured: boolean;
  badge?: string;
  material?: string;
  dimensions?: string;
  productionTime?: string;
  features?: string[];
  notes?: string;
  images: ProductImage[];
  options: ProductOption[];
  keywords: string[];
  createdAt: string;
}
export interface CartItem {
  key: string;
  product: Product;
  quantity: number;
  selectedOptions: Record<string, string>;
}
export interface CustomerData {
  name: string;
  whatsapp: string;
  city: string;
  state: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
}
export interface OrderPayload {
  customer: CustomerData;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    selectedOptions: Record<string, string>;
  }[];
  notes: string;
  subtotal: number;
  createdAt: string;
}
