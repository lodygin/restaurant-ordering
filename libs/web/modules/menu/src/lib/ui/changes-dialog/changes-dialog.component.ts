import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

import { MoneyPipe } from '@restaurant-ordering/web/common/money';

import { CartStore } from '../../store/cart.store';
import { type CartChange } from '../../types';

@Component({
  selector: 'app-changes-dialog',
  imports: [
    MatButton,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MoneyPipe,
  ],
  styleUrl: './changes-dialog.component.scss',
  template: `
    <h2 mat-dialog-title>The menu changed while you were ordering</h2>

    <mat-dialog-content>
      <p>We updated your order to match the kitchen. Nothing has been placed yet.</p>

      <ul>
        @for (change of changes; track change.lineId) {
          <li [class.gone]="change.type === 'unavailable' || change.type === 'now-open'">
            <strong>{{ change.name }}</strong>
            @switch (change.type) {
              @case ('unavailable') {
                No longer available, removed from your order.
              }
              @case ('now-open') {
                Now priced when ordering, removed from your order. Add it again with a price.
              }
              @case ('now-fixed') {
                Now has a fixed price of {{ change.to | money }} instead of the
                {{ change.from | money }} you entered.
              }
              @case ('price') {
                Price changed from {{ change.from | money }} to {{ change.to | money }}.
              }
            }
          </li>
        }
      </ul>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button matButton mat-dialog-close>Review order</button>
      @if (cart.lines().length) {
        <button matButton="filled" mat-dialog-close (click)="cart.placeOrder()">
          Place updated order
        </button>
      }
    </mat-dialog-actions>
  `,
})
export class ChangesDialogComponent {
  protected readonly changes = inject<CartChange[]>(MAT_DIALOG_DATA);
  protected readonly cart = inject(CartStore);
}
