-- FB Burguer — limpeza final para a versão de portfólio.
-- Mantém o histórico da migration Admin V3, mas remove recursos que deixaram
-- de fazer parte do produto final. As RPCs set_order_status e update_order_items
-- continuam sendo usadas pelo painel administrativo.

-- RPC antiga que permitia editar também dados informados pelo cliente.
drop function if exists public.update_order_comanda(
  uuid,text,text,text,text,numeric,text,text,numeric,numeric,jsonb
);

-- O fluxo final usa apenas set_order_status para concluir e cancelar pedidos.
drop function if exists public.close_order_comanda(uuid);
drop function if exists public.cancel_order_comanda(uuid);

-- Configurações adicionadas durante a experiência do Admin V3 e não utilizadas
-- na versão final de portfólio.
alter table public.businesses
  drop column if exists description,
  drop column if exists instagram,
  drop column if exists accepting_orders,
  drop column if exists delivery_fee,
  drop column if exists minimum_order,
  drop column if exists delivery_eta_min,
  drop column if exists delivery_eta_max,
  drop column if exists accepts_pix,
  drop column if exists accepts_cash,
  drop column if exists accepts_card_on_delivery;
