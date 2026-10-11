# Banco do catálogo

## Situação verificada em 11/10/2026

O projeto configura o Supabase `beqcmzhyfqadcblxqdru`, mas os tipos locais não
contêm tabelas e o catálogo e checkout usam mocks. Isso não prova que o banco
remoto esteja vazio. O roadmap exige auditar e reutilizar os tenants e a
autorização existentes. A URL e a chave pública estão no `.env`; não há senha
do banco nem token de administração Supabase no ambiente. A chave pública
permite conectar o cliente da aplicação, mas não aplicar migrations.
Nenhuma migration foi aplicada e nenhum dado remoto foi alterado.

## Modelo proposto para a etapa 2

Após a auditoria, adaptar chaves e políticas ao modelo de empresas existente:

- Categorias: empresa, nome, slug e ordem de exibição; slug único por empresa.
- Produtos: empresa, categoria, slug, nome, descrições, preço decimal,
  preço anterior opcional, ativo, destaque, selo, material, dimensões,
  prazo de produção, características, notas, palavras-chave e datas.
- Imagens: empresa, produto, URL, texto alternativo, posição e indicador de capa.
  Limitar a dez posições por produto e uma capa por produto.
- Opções: empresa, produto, identificador, rótulo, tipo (text/select/textarea),
  valores disponíveis, obrigatoriedade e ordem.

Usar valores monetários exatos com restrições de valores não negativos.
As referências entre produto, categoria, imagem e opção devem impedir
associações entre empresas diferentes, inclusive em escritas privilegiadas.
Slugs devem ser únicos dentro da empresa, não globalmente.

Habilitar RLS em todas as tabelas novas. A leitura pública, se fizer parte
das regras existentes, deve expor apenas o catálogo publicado e seus filhos.
A escrita deve exigir vínculo e papel autorizado na empresa. Não conceder
acesso de escrita a visitantes e não confiar em tenant_id enviado pelo cliente
como prova de autorização.

## Execução pendente

1. Autenticar o Supabase CLI para este projeto, ou executar
   `supabase/audit.sql` no SQL Editor do projeto `beqcmzhyfqadcblxqdru`.
2. Identificar tenants, membros e funções de
   autorização. A consulta inspeciona metadados, não registros de clientes.
3. Escrever a migration conforme o esquema auditado e validar em transação:
   isolamento entre empresas, restrições de preço, slugs, imagens, referências
   cruzadas e leitura de produtos inativos.
4. Aplicar a migration e atualizar os tipos do Supabase a partir do banco.

Conforme a etapa 2 do roadmap, manter o frontend e seus mocks nesta entrega.
Persistência de pedidos e clientes pertence a uma integração posterior.
Não cadastrar automaticamente os produtos fictícios como produtos reais.
