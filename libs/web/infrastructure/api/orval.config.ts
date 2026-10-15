import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: {
      target: '../../../../dist/apps/server/openapi.json',
    },
    output: {
      mode: 'single',
      target: 'src/lib/generated/api.ts',
      client: 'angular',
      clean: true,
      override: {
        title: () => 'Api',
        // MenuController_createItem_v1 -> menuCreateItem
        operationName: operation => {
          const id = typeof operation.operationId === 'string' ? operation.operationId : '';
          const match = /^([A-Za-z]+)Controller_([a-zA-Z0-9]+)_v\d+$/.exec(id);

          if (!match?.[1] || !match[2]) {
            return id;
          }

          const resource = match[1].charAt(0).toLowerCase() + match[1].slice(1);
          const method = match[2].charAt(0).toUpperCase() + match[2].slice(1);

          return `${resource}${method}`;
        },
      },
    },
  },
});
