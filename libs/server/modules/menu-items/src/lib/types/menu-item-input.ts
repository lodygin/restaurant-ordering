export type CreateMenuItemInput = {
  categoryId: string;
  name: string;
  description?: string;
  price?: number | null;
  available?: boolean;
  openPrice?: boolean;
};

export type UpdateMenuItemInput = Partial<CreateMenuItemInput>;
