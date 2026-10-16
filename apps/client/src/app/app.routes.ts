import { type Route } from '@angular/router';

import { ShellComponent } from '@restaurant-ordering/web/modules/shell';

export const appRoutes: Route[] = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'menu' },
      {
        path: 'menu',
        loadChildren: () => import('@restaurant-ordering/web/modules/menu').then(m => m.ROUTES),
      },
      {
        path: 'orders',
        loadChildren: () => import('@restaurant-ordering/web/modules/orders').then(m => m.ROUTES),
      },
      {
        path: 'menu-setup',
        loadChildren: () =>
          import('@restaurant-ordering/web/modules/menu-setup').then(m => m.ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
