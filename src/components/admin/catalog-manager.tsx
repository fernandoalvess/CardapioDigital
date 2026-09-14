"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ImageOff,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { Controller, useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCategory, AdminProduct } from "@/lib/admin-catalog";
import { formatBRL } from "@/lib/format";
import {
  categorySchema,
  productSchema,
  type CategoryFormValues,
  type ProductFormValues,
} from "@/lib/validation/catalog";

type DialogState =
  | { type: "category"; category: AdminCategory | null }
  | { type: "product"; product: AdminProduct | null }
  | null;

export function CatalogManager({
  categories: initialCategories,
  products: initialProducts,
}: {
  categories: AdminCategory[];
  products: AdminProduct[];
}) {
  const router = useRouter();
  const categories = initialCategories;
  const products = initialProducts;
  const [dialog, setDialog] = useState<DialogState>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [busyKey, setBusyKey] = useState<string | null>(null);


  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products
      .filter((product) =>
        categoryFilter === "all" ? true : product.categoryId === categoryFilter,
      )
      .filter((product) => {
        if (!term) return true;
        const category = categoryById.get(product.categoryId)?.name ?? "";
        return [product.name, product.description, category]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "pt-BR"));
  }, [categoryById, categoryFilter, products, search]);

  async function quickProductPatch(product: AdminProduct, patch: Partial<AdminProduct>) {
    setBusyKey(`product:${product.id}`);
    try {
      await requestJson(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      toast.success("Produto atualizado.");
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyKey(null);
    }
  }

  async function removeProduct(product: AdminProduct) {
    if (!window.confirm(`Excluir “${product.name}” do cardápio? O histórico das comandas será preservado.`)) {
      return;
    }
    setBusyKey(`product:${product.id}`);
    try {
      await requestJson(`/api/admin/products/${product.id}`, { method: "DELETE" });
      toast.success("Produto excluído.");
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyKey(null);
    }
  }

  async function removeCategory(category: AdminCategory) {
    if (!window.confirm(`Excluir a categoria “${category.name}”?`)) return;
    setBusyKey(`category:${category.id}`);
    try {
      await requestJson(`/api/admin/categories/${category.id}`, { method: "DELETE" });
      toast.success("Categoria excluída.");
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyKey(null);
    }
  }

  function finishDialog() {
    setDialog(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--brand)]">Gestão</p>
          <h1 className="mt-1 text-3xl font-black">Cardápio</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Gerencie produtos e categorias sem precisar fazer um novo deploy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setDialog({ type: "category", category: null })}>
            <Plus className="h-4 w-4" />
            Nova categoria
          </Button>
          <Button type="button" onClick={() => setDialog({ type: "product", product: null })} disabled={categories.length === 0}>
            <Plus className="h-4 w-4" />
            Novo produto
          </Button>
        </div>
      </div>

      <section className="mt-7 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">Categorias</h2>
            <p className="mt-1 text-sm text-zinc-500">Organize os grupos exibidos no cardápio.</p>
          </div>
          <span className="text-sm font-bold text-zinc-400">{categories.length} cadastrada(s)</span>
        </div>

        {categories.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => {
              const productCount = products.filter((product) => product.categoryId === category.id).length;
              const busy = busyKey === `category:${category.id}`;
              return (
                <div key={category.id} className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 ${category.isActive ? "border-zinc-200" : "border-dashed border-zinc-300 bg-zinc-50"}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="truncate text-sm">{category.name}</strong>
                      {!category.isActive && <StatusPill tone="zinc">Oculta</StatusPill>}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{productCount} produto(s) · ordem {category.sortOrder}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <IconButton label={`Editar ${category.name}`} onClick={() => setDialog({ type: "category", category })}>
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                    <IconButton label={`Excluir ${category.name}`} danger disabled={busy} onClick={() => void removeCategory(category)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
            Cadastre uma categoria antes de adicionar produtos.
          </p>
        )}
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-4 md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black">Produtos</h2>
              <p className="mt-1 text-sm text-zinc-500">Busque e altere a disponibilidade diretamente na lista.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_200px] lg:w-[520px]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produto" className="pl-10" />
              </label>
              <NativeSelect value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="all">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </NativeSelect>
            </div>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead className="bg-zinc-50 text-xs font-black uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3">Produto</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3">Preço</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visibleProducts.map((product) => {
                const busy = busyKey === `product:${product.id}`;
                return (
                  <tr key={product.id} className="transition hover:bg-zinc-50">
                    <td className="px-5 py-4"><ProductIdentity product={product} /></td>
                    <td className="px-5 py-4 text-sm text-zinc-600">{categoryById.get(product.categoryId)?.name ?? "Sem categoria"}</td>
                    <td className="px-5 py-4"><strong className="whitespace-nowrap text-sm text-[var(--brand-dark)]">{formatBRL(product.price)}</strong></td>
                    <td className="px-5 py-4"><ProductStatus product={product} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" disabled={busy} onClick={() => void quickProductPatch(product, { isAvailable: !product.isAvailable })} className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${product.isAvailable ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                          {product.isAvailable ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          {product.isAvailable ? "Disponível" : "Indisponível"}
                        </button>
                        <button type="button" onClick={() => setDialog({ type: "product", product })} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-bold text-zinc-600 hover:bg-zinc-50">
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </button>
                        <IconButton label={`Excluir ${product.name}`} danger disabled={busy} onClick={() => void removeProduct(product)}>
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-zinc-100 md:hidden">
          {visibleProducts.map((product) => {
            const busy = busyKey === `product:${product.id}`;
            return (
              <article key={product.id} className="p-4">
                <div className="flex gap-3">
                  <ProductImage product={product} />
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-zinc-950">{product.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">{categoryById.get(product.categoryId)?.name ?? "Sem categoria"}</p>
                    <p className="mt-1 font-black text-[var(--brand-dark)]">{formatBRL(product.price)}</p>
                  </div>
                </div>
                <div className="mt-3"><ProductStatus product={product} /></div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={() => void quickProductPatch(product, { isAvailable: !product.isAvailable })} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-100 px-3 text-sm font-bold text-zinc-700">
                    {product.isAvailable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} Disponibilidade
                  </button>
                  <button type="button" onClick={() => setDialog({ type: "product", product })} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 text-sm font-bold text-zinc-700">
                    <Pencil className="h-4 w-4" /> Editar
                  </button>
                  <IconButton label={`Excluir ${product.name}`} danger disabled={busy} onClick={() => void removeProduct(product)}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </article>
            );
          })}
        </div>

        {visibleProducts.length === 0 && (
          <div className="p-10 text-center text-sm text-zinc-500">Nenhum produto encontrado com os filtros atuais.</div>
        )}
        <div className="border-t border-zinc-100 p-4 text-sm text-zinc-500 md:px-5">
          {visibleProducts.length} produto(s) encontrado(s)
        </div>
      </section>

      {dialog?.type === "category" && (
        <CategoryDialog category={dialog.category} onClose={() => setDialog(null)} onDone={finishDialog} />
      )}
      {dialog?.type === "product" && (
        <ProductDialog product={dialog.product} categories={categories} onClose={() => setDialog(null)} onDone={finishDialog} />
      )}
    </>
  );
}

function CategoryDialog({ category, onClose, onDone }: { category: AdminCategory | null; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      sortOrder: category?.sortOrder ?? 0,
      isActive: category?.isActive ?? true,
    },
  });

  async function submit(values: CategoryFormValues) {
    setBusy(true);
    try {
      await requestJson(category ? `/api/admin/categories/${category.id}` : "/api/admin/categories", {
        method: category ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      toast.success(category ? "Categoria atualizada." : "Categoria criada.");
      onDone();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>Defina o nome, a ordem e se a categoria aparece no cardápio.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="grid gap-4">
          <FormField label="Nome" error={errors.name?.message}><Input placeholder="Ex.: Combos" {...register("name")} /></FormField>
          <FormField label="Ordem de exibição" error={errors.sortOrder?.message}><Input type="number" min={0} {...register("sortOrder", { valueAsNumber: true })} /></FormField>
          <ToggleField label="Categoria ativa" description="Categorias inativas não aparecem no cardápio do cliente." inputProps={register("isActive")} />
          <DialogActions busy={busy} onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProductDialog({ product, categories, onClose, onDone }: { product: AdminProduct | null; categories: AdminCategory[]; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { register, control, handleSubmit, setValue, setError, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      categoryId: product?.categoryId ?? categories[0]?.id ?? "",
      imageUrl: product?.imageUrl ?? "",
      sortOrder: product?.sortOrder ?? 0,
      isAvailable: product?.isAvailable ?? true,
      isFeatured: product?.isFeatured ?? false,
      isActive: product?.isActive ?? true,
    },
  });
  const imageUrl = useWatch({ control, name: "imageUrl" });

  async function submit(values: ProductFormValues) {
    setBusy(true);
    try {
      await requestJson(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: product ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      toast.success(product ? "Produto atualizado." : "Produto criado.");
      onDone();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    setUploading(true);
    const form = new FormData();
    form.set("file", file);
    try {
      const result = await requestJson<{ imageUrl?: unknown }>("/api/admin/products/image", { method: "POST", body: form });
      if (typeof result.imageUrl !== "string") throw new Error("A imagem foi enviada, mas a URL não foi retornada.");
      setValue("imageUrl", result.imageUrl, { shouldDirty: true, shouldValidate: true });
      toast.success("Imagem enviada.");
    } catch (error) {
      setError("imageUrl", { type: "server", message: errorMessage(error) });
      toast.error(errorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent wide>
        <DialogHeader>
          <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>Cadastre os dados que serão exibidos no cardápio.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-[180px_1fr]">
            <div>
              <p className="mb-2 text-sm font-bold">Imagem <span className="font-normal text-zinc-400">(opcional)</span></p>
              <label className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 hover:border-orange-300">
                {imageUrl ? (
                  <>
                    <Image src={imageUrl} alt="Prévia do produto" fill className="object-cover" sizes="180px" />
                    <button type="button" onClick={(event) => { event.preventDefault(); setValue("imageUrl", "", { shouldDirty: true, shouldValidate: true }); }} className="absolute bottom-2 right-2 z-10 inline-flex h-8 items-center gap-1 rounded-lg bg-white/95 px-2.5 text-xs font-black text-red-600 shadow-sm hover:bg-white">
                      <Trash2 className="h-3.5 w-3.5" /> Remover
                    </button>
                  </>
                ) : (
                  <div className="text-center text-zinc-400"><ImagePlus className="mx-auto h-7 w-7" /><span className="mt-2 block text-xs font-bold">Adicionar imagem</span><span className="mt-1 block text-xs">ou deixe sem imagem</span></div>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
                {uploading && <div className="absolute inset-0 grid place-items-center bg-white/80 text-xs font-black text-[var(--brand-dark)]">Enviando...</div>}
              </label>
              <input type="hidden" {...register("imageUrl")} />
              <p className="mt-2 text-xs leading-5 text-zinc-400">JPG, PNG, WebP ou AVIF. Máx. 5 MB.</p>
              <FieldError message={errors.imageUrl?.message} />
            </div>

            <div className="grid gap-4">
              <FormField label="Nome" error={errors.name?.message}><Input placeholder="Ex.: X-Bacon" {...register("name")} /></FormField>
              <FormField label="Descrição" error={errors.description?.message}><Textarea rows={3} placeholder="Ingredientes e detalhes do produto" {...register("description")} /></FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Preço (R$)" error={errors.price?.message}>
                  <Controller control={control} name="price" render={({ field }) => (
                    <NumericFormat customInput={Input} decimalSeparator="," thousandSeparator="." decimalScale={2} fixedDecimalScale allowNegative={false} prefix="R$ " value={field.value} onValueChange={({ floatValue }) => field.onChange(floatValue ?? 0)} onBlur={field.onBlur} getInputRef={field.ref} />
                  )} />
                </FormField>
                <FormField label="Categoria" error={errors.categoryId?.message}>
                  <NativeSelect {...register("categoryId")}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}{!category.isActive ? " (oculta)" : ""}</option>)}</NativeSelect>
                </FormField>
              </div>
              <FormField label="Ordem de exibição" error={errors.sortOrder?.message}><Input type="number" min={0} {...register("sortOrder", { valueAsNumber: true })} /></FormField>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl bg-zinc-50 p-4 sm:grid-cols-3">
            <ToggleField label="Ativo" description="Se desligado, some do cardápio." inputProps={register("isActive")} />
            <ToggleField label="Disponível" description="Use quando o item acabar." inputProps={register("isAvailable")} />
            <ToggleField label="Destaque" description="Exibe na área de destaques." inputProps={register("isFeatured")} />
          </div>
          <DialogActions busy={busy || uploading} onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProductIdentity({ product }: { product: AdminProduct }) {
  return (
    <div className="flex min-w-[220px] items-center gap-3">
      <ProductImage product={product} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="truncate text-sm text-zinc-950">{product.name}</strong>
          {product.isFeatured && <StatusPill tone="orange"><Star className="h-3 w-3 fill-current" /> Destaque</StatusPill>}
        </div>
        <p className="mt-1 max-w-xs truncate text-xs text-zinc-500">{product.description || "Sem descrição"}</p>
      </div>
    </div>
  );
}

function ProductImage({ product }: { product: AdminProduct }) {
  return product.imageUrl ? (
    <Image src={product.imageUrl} alt={product.name} width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl bg-zinc-100 object-cover" />
  ) : (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-zinc-400"><ImageOff className="h-4 w-4" /></div>
  );
}

function ProductStatus({ product }: { product: AdminProduct }) {
  if (!product.isActive) return <StatusPill tone="zinc">Oculto</StatusPill>;
  return product.isAvailable ? <StatusPill tone="green">Disponível</StatusPill> : <StatusPill tone="red">Indisponível</StatusPill>;
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="grid gap-2"><span className="text-sm font-bold">{label}</span>{children}<FieldError message={error} /></label>;
}

function ToggleField({ label, description, inputProps }: { label: string; description: string; inputProps: UseFormRegisterReturn }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--brand)]" {...inputProps} />
      <span><strong className="block text-sm">{label}</strong><span className="mt-0.5 block text-xs leading-4 text-zinc-500">{description}</span></span>
    </label>
  );
}

function DialogActions({ busy, onClose }: { busy: boolean; onClose: () => void }) {
  return <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button></div>;
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="text-xs font-medium text-red-600">{message}</span> : null;
}

function StatusPill({ children, tone }: { children: React.ReactNode; tone: "orange" | "red" | "zinc" | "green" }) {
  const className = tone === "orange" ? "bg-orange-50 text-orange-700" : tone === "red" ? "bg-red-50 text-red-700" : tone === "green" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${className}`}>{children}</span>;
}

function IconButton({ label, danger = false, disabled = false, onClick, children }: { label: string; danger?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition disabled:opacity-40 ${danger ? "text-red-500 hover:bg-red-50" : "text-zinc-600 hover:bg-zinc-100"}`}>{children}</button>;
}

async function requestJson<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "Não foi possível concluir a operação.");
  return result as T;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}
