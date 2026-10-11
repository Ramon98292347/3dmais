import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead, whatsappUrl } from "@/features/catalog/config";
export const Route = createFileRoute("/contato")({
  head: () =>
    pageHead(
      "Contato | Criar3D.01",
      "Converse sobre produtos personalizados e soluções em impressão 3D da Criar3D.01.",
    ),
  component: ContactPage,
});
function ContactPage() {
  const url = whatsappUrl();
  return (
    <main className="container contact-page">
      <span className="section-eyebrow">VAMOS CRIAR ALGO JUNTOS</span>
      <h1>Qual é a sua próxima ideia?</h1>
      <p>
        Produtos personalizados, detalhes de uma peça ou uma nova possibilidade.
        <br />A conversa começa por aqui.
      </p>
      <div className="contact-options">
        <div>
          <MessageCircle />
          <h2>WhatsApp</h2>
          <p>
            {url
              ? "Fale diretamente com a nossa equipe."
              : "O número de atendimento será disponibilizado em breve."}
          </p>
          {url ? (
            <Button asChild>
              <a href={url} target="_blank" rel="noreferrer">
                Falar no WhatsApp <ArrowRight />
              </a>
            </Button>
          ) : (
            <Button disabled>Contato em breve</Button>
          )}
        </div>
        <div>
          <ShoppingBag />
          <h2>Encontre sua ideia</h2>
          <p>Explore a coleção e prepare seu pedido de demonstração.</p>
          <Button variant="outline" asChild>
            <Link to="/catalogo">
              Explorar catálogo <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
