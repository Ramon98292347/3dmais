# Catálogo Criar3D.01
- [x] Identidade, imagens demonstrativas e páginas públicas.
- [x] Busca, filtros, detalhes, galeria e personalização.
- [x] Carrinho local, checkout e sucesso simulado.
- [x] Testes das regras e verificação desktop, tablet e celular.
- [ ] WhatsApp real — aguardando número da empresa.

## Etapa 2 — somente banco do catálogo
- [ ] Auditar banco e autorização multi-tenant existentes — bloqueado: banco existente ainda não conectado a este projeto.
- [ ] Criar e aplicar migrations de catálogo reutilizando tenants e regras existentes — depende da auditoria.
- [ ] Adicionar tipos independentes do frontend e testes SQL das regras e do isolamento — depende do esquema auditado.
- [ ] Validar migrations e testes; entregar relatório, sem alterar mocks nem conectar o frontend — depende do acesso ao banco.