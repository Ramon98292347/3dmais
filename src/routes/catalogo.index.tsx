import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/features/catalog/CatalogPage";
import { pageHead } from "@/features/catalog/config";
export const Route = createFileRoute("/catalogo/")({
  head: () =>
    pageHead(
      "Catálogo de Produtos | Criar3D.01",
      "Explore produtos personalizados, impressão 3D e soluções criativas da Criar3D.01 e RF Tecnologia.",
    ),
  component: CatalogPage,
});
