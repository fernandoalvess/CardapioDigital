# FB Hamburgueria V2

Nova base do cardápio digital da FB Hamburgueria, migrada da versão HTML/JavaScript para uma aplicação full-stack.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase (Postgres, Auth e RLS)

## O que já está nesta primeira etapa

- Cardápio responsivo reconstruído em React.
- 16 produtos e 4 categorias migrados da V1.
- Imagens legadas convertidas para WebP e reduzidas.
- Busca no cardápio.
- Navegação por categoria.
- Carrinho persistente em `localStorage`.
- Contador correto por quantidade de unidades.
- Checkout inicial.
- Endpoint `/api/orders` com validação Zod e reprecificação no servidor.
- Login administrativo preparado com Supabase SSR, Proxy e verificação de membership.
- Dashboard inicial e tela de cardápio no admin.
- Schema PostgreSQL multiempresa com RLS.
- Seed da FB Hamburgueria.
- Fallback local: o site roda sem Supabase para desenvolvimento visual.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Conectando ao Supabase

1. Crie um projeto no Supabase.
2. Copie `.env.example` para `.env.local`.
3. Preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
4. Execute a migration:
   - `supabase/migrations/202608170001_initial_schema.sql`
5. Execute:
   - `supabase/seed.sql`

Depois crie um usuário no Supabase Auth e associe-o à loja:

```sql
insert into public.business_members (business_id, user_id, role)
values (
  '10000000-0000-4000-8000-000000000001',
  'UUID_DO_USUARIO_AUTH',
  'owner'
);
```

## Rotas

- `/` — cardápio
- `/checkout` — checkout
- `/admin/login` — login administrativo
- `/admin` — dashboard
- `/admin/cardapio` — visão do cardápio

## Próxima etapa recomendada

Implementar o CRUD real no painel:

- criar/editar/excluir categoria;
- criar/editar produto;
- upload de imagem no Supabase Storage;
- alternar disponibilidade;
- reordenar itens;
- validação de permissões por papel.
