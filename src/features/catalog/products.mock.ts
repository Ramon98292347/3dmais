import type { Product } from "./types";
import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";
import p5 from "@/assets/product-5.jpg";
import p6 from "@/assets/product-6.jpg";
import p7 from "@/assets/product-7.jpg";
import p8 from "@/assets/product-8.jpg";
import p9 from "@/assets/product-9.jpg";
import p10 from "@/assets/product-10.jpg";
import p11 from "@/assets/product-11.jpg";
import p12 from "@/assets/product-12.jpg";
export const categories = [
  "Luminárias",
  "Porta-canetas",
  "Infantil",
  "Educacional",
  "Anatomia",
  "Decoração",
  "Personalizados",
  "Chaveiros",
  "Outros",
];
const seeds: [string, string, number, string, string, string][] = [
  [
    "Luminária Espiral",
    "Luminárias",
    149.9,
    "Luz e design para transformar seu espaço.",
    p1,
    "DESTAQUE",
  ],
  [
    "Porta-canetas Geométrico",
    "Porta-canetas",
    39.9,
    "Sua mesa organizada, com mais personalidade.",
    p2,
    "MAIS VENDIDO",
  ],
  [
    "Dinossauro Articulado",
    "Infantil",
    49.9,
    "Criatividade e diversão em cada movimento.",
    p3,
    "NOVO",
  ],
  [
    "Sistema Solar Educativo",
    "Educacional",
    119.9,
    "O universo de um jeito muito mais próximo.",
    p4,
    "",
  ],
  ["Coração Anatômico", "Anatomia", 159.9, "Detalhes que tornam o aprendizado tangível.", p5, ""],
  [
    "Vaso Texturizado",
    "Decoração",
    69.9,
    "Formas orgânicas para os seus ambientes.",
    p6,
    "DESTAQUE",
  ],
  [
    "Chaveiro Personalizado",
    "Chaveiros",
    19.9,
    "Um pequeno detalhe, a sua identidade.",
    p7,
    "PERSONALIZÁVEL",
  ],
  ["Cachepô Geométrico", "Decoração", 34.9, "Um novo lugar para a sua natureza.", p8, ""],
  ["Polvo Articulado", "Infantil", 44.9, "Um companheiro cheio de movimento.", p9, "NOVO"],
  ["Suporte para Celular", "Outros", 29.9, "Praticidade que acompanha a sua rotina.", p10, ""],
  [
    "Luminária Litofania",
    "Personalizados",
    129.9,
    "Transforme uma lembrança em luz.",
    p11,
    "PERSONALIZÁVEL",
  ],
  ["Pássaro Geométrico", "Decoração", 54.9, "Uma expressão de design e criatividade.", p12, ""],
];
export const products: Product[] = seeds.map(
  ([name, category, price, shortDescription, image, badge], i) => ({
    id: `demo-${i + 1}`,
    slug: name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, "-"),
    name,
    category,
    price,
    shortDescription,
    description: `${shortDescription} Uma peça de demonstração produzida com impressão 3D, com textura delicada e atenção a cada detalhe. Ideal para quem valoriza produtos criativos e originais.`,
    isActive: true,
    isFeatured: badge === "DESTAQUE",
    badge: badge || undefined,
    material: "PLA — polímero para impressão 3D",
    dimensions: i === 0 ? "15 × 15 × 28 cm" : "Medidas ilustrativas: 12 × 12 × 15 cm",
    productionTime: "3 a 7 dias úteis (ilustrativo)",
    features: [
      "Produzido com tecnologia de impressão 3D",
      "Acabamento com textura de camadas",
      "Design criativo e funcional",
    ],
    notes:
      "Produto, imagens, valores e prazos de demonstração. As cores podem variar conforme a tela.",
    images: [
      { id: `img-${i}`, url: image, alt: name, sortOrder: 0, isCover: true },
      {
        id: `img-${i}-detail`,
        url: image,
        alt: `Detalhe da textura — ${name}`,
        sortOrder: 1,
        isCover: false,
      },
    ],
    options:
      badge === "PERSONALIZÁVEL"
        ? [
            { id: "name", label: "Nome personalizado", type: "text" },
            {
              id: "color",
              label: "Cor",
              type: "select",
              values: ["Azul", "Branco", "Preto", "Vermelho"],
            },
            { id: "notes", label: "Observações", type: "textarea" },
          ]
        : [],
    keywords: ["impressão 3d", "criativo", name, category],
    createdAt: `2026-10-${String(12 - i).padStart(2, "0")}T12:00:00Z`,
  }),
);
