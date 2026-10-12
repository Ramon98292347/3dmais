import type { CartItem, CustomerData, OrderPayload } from "../catalog/types";
import { cartTotal } from "../cart/cartLogic";
import { submitOrderToWebhook } from "./checkout.functions";

export interface PostalAddress {
  address: string;
  city: string;
  state: string;
}

export async function lookupPostalCode(cep: string, signal?: AbortSignal): Promise<PostalAddress> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) throw new Error("invalid_cep");

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal });
  if (!response.ok) throw new Error("postal_lookup_failed");

  const data = (await response.json()) as {
    erro?: boolean;
    logradouro?: string;
    localidade?: string;
    uf?: string;
  };
  if (data.erro || !data.localidade || !data.uf) throw new Error("postal_code_not_found");

  return { address: data.logradouro ?? "", city: data.localidade, state: data.uf };
}

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
  orderId: string = crypto.randomUUID(),
): OrderPayload {
  return {
    orderId,
    customer,
    items: items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.price,
      subtotal: item.quantity * item.product.price,
      selectedOptions: Object.fromEntries(
        Object.entries(item.selectedOptions).map(([optionId, value]) => [
          item.product.options.find((option) => option.id === optionId)?.label ?? optionId,
          value,
        ]),
      ),
    })),
    notes,
    subtotal: cartTotal(items),
    createdAt: new Date().toISOString(),
  };
}
export interface CheckoutSource {
  submitOrder: typeof submitOrderToWebhook;
}
export const checkoutService: CheckoutSource = { submitOrder: submitOrderToWebhook };
