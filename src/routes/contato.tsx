import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, ArrowRight, ShoppingBag, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { companyConfig, pageHead, whatsappUrl } from "@/features/catalog/config";
export const Route = createFileRoute("/contato")({
  head: () =>
    pageHead(
      "Contato | Criar3D.01",
      "Converse sobre produtos personalizados e soluções em impressão 3D da Criar3D.01.",
    ),
  component: ContactPage,
});
function ContactPage() {
  const whatsappContacts = companyConfig.whatsappNumbers;
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
            {whatsappContacts.length
              ? "Fale diretamente com a nossa equipe."
              : "O número de atendimento será disponibilizado em breve."}
          </p>
          {whatsappContacts.length ? (
            <div className="contact-whatsapp-list">
              {whatsappContacts.map((contact) => (
                <Button key={contact.number} asChild>
                  <a href={whatsappUrl(contact.number)!} target="_blank" rel="noreferrer">
                    {contact.display} <ArrowRight />
                  </a>
                </Button>
              ))}
            </div>
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
        <div>
          <MapPin />
          <h2>Nosso endereço</h2>
          <p>{companyConfig.address}</p>
          <Button variant="outline" asChild>
            <a href={companyConfig.mapsUrl} target="_blank" rel="noreferrer">
              Abrir no Google Maps <ArrowRight />
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
