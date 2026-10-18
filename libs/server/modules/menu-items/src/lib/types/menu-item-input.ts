export type CreateMenuItemInput = {
  categoryId: string;
  name: string;
  price?: number | null;
  available?: boolean;
  openPrice?: boolean;
};

export type UpdateMenuItemInput = Partial<CreateMenuItemInput>;
