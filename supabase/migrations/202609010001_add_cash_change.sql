-- FB Burguer: valor informado pelo cliente para troco em pedidos pagos em dinheiro.
-- O troco calculado é exibido apenas no painel administrativo.

alter table public.orders
  add column if not exists cash_change_for numeric(10,2)
    check (cash_change_for is null or cash_change_for >= 0);

comment on column public.orders.cash_change_for is
  'Valor em dinheiro informado pelo cliente para cálculo administrativo do troco.';

-- A versão anterior da função não possui o parâmetro new_cash_change_for.
drop function if exists public.update_order_comanda(
  uuid,text,text,text,text,text,text,numeric,numeric,jsonb
);

create or replace function public.update_order_comanda(
  target_order_id uuid,
  new_customer_name text,
  new_customer_phone text,
  new_address_text text,
  new_payment_method text,
  new_cash_change_for numeric,
  new_notes text,
  new_admin_notes text,
  new_delivery_fee numeric,
  new_discount numeric,
  new_items jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  current_order public.orders;
  item jsonb;
  new_subtotal numeric(10,2);
  new_total numeric(10,2);
begin
  select * into current_order
  from public.orders
  where id = target_order_id
  for update;

  if current_order.id is null then
    raise exception 'Comanda não encontrada';
  end if;

  if not public.has_business_role(
    current_order.business_id,
    array['owner','manager']::public.business_role[]
  ) then
    raise exception 'Sem permissão para editar esta comanda';
  end if;

  if current_order.status <> 'pending' then
    raise exception 'Apenas comandas abertas podem ser editadas';
  end if;

  if new_payment_method not in ('pix', 'cash', 'card_on_delivery') then
    raise exception 'Forma de pagamento inválida';
  end if;

  if new_delivery_fee < 0 or new_discount < 0 then
    raise exception 'Taxa e desconto não podem ser negativos';
  end if;

  if new_cash_change_for is not null and new_cash_change_for < 0 then
    raise exception 'Valor para troco não pode ser negativo';
  end if;

  for item in select * from jsonb_array_elements(new_items)
  loop
    update public.order_items
    set
      quantity = greatest(1, least(100, (item->>'quantity')::integer)),
      unit_price = greatest(0, (item->>'unitPrice')::numeric),
      total = greatest(0, (item->>'unitPrice')::numeric)
        * greatest(1, least(100, (item->>'quantity')::integer))
    where id = (item->>'id')::uuid
      and order_id = target_order_id;
  end loop;

  select coalesce(sum(total), 0)
  into new_subtotal
  from public.order_items
  where order_id = target_order_id;

  new_total := greatest(0, new_subtotal + new_delivery_fee - new_discount);

  if new_payment_method = 'cash'
     and new_cash_change_for is not null
     and new_cash_change_for < new_total then
    raise exception 'O valor para troco deve ser igual ou maior que o total da comanda';
  end if;

  update public.orders
  set
    customer_name = trim(new_customer_name),
    customer_phone = trim(new_customer_phone),
    address_text = trim(new_address_text),
    payment_method = new_payment_method,
    cash_change_for = case
      when new_payment_method = 'cash' then new_cash_change_for
      else null
    end,
    notes = nullif(trim(new_notes), ''),
    admin_notes = nullif(trim(new_admin_notes), ''),
    subtotal = new_subtotal,
    delivery_fee = new_delivery_fee,
    discount = new_discount,
    total = new_total,
    updated_at = now()
  where id = target_order_id
  returning * into current_order;

  return current_order;
end;
$$;

grant execute on function public.update_order_comanda(
  uuid,text,text,text,text,numeric,text,text,numeric,numeric,jsonb
) to authenticated;
