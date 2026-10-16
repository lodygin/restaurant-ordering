import { type Routes } from '@angular/router';

export const ROUTES: Routes = [
  {
    path: '',
    title: 'Orders | My Kitchen',
    loadComponent: () => import('./ui/orders').then(m => m.OrdersComponent),
  },
];
