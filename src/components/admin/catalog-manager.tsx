"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ImagePlus,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { formatBRL } from "@/lib/format";
import type { AdminCategory, AdminProduct } from "@/lib/admin-catalog";

type DialogState =
  | { type: "category"; category: AdminCategory | null }
  | { type: "product"; product: AdminProduct | null }
  | null;

export function CatalogManager({
  categories,
  products,
}: {
  categories: AdminCategory[];
  products: AdminProduct[];
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const grouped = useMemo(
    () =>
      categories.map((category) => ({
        category,
        products: products.filter((product) => product.categoryId === category.id),
      })),
    [categories, products],
  );

  async function quickProductPatch(product: AdminProduct, patch: Partial<AdminProduct>) {
    setBusyId(product.id);
    setMessage(null);
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const result = await response.json().catch(() => ({}));
    setBusyId(null);
    if (!response.ok) {
      setMessage({ type: "error", text: result.error ?? "Não foi possível atualizar o produto." });
      return;
    }
    router.refresh();
  }

  async function removeProduct(product: AdminProduct) {
    if (!window.confirm(`Excluir “${product.name}” do cardápio? O histórico das comandas será preservado.`)) return;
    setBusyId(product.id);
    setMessage(null);
    const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    setBusyId(null);
    if (!response.ok) {
      setMessage({ type: "error", text: result.error ?? "Não foi possível excluir o produto." });
      return;
    }
    setMessage({ type: "success", text: "Produto excluído." });
    router.refresh();
  }

  async function removeCategory(category: AdminCategory) {
    if (!window.confirm(`Excluir a categoria “${category.name}”?`)) return;
    setBusyId(category.id);
    setMessage(null);
    const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    setBusyId(null);
    if (!response.ok) {
      setMessage({ type: "error", text: result.error ?? "Não foi possível excluir a categoria." });
      return;
    }
    setMessage({ type: "success", text: "Categoria excluída." });
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6500]">Gestão</p>
          <h1 className="mt-1 text-3xl font-black">Cardápio</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Produtos e categorias são atualizados no Supabase e refletidos no cardápio do cliente sem novo deploy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDialog({ type: "category", category: null })}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-700 transition hover:bg-zinc-50"
          >
            <Plus className="h-4 w-4" />
            Nova categoria
          </button>
          <button
            type="button"
            onClick={() => setDialog({ type: "product", product: null })}
            disabled={categories.length === 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ff6500] px-4 text-sm font-black text-white transition hover:bg-[#e85b00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Novo produto
          </button>
        </div>
      </div>

      {message && (
        <div className={`mt-5 rounded-xl border p-4 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <div className="mt-7 space-y-6">
        {grouped.map(({ category, products: categoryProducts }) => (
          <section key={category.id} className={`rounded-3xl border bg-white p-5 shadow-sm md:p-6 ${category.isActive ? "border-zinc-200" : "border-dashed border-zinc-300 opacity-75"}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black">{category.name}</h2>
                    {!category.isActive && <StatusPill tone="zinc">Oculta</StatusPill>}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{categoryProducts.length} produto(s) · ordem {category.sortOrder}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDialog({ type: "category", category })}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  type="button"
                  onClick={() => removeCategory(category)}
                  disabled={busyId === category.id}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40"
                  aria-label={`Excluir ${category.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {categoryProducts.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-400">
                Nenhum produto nesta categoria.
              </div>
            ) : (
              <div className="mt-5 divide-y divide-zinc-100">
                {categoryProducts.map((product) => (
                  <article key={product.id} className="flex flex-col gap-4 py-4 first:pt-0 sm:flex-row sm:items-center">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 shrink-0 rounded-2xl bg-zinc-100 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-zinc-950">{product.name}</p>
                        {product.isFeatured && <StatusPill tone="orange"><Star className="h-3 w-3 fill-current" /> Destaque</StatusPill>}
                        {!product.isActive && <StatusPill tone="zinc">Oculto</StatusPill>}
                        {product.isActive && !product.isAvailable && <StatusPill tone="red">Indisponível</StatusPill>}
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{product.description || "Sem descrição"}</p>
                      <p className="mt-1 font-black text-[#e85b00]">{formatBRL(product.price)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={busyId === product.id}
                        onClick={() => quickProductPatch(product, { isAvailable: !product.isAvailable })}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${product.isAvailable ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
                      >
                        {product.isAvailable ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {product.isAvailable ? "Disponível" : "Indisponível"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDialog({ type: "product", product })}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProduct(product)}
                        disabled={busyId === product.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40"
                        aria-label={`Excluir ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {dialog?.type === "category" && (
        <CategoryDialog category={dialog.category} onClose={() => setDialog(null)} onDone={() => { setDialog(null); router.refresh(); }} />
      )}
      {dialog?.type === "product" && (
        <ProductDialog product={dialog.product} categories={categories} onClose={() => setDialog(null)} onDone={() => { setDialog(null); router.refresh(); }} />
      )}
    </>
  );
}

function CategoryDialog({ category, onClose, onDone }: { category: AdminCategory | null; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      sortOrder: Number(form.get("sortOrder") ?? 0),
      isActive: form.get("isActive") === "on",
    };
    const response = await fetch(category ? `/api/admin/categories/${category.id}` : "/api/admin/categories", {
      method: category ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setError(result.error ?? "Não foi possível salvar a categoria."); return; }
    onDone();
  }

  return (
    <Modal title={category ? "Editar categoria" : "Nova categoria"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <TextField label="Nome" name="name" defaultValue={category?.name ?? ""} placeholder="Ex.: Combos" />
        <TextField label="Ordem de exibição" name="sortOrder" type="number" min="0" defaultValue={String(category?.sortOrder ?? 0)} />
        <ToggleField label="Categoria ativa" name="isActive" defaultChecked={category?.isActive ?? true} description="Categorias inativas não aparecem no cardápio do cliente." />
        {error && <ErrorBox>{error}</ErrorBox>}
        <DialogActions busy={busy} onClose={onClose} />
      </form>
    </Modal>
  );
}

function ProductDialog({ product, categories, onClose, onDone }: { product: AdminProduct | null; categories: AdminCategory[]; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true); setError("");
    const form = new FormData(); form.set("file", file);
    const response = await fetch("/api/admin/products/image", { method: "POST", body: form });
    const result = await response.json().catch(() => ({}));
    setUploading(false);
    if (!response.ok) { setError(result.error ?? "Não foi possível enviar a imagem."); return; }
    setImageUrl(result.imageUrl);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
      price: Number(String(form.get("price") ?? "0").replace(",", ".")),
      categoryId: String(form.get("categoryId") ?? ""),
      imageUrl,
      sortOrder: Number(form.get("sortOrder") ?? 0),
      isAvailable: form.get("isAvailable") === "on",
      isFeatured: form.get("isFeatured") === "on",
      isActive: form.get("isActive") === "on",
    };
    const response = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
      method: product ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setError(result.error ?? "Não foi possível salvar o produto."); return; }
    onDone();
  }

  return (
    <Modal title={product ? "Editar produto" : "Novo produto"} onClose={onClose} wide>
      <form onSubmit={submit} className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-[180px_1fr]">
          <div>
            <p className="mb-2 text-sm font-bold">Imagem</p>
            <label className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 hover:border-orange-300">
              {imageUrl ? (
                <Image src={imageUrl} alt="Prévia do produto" fill className="object-cover" sizes="180px" />
              ) : (
                <div className="text-center text-zinc-400"><ImagePlus className="mx-auto h-7 w-7" /><span className="mt-2 block text-xs font-bold">Adicionar imagem</span></div>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
              {uploading && <div className="absolute inset-0 grid place-items-center bg-white/80 text-xs font-black text-[#e85b00]">Enviando...</div>}
            </label>
            <p className="mt-2 text-xs leading-5 text-zinc-400">JPG, PNG, WebP ou AVIF. Máx. 5 MB.</p>
          </div>

          <div className="grid gap-4">
            <TextField label="Nome" name="name" defaultValue={product?.name ?? ""} placeholder="Ex.: X-Bacon" />
            <label className="grid gap-2"><span className="text-sm font-bold">Descrição</span><textarea name="description" rows={3} defaultValue={product?.description ?? ""} className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" placeholder="Ingredientes e detalhes do produto" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Preço (R$)" name="price" type="number" step="0.01" min="0" defaultValue={String(product?.price ?? "")} placeholder="0,00" />
              <label className="grid gap-2"><span className="text-sm font-bold">Categoria</span><select name="categoryId" defaultValue={product?.categoryId ?? categories[0]?.id} className="min-h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-orange-400">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}{!category.isActive ? " (oculta)" : ""}</option>)}</select></label>
            </div>
            <TextField label="Ordem de exibição" name="sortOrder" type="number" min="0" defaultValue={String(product?.sortOrder ?? 0)} />
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl bg-zinc-50 p-4 sm:grid-cols-3">
          <ToggleField label="Ativo" name="isActive" defaultChecked={product?.isActive ?? true} description="Se desligado, some do cardápio." />
          <ToggleField label="Disponível" name="isAvailable" defaultChecked={product?.isAvailable ?? true} description="Use quando o item acabar." />
          <ToggleField label="Destaque" name="isFeatured" defaultChecked={product?.isFeatured ?? false} description="Exibe na área de destaques." />
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        <DialogActions busy={busy || uploading} onClose={onClose} />
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6 ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-xl font-black">{title}</h2><button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200"><X className="h-4 w-4" /></button></div>{children}</div></div>;
}

function TextField({ label, name, defaultValue, type = "text", placeholder, min, step }: { label: string; name: string; defaultValue: string; type?: string; placeholder?: string; min?: string; step?: string }) {
  return <label className="grid gap-2"><span className="text-sm font-bold">{label}</span><input required name={name} type={type} min={min} step={step} defaultValue={defaultValue} placeholder={placeholder} className="min-h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" /></label>;
}

function ToggleField({ label, name, defaultChecked, description }: { label: string; name: string; defaultChecked: boolean; description: string }) {
  return <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 h-4 w-4 accent-[#ff6500]" /><span><strong className="block text-sm">{label}</strong><span className="mt-0.5 block text-xs leading-4 text-zinc-500">{description}</span></span></label>;
}

function DialogActions({ busy, onClose }: { busy: boolean; onClose: () => void }) {
  return <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4"><button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-bold text-zinc-500 hover:bg-zinc-100">Cancelar</button><button type="submit" disabled={busy} className="min-h-11 rounded-xl bg-[#ff6500] px-5 text-sm font-black text-white hover:bg-[#e85b00] disabled:opacity-50">{busy ? "Salvando..." : "Salvar"}</button></div>;
}

function ErrorBox({ children }: { children: React.ReactNode }) { return <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{children}</div>; }

function StatusPill({ children, tone }: { children: React.ReactNode; tone: "orange" | "red" | "zinc" }) {
  const className = tone === "orange" ? "bg-orange-50 text-orange-700" : tone === "red" ? "bg-red-50 text-red-700" : "bg-zinc-100 text-zinc-600";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${className}`}>{children}</span>;
}
