import { Component, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-quantity-stepper',
  imports: [MatIconButton, MatIcon],
  host: {
    role: 'group',
    '[attr.aria-label]': '"Quantity of " + label()',
    '[attr.aria-disabled]': 'disabled() || null',
  },
  styleUrl: './quantity-stepper.component.scss',
  template: `
    <button
      matIconButton
      aria-label="Remove one"
      [disabled]="disabled()"
      (click)="decreased.emit()"
    >
      <mat-icon svgIcon="remove" />
    </button>

    <output>{{ value() }}</output>

    <button matIconButton aria-label="Add one" [disabled]="disabled()" (click)="increased.emit()">
      <mat-icon svgIcon="add" />
    </button>
  `,
})
export class QuantityStepperComponent {
  readonly value = input.required<number>();
  readonly label = input.required<string>();
  readonly disabled = input(false);

  readonly decreased = output();
  readonly increased = output();
}
