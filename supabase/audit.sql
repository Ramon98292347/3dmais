-- Auditoria somente leitura. Execute no SQL Editor do banco existente.
-- Não retorna registros de clientes, credenciais ou dados de pedidos.
select table_schema, table_name, column_name, data_type, is_nullable,
       column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
order by c.relname;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select conrelid::regclass as table_name, conname, contype,
       pg_get_constraintdef(oid) as definition
from pg_constraint
where connamespace = 'public'::regnamespace
order by conrelid::regclass::text, conname;

select routine_schema, routine_name, data_type, security_type
from information_schema.routines
where routine_schema = 'public'
order by routine_name;

select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
order by table_name, grantee, privilege_type;
