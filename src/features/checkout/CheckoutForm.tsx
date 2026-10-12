import { useEffect, useState, type FormEvent } from "react";
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
import {
  createOrderPayload,
  checkoutService,
  lookupPostalCode,
  validateCustomer,
} from "./checkoutService";
import { readCustomerProfile, saveCustomerProfile } from "./customerProfile";
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<"form" | "review" | "success">("form");
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [lastOrderId, setLastOrderId] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [postalLookup, setPostalLookup] = useState<
    "idle" | "loading" | "success" | "not-found" | "failed"
  >("idle");
  const [profileFound, setProfileFound] = useState(false);
  useEffect(() => {
    const digits = customer.whatsapp.replace(/\D/g, "");
    setProfileFound(false);
    if (digits.length < 10 || digits.length > 13) return;

    const timeout = window.setTimeout(() => {
      let profile;
      try {
        profile = readCustomerProfile(digits, window.localStorage);
      } catch {
        return;
      }
      if (!profile) return;
      setCustomer((current) => ({ ...profile, whatsapp: current.whatsapp }));
      setErrors((current) => ({ ...current, name: "", city: "", state: "", cep: "" }));
      setProfileFound(true);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [customer.whatsapp]);
  useEffect(() => {
    const digits = customer.cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setPostalLookup("idle");
      return;
    }

    const controller = new AbortController();
    setPostalLookup("loading");
    lookupPostalCode(digits, controller.signal)
      .then((address) => {
        setCustomer((current) => ({
          ...current,
          address: address.address || current.address,
          city: address.city,
          state: address.state,
        }));
        setErrors((current) => ({ ...current, city: "", state: "" }));
        setPostalLookup("success");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setPostalLookup(
          error instanceof Error && error.message === "postal_code_not_found"
            ? "not-found"
            : "failed",
        );
      });

    return () => controller.abort();
  }, [customer.cep]);
  const change = (key: keyof CustomerData, value: string) => {
    setOrderId(null);
    const normalizedValue =
      key === "cep"
        ? value
            .replace(/\D/g, "")
            .slice(0, 8)
            .replace(/^(\d{5})(\d)/, "$1-$2")
        : value;
    setCustomer((prev) => ({ ...prev, [key]: normalizedValue }));
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
      const payload = createOrderPayload(customer, cart.items, notes, orderId ?? undefined);
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
      try {
        saveCustomerProfile(customer, window.localStorage);
      } catch {
        // The order can still complete when browser storage is unavailable.
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
                  ["whatsapp", "WhatsApp", true],
                  ["name", "Nome completo", true],
                  ["cep", "CEP", false],
                  ["city", "Cidade", true],
                  ["state", "Estado", true],
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
                  {key === "cep" && postalLookup !== "idle" && (
                    <span className="field-hint" role="status" aria-live="polite">
                      {postalLookup === "loading" && "Buscando endereço..."}
                      {postalLookup === "success" &&
                        "Endereço preenchido pelo CEP. Confira os dados."}
                      {postalLookup === "not-found" &&
                        "CEP não encontrado. Confira ou preencha o endereço manualmente."}
                      {postalLookup === "failed" &&
                        "Não foi possível buscar o CEP. Preencha o endereço manualmente."}
                    </span>
                  )}
                  {key === "whatsapp" && profileFound && (
                    <span className="field-hint" role="status">
                      Encontramos seus dados neste aparelho e preenchemos o formulário. Confira
                      antes de continuar.
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
