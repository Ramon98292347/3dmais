import type { CartItem, Product } from '../catalog/types';
export const clampQuantity = (quantity: number) => Math.max(1, Number.isFinite(quantity) ? Math.floor(quantity) : 1);
export const cartTotal = (items: CartItem[]) => items.reduce((sum,item)=>sum+item.product.price*item.quantity,0);
export function addCartItem(items: CartItem[], product: Product, quantity: number, selectedOptions: Record<string,string>): CartItem[] {
 const key = JSON.stringify([product.id,Object.entries(selectedOptions).sort(([a],[b])=>a.localeCompare(b))]);
 const existing=items.find(item=>item.key===key);
 return existing?items.map(item=>item.key===key?{...item,quantity:item.quantity+clampQuantity(quantity)}:item):[...items,{key,product,quantity:clampQuantity(quantity),selectedOptions}];
}
export function restoreCart(raw: string, products: Product[]): CartItem[] {
 try { const parsed: unknown = JSON.parse(raw); if(!Array.isArray(parsed)) return []; return parsed.flatMap((item: unknown) => {
 if(!item||typeof item!=='object'||!('product' in item)||!('quantity' in item)||!('selectedOptions' in item)) return [];
 const saved=item.product; if(!saved||typeof saved!=='object'||!('id' in saved))return [];
 const product=products.find(p=>p.id===saved.id); if(!product||typeof item.quantity!=='number'||!item.selectedOptions||typeof item.selectedOptions!=='object')return [];
 const options=Object.fromEntries(Object.entries(item.selectedOptions).filter((entry):entry is [string,string]=>typeof entry[1]==='string'));
 return [{key:JSON.stringify([product.id,Object.entries(options).sort(([a],[b])=>a.localeCompare(b))]),product,quantity:clampQuantity(item.quantity),selectedOptions:options}];
 }); } catch {return [];}
}
