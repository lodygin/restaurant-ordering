export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  /** Cents; null for open-price items. */
  price: number | null;
  available: boolean;
  openPrice: boolean;
};
