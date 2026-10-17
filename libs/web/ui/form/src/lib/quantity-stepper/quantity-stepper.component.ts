import { Component, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-quantity-stepper',
  imports: [MatIconButton, MatIcon],
  host: { role: 'group', '[attr.aria-label]': '"Quantity of " + label()' },
  styleUrl: './quantity-stepper.component.scss',
  template: `
    <button matIconButton aria-label="Remove one" (click)="decreased.emit()">
      <mat-icon>remove</mat-icon>
    </button>
    <output>{{ value() }}</output>
    <button matIconButton aria-label="Add one" (click)="increased.emit()">
      <mat-icon>add</mat-icon>
    </button>
  `,
})
export class QuantityStepperComponent {
  readonly value = input.required<number>();
  readonly label = input.required<string>();

  readonly decreased = output();
  readonly increased = output();
}
