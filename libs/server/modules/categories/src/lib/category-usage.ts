/** Registered by modules that reference categories; a non-zero count blocks deletion. */
export type CategoryUsage = {
  countIn(categoryId: string): number;
};
