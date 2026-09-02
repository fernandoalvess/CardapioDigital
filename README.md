# 🍔 FB Burguer

Sistema completo de cardápio digital e gestão de pedidos para hamburguerias, desenvolvido com **Next.js, TypeScript, Supabase e Vercel**.

> Projeto full stack criado para digitalizar o processo de pedidos de uma hamburgueria: o cliente monta o pedido pelo celular, a comanda é registrada no banco de dados e a equipe gerencia pedidos, cardápio e vendas através de um painel administrativo.

## 🌐 Links

- **Demo:** https://fbburguer.vercel.app/
- **GitHub:** https://github.com/fernandoalvess/CardapioDigital

---

## ✨ Visão geral

O **FB Burguer** foi desenvolvido para substituir um fluxo de pedidos baseado apenas em mensagens por uma aplicação web estruturada, responsiva e integrada a banco de dados.

O sistema permite que clientes consultem o cardápio, adicionem produtos à sacola, preencham os dados do pedido e escolham a forma de pagamento. Antes do encaminhamento ao WhatsApp, a aplicação registra automaticamente uma **comanda no Supabase**, garantindo rastreabilidade e controle das vendas.

Além da experiência do cliente, o projeto conta com uma área administrativa protegida para gerenciamento de comandas, produtos, categorias, disponibilidade e operação da loja.

---

## 🎯 Problema resolvido

Em operações pequenas de delivery, pedidos recebidos apenas por WhatsApp podem gerar problemas como:

- perda de pedidos;
- dificuldade para acompanhar comandas abertas;
- divergência de preços;
- ausência de histórico de vendas;
- dificuldade para atualizar o cardápio;
- falta de controle sobre produtos indisponíveis;
- erros ao calcular totais, taxas e descontos.

O FB Burguer centraliza esse fluxo em uma aplicação única, mantendo o WhatsApp como canal de comunicação sem abrir mão de controle interno e persistência dos dados.

---

## 🚀 Principais funcionalidades

### Área do cliente

- Cardápio digital responsivo
- Busca de produtos
- Filtro por categorias
- Produtos em destaque
- Controle de disponibilidade
- Produtos com ou sem imagem
- Sacola persistida no navegador
- Controle de quantidade dos itens
- Checkout
- Máscara de telefone
- Endereço e observações do pedido
- Seleção de forma de pagamento
- Pix, dinheiro e cartão na entrega
- Campo de troco para pagamentos em dinheiro
- Validação de horário de funcionamento
- Bloqueio de novos pedidos quando a loja está fechada
- Exibição do próximo horário de abertura
- Criação da comanda antes do redirecionamento ao WhatsApp
- Layout mobile-first
- Suporte a instalação como PWA/atalho na tela inicial

### Painel administrativo

- Autenticação de administrador
- Dashboard operacional
- Quantidade de comandas abertas
- Vendas do dia
- Faturamento diário
- Ticket médio
- Resumo por forma de pagamento
- Produtos mais vendidos
- Listagem e filtros de comandas
- Busca por número, cliente, telefone ou endereço
- Visualização detalhada de pedidos
- Adição e remoção de itens em comandas abertas
- Alteração da quantidade dos itens
- Aplicação de taxa de entrega e desconto
- Anotações administrativas
- Fechamento de comandas
- Cancelamento de pedidos
- Preservação dos dados originais do cliente
- CRUD de categorias
- CRUD de produtos
- Upload de imagens
- Produto ativo/inativo
- Produto disponível/indisponível
- Destaques do cardápio
- Ordenação de produtos e categorias

---

## 🧠 Decisões de arquitetura

### A comanda é criada antes do WhatsApp

Um dos principais cuidados do projeto foi evitar que o WhatsApp fosse aberto antes da persistência do pedido.

O fluxo é:

```text
Cliente finaliza o pedido
        ↓
Validação no servidor
        ↓
Consulta do horário da loja
        ↓
Consulta dos produtos e preços no banco
        ↓
Criação da comanda no Supabase
        ↓
Registro dos itens da comanda
        ↓
Redirecionamento para o WhatsApp
```

Dessa forma, mesmo que a conversa no WhatsApp não seja concluída, existe um registro interno da tentativa de pedido.

### O preço não é confiado ao navegador

O frontend envia principalmente os identificadores dos produtos e suas quantidades.

O servidor consulta os valores diretamente no banco de dados antes de calcular o total do pedido, reduzindo o risco de manipulação de preço pelo cliente.

### Dados do cliente não são editados pelo administrador

Depois da criação de uma comanda, nome, telefone, endereço e dados originais do cliente permanecem preservados.

O painel permite editar **o pedido**, por exemplo:

- adicionar um refrigerante;
- remover um item;
- alterar quantidade;
- aplicar desconto;
- adicionar taxa;
- registrar uma observação interna.

Essa regra também é protegida no backend/banco, e não apenas pela interface.

### Histórico das vendas preservado

Os itens da comanda armazenam um snapshot de informações importantes do produto no momento da compra.

Assim, mesmo que um produto seja posteriormente alterado ou removido do cardápio, pedidos antigos continuam mantendo os dados necessários para consulta.

---

## 🛠️ Tecnologias

### Frontend

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Lucide React**
- Componentes reutilizáveis inspirados em shadcn/ui

### Backend

- **Next.js Route Handlers**
- **Node.js**
- **Supabase**
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security / políticas de acesso
- Funções RPC para operações críticas

### Infraestrutura

- **Vercel**
- **Git**
- **GitHub**
- Supabase Cloud

---

## 🏗️ Arquitetura

```text
┌──────────────────────────┐
│       Cliente Web        │
│    Next.js / React       │
└─────────────┬────────────┘
              │
              │ HTTPS
              ▼
┌──────────────────────────┐
│      Next.js Server      │
│                          │
│ Route Handlers / SSR     │
│ Validação / regras       │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│         Supabase         │
│                          │
│ PostgreSQL               │
│ Auth                     │
│ Storage                  │
│ RPC / RLS                │
└──────────────────────────┘
              │
              ▼
┌──────────────────────────┐
│        WhatsApp          │
│ Comunicação com cliente  │
└──────────────────────────┘
```

---

## 📦 Estrutura principal

```text
src/
├── app/
│   ├── admin/
│   │   ├── cardapio/
│   │   ├── comandas/
│   │   └── login/
│   ├── api/
│   │   ├── admin/
│   │   ├── orders/
│   │   └── store/
│   ├── checkout/
│   └── page.tsx
│
├── components/
│   ├── admin/
│   ├── store/
│   └── ui/
│
├── lib/
│   ├── supabase/
│   ├── catalog.ts
│   ├── admin-catalog.ts
│   ├── admin-orders.ts
│   └── business-hours.ts
│
└── types/

supabase/
├── migrations/
└── seed.sql
```

---

## 🗃️ Modelagem de dados

Entre as principais entidades utilizadas estão:

```text
businesses
business_members
business_hours
categories
products
orders
order_items
```

O banco também utiliza funções específicas para ações administrativas como atualização, fechamento e cancelamento de comandas.

---

## 🔐 Segurança

O projeto foi estruturado para evitar confiar em dados críticos enviados pelo navegador.

Principais cuidados:

- autenticação para área administrativa;
- operações sensíveis executadas no servidor;
- chaves privadas não expostas no frontend;
- preços recalculados utilizando dados do banco;
- validação dos payloads recebidos pelas APIs;
- separação entre chaves públicas e credenciais privadas;
- controle de acesso no Supabase;
- proteção dos dados originais do cliente;
- variáveis sensíveis armazenadas em `.env.local` e na Vercel;
- `.env.local` fora do versionamento Git.

---

## 📱 Mobile-first

A interface foi projetada considerando que a maior parte dos pedidos acontece pelo smartphone.

Foram trabalhados:

- navegação simplificada;
- cards adaptáveis;
- checkout otimizado para telas pequenas;
- painel administrativo responsivo;
- campos com tamanho adequado para evitar zoom automático no iOS;
- menus adaptados para desktop e mobile;
- feedback visual de carregamento e status;
- atalhos para telefone e WhatsApp.

---

## 🕒 Horário de funcionamento

A disponibilidade da loja é armazenada no banco de dados.

A aplicação verifica o funcionamento em diferentes pontos do fluxo:

```text
Cardápio / Sacola
        ↓
Checkout
        ↓
API de criação do pedido
```

A validação final é feita no servidor.

Isso impede que um cliente contorne a interface e tente criar um pedido diretamente pela API fora do horário permitido.

---

## 💳 Formas de pagamento

O sistema registra a forma de pagamento escolhida pelo cliente:

- Pix
- Dinheiro
- Cartão na entrega

O FB Burguer **não processa pagamentos online dentro da plataforma**. O pagamento continua sendo realizado diretamente com o estabelecimento.

Para pedidos em dinheiro, o cliente pode informar o valor para troco. O cálculo estimado é disponibilizado apenas no painel administrativo.

---

## ⚙️ Executando localmente

### 1. Clone o projeto

```bash
git clone https://github.com/fernandoalvess/CardapioDigital.git
cd CardapioDigital
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie:

```text
.env.local
```

Exemplo:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_BUSINESS_SLUG=fb-burguer
```

> Nunca publique credenciais reais no repositório.

### 4. Execute

```bash
npm run dev
```

Abra:

```text
http://localhost:3000
```

---

## 🧪 Build de produção

```bash
npm run build
```

A aplicação é preparada para deploy na Vercel.

---

## ☁️ Deploy

O projeto utiliza:

```text
GitHub
   ↓
Vercel
   ↓
Next.js
   ↓
Supabase
```

A branch principal é utilizada para produção e novas funcionalidades podem ser desenvolvidas em branches separadas, gerando deployments de Preview antes de chegar à versão principal.

---

## 💡 Competências demonstradas neste projeto

Este projeto demonstra experiência prática com:

- desenvolvimento full stack;
- React e Next.js;
- TypeScript;
- APIs REST;
- SSR e Server Components;
- autenticação;
- PostgreSQL;
- modelagem de banco de dados;
- regras de negócio;
- upload e armazenamento de arquivos;
- validação de dados;
- segurança de aplicações web;
- responsividade;
- experiência do usuário;
- Git Flow;
- deploy contínuo;
- debugging em ambiente de produção.

---

## 👨‍💻 Autor

**Fernando U. Alves**

- GitHub: https://github.com/fernandoalvess
- Projeto: https://github.com/fernandoalvess/CardapioDigital

---

## 📄 Licença

Projeto desenvolvido para fins de portfólio e aplicação prática de desenvolvimento web full stack.
