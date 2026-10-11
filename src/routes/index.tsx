import { createFileRoute, redirect } from '@tanstack/react-router';
import { pageHead } from '@/features/catalog/config';
export const Route = createFileRoute('/')({head:()=>pageHead('Criar3D.01 | Produtos e impressão 3D','Catálogo de produtos personalizados da Criar3D.01 e RF Tecnologia.'),beforeLoad:()=>{throw redirect({to:'/catalogo'});}});
