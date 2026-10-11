import { createFileRoute } from '@tanstack/react-router';
import { CatalogPage } from '@/features/catalog/CatalogPage';
import { pageHead } from '@/features/catalog/config';
export const Route=createFileRoute('/categorias')({head:()=>pageHead('Categorias | Criar3D.01','Explore luminárias, decoração, produtos educacionais e peças personalizadas de impressão 3D.'),component:()=> <CatalogPage categoryView/>});
