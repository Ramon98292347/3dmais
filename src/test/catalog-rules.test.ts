import { describe, expect, it } from "vitest";
import { products } from "../features/catalog/products.mock";
import { filterProducts } from "../features/catalog/catalogService";
import { addCartItem, clampQuantity, restoreCart, cartTotal } from "../features/cart/cartLogic";
import {
  createOrderPayload,
  validateCustomer,
  submitOrderMock,
} from "../features/checkout/checkoutService";
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
describe("Catalog rules", () => {
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
    const payload = createOrderPayload(customer, addCartItem([], product, 2, {}), "Teste");
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
  it("simulates a successful order", async () => {
    expect(
      await submitOrderMock(createOrderPayload(customer, addCartItem([], product, 1, {}), "")),
    ).toEqual({ success: true });
  });
});
