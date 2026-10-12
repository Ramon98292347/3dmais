import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  LoaderCircle,
  PackageCheck,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { useCart } from "../cart/CartProvider";
import type { CustomerData } from "../catalog/types";
import { money } from "../catalog/catalogService";
import { createOrderPayload, checkoutService, validateCustomer } from "./checkoutService";
const states = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];
export function CheckoutForm({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const cart = useCart();
  const sendOrder = useServerFn(checkoutService.submitOrder);
  const [customer, setCustomer] = useState<CustomerData>({
    name: "",
    whatsapp: "",
    city: "",
    state: "",
    cep: "",
    address: "",
    number: "",
    complement: "",
  });
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"bank_deposit" | "contact">("contact");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<"form" | "review" | "success">("form");
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [lastOrderId, setLastOrderId] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const change = (key: keyof CustomerData, value: string) => {
    setOrderId(null);
    setCustomer((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };
  const review = (e: FormEvent) => {
    e.preventDefault();
    const found = validateCustomer(customer);
    setErrors(found);
    if (!Object.keys(found).length) setStage("review");
  };
  const submit = async () => {
    setBusy(true);
    setSubmitError("");
    try {
      const payload = createOrderPayload(customer, cart.items, notes, orderId ?? undefined, paymentMethod);
      setOrderId(payload.orderId);
      const result = await sendOrder({ data: payload });
      if (!result.success) {
        setSubmitError(
          result.error === "history_unavailable"
            ? "O histórico ainda não foi configurado. Execute supabase/orders.sql no SQL Editor do Supabase e tente novamente."
            : "O pedido ficou salvo no histórico, mas não conseguimos avisar o atendimento pelo webhook. Tente novamente.",
        );
        return;
      }
      setLastOrderId(payload.orderId);
      cart.clear();
      setStage("success");
    } catch {
      setSubmitError("Não foi possível enviar o pedido. Confira sua conexão e tente novamente.");
    } finally {
      setBusy(false);
    }
  };
  if (stage === "success")
    return (
      <div className="order-success">
        <div className="success-icon">
          <CircleCheck size={48} />
        </div>
        <span className="section-eyebrow">PEDIDO RECEBIDO</span>
        <h2>
          Sua ideia está
          <br />
          um passo mais perto.
        </h2>
        <p>
          Seu pedido foi enviado para atendimento. A loja poderá entrar em contato pelo WhatsApp
          informado.
        </p>
        <p className="text-xs text-muted-foreground">Código do pedido: {lastOrderId}</p>
        <Button size="lg" onClick={onClose}>
          Continuar explorando <ArrowRight />
        </Button>
      </div>
    );
  return (
    <>
      <div className="checkout-steps">
        <span className="active">
          <span>{stage === "review" ? <Check size={12} /> : "1"}</span> Seus dados
        </span>
        <i />
        <span className={stage === "review" ? "active" : ""}>
          <span>2</span> Revisão
        </span>
      </div>
      <div className="drawer-body">
        <Button
          variant="link"
          className="checkout-back"
          onClick={stage === "form" ? onBack : () => setStage("form")}
        >
          <ArrowLeft />
          {stage === "form" ? "Voltar ao carrinho" : "Editar meus dados"}
        </Button>
        {stage === "form" ? (
          <form id="checkout-form" onSubmit={review} noValidate>
            <h3>Vamos conhecer você</h3>
            <p className="checkout-subtitle">Preencha os dados para preparar seu pedido.</p>
            <div className="form-grid">
              {(
                [
                  ["name", "Nome completo", true],
                  ["whatsapp", "WhatsApp", true],
                  ["city", "Cidade", true],
                  ["state", "Estado", true],
                  ["cep", "CEP", false],
                  ["address", "Endereço", false],
                  ["number", "Número", false],
                  ["complement", "Complemento", false],
                ] as const
              ).map(([key, label, required]) => (
                <label
                  className={`field ${key === "name" || key === "address" ? "field-wide" : ""}`}
                  key={key}
                >
                  {label}
                  {required && " *"}
                  {key === "state" ? (
                    <select
                      aria-invalid={!!errors[key]}
                      aria-describedby={errors[key] ? `${key}-error` : undefined}
                      value={customer[key]}
                      onChange={(e) => change(key, e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {states.map((state) => (
                        <option key={state}>{state}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={key === "whatsapp" ? "tel" : "text"}
                      inputMode={key === "cep" ? "numeric" : undefined}
                      autoComplete={
                        key === "name"
                          ? "name"
                          : key === "whatsapp"
                            ? "tel"
                            : key === "cep"
                              ? "postal-code"
                              : key === "city"
                                ? "address-level2"
                                : key === "address"
                                  ? "street-address"
                                  : "off"
                      }
                      placeholder={
                        key === "whatsapp"
                          ? "(00) 00000-0000"
                          : key === "cep"
                            ? "00000-000"
                            : undefined
                      }
                      value={customer[key]}
                      maxLength={key === "whatsapp" ? 20 : key === "cep" ? 10 : 150}
                      aria-invalid={!!errors[key]}
                      aria-describedby={errors[key] ? `${key}-error` : undefined}
                      onChange={(e) => change(key, e.target.value)}
                    />
                  )}{" "}
                  {errors[key] && (
                    <span className="field-error" id={`${key}-error`} role="alert">
                      {errors[key]}
                    </span>
                  )}
                </label>
              ))}
              <label className="field field-wide">
                Observação do pedido
                <textarea
                  maxLength={1000}
                  value={notes}
                  onChange={(e) => {
                    setOrderId(null);
                    setNotes(e.target.value);
                  }}
                  placeholder="Há algo mais que precisamos saber?"
                />
              </label>
            </div>
          </form>
        ) : (
          <>
            <h3>Confira seu pedido</h3>
            <div className="customer-review">
              <strong>{customer.name}</strong>
              <span>{customer.whatsapp}</span>
              <span>
                {customer.city} — {customer.state}
              </span>
              {customer.address && (
                <span>
                  {customer.address}, {customer.number} {customer.complement}
                </span>
              )}
              {customer.cep && <span>CEP {customer.cep}</span>}
            </div>
            <h4 className="summary-title">Resumo do pedido</h4>
            <div className="order-summary">
              {cart.items.map((item) => (
                <div key={item.key}>
                  <div>
                    <strong>{item.product.name}</strong>
                    <small>
                      {item.quantity} × {money(item.product.price)}
                    </small>
                    {Object.entries(item.selectedOptions)
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <small key={k}>
                          {item.product.options.find((o) => o.id === k)?.label}: {v}
                        </small>
                      ))}
                  </div>
                  <strong>{money(item.product.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
            <fieldset className="payment-choice">
              <legend>Como prefere combinar o pagamento?</legend>
              <label>
                <input type="radio" name="payment-method" value="contact" checked={paymentMethod === "contact"} onChange={() => setPaymentMethod("contact")} />
                Quero combinar com a loja pelo WhatsApp
              </label>
              <label>
                <input type="radio" name="payment-method" value="bank_deposit" checked={paymentMethod === "bank_deposit"} onChange={() => setPaymentMethod("bank_deposit")} />
                Tenho interesse em depósito ou transferência bancária
              </label>
              {paymentMethod === "bank_deposit" && <p>O atendimento confirma o total e envia os dados bancários pelo WhatsApp. Não faça depósito antes dessa confirmação.</p>}
            </fieldset>
            {notes && <p className="order-notes">Observação: {notes}</p>}
          </>
        )}
        <div className="shipping-note">
          <PackageCheck />
          <p>O valor do frete e demais detalhes serão confirmados após o recebimento do pedido.</p>
        </div>
        {submitError && (
          <p role="alert" className="field-error">
            {submitError}
          </p>
        )}
      </div>
      <div className="drawer-bottom">
        <div className="cart-subtotal">
          <span>Total dos produtos</span>
          <strong>{money(cart.subtotal)}</strong>
        </div>
        {stage === "form" ? (
          <Button size="lg" type="submit" form="checkout-form">
            Revisar pedido <ArrowRight />
          </Button>
        ) : (
          <Button size="lg" disabled={busy} onClick={submit}>
            {busy ? (
              <>
                <LoaderCircle className="animate-spin" />
                Enviando pedido...
              </>
            ) : (
              <>
                Enviar pedido <ArrowRight />
              </>
            )}
          </Button>
        )}
        <p className="checkout-disclaimer">
          Sem pagamento nesta etapa. Ao finalizar, seus dados serão enviados à loja para atendimento
          do pedido.
        </p>
      </div>
    </>
  );
}
