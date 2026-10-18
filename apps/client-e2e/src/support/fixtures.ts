import { test as base } from '@playwright/test';

import { Api } from './api';

export const test = base.extend<{ api: Api }>({
  api: async ({ request }, use) => use(new Api(request)),
});

export { expect } from '@playwright/test';

// the server outlives test runs, so names must not repeat between them either
export function unique(label: string): string {
  return `${label} ${crypto.randomUUID().slice(0, 8)}`;
}
