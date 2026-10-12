export const companyConfig = {
  name: "Criar3D.01",
  partner: "RF Tecnologia",
  whatsapp: "",
  whatsappMessage: "Olá! Gostaria de saber mais sobre os produtos da Criar3D.01.",
  address: "Rua Presidente Costa e Silva, Castelo Branco, Cariacica - ES, 29140-822",
  mapsUrl: "https://maps.app.goo.gl/tpf6b2PgahMMQ8Rj6",
};
export const whatsappUrl = () =>
  companyConfig.whatsapp
    ? `https://wa.me/${companyConfig.whatsapp}?text=${encodeURIComponent(companyConfig.whatsappMessage)}`
    : null;
export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
