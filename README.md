# 🍔 FB Burguer

Sistema de cardápio digital e gestão de pedidos para hamburguerias, desenvolvido com **Next.js, TypeScript, Supabase e Vercel**.

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

## 👨‍💻 Autor

**Fernando U. Alves**

- GitHub: https://github.com/fernandoalvess
- Projeto: https://github.com/fernandoalvess/CardapioDigital
