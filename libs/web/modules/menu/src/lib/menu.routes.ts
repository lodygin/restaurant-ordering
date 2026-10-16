import { type Routes } from '@angular/router';

export const ROUTES: Routes = [
  {
    path: '',
    title: 'Menu | My Kitchen',
    loadComponent: () => import('./ui/menu').then(m => m.MenuComponent),
  },
];
