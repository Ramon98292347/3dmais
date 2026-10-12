import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { ArrowLeft, Box, ClipboardList, ImagePlus, LogOut, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/features/catalog/config";
import { money } from "@/features/catalog/catalogService";

export const Route = createFileRoute("/admin")({
  head: () => pageHead("Administração | Criar3D.01", "Gerencie produtos e categorias."),
  component: AdminPage,
});

const database = supabase as unknown as SupabaseClient;
const bucket = "product-images";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};
type ProductRow = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  price: number | string;
  compare_at_price: number | string | null;
  is_active: boolean;
  is_featured: boolean;
  badge: string | null;
  material: string | null;
  dimensions: string | null;
  production_time: string | null;
  features: string[];
  notes: string | null;
  keywords: string[];
  created_at: string;
};
type OrderRow = {
  order_id: string;
  created_at: string;
  customer: {
    name: string;
    whatsapp: string;
    city: string;
    state: string;
    cep: string;
    address: string;
    number: string;
    complement: string;
  };
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    selectedOptions: Record<string, string>;
  }[];
  notes: string;
  subtotal: number | string;
};
type OptionDraft = {
  key: string;
  label: string;
  type: "text" | "select" | "textarea";
  values: string;
  required: boolean;
};
type ProductDraft = {
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  badge: string;
  material: string;
  dimensions: string;
  productionTime: string;
  features: string;
  keywords: string;
  notes: string;
  active: boolean;
  featured: boolean;
};

const emptyProduct: ProductDraft = {
  categoryId: "",
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  price: "",
  compareAtPrice: "",
  badge: "",
  material: "",
  dimensions: "",
  productionTime: "",
  features: "",
  keywords: "",
  notes: "",
  active: true,
  featured: false,
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function splitList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [bootstrapChecked, setBootstrapChecked] = useState(false);
  const [hasAdmins, setHasAdmins] = useState(true);
  const [bootstrapError, setBootstrapError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupNotice, setSignupNotice] = useState("");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersError, setOrdersError] = useState("");
  const [activeSection, setActiveSection] = useState<"products" | "orders">("products");
  const [draft, setDraft] = useState<ProductDraft>(emptyProduct);
  const [optionDrafts, setOptionDrafts] = useState<OptionDraft[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [busy, setBusy] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    void database.rpc("catalog_has_admins").then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setBootstrapError("Não foi possível verificar a configuração inicial. Aplique o arquivo supabase/admin.sql no SQL Editor do Supabase.");
      } else {
        setHasAdmins(data === true);
      }
      setBootstrapChecked(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setAuthReady(true);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
      setIsAdmin(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!session) {
      setIsAdmin(false);
      setCheckingAdmin(false);
      return;
    }
    setCheckingAdmin(true);
    void database.rpc("is_catalog_admin").then(({ data, error }) => {
      if (!active) return;
      setIsAdmin(!error && data === true);
      setCheckingAdmin(false);
      if (error) setPageError("Aplique supabase/admin.sql e autorize sua conta para liberar o painel.");
    });
    return () => {
      active = false;
    };
  }, [session?.user.id]);

  useEffect(() => {
    if (isAdmin) void loadDashboard();
  }, [isAdmin]);

  async function loadDashboard() {
    setPageError("");
    const [categoryResult, productResult, orderResult] = await Promise.all([
      database.from("categories").select("*").order("sort_order").order("name"),
      database.from("products").select("*").order("created_at", { ascending: false }),
      database.from("catalog_orders").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (categoryResult.error || productResult.error) {
      setPageError(categoryResult.error?.message || productResult.error?.message || "Falha ao carregar o painel.");
      return;
    }
    setCategories(categoryResult.data as CategoryRow[]);
    setProducts(productResult.data as ProductRow[]);
    if (orderResult.error) {
      setOrders([]);
      setOrdersError("Aplique supabase/orders.sql para ativar o histórico de pedidos.");
    } else {
      setOrders(orderResult.data as unknown as OrderRow[]);
      setOrdersError("");
    }
    setDraft((current) => ({
      ...current,
      categoryId: current.categoryId || (categoryResult.data as CategoryRow[])[0]?.id || "",
    }));
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginBusy(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setLoginError(error.message);
    setLoginBusy(false);
  }

  async function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginBusy(true);
    setLoginError("");
    setSignupNotice("");
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    if (error) {
      setLoginError(error.message);
      setLoginBusy(false);
      return;
    }
    if (data.session) {
      const { data: claimed, error: claimError } = await database.rpc("claim_first_catalog_admin");
      if (claimError) {
        setLoginError("A conta foi criada, mas não foi possível ativar o primeiro administrador. Confira se supabase/admin.sql foi aplicado.");
      } else if (claimed) {
        setIsAdmin(true);
        setHasAdmins(true);
        setSignupNotice("Conta criada e primeiro administrador ativado.");
      } else {
        setHasAdmins(true);
        setSignupNotice("A conta foi criada, mas o primeiro administrador já foi configurado por outra conta.");
      }
    } else {
      setSignupNotice("Conta criada. Confirme o e-mail e depois entre para concluir a ativação do primeiro administrador.");
    }
    setLoginBusy(false);
  }

  async function claimFirstAdmin() {
    setLoginBusy(true);
    setLoginError("");
    const { data, error } = await database.rpc("claim_first_catalog_admin");
    if (error) {
      setLoginError("Não foi possível ativar o primeiro administrador. Confira se supabase/admin.sql foi aplicado.");
    } else if (data) {
      setIsAdmin(true);
      setHasAdmins(true);
    } else {
      setHasAdmins(true);
      setLoginError("O primeiro administrador já foi cadastrado por outra conta.");
    }
    setLoginBusy(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProducts([]);
    setCategories([]);
  }

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = categoryName.trim();
    const slug = slugify(name);
    if (!name || !slug) return;
    setBusy(true);
    setPageError("");
    const { data, error } = await database
      .from("categories")
      .insert({ name, slug, sort_order: categories.length, is_active: true })
      .select("*")
      .single();
    if (error) setPageError(error.message);
    else {
      const category = data as CategoryRow;
      setCategories((current) => [...current, category]);
      setDraft((current) => ({ ...current, categoryId: current.categoryId || category.id }));
      setCategoryName("");
      setNotice("Categoria criada.");
    }
    setBusy(false);
  }

  function editProduct(product: ProductRow) {
    setLoadingOptions(true);
    setEditingId(product.id);
    setDraft({
      categoryId: product.category_id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.short_description,
      description: product.description,
      price: String(product.price),
      compareAtPrice: product.compare_at_price == null ? "" : String(product.compare_at_price),
      badge: product.badge ?? "",
      material: product.material ?? "",
      dimensions: product.dimensions ?? "",
      productionTime: product.production_time ?? "",
      features: (product.features ?? []).join("\n"),
      keywords: (product.keywords ?? []).join(", "),
      notes: product.notes ?? "",
      active: product.is_active,
      featured: product.is_featured,
    });
    setFiles([]);
    setOptionDrafts([]);
    void database
      .from("product_options")
      .select("option_key,label,option_type,option_values,is_required")
      .eq("product_id", product.id)
      .order("sort_order")
      .then(({ data, error }) => {
        if (error) {
          setPageError(error.message);
          setLoadingOptions(false);
          return;
        }
        setOptionDrafts(
          (data ?? []).map((option) => ({
            key: option.option_key,
            label: option.label,
            type: option.option_type,
            values: (option.option_values ?? []).join(", "),
            required: option.is_required,
          })),
        );
        setLoadingOptions(false);
      });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetProductForm() {
    setEditingId(null);
    setDraft({ ...emptyProduct, categoryId: categories[0]?.id ?? "" });
    setOptionDrafts([]);
    setFiles([]);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setPageError("");
    setNotice("");
    const invalidFile = files.find(
      (file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024,
    );
    if (invalidFile) {
      setPageError("Use imagens JPG, PNG ou WebP de até 5 MB.");
      setBusy(false);
      return;
    }
    const currentImageCount = editingId
      ? await database
          .from("product_images")
          .select("id", { count: "exact", head: true })
          .eq("product_id", editingId)
      : { count: 0, error: null };
    if (currentImageCount.error) {
      setPageError(currentImageCount.error.message);
      setBusy(false);
      return;
    }
    if ((currentImageCount.count ?? 0) + files.length > 10) {
      setPageError("Cada produto pode ter no máximo 10 imagens. Remova imagens antigas antes de adicionar outras.");
      setBusy(false);
      return;
    }

    const productValues = {
      category_id: draft.categoryId,
      slug: slugify(draft.slug || draft.name),
      name: draft.name.trim(),
      short_description: draft.shortDescription.trim(),
      description: draft.description.trim(),
      price: Number(draft.price),
      compare_at_price: draft.compareAtPrice ? Number(draft.compareAtPrice) : null,
      is_active: draft.active,
      is_featured: draft.featured,
      badge: draft.badge.trim() || null,
      material: draft.material.trim() || null,
      dimensions: draft.dimensions.trim() || null,
      production_time: draft.productionTime.trim() || null,
      features: splitList(draft.features),
      notes: draft.notes.trim() || null,
      keywords: splitList(draft.keywords),
    };
    let productId = editingId;
    if (editingId) {
      const { error } = await database.from("products").update(productValues).eq("id", editingId);
      if (error) {
        setPageError(error.message);
        setBusy(false);
        return;
      }
    } else {
      const { data, error } = await database.from("products").insert(productValues).select("id").single();
      if (error || !data) {
        setPageError(error?.message || "Não foi possível criar o produto.");
        setBusy(false);
        return;
      }
      productId = data.id;
    }

    try {
      const uploadedPaths: string[] = [];
      const newImages = [];
      for (const [index, file] of files.entries()) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${productId}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;
        uploadedPaths.push(path);
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        newImages.push({
          product_id: productId,
          url: data.publicUrl,
          alt: draft.name.trim(),
          sort_order: (currentImageCount.count ?? 0) + index,
          is_cover: (currentImageCount.count ?? 0) === 0 && index === 0,
        });
      }
      if (newImages.length) {
        const { error } = await database.from("product_images").insert(newImages);
        if (error) throw error;
      }
      const { error: clearOptionsError } = await database.from("product_options").delete().eq("product_id", productId);
      if (clearOptionsError) throw clearOptionsError;
      const options = optionDrafts
        .filter((option) => option.key.trim() && option.label.trim())
        .map((option, index) => ({
          product_id: productId,
          option_key: slugify(option.key).replace(/-/g, "_").replace(/^(\d)/, "option_$1"),
          label: option.label.trim(),
          option_type: option.type,
          option_values: option.type === "select" ? splitList(option.values) : [],
          is_required: option.required,
          sort_order: index,
        }));
      if (options.length) {
        const { error } = await database.from("product_options").insert(options);
        if (error) throw error;
      }
      setNotice(editingId ? "Produto atualizado." : "Produto cadastrado.");
      resetProductForm();
      await loadDashboard();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Falha ao salvar imagens ou opções do produto.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleProduct(product: ProductRow) {
    const { error } = await database
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);
    if (error) setPageError(error.message);
    else await loadDashboard();
  }

  if (!authReady || !bootstrapChecked || checkingAdmin) {
    return <main className="mx-auto min-h-[70vh] max-w-5xl px-4 py-16">Carregando administração…</main>;
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-12">
        <section className="w-full rounded-2xl border bg-card p-7 shadow-sm">
          <Link to="/catalogo" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft size={16} /> Voltar à loja
          </Link>
          <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck />
          </div>
          <h1 className="text-2xl font-bold">Área administrativa</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {hasAdmins ? "Entre com a conta autorizada para gerenciar o catálogo." : "Ainda não há administrador. Crie a primeira conta administrativa da loja."}
          </p>
          {bootstrapError && <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{bootstrapError}</p>}
          <form className="mt-6 space-y-4" onSubmit={isSigningUp ? signUp : signIn}>
            <label className="block space-y-2 text-sm font-medium">
              E-mail
              <Input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Senha
              <Input type="password" autoComplete={isSigningUp ? "new-password" : "current-password"} minLength={isSigningUp ? 8 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {loginError && <p className="text-sm text-destructive">{loginError}</p>}
            {signupNotice && <p className="text-sm text-primary">{signupNotice}</p>}
            <Button className="w-full" type="submit" disabled={loginBusy}>
              {loginBusy ? "Aguarde…" : isSigningUp ? "Criar primeiro administrador" : "Entrar"}
            </Button>
          </form>
          {!hasAdmins && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">O primeiro cadastro que confirmar o e-mail e concluir a ativação ficará como administrador. Depois disso, o cadastro inicial será fechado.</p>}
          {!bootstrapError && !hasAdmins && <button type="button" className="mt-4 text-sm text-primary underline-offset-4 hover:underline" onClick={() => { setIsSigningUp(!isSigningUp); setLoginError(""); setSignupNotice(""); }}>
            {isSigningUp ? "Já tem uma conta? Entrar" : "Criar a primeira conta de administrador"}
          </button>}
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    if (!hasAdmins) {
      return (
        <main className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-12">
          <section className="w-full rounded-2xl border bg-card p-7 shadow-sm">
            <ShieldCheck className="mb-4 text-primary" />
            <h1 className="text-2xl font-bold">Ativar primeiro administrador</h1>
            <p className="mt-2 text-sm text-muted-foreground">Não há administrador cadastrado. Se esta é sua loja, ative sua conta como o primeiro administrador.</p>
            {loginError && <p className="mt-4 text-sm text-destructive">{loginError}</p>}
            <Button className="mt-5 w-full" onClick={() => void claimFirstAdmin()} disabled={loginBusy}>{loginBusy ? "Ativando…" : "Ativar como primeiro administrador"}</Button>
            <Button className="mt-2 w-full" variant="ghost" onClick={signOut}>Sair</Button>
          </section>
        </main>
      );
    }
    return (
      <main className="mx-auto min-h-[70vh] max-w-2xl px-4 py-14">
        <section className="rounded-2xl border bg-card p-7">
          <ShieldCheck className="mb-4 text-primary" />
          <h1 className="text-2xl font-bold">Conta sem permissão administrativa</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A conta {session.user.email} entrou, mas ainda não foi autorizada para gerenciar o catálogo.
          </p>
          <pre className="mt-5 overflow-auto rounded-lg bg-muted p-4 text-xs">{`insert into public.catalog_admins (user_id)\nvalues ('${session.user.id}')\non conflict (user_id) do nothing;`}</pre>
          <div className="mt-5 flex gap-3">
            <Button variant="outline" asChild><Link to="/catalogo">Voltar à loja</Link></Button>
            <Button variant="ghost" onClick={signOut}>Sair</Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Criar3D.01</p>
          <h1 className="mt-1 text-3xl font-bold">Administração</h1>
          <p className="mt-1 text-sm text-muted-foreground">Produtos, categorias e imagens da loja.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild><Link to="/catalogo"><Box /> Ver loja</Link></Button>
          <Button variant="ghost" onClick={signOut}><LogOut /> Sair</Button>
        </div>
      </header>

      {(pageError || notice) && (
        <div className={`mb-5 rounded-lg border px-4 py-3 text-sm ${pageError ? "border-destructive/40 text-destructive" : "border-primary/30 text-primary"}`}>
          {pageError || notice}
        </div>
      )}

      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Seções administrativas">
        <Button variant={activeSection === "products" ? "default" : "outline"} onClick={() => setActiveSection("products")}>
          <Box size={16} /> Produtos e categorias
        </Button>
        <Button variant={activeSection === "orders" ? "default" : "outline"} onClick={() => setActiveSection("orders")}>
          <ClipboardList size={16} /> Histórico de pedidos ({orders.length})
        </Button>
      </nav>

      {activeSection === "orders" ? (
        <section className="space-y-4">
          <header className="rounded-2xl border bg-card p-5 shadow-sm md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Histórico de pedidos</h2>
                <p className="mt-1 text-sm text-muted-foreground">Pedidos mais recentes primeiro. O painel exibe até os últimos 100.</p>
              </div>
              <Button variant="outline" onClick={() => void loadDashboard()}>Atualizar</Button>
            </div>
          </header>
          {ordersError && <p role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800">{ordersError}</p>}
          {!ordersError && !orders.length && <p className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">Nenhum pedido recebido ainda.</p>}
          {!ordersError && orders.map((order) => (
            <article key={order.order_id} className="rounded-2xl border bg-card p-5 shadow-sm md:p-7">
              <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
                <div>
                  <h3 className="text-lg font-semibold">{order.customer.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Pedido {order.order_id.slice(0, 8).toUpperCase()} · {new Date(order.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <strong className="text-lg text-primary">{money(Number(order.subtotal))}</strong>
              </header>
              <div className="grid gap-5 py-4 md:grid-cols-2">
                <div className="space-y-1 text-sm">
                  <h4 className="font-semibold">Contato e entrega</h4>
                  <p>WhatsApp: {order.customer.whatsapp}</p>
                  <p>{order.customer.city} — {order.customer.state}{order.customer.cep ? ` · CEP ${order.customer.cep}` : ""}</p>
                  {(order.customer.address || order.customer.number || order.customer.complement) && <p>{[order.customer.address, order.customer.number, order.customer.complement].filter(Boolean).join(", ")}</p>}
                </div>
                <div className="space-y-2 text-sm">
                  <h4 className="font-semibold">Itens do pedido</h4>
                  <ul className="space-y-2">
                    {order.items.map((item, index) => (
                      <li key={`${order.order_id}-${index}`} className="border-b pb-2 last:border-0">
                        <div className="flex justify-between gap-3"><span>{item.quantity} × {item.name}</span><strong>{money(Number(item.subtotal))}</strong></div>
                        {Object.entries(item.selectedOptions ?? {}).filter(([, value]) => value).map(([key, value]) => <p key={key} className="text-xs text-muted-foreground">{key}: {value}</p>)}
                      </li>
                    ))}
                  </ul>
                  {order.notes && <p className="rounded-lg bg-muted p-3 text-xs">Observação: {order.notes}</p>}
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{editingId ? "Editar produto" : "Cadastrar produto"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Os campos marcados com * são obrigatórios.</p>
            </div>
            {editingId && <Button variant="outline" onClick={resetProductForm}>Novo produto</Button>}
          </div>
          <form className="space-y-5" onSubmit={saveProduct}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">Nome do produto *
                <Input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value, slug: editingId ? draft.slug : slugify(event.target.value) })} />
              </label>
              <label className="space-y-2 text-sm font-medium">Categoria *
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" required value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}>
                  <option value="">Selecione</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
            </div>
            {!categories.length && <p className="text-sm text-amber-700">Crie uma categoria antes de cadastrar produtos.</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">Slug da página
                <Input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: slugify(event.target.value) })} />
              </label>
              <label className="space-y-2 text-sm font-medium">Selo para lançamento
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={draft.badge} onChange={(event) => setDraft({ ...draft, badge: event.target.value })}>
                  <option value="">Sem selo</option>
                  <option value="NOVO">NOVO</option>
                  <option value="LANÇAMENTO">LANÇAMENTO</option>
                  {draft.badge && !["NOVO", "LANÇAMENTO"].includes(draft.badge.toLocaleUpperCase("pt-BR")) && <option value={draft.badge}>{draft.badge} (selo atual)</option>}
                </select>
              </label>
            </div>
            <label className="block space-y-2 text-sm font-medium">Descrição curta *
              <Input required maxLength={240} value={draft.shortDescription} onChange={(event) => setDraft({ ...draft, shortDescription: event.target.value })} />
            </label>
            <label className="block space-y-2 text-sm font-medium">Descrição completa *
              <Textarea required rows={5} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">Preço (R$) *
                <Input type="number" min="0" step="0.01" required value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} />
              </label>
              <label className="space-y-2 text-sm font-medium">Preço anterior / de (R$)
                <Input type="number" min={draft.price || "0"} step="0.01" value={draft.compareAtPrice} onChange={(event) => setDraft({ ...draft, compareAtPrice: event.target.value })} />
                <span className="block text-xs font-normal text-muted-foreground">Preencha um valor acima do preço atual para exibir o produto como promoção no carrossel.</span>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2 text-sm font-medium">Material
                <Input value={draft.material} onChange={(event) => setDraft({ ...draft, material: event.target.value })} />
              </label>
              <label className="space-y-2 text-sm font-medium">Dimensões
                <Input value={draft.dimensions} onChange={(event) => setDraft({ ...draft, dimensions: event.target.value })} />
              </label>
              <label className="space-y-2 text-sm font-medium">Prazo de produção
                <Input value={draft.productionTime} onChange={(event) => setDraft({ ...draft, productionTime: event.target.value })} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">Características <span className="font-normal text-muted-foreground">(uma por linha)</span>
                <Textarea rows={3} value={draft.features} onChange={(event) => setDraft({ ...draft, features: event.target.value })} />
              </label>
              <label className="space-y-2 text-sm font-medium">Palavras-chave <span className="font-normal text-muted-foreground">(separe por vírgula)</span>
                <Textarea rows={3} value={draft.keywords} onChange={(event) => setDraft({ ...draft, keywords: event.target.value })} />
              </label>
            </div>
            <label className="block space-y-2 text-sm font-medium">Observações
              <Textarea rows={2} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
            </label>
            <label className="block space-y-2 text-sm font-medium">Fotos do produto
              <span className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <ImagePlus size={18} /> JPG, PNG ou WebP; até 5 MB por foto e 10 por produto.
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
              </span>
              {files.length > 0 && <span className="block text-xs text-muted-foreground">{files.map((file) => file.name).join(" · ")}</span>}
            </label>

            <div className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div><h3 className="font-medium">Personalizações</h3><p className="text-xs text-muted-foreground">Campos exibidos ao cliente na página do produto.</p></div>
                <Button type="button" variant="outline" size="sm" onClick={() => setOptionDrafts([...optionDrafts, { key: "", label: "", type: "text", values: "", required: false }])}><Plus size={15} /> Adicionar</Button>
              </div>
              <div className="space-y-3">
                {optionDrafts.map((option, index) => (
                  <div className="grid gap-3 rounded-lg bg-muted/50 p-3 sm:grid-cols-2" key={`${index}-${option.key}`}>
                    <Input placeholder="Identificador (ex.: cor)" value={option.key} onChange={(event) => setOptionDrafts(optionDrafts.map((item, i) => i === index ? { ...item, key: event.target.value } : item))} />
                    <Input placeholder="Rótulo (ex.: Escolha uma cor)" value={option.label} onChange={(event) => setOptionDrafts(optionDrafts.map((item, i) => i === index ? { ...item, label: event.target.value } : item))} />
                    <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={option.type} onChange={(event) => setOptionDrafts(optionDrafts.map((item, i) => i === index ? { ...item, type: event.target.value as OptionDraft["type"] } : item))}>
                      <option value="text">Texto</option><option value="select">Lista de opções</option><option value="textarea">Texto longo</option>
                    </select>
                    {option.type === "select" && <Input placeholder="Opções separadas por vírgula" value={option.values} onChange={(event) => setOptionDrafts(optionDrafts.map((item, i) => i === index ? { ...item, values: event.target.value } : item))} />}
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={option.required} onChange={(event) => setOptionDrafts(optionDrafts.map((item, i) => i === index ? { ...item, required: event.target.checked } : item))} /> Obrigatório</label>
                    <Button className="justify-self-end" type="button" size="icon" variant="ghost" aria-label="Remover personalização" onClick={() => setOptionDrafts(optionDrafts.filter((_, i) => i !== index))}><Trash2 size={16} /></Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-5 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} /> Publicar no catálogo</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} /> Marcar como destaque</label>
            </div>
            <Button type="submit" disabled={busy || loadingOptions || !categories.length}><Save size={16} /> {busy ? "Salvando…" : loadingOptions ? "Carregando personalizações…" : editingId ? "Salvar alterações" : "Cadastrar produto"}</Button>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Categorias</h2>
            <form className="mt-4 flex gap-2" onSubmit={addCategory}>
              <Input required placeholder="Nova categoria" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
              <Button type="submit" size="icon" disabled={busy} aria-label="Criar categoria"><Plus /></Button>
            </form>
            <ul className="mt-4 space-y-2 text-sm">
              {categories.map((category) => <li className="flex justify-between gap-2 border-b pb-2" key={category.id}><span>{category.name}</span><span className="text-muted-foreground">{products.filter((product) => product.category_id === category.id).length}</span></li>)}
            </ul>
          </section>
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Produtos</h2><span className="text-sm text-muted-foreground">{products.length}</span></div>
            {products.length ? <ul className="space-y-3">{products.map((product) => <li key={product.id} className="flex items-start justify-between gap-3 border-b pb-3"><div className="min-w-0"><p className="truncate font-medium">{product.name}</p><p className="text-xs text-muted-foreground">R$ {Number(product.price).toFixed(2)} · {product.is_active ? "Publicado" : "Rascunho"}</p></div><div className="flex shrink-0 gap-1"><Button size="sm" variant="outline" onClick={() => editProduct(product)}>Editar</Button><Button size="sm" variant="ghost" onClick={() => void toggleProduct(product)}>{product.is_active ? "Ocultar" : "Publicar"}</Button></div></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>}
          </section>
        </aside>
      </div>
      )}
    </main>
  );
}
