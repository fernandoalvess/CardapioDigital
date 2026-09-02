-- Gestão real do cardápio.

alter table public.products
  add column if not exists is_active boolean not null default true;

create index if not exists idx_products_business_active
  on public.products(business_id, is_active, category_id, sort_order);

-- Bucket público: apenas as imagens são públicas. Upload/remoção são feitos
-- exclusivamente por rotas server-side após validar o administrador.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
