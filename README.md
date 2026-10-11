# Criar3D.01

Catálogo online de produtos impressos em 3D, com painel administrativo para gerenciar categorias, produtos, personalizações e imagens. Os dados do catálogo são carregados diretamente do Supabase.

## Desenvolvimento local

Requer Node.js e npm.

```sh
npm install
npm run dev
```

Configure as variáveis do Supabase no arquivo `.env`:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publishable
VITE_SUPABASE_PROJECT_ID=seu_project_id
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua_chave_publishable
```

Use somente a chave publishable no cliente. Nunca coloque chaves `service_role` ou `sb_secret` no frontend ou em arquivos versionados.

## Configuração do banco

Os scripts SQL estão em `supabase/`. Confira o banco existente antes de aplicar `catalog.sql`; em um projeto Supabase novo, aplique `catalog.sql` e depois `admin.sql` no SQL Editor.

Acesse `/admin` para criar a primeira conta administrativa. O cadastro inicial só aparece enquanto não houver administrador. Com a confirmação de e-mail habilitada, confirme o endereço e entre para concluir a ativação.

## Verificação

```sh
npx tsc --noEmit
npm run build
```
