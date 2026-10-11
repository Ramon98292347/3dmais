import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Layers3, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/features/catalog/config";
import hero from "@/assets/catalog-hero.jpg";
export const Route = createFileRoute("/sobre")({
  head: () =>
    pageHead(
      "Sobre nós | Criar3D.01 + RF Tecnologia",
      "Criatividade, impressão 3D e cuidado em cada detalhe. Conheça a Criar3D.01 e RF Tecnologia.",
    ),
  component: () => (
    <main className="container about-page">
      <span className="section-eyebrow">CRIAR3D.01 + RF TECNOLOGIA</span>
      <h1>
        Transformamos ideias
        <br />
        em produtos.
      </h1>
      <p className="about-intro">
        Tecnologia e criatividade, juntas para dar forma a novas possibilidades.
      </p>
      <img
        src={hero}
        alt="Luminária e peças produzidas com impressão 3D"
        width={1536}
        height={768}
      />
      <div className="about-values">
        {[
          [
            Layers3,
            "Tecnologia que cria",
            "Impressão 3D para transformar ideias em objetos tangíveis.",
          ],
          [
            Sparkles,
            "Sua personalidade",
            "Soluções criativas e produtos que podem levar a sua identidade.",
          ],
          [
            Heart,
            "Cuidado em cada detalhe",
            "Atenção à forma, à textura e ao resultado de cada peça.",
          ],
        ].map(([Icon, title, text]) => {
          const C = Icon as typeof Layers3;
          return (
            <div key={String(title)}>
              <C />
              <h2>{String(title)}</h2>
              <p>{String(text)}</p>
            </div>
          );
        })}
      </div>
      <Button asChild size="lg">
        <Link to="/catalogo">
          Conheça os produtos <ArrowRight />
        </Link>
      </Button>
    </main>
  ),
});
