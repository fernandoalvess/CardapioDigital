import type { Catalog } from "@/types/catalog";

const BUSINESS_ID = "10000000-0000-4000-8000-000000000001";

export const seedCatalog: Catalog = {
  business: {
    id: BUSINESS_ID,
    name: "FB Hamburgueria",
    slug: "fb-hamburgueria",
    address: "Rua Fernando, 15, Centro, Ereré-CE",
    whatsapp: "5588998102411",
    timezone: "America/Fortaleza",
  },
  categories: [
    {
      id: "20000000-0000-4000-8000-000000000001",
      name: "Hambúrgueres",
      slug: "hamburgueres",
      sortOrder: 10,
      products: [
        {
          id: "30000000-0000-4000-8000-000000000001",
          categoryId: "20000000-0000-4000-8000-000000000001",
          name: "Hamburguer Smash",
          slug: "hamburguer-smash",
          description: "Pão de fermentação natural, burger 160g, queijo prato e maionese da casa.",
          price: 18.9,
          imageUrl: "/legacy/hamb-1.webp",
          isAvailable: true,
          isFeatured: true,
          sortOrder: 10
        },
        {
          id: "30000000-0000-4000-8000-000000000002",
          categoryId: "20000000-0000-4000-8000-000000000001",
          name: "Hamburguer Duplo",
          slug: "hamburguer-duplo",
          description: "Pão de fermentação natural, dois burgers, queijo prato e maionese da casa.",
          price: 32.9,
          imageUrl: "/legacy/hamb-2.webp",
          isAvailable: true,
          isFeatured: true,
          sortOrder: 20
        },
        {
          id: "30000000-0000-4000-8000-000000000003",
          categoryId: "20000000-0000-4000-8000-000000000001",
          name: "Hamburguer Salad",
          slug: "hamburguer-salad",
          description: "Pão de fermentação natural, burger 160g, queijo prato, salada e maionese da casa.",
          price: 35.9,
          imageUrl: "/legacy/hamb-3.webp",
          isAvailable: true,
          isFeatured: false,
          sortOrder: 30
        },
        {
          id: "30000000-0000-4000-8000-000000000004",
          categoryId: "20000000-0000-4000-8000-000000000001",
          name: "Hamburguer da Casa",
          slug: "hamburguer-da-casa",
          description: "Pão de fermentação natural, burger 160g, queijo prato e maionese da casa.",
          price: 38.9,
          imageUrl: "/legacy/hamb-4.webp",
          isAvailable: true,
          isFeatured: false,
          sortOrder: 40
        }
      ]
    },
    {
      id: "20000000-0000-4000-8000-000000000002",
      name: "Salgados",
      slug: "salgados",
      sortOrder: 20,
      products: [
        {
          id: "30000000-0000-4000-8000-000000000005",
          categoryId: "20000000-0000-4000-8000-000000000002",
          name: "Coxinha",
          slug: "coxinha",
          description: "Massa cremosa à base de batata, empanamento crocante e recheio de frango desfiado.",
          price: 2.5,
          imageUrl: "/legacy/coxinha.webp",
          isAvailable: true,
          isFeatured: false,
          sortOrder: 10
        },
        {
          id: "30000000-0000-4000-8000-000000000006",
          categoryId: "20000000-0000-4000-8000-000000000002",
          name: "Salsichão",
          slug: "salsichao",
          description: "Massa cremosa à base de batata, superfície dourada e crocante, recheada com salsicha.",
          price: 2.0,
          imageUrl: "/legacy/salsichao.webp",
          isAvailable: true,
          isFeatured: false,
          sortOrder: 20
        },
        {
          id: "30000000-0000-4000-8000-000000000007",
          categoryId: "20000000-0000-4000-8000-000000000002",
          name: "Pastel",
          slug: "pastel",
          description: "Pastel crocante com opções de recheio de frango, queijo ou carne.",
          price: 4.0,
          imageUrl: "/legacy/pastel.webp",
          isAvailable: true,
          isFeatured: false,
          sortOrder: 30
        },
        {
          id: "30000000-0000-4000-8000-000000000008",
          categoryId: "20000000-0000-4000-8000-000000000002",
          name: "Risole",
          slug: "risole",
          description: "Risole dourado e crocante com opções de frango, queijo ou carne.",
          price: 3.0,
          imageUrl: "/legacy/risole.webp",
          isAvailable: true,
          isFeatured: false,
          sortOrder: 40
        }
      ]
    },
    {
      id: "20000000-0000-4000-8000-000000000003",
      name: "Bebidas",
      slug: "bebidas",
      sortOrder: 30,
      products: [
        {
          id: "30000000-0000-4000-8000-000000000009",
          categoryId: "20000000-0000-4000-8000-000000000003",
          name: "Coca-Cola Lata",
          slug: "coca-cola-lata",
          description: "Refrigerante Coca-Cola em lata.",
          price: 6.0,
          imageUrl: "/legacy/coca-cola-lata.webp",
          isAvailable: true,
          isFeatured: false,
          sortOrder: 10
        },
        {
          id: "30000000-0000-4000-8000-000000000010",
          categoryId: "20000000-0000-4000-8000-000000000003",
          name: "Guaraná Lata",
          slug: "guarana-lata",
          description: "Refrigerante Guaraná em lata.",
          price: 6.0,
          imageUrl: "/legacy/guarana-lata.webp",
          isAvailable: true,
          isFeatured: false,
          sortOrder: 20
        },
        {
          id: "30000000-0000-4000-8000-000000000011",
          categoryId: "20000000-0000-4000-8000-000000000003",
          name: "Fanta Uva Lata",
          slug: "fanta-uva-lata",
          description: "Refrigerante Fanta Uva em lata.",
          price: 6.0,
          imageUrl: "/legacy/fanta-uva-lata.webp",
          isAvailable: true,
          isFeatured: false,
          sortOrder: 30
        },
        {
          id: "30000000-0000-4000-8000-000000000012",
          categoryId: "20000000-0000-4000-8000-000000000003",
          name: "Fanta Laranja Lata",
          slug: "fanta-laranja-lata",
          description: "Refrigerante Fanta Laranja em lata.",
          price: 6.0,
          imageUrl: "/legacy/fanta-laranja-lata.webp",
          isAvailable: true,
          isFeatured: false,
          sortOrder: 40
        },
        {
          id: "30000000-0000-4000-8000-000000000013",
          categoryId: "20000000-0000-4000-8000-000000000003",
          name: "Coca-Cola 1L",
          slug: "coca-cola-1l",
          description: "Refrigerante Coca-Cola de 1 litro.",
          price: 10.0,
          imageUrl: "/legacy/coca-cola-1l.webp",
          isAvailable: true,
          isFeatured: false,
          sortOrder: 50
        },
        {
          id: "30000000-0000-4000-8000-000000000014",
          categoryId: "20000000-0000-4000-8000-000000000003",
          name: "Guaraná 1L",
          slug: "guarana-1l",
          description: "Refrigerante Guaraná de 1 litro.",
          price: 10.0,
          imageUrl: "/legacy/guarana-1l.webp",
          isAvailable: true,
          isFeatured: false,
          sortOrder: 60
        }
      ]
    },
    {
      id: "20000000-0000-4000-8000-000000000004",
      name: "Sobremesas",
      slug: "sobremesas",
      sortOrder: 40,
      products: [
        {
          id: "30000000-0000-4000-8000-000000000015",
          categoryId: "20000000-0000-4000-8000-000000000004",
          name: "Pudim",
          slug: "pudim",
          description: "Pudim de leite condensado, cremoso e delicado.",
          price: 5.9,
          imageUrl: "/legacy/pudim.webp",
          isAvailable: true,
          isFeatured: false,
          sortOrder: 10
        },
        {
          id: "30000000-0000-4000-8000-000000000016",
          categoryId: "20000000-0000-4000-8000-000000000004",
          name: "Bolo de Chocolate",
          slug: "bolo-de-chocolate",
          description: "Bolo de chocolate macio e intenso.",
          price: 5.0,
          imageUrl: "/legacy/bolo-chocolate.webp",
          isAvailable: true,
          isFeatured: false,
          sortOrder: 20
        }
      ]
    }
  ]
};
