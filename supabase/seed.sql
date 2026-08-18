insert into public.businesses (
  id, name, slug, address, whatsapp, timezone, is_active
) values (
  '10000000-0000-4000-8000-000000000001',
  'FB Burguer',
  'fb-burguer',
  'R. Cap. Teotônio, 1500, Centro',
  '5588998102411',
  'America/Fortaleza',
  true
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  address = excluded.address,
  whatsapp = excluded.whatsapp,
  timezone = excluded.timezone;

insert into public.categories (id, business_id, name, slug, sort_order, is_active) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Hambúrgueres','hamburgueres',10,true),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Salgados','salgados',20,true),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','Bebidas','bebidas',30,true),
('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','Sobremesas','sobremesas',40,true)
on conflict (id) do update set
  name=excluded.name, slug=excluded.slug, sort_order=excluded.sort_order, is_active=excluded.is_active;

insert into public.products
(id,business_id,category_id,name,slug,description,price,image_url,is_available,is_featured,sort_order)
values
('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Hamburguer Smash','hamburguer-smash','Pão de fermentação natural, burger 160g, queijo prato e maionese da casa.',18.90,'/legacy/hamb-1.webp',true,true,10),
('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Hamburguer Duplo','hamburguer-duplo','Pão de fermentação natural, dois burgers, queijo prato e maionese da casa.',32.90,'/legacy/hamb-2.webp',true,true,20),
('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Hamburguer Salad','hamburguer-salad','Pão de fermentação natural, burger 160g, queijo prato, salada e maionese da casa.',35.90,'/legacy/hamb-3.webp',true,false,30),
('30000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Hamburguer da Casa','hamburguer-da-casa','Pão de fermentação natural, burger 160g, queijo prato e maionese da casa.',38.90,'/legacy/hamb-4.webp',true,false,40),
('30000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','Coxinha','coxinha','Massa cremosa à base de batata, empanamento crocante e recheio de frango desfiado.',2.50,'/legacy/coxinha.webp',true,false,10),
('30000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','Salsichão','salsichao','Massa cremosa à base de batata, superfície dourada e crocante, recheada com salsicha.',2.00,'/legacy/salsichao.webp',true,false,20),
('30000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','Pastel','pastel','Pastel crocante com opções de recheio de frango, queijo ou carne.',4.00,'/legacy/pastel.webp',true,false,30),
('30000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','Risole','risole','Risole dourado e crocante com opções de frango, queijo ou carne.',3.00,'/legacy/risole.webp',true,false,40),
('30000000-0000-4000-8000-000000000009','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','Coca-Cola Lata','coca-cola-lata','Refrigerante Coca-Cola em lata.',6.00,'/legacy/coca-cola-lata.webp',true,false,10),
('30000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','Guaraná Lata','guarana-lata','Refrigerante Guaraná em lata.',6.00,'/legacy/guarana-lata.webp',true,false,20),
('30000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','Fanta Uva Lata','fanta-uva-lata','Refrigerante Fanta Uva em lata.',6.00,'/legacy/fanta-uva-lata.webp',true,false,30),
('30000000-0000-4000-8000-000000000012','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','Fanta Laranja Lata','fanta-laranja-lata','Refrigerante Fanta Laranja em lata.',6.00,'/legacy/fanta-laranja-lata.webp',true,false,40),
('30000000-0000-4000-8000-000000000013','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','Coca-Cola 1L','coca-cola-1l','Refrigerante Coca-Cola de 1 litro.',10.00,'/legacy/coca-cola-1l.webp',true,false,50),
('30000000-0000-4000-8000-000000000014','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','Guaraná 1L','guarana-1l','Refrigerante Guaraná de 1 litro.',10.00,'/legacy/guarana-1l.webp',true,false,60),
('30000000-0000-4000-8000-000000000015','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000004','Pudim','pudim','Pudim de leite condensado, cremoso e delicado.',5.90,'/legacy/pudim.webp',true,false,10),
('30000000-0000-4000-8000-000000000016','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000004','Bolo de Chocolate','bolo-de-chocolate','Bolo de chocolate macio e intenso.',5.00,'/legacy/bolo-chocolate.webp',true,false,20)
on conflict (id) do update set
  name=excluded.name,
  description=excluded.description,
  price=excluded.price,
  image_url=excluded.image_url,
  is_available=excluded.is_available,
  is_featured=excluded.is_featured,
  sort_order=excluded.sort_order;

insert into public.business_hours (business_id, weekday, opens_at, closes_at, is_closed)
select
  '10000000-0000-4000-8000-000000000001'::uuid,
  day,
  '18:00'::time,
  '22:00'::time,
  false
from generate_series(0, 6) as day
on conflict (business_id, weekday) do update set
  opens_at=excluded.opens_at,
  closes_at=excluded.closes_at,
  is_closed=excluded.is_closed;
