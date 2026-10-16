import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  styleUrl: './shell.component.scss',
  template: `
    <header class="topbar">
      <a class="brand" routerLink="/menu">My Kitchen</a>

      <nav class="nav">
        @for (link of links; track link.path) {
          <a
            [routerLink]="link.path"
            routerLinkActive
            #active="routerLinkActive"
            [attr.aria-current]="active.isActive ? 'page' : null"
          >
            {{ link.label }}
          </a>
        }
      </nav>
    </header>

    <main>
      <router-outlet />
    </main>
  `,
})
export class ShellComponent {
  protected readonly links = [
    { path: '/menu', label: 'Menu' },
    { path: '/orders', label: 'Orders' },
    { path: '/menu-setup', label: 'Menu setup' },
  ];
}
