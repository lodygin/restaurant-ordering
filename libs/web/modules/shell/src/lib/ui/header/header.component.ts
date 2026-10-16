import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  styleUrl: './header.component.scss',
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

      <ng-content />
    </header>
  `,
})
export class HeaderComponent {
  protected readonly links = [
    { path: '/menu', label: 'Menu' },
    { path: '/orders', label: 'Orders' },
    { path: '/menu-setup', label: 'Menu setup' },
  ];
}
