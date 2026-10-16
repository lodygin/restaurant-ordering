export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  /** Integer cents; null for open-price items, whose price is entered when ordering. */
  price: number | null;
  available: boolean;
  openPrice: boolean;
};
