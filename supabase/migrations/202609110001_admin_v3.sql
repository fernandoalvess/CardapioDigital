-- FB Burguer Admin V3
-- Configurações operacionais da loja + fluxo completo de status dos pedidos.

alter table public.businesses
  add column if not exists description text,
  add column if not exists instagram text,
  add column if not exists accepting_orders boolean not null default true,
  add column if not exists delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0),
  add column if not exists minimum_order numeric(10,2) not null default 0 check (minimum_order >= 0),
  add column if not exists delivery_eta_min integer not null default 30 check (delivery_eta_min between 0 and 600),
  add column if not exists delivery_eta_max integer not null default 50 check (delivery_eta_max between 0 and 600),
  add column if not exists accepts_pix boolean not null default true,
  add column if not exists accepts_cash boolean not null default true,
  add column if not exists accepts_card_on_delivery boolean not null default true;

comment on column public.businesses.accepting_orders is
  'Controle manual para pausar novos pedidos sem alterar o horário semanal.';

create or replace function public.set_order_status(
  target_order_id uuid,
  new_status public.order_status
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  current_order public.orders;
  transition_allowed boolean := false;
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
    raise exception 'Sem permissão para alterar o status desta comanda';
  end if;

  if current_order.status = new_status then
    return current_order;
  end if;

  transition_allowed := case current_order.status
    when 'pending' then new_status in ('accepted', 'cancelled')
    when 'accepted' then new_status in ('preparing', 'cancelled')
    when 'preparing' then new_status in ('ready', 'cancelled')
    when 'ready' then new_status in ('out_for_delivery', 'completed', 'cancelled')
    when 'out_for_delivery' then new_status in ('completed', 'cancelled')
    else false
  end;

  if not transition_allowed then
    raise exception 'Transição de status não permitida';
  end if;

  update public.orders
  set
    status = new_status,
    closed_at = case
      when new_status = 'completed' then coalesce(closed_at, now())
      else closed_at
    end,
    closed_by = case
      when new_status = 'completed' then auth.uid()
      else closed_by
    end,
    cancelled_at = case
      when new_status = 'cancelled' then coalesce(cancelled_at, now())
      else cancelled_at
    end,
    updated_at = now()
  where id = target_order_id
  returning * into current_order;

  return current_order;
end;
$$;

revoke all on function public.set_order_status(uuid, public.order_status)
from public, anon;
grant execute on function public.set_order_status(uuid, public.order_status)
to authenticated;

-- Permite corrigir os itens enquanto o pedido ainda está dentro da operação.
-- Após sair para entrega, concluir ou cancelar, o conteúdo fica congelado.
create or replace function public.update_order_items(
  target_order_id uuid,
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
  existing_item public.order_items;
  catalog_product public.products;
  new_subtotal numeric(10,2) := 0;
  order_item_id uuid;
  product_id_value uuid;
  item_quantity integer;
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

  if current_order.status in ('out_for_delivery', 'completed', 'cancelled') then
    raise exception 'Este pedido não pode mais ter os itens alterados';
  end if;

  if new_delivery_fee < 0 or new_discount < 0 then
    raise exception 'Taxa e desconto não podem ser negativos';
  end if;

  if jsonb_typeof(new_items) <> 'array' or jsonb_array_length(new_items) = 0 then
    raise exception 'A comanda precisa ter pelo menos um item';
  end if;

  delete from public.order_items oi
  where oi.order_id = target_order_id
    and oi.id not in (
      select (entry->>'orderItemId')::uuid
      from jsonb_array_elements(new_items) entry
      where nullif(entry->>'orderItemId', '') is not null
    );

  for item in select * from jsonb_array_elements(new_items)
  loop
    item_quantity := greatest(1, least(100, coalesce((item->>'quantity')::integer, 1)));
    order_item_id := nullif(item->>'orderItemId', '')::uuid;
    product_id_value := nullif(item->>'productId', '')::uuid;

    if order_item_id is not null then
      select * into existing_item
      from public.order_items
      where id = order_item_id
        and order_id = target_order_id;

      if existing_item.id is null then
        raise exception 'Item da comanda não encontrado';
      end if;

      update public.order_items
      set
        quantity = item_quantity,
        total = unit_price * item_quantity
      where id = existing_item.id;
    else
      if product_id_value is null then
        raise exception 'Produto não informado';
      end if;

      select p.* into catalog_product
      from public.products p
      where p.id = product_id_value
        and p.business_id = current_order.business_id
        and coalesce(p.is_active, true) = true
        and p.is_available = true
        and exists (
          select 1
          from public.categories c
          where c.id = p.category_id
            and c.business_id = current_order.business_id
            and c.is_active = true
        );

      if catalog_product.id is null then
        raise exception 'Produto indisponível ou não encontrado';
      end if;

      insert into public.order_items (
        order_id, product_id, product_name_snapshot, unit_price, quantity, total
      ) values (
        target_order_id,
        catalog_product.id,
        catalog_product.name,
        catalog_product.price,
        item_quantity,
        catalog_product.price * item_quantity
      );
    end if;
  end loop;

  select coalesce(sum(total), 0)
  into new_subtotal
  from public.order_items
  where order_id = target_order_id;

  update public.orders
  set
    admin_notes = nullif(trim(new_admin_notes), ''),
    subtotal = new_subtotal,
    delivery_fee = new_delivery_fee,
    discount = new_discount,
    total = greatest(0, new_subtotal + new_delivery_fee - new_discount),
    updated_at = now()
  where id = target_order_id
  returning * into current_order;

  return current_order;
end;
$$;

grant execute on function public.update_order_items(uuid,text,numeric,numeric,jsonb)
to authenticated;
