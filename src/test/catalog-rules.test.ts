import { afterEach, describe, expect, it, vi } from "vitest";
import { products } from "../features/catalog/products.mock";
import { filterProducts } from "../features/catalog/catalogService";
import { addCartItem, clampQuantity, restoreCart, cartTotal } from "../features/cart/cartLogic";
import {
  createOrderPayload,
  lookupPostalCode,
  validateCustomer,
} from "../features/checkout/checkoutService";
import {
  normalizePhone,
  readCustomerProfile,
  saveCustomerProfile,
} from "../features/checkout/customerProfile";
const customer = {
  name: "Maria Silva",
  whatsapp: "11999999999",
  city: "São Paulo",
  state: "SP",
  cep: "",
  address: "",
  number: "",
  complement: "",
};
const product = products[0];
if (!product) throw new Error("Expected a demo product fixture");
describe("Catalog rules", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("looks up and maps a Brazilian postal code", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ logradouro: "Praça da Sé", localidade: "São Paulo", uf: "SP" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(lookupPostalCode("01001-000")).resolves.toEqual({
      address: "Praça da Sé",
      city: "São Paulo",
      state: "SP",
    });
    expect(fetchMock).toHaveBeenCalledWith("https://viacep.com.br/ws/01001000/json/", {
      signal: undefined,
    });
  });

  it("rejects invalid postal code lengths without making a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(lookupPostalCode("1234")).rejects.toThrow("invalid_cep");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("saves a customer profile by phone and retrieves it with formatted input", () => {
    const entries = new Map<string, string>();
    const storage = {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
    } as Storage;
    const savedCustomer = { ...customer, whatsapp: "27 99829-2347", city: "Vila Velha" };

    expect(normalizePhone(savedCustomer.whatsapp)).toBe("27998292347");
    expect(saveCustomerProfile(savedCustomer, storage)).toBe(true);
    expect(readCustomerProfile("(27) 99829-2347", storage)).toEqual(savedCustomer);
    expect(readCustomerProfile("27998292348", storage)).toBeNull();
  });

  it("never allows quantity below one", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-5)).toBe(1);
  });
  it("includes at least 10 demo products and no more than 10 images each", () => {
    expect(products.length).toBeGreaterThanOrEqual(10);
    expect(products.every((p) => p.images.length <= 10)).toBe(true);
  });
  it("filters up to R$50 inclusively", () => {
    const result = filterProducts(products, {
      query: "",
      category: "Todos",
      price: "under50",
      sort: "recent",
    });
    expect(result.length).toBe(6);
    expect(result.every((p) => p.price <= 50)).toBe(true);
  });
  it("filters R$50 to R$100", () => {
    expect(
      filterProducts(products, { query: "", category: "Todos", price: "50to100", sort: "low" }).map(
        (p) => p.price,
      ),
    ).toEqual([54.9, 69.9]);
  });
  it("filters above R$100", () => {
    expect(
      filterProducts(products, { query: "", category: "Todos", price: "over100", sort: "low" }).map(
        (p) => p.price,
      ),
    ).toEqual([119.9, 129.9, 149.9, 159.9]);
  });
  it("requires name WhatsApp city and state", () => {
    expect(
      Object.keys(
        validateCustomer({ ...customer, name: "", whatsapp: "", city: "", state: "" }),
      ).sort(),
    ).toEqual(["city", "name", "state", "whatsapp"]);
    expect(validateCustomer(customer)).toEqual({});
  });
  it("keeps cart data through local persistence", () => {
    const items = addCartItem([], product, 2, { color: "Azul" });
    expect(restoreCart(JSON.stringify(items), products)).toEqual(items);
  });
  it("keeps distinct customization separate", () => {
    const items = addCartItem(addCartItem([], product, 1, { color: "Azul" }), product, 2, {
      color: "Branco",
    });
    expect(items.length).toBe(2);
    expect(cartTotal(items)).toBeCloseTo(449.7);
  });
  it("builds the required payload without freight or payment", () => {
    const orderId = "00000000-0000-4000-8000-000000000001";
    const payload = createOrderPayload(customer, addCartItem([], product, 2, {}), "Teste", orderId);
    expect(payload.orderId).toBe(orderId);
    expect(payload.items[0]).toEqual({
      productId: product.id,
      name: product.name,
      quantity: 2,
      unitPrice: 149.9,
      subtotal: 299.8,
      selectedOptions: {},
    });
    expect(payload.subtotal).toBe(299.8);
    expect(payload.customer).toEqual(customer);
    expect(payload).not.toHaveProperty("shipping");
    expect(payload).not.toHaveProperty("payment");
  });
});
