import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  Search,
  SlidersHorizontal,
  ShoppingBag,
  X,
  Layers3,
  Sparkles,
  PackageCheck,
  ChevronRight,
  Lightbulb,
  Shapes,
  PencilRuler,
  KeyRound,
  LayoutGrid,
  Heart,
  GraduationCap,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/catalog-hero.jpg";
import { catalogService, filterProducts, money } from "./catalogService";
import { categories } from "./products.mock";
import { Drawer, ProductPhoto } from "./controls";
import { useCart } from "../cart/CartProvider";
import type { Product } from "./types";
const categoryIcons: Record<string, typeof Lightbulb> = {
  Luminárias: Lightbulb,
  "Porta-canetas": PencilRuler,
  Infantil: Shapes,
  Educacional: GraduationCap,
  Anatomia: Heart,
  Decoração: Palette,
  Personalizados: Sparkles,
  Chaveiros: KeyRound,
  Outros: PackageCheck,
};
export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  return (
    <article className="product-card">
      <Link to="/catalogo/$slug" params={{ slug: product.slug }} className="product-image">
        <ProductPhoto product={product} />
        {product.badge && (
          <span
            className={`product-badge ${product.badge === "PERSONALIZÁVEL" ? "badge-custom" : ""}`}
          >
            {product.badge === "PERSONALIZÁVEL" && <Sparkles size={11} />} {product.badge}
          </span>
        )}
        <span className="image-link">
          <ArrowRight size={16} />
        </span>
      </Link>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <Link to="/catalogo/$slug" params={{ slug: product.slug }} className="product-name">
          {product.name}
        </Link>
        <p>{product.shortDescription}</p>
        <div className="price-line">
          {product.options.length > 0 && <small>A partir de</small>}
          <strong>{money(product.price)}</strong>
        </div>
        <div className="product-actions">
          <Button variant="outline" asChild>
            <Link to="/catalogo/$slug" params={{ slug: product.slug }}>
              Ver detalhes
            </Link>
          </Button>
          {product.options.length ? (
            <Button asChild>
              <Link to="/catalogo/$slug" params={{ slug: product.slug }}>
                <ShoppingBag />
                Quero comprar
              </Link>
            </Button>
          ) : (
            <Button onClick={() => cart.add(product)}>
              <ShoppingBag />
              Quero comprar
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
export function CatalogPage({
  initialCategory = "Todos",
  categoryView = false,
}: {
  initialCategory?: string;
  categoryView?: boolean;
}) {
  const {
    data: products = [],
    isPending,
    isError,
  } = useQuery({ queryKey: ["catalog"], queryFn: catalogService.listProducts });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [price, setPrice] = useState("all");
  const [sort, setSort] = useState("recent");
  const [filterOpen, setFilterOpen] = useState(false);
  const results = filterProducts(products, { query, category, price, sort });
  const reset = () => {
    setQuery("");
    setCategory("Todos");
    setPrice("all");
    setSort("recent");
  };
  const filterPanel = (
    <>
      <div className="filter-title">
        <SlidersHorizontal size={17} />
        <h3>Filtros</h3>
        {(category !== "Todos" || price !== "all") && (
          <Button variant="link" size="sm" onClick={reset}>
            Limpar
          </Button>
        )}
      </div>
      <fieldset className="filter-group">
        <legend>Categorias</legend>
        {["Todos", ...categories].map((name) => {
          const Icon = categoryIcons[name] || LayoutGrid;
          return (
            <Button
              key={name}
              variant="ghost"
              className={`category-filter ${category === name ? "selected" : ""}`}
              onClick={() => setCategory(name)}
            >
              <Icon size={16} />
              <span>{name}</span>
              <small>
                {name === "Todos"
                  ? products.length
                  : products.filter((p) => p.category === name).length}
              </small>
            </Button>
          );
        })}
      </fieldset>
      <fieldset className="filter-group price-filter">
        <legend>Faixa de preço</legend>
        {[
          ["all", "Todos os preços"],
          ["under50", "Até R$ 50"],
          ["50to100", "R$ 50 a R$ 100"],
          ["over100", "Acima de R$ 100"],
        ].map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name="price"
              value={value}
              checked={price === value}
              onChange={() => setPrice(value ?? "all")}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <div className="made-for-you">
        <Sparkles size={23} />
        <h4>Do seu jeito.</h4>
        <p>Peças que levam a sua personalidade em cada detalhe.</p>
        <Button variant="link" asChild>
          <Link to="/catalogo/$slug" params={{ slug: "chaveiro-personalizado" }}>
            Ver personalizáveis <ArrowRight />
          </Link>
        </Button>
      </div>
    </>
  );
  return (
    <>
      <div className="breadcrumb container">
        <Link to="/catalogo">Início</Link>
        <ChevronRight size={12} />
        <span>{categoryView ? "Categorias" : "Catálogo"}</span>
      </div>
      {!categoryView ? (
        <>
          <section className="catalog-hero">
            <img
              src={hero}
              width={1536}
              height={768}
              alt="Peças de impressão 3D: luminária espiral, porta-canetas e cachepô"
              fetchPriority="high"
            />
            <div className="container hero-inner">
              <span className="eyebrow">
                <span /> TECNOLOGIA QUE DÁ FORMA À CRIATIVIDADE
              </span>
              <h1>
                Ideias que ganham forma.
                <br />
                <span>Produtos que inspiram.</span>
              </h1>
              <p>
                Produtos personalizados e impressão 3D.
                <br />
                Criados com tecnologia, feitos com cuidado.
              </p>
              <Button
                variant="hero"
                size="lg"
                onClick={() =>
                  document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explorar produtos <ArrowDown />
              </Button>
              <span className="hero-signature">
                CRIAR3D.01 <i /> RF TECNOLOGIA
              </span>
            </div>
          </section>
          <div className="trust-band">
            <div className="container">
              <span>
                <Layers3 />
                <span>
                  Produzidos com <strong>impressão 3D</strong>
                </span>
              </span>
              <span>
                <Sparkles />
                <span>
                  Personalização <strong>em cada detalhe</strong>
                </span>
              </span>
              <span>
                <PackageCheck />
                <span>
                  Cuidado do projeto <strong>até você</strong>
                </span>
              </span>
            </div>
          </div>
        </>
      ) : (
        <section className="container category-page-heading">
          <span className="eyebrow text-primary">EXPLORE AS POSSIBILIDADES</span>
          <h1>Uma ideia para cada universo.</h1>
          <p>Encontre a categoria que combina com você.</p>
          <div className="category-tabs">
            {["Todos", ...categories].map((name) => (
              <Button
                variant={category === name ? "default" : "outline"}
                key={name}
                onClick={() => setCategory(name)}
              >
                {name}
              </Button>
            ))}
          </div>
        </section>
      )}
      <section id="produtos" className="container catalog-section">
        <div className="catalog-section-heading">
          <div>
            <span className="section-eyebrow">CRIATIVIDADE EM CADA CAMADA</span>
            <h2>{categoryView ? "Explore nossos produtos" : "Encontre sua próxima ideia"}</h2>
          </div>
          <span className="demo-note">Coleção de demonstração</span>
        </div>
        <div className="search-toolbar">
          <div className="search-box">
            <Search size={20} />
            <input
              aria-label="Buscar produtos"
              placeholder="O que você está procurando?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Limpar busca"
                onClick={() => setQuery("")}
              >
                <X />
              </Button>
            )}
          </div>
          <label className="sort-box">
            <span>Ordenar por:</span>
            <select
              aria-label="Ordenar produtos"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">Mais recentes</option>
              <option value="low">Menor preço</option>
              <option value="high">Maior preço</option>
              <option value="name">Nome A–Z</option>
            </select>
          </label>
          <Button variant="outline" className="mobile-filter" onClick={() => setFilterOpen(true)}>
            <SlidersHorizontal />
            Filtrar{(category !== "Todos" || price !== "all") && " •"}
          </Button>
        </div>
        <div className="catalog-layout">
          <aside className="desktop-filters">{filterPanel}</aside>
          <div className="catalog-results">
            <div className="results-heading">
              <p aria-live="polite">
                <strong>{results.length}</strong> produtos encontrados
              </p>
              {category !== "Todos" && (
                <Button variant="secondary" size="sm" onClick={() => setCategory("Todos")}>
                  {category}
                  <X />
                </Button>
              )}
              <span>Feitos para surpreender.</span>
            </div>
            {isPending ? (
              <div className="product-grid">
                {Array.from({ length: 6 }, (_, i) => (
                  <div className="product-skeleton" key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="empty-state">
                <PackageCheck />
                <h3>Não foi possível carregar os produtos.</h3>
                <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
              </div>
            ) : results.length ? (
              <div className="product-grid">
                {results.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Search />
                <h3>{query ? "Nenhum produto encontrado" : "Nenhum produto nesta seleção"}</h3>
                <p>Que tal explorar outras ideias?</p>
                <Button variant="outline" onClick={reset}>
                  Limpar filtros
                </Button>
              </div>
            )}
            <p className="catalog-end">
              Você viu todos os {results.length} produtos desta seleção.
            </p>
          </div>
        </div>
      </section>
      <Drawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        title="Filtrar produtos"
        description="Escolha a categoria e a faixa de preço."
      >
        <div className="drawer-body">{filterPanel}</div>
        <div className="drawer-bottom">
          <Button size="lg" onClick={() => setFilterOpen(false)}>
            Ver {results.length} produtos <ArrowRight />
          </Button>
        </div>
      </Drawer>
    </>
  );
}
