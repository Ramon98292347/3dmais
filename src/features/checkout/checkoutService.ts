import type { CartItem, CustomerData, OrderPayload } from "../catalog/types";
import { cartTotal } from "../cart/cartLogic";
export function validateCustomer(customer: CustomerData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (customer.name.trim().split(/\s+/).length < 2) errors["name"] = "Informe seu nome completo.";
  if (
    customer.whatsapp.replace(/\D/g, "").length < 10 ||
    customer.whatsapp.replace(/\D/g, "").length > 13
  )
    errors["whatsapp"] = "Informe um WhatsApp válido com DDD.";
  if (!customer.city.trim()) errors["city"] = "Informe sua cidade.";
  if (!/^[A-Z]{2}$/.test(customer.state)) errors["state"] = "Selecione seu estado.";
  if (customer.cep && customer.cep.replace(/\D/g, "").length !== 8)
    errors["cep"] = "Informe um CEP com 8 dígitos.";
  return errors;
}
export function createOrderPayload(
  customer: CustomerData,
  items: CartItem[],
  notes: string,
): OrderPayload {
  return {
    customer,
    items: items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.price,
      subtotal: item.quantity * item.product.price,
      selectedOptions: item.selectedOptions,
    })),
    notes,
    subtotal: cartTotal(items),
    createdAt: new Date().toISOString(),
  };
}
export interface CheckoutSource {
  submitOrder: (payload: OrderPayload) => Promise<{ success: boolean }>;
}
export const submitOrderMock = async (payload: OrderPayload) => {
  if (!payload.items.length || Object.keys(validateCustomer(payload.customer)).length)
    throw new Error("Confira os dados do pedido.");
  await new Promise((resolve) => setTimeout(resolve, 850));
  return { success: true };
};
export const checkoutService: CheckoutSource = { submitOrder: submitOrderMock };
