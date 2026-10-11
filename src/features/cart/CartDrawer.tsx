import { useState } from "react";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, ProductPhoto, QuantitySelector } from "../catalog/controls";
import { money } from "../catalog/catalogService";
import { CheckoutForm } from "../checkout/CheckoutForm";
import { useCart } from "./CartProvider";
export function CartDrawer() {
  const cart = useCart();
  const [checkout, setCheckout] = useState(false);
  const close = (open: boolean) => {
    cart.setOpen(open);
    if (!open) setCheckout(false);
  };
  return (
    <Drawer
      open={cart.open}
      onOpenChange={close}
      title={checkout ? "Seu pedido" : "Seu carrinho"}
      description={checkout ? "Cada detalhe importa." : "Suas ideias favoritas, em um só lugar."}
    >
      {checkout ? (
        <CheckoutForm onBack={() => setCheckout(false)} onClose={() => close(false)} />
      ) : cart.items.length ? (
        <>
          <div className="drawer-body cart-items">
            {cart.items.map((item) => (
              <div className="cart-item" key={item.key}>
                <div className="cart-item-image">
                  <ProductPhoto product={item.product} />
                </div>
                <div className="cart-item-content">
                  <strong>{item.product.name}</strong>
                  {Object.entries(item.selectedOptions)
                    .filter(([, value]) => value)
                    .map(([key, value]) => (
                      <small key={key}>
                        {item.product.options.find((o) => o.id === key)?.label}: {value}
                      </small>
                    ))}
                  <small>{money(item.product.price)} / un.</small>
                  <div className="cart-item-controls">
                    <QuantitySelector
                      value={item.quantity}
                      onChange={(q) => cart.update(item.key, q)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover ${item.product.name}`}
                      onClick={() => cart.remove(item.key)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <strong className="item-subtotal">
                    {money(item.quantity * item.product.price)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
          <div className="drawer-bottom">
            <div className="cart-subtotal">
              <span>Subtotal</span>
              <strong>{money(cart.subtotal)}</strong>
            </div>
            <p>Frete confirmado posteriormente.</p>
            <Button size="lg" onClick={() => setCheckout(true)}>
              Finalizar pedido <ArrowRight />
            </Button>
            <Button variant="ghost" onClick={() => close(false)}>
              Continuar comprando
            </Button>
          </div>
        </>
      ) : (
        <div className="empty-state empty-cart">
          <ShoppingBag size={44} />
          <h3>Seu carrinho está esperando uma ideia.</h3>
          <p>Explore a coleção e encontre algo que é a sua cara.</p>
          <Button onClick={() => close(false)}>
            Explorar produtos <ArrowRight />
          </Button>
        </div>
      )}
    </Drawer>
  );
}
