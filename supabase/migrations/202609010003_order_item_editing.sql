-- A administração pode ajustar o conteúdo da comanda, mas não os dados originais
-- informados pelo cliente (nome, telefone, endereço, pagamento e observação).

drop function if exists public.update_order_comanda(
  uuid,text,text,text,text,text,text,numeric,numeric,jsonb
);

drop function if exists public.update_order_comanda(
  uuid,text,text,text,text,numeric,text,text,numeric,numeric,jsonb
);

-- Evita alterações diretas nos campos da comanda via Data API. As mudanças
-- administrativas passam somente pelas funções controladas abaixo.
revoke update on public.orders from authenticated;

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

  if current_order.status <> 'pending' then
    raise exception 'Apenas comandas abertas podem ser editadas';
  end if;

  if new_delivery_fee < 0 or new_discount < 0 then
    raise exception 'Taxa e desconto não podem ser negativos';
  end if;

  if jsonb_typeof(new_items) <> 'array' or jsonb_array_length(new_items) = 0 then
    raise exception 'A comanda precisa ter pelo menos um item';
  end if;

  -- Remove somente itens antigos que deixaram de aparecer no estado enviado.
  -- Itens que permaneceram mantêm nome e preço originais do pedido.
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
