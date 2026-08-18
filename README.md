# FB Burguer

Nova versão do cardápio digital da FB Burguer, construída com Next.js, TypeScript, Tailwind CSS e Supabase.

## Conceito da V2

- Marca: **FB Burguer**.
- Interface limpa e mobile-first, inspirada nos padrões de navegação de apps de delivery, sem copiar identidade visual de terceiros.
- Sem imagem hero grande: a identidade da loja aparece em um cabeçalho compacto com a nova logo.
- O site **não processa pagamentos**. A forma de pagamento é apenas uma informação da comanda.
- Todo pedido encaminhado ao WhatsApp precisa ser salvo primeiro como **comanda aberta**.
- Uma comanda aberta não entra no faturamento.
- O administrador pode ajustar cliente, endereço, observações, itens, quantidades, valores, taxa e desconto.
- Ao clicar em **Fechar comanda e confirmar venda**, a comanda passa a contar como venda no dashboard.
- Comandas também podem ser canceladas e não entram nas vendas.

## Stack

- Next.js 16 / App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase PostgreSQL + Auth + RLS
- Vercel

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_BUSINESS_SLUG=fb-burguer
```

Nunca envie `.env.local` para o GitHub.

## Banco

Execute as migrations em ordem:

1. `supabase/migrations/202608170001_initial_schema.sql`
2. `supabase/migrations/202608170002_fb_burguer_comandas.sql`

Depois execute `supabase/seed.sql` para inserir a FB Burguer e o cardápio inicial.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Validação antes do push

```bash
npm run build
```

## Rotas principais

- `/` — cardápio
- `/checkout` — revisão e criação da comanda antes do WhatsApp
- `/admin/login` — login administrativo
- `/admin` — dashboard de vendas confirmadas
- `/admin/comandas` — comandas abertas, fechadas e canceladas
- `/admin/cardapio` — gestão do cardápio (base preparada para o CRUD)
