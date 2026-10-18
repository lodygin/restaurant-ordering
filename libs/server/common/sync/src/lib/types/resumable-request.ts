export type ResumableRequest = {
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, unknown>;
};
