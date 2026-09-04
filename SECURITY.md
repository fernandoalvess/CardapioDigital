# Security — FB Burguer

Esta implantação pública é uma demo funcional do projeto e mantém o fluxo real de criação de comandas e envio para o WhatsApp.

## Controles aplicados

- Supabase Publishable Key no cliente e `SUPABASE_SECRET_KEY` somente no servidor.
- Row-Level Security (RLS) nas tabelas do banco.
- Produtos ocultos protegidos também na camada RLS.
- Autenticação e autorização administrativas verificadas no servidor.
- Preços e disponibilidade dos produtos recalculados/validados no backend antes da criação da comanda.
- Rate limit compartilhado no Supabase para pedidos e tentativas de login.
- Validação de entrada com Zod.
- Proteção básica contra bots por honeypot.
- Upload de imagens limitado por tamanho, MIME type e assinatura real do arquivo.
- Content Security Policy (CSP), HSTS e outros cabeçalhos de segurança.
- Respostas de API sem mensagens internas do banco ou nomes de variáveis sensíveis.
- Área administrativa e checkout fora da indexação de mecanismos de busca.
- Dependabot e comando `npm run security:audit` para acompanhamento de dependências.

## Credenciais

Nunca versione `.env`, `.env.local`, chaves secretas do Supabase ou outras credenciais reais.

A chave `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` é pública por natureza. O acesso ao banco é restringido por RLS e pelas regras server-side da aplicação.

## Relato de vulnerabilidade

Caso encontre um problema de segurança, evite publicar dados sensíveis em uma issue pública. Prefira os recursos privados de Security do GitHub quando disponíveis.
