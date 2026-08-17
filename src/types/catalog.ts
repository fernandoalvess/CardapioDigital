export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  categoryId: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  products: Product[];
};

export type Business = {
  id: string;
  name: string;
  slug: string;
  address: string;
  whatsapp: string;
  timezone: string;
};

export type Catalog = {
  business: Business;
  categories: Category[];
};
