# Entrega — Catálogo Criar3D.01, etapa 1

- Páginas: /catalogo, /catalogo/$slug, /categorias, /sobre e /contato. / redireciona ao catálogo.
- Componentes separados para catálogo, cards, galeria, opções, quantidade, navegação, carrinho, formulário, revisão e sucesso.
- 12 produtos genéricos de demonstração, com imagens geradas e preços/prazos ilustrativos.
- Pesquisa por nome, categoria e palavras-chave; categorias, três faixas de preço e quatro ordenações.
- Galeria limitada a 10 imagens, com miniaturas, setas, gesto no celular, contador e ampliação. Mocks usam capa e recorte de detalhe da mesma foto, não ângulos reais diferentes.
- Carrinho com quantidades, personalização, remoção, subtotal e persistência em localStorage validada contra os produtos atuais.
- Checkout com dados obrigatórios, endereço opcional, observação, revisão e sucesso exclusivamente simulado.
- OrderPayload tipado com cliente, itens, opções, valores, observação e data.
- catalogService e checkoutService usam interfaces substituíveis para futuras integrações. Fotos recebidas por image.url. Nenhuma integração real, URL de webhook, banco, pagamento ou cálculo de frete.
- Layout verificado em 1280, 768 e 390 px. Busca, ordenação, filtros no celular, galeria, carrinho, persistência e pedido completo testados pelo navegador, sem erros de execução.
- 11 testes automatizados aprovados.
- Lint: 0 erros, 7 avisos de Fast Refresh (6 nos componentes da base e 1 no provedor do carrinho).
- Typecheck e build automáticos: aprovados no registro da plataforma.
- Pendente: fornecer o número real do WhatsApp; nenhum número foi inventado.
