import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const orderPayloadSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: z.enum(["bank_deposit", "contact"]),
  customer: z.object({
    name: z.string().trim().min(1).max(150),
    whatsapp: z.string().trim().min(1).max(20),
    city: z.string().trim().min(1).max(150),
    state: z.string().regex(/^[A-Z]{2}$/),
    cep: z.string().max(10),
    address: z.string().max(150),
    number: z.string().max(150),
    complement: z.string().max(150),
  }),
  items: z.array(z.object({
    productId: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(160),
    quantity: z.number().int().min(1).max(99),
    unitPrice: z.number().finite().min(0).max(10_000_000),
    subtotal: z.number().finite().min(0).max(10_000_000),
    selectedOptions: z.record(z.string().max(120), z.string().max(500)),
  })).min(1).max(25),
  notes: z.string().max(1000),
  subtotal: z.number().finite().min(0).max(100_000_000),
  createdAt: z.string().datetime(),
});

const webhookUrl = "https://n8n-n8n.ynlng8.easypanel.host/webhook/3dmais";
const database = supabase as unknown as SupabaseClient;

export const submitOrderToWebhook = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const parsed = orderPayloadSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("Confira os dados do pedido.");
    }
    const customer = parsed.data.customer;
    const phoneLength = customer.whatsapp.replace(/\D/g, "").length;
    if (customer.name.trim().split(/\s+/).length < 2 || phoneLength < 10 || phoneLength > 13) {
      throw new Error("Confira os dados do pedido.");
    }

    const calculatedSubtotal = parsed.data.items.reduce((total, item) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      if (Math.abs(lineSubtotal - item.subtotal) > 0.01) {
        throw new Error("O resumo do pedido é inválido.");
      }
      return total + lineSubtotal;
    }, 0);
    if (Math.abs(calculatedSubtotal - parsed.data.subtotal) > 0.01) {
      throw new Error("O resumo do pedido é inválido.");
    }
    return parsed.data;
  })
  .handler(async ({ data }) => {
    const { error: recordError } = await database.rpc("record_catalog_order", { p_order: data });
    if (recordError) {
      console.error("Falha ao registrar o pedido no histórico.", recordError.code, recordError.message);
      return { success: false, error: "history_unavailable" as const };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json", "accept": "application/json" },
        body: JSON.stringify({ event: "order.created", ...data }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Webhook respondeu com status ${response.status}.`);
      }
      return { success: true, orderId: data.orderId };
    } catch (error) {
      console.error("Falha ao enviar pedido ao webhook do n8n.", error);
      return { success: false, error: "webhook_unavailable" as const };
    } finally {
      clearTimeout(timeout);
    }
  });
