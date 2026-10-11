import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { CartItem, Product } from '../catalog/types';
import { products } from '../catalog/products.mock';
import { addCartItem, cartTotal, clampQuantity, restoreCart } from './cartLogic';
interface CartContextValue { items: CartItem[]; count: number; subtotal: number; open: boolean; setOpen: (open:boolean)=>void; add: (product:Product,quantity?:number,options?:Record<string,string>)=>void; update: (key:string,quantity:number)=>void; remove: (key:string)=>void; clear:()=>void }
const CartContext=createContext<CartContextValue | null>(null);
export const CART_STORAGE_KEY='criar3d-cart-v1';
export function CartProvider({children}:{children:ReactNode}) {
 const [items,setItems]=useState<CartItem[]>([]); const [ready,setReady]=useState(false);const [open,setOpen]=useState(false);
 useEffect(()=>{try{setItems(restoreCart(localStorage.getItem(CART_STORAGE_KEY)||'[]',products));}catch{}setReady(true);},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem(CART_STORAGE_KEY,JSON.stringify(items));}catch{}},[items,ready]);
 const add=(product:Product,quantity=1,options:Record<string,string>={})=>{setItems(prev=>addCartItem(prev,product,quantity,options));toast.success('Produto adicionado ao carrinho.',{action:{label:'Ver carrinho',onClick:()=>setOpen(true)}});};
 return <CartContext.Provider value={{items,count:items.reduce((sum,item)=>sum+item.quantity,0),subtotal:cartTotal(items),open,setOpen,add,update:(key,q)=>setItems(prev=>prev.map(item=>item.key===key?{...item,quantity:clampQuantity(q)}:item)),remove:key=>setItems(prev=>prev.filter(item=>item.key!==key)),clear:()=>setItems([])}}>{children}</CartContext.Provider>;
}
export function useCart(){const cart=useContext(CartContext);if(!cart)throw new Error('CartProvider required');return cart;}
