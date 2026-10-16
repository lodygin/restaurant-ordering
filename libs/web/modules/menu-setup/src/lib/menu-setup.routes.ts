import { type Routes } from '@angular/router';

export const ROUTES: Routes = [
  {
    path: '',
    title: 'Menu setup | My Kitchen',
    loadComponent: () => import('./ui/menu-setup').then(m => m.MenuSetupComponent),
  },
];
