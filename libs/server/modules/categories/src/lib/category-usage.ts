/**
 * Something that keeps references to categories. Categories never import their users: a user
 * registers itself, so the dependency points one way only (menu-items -> categories).
 */
export type CategoryUsage = {
  /** How many records still point at this category; anything above zero blocks deletion. */
  countIn(categoryId: string): number;
};
