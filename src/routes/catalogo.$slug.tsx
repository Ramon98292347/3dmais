import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { products } from "@/features/catalog/products.mock";
import { ProductDetails } from "@/features/catalog/ProductDetails";
import { pageHead } from "@/features/catalog/config";
export const Route = createFileRoute("/catalogo/$slug")({
  loader: ({ params }) => {
    const product = products.find((p) => p.slug === params.slug && p.isActive);
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) =>
    pageHead(
      loaderData ? `${loaderData.name} | Criar3D.01` : "Produto não encontrado | Criar3D.01",
      loaderData?.shortDescription || "Explore outros produtos do catálogo Criar3D.01.",
    ),
  component: ProductPage,
  notFoundComponent: () => (
    <div className="container empty-state">
      <h1>Produto não encontrado</h1>
      <Link to="/catalogo">Voltar ao catálogo</Link>
    </div>
  ),
});
function ProductPage() {
  const product = Route.useLoaderData();
  return <ProductDetails product={product} />;
}
