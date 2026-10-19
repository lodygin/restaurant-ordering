import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { defer, filter, map, merge, type Observable } from 'rxjs';

import { ITEM_MAX_PRICE, ITEM_NAME_MAX_LENGTH } from '@restaurant-ordering/shared/menu-items';
import { formatPrice, parsePrice } from '@restaurant-ordering/shared/money';
import {
  disableControl,
  nameValidators,
  priceValidator,
} from '@restaurant-ordering/web/common/form';
import { type MenuItem, type MenuItemInput } from '@restaurant-ordering/web/core/menu';
import { ConfirmService } from '@restaurant-ordering/web/ui/confirm';
import {
  FocusableDirective,
  InputComponent,
  MoneyFieldComponent,
} from '@restaurant-ordering/web/ui/form';
import { HighlightDirective } from '@restaurant-ordering/web/ui/highlight';

import { DEFAULT_ITEM_PRICE } from '../../constants';
import { ItemSetupStore } from '../../store/item-setup.store';

@Component({
  selector: 'tr[appItemRow]',
  hostDirectives: [HighlightDirective],
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatCheckbox,
    MatSlideToggle,
    InputComponent,
    MoneyFieldComponent,
    FocusableDirective,
  ],
  styleUrl: './item-row.component.scss',
  template: `
    <td>
      <input
        appInput
        appFocusable
        [formControl]="form.controls.name"
        (focus)="editing.set('name')"
        (blur)="editing.set(null)"
        [attr.aria-label]="'Name of ' + item().name"
        title="An item needs a name"
      />
    </td>

    <td>
      <app-money-field>
        <input
          appInput
          inputmode="decimal"
          [formControl]="form.controls.price"
          (focus)="editing.set('price')"
          (blur)="editing.set(null)"
          [placeholder]="form.controls.openPrice.value ? 'At order' : ''"
          [attr.aria-label]="'Price of ' + item().name"
          title="Enter a price above zero, like 12.50"
        />
      </app-money-field>
    </td>

    <td class="center">
      <mat-slide-toggle
        hideIcon
        [formControl]="form.controls.available"
        [aria-label]="item().name + ' is available'"
      />
    </td>

    <td class="center">
      <mat-checkbox
        [formControl]="form.controls.openPrice"
        [aria-label]="item().name + ' has an open price'"
      />
    </td>

    <td class="remove">
      <button
        matButton
        class="quiet"
        [disabled]="disabled() || items.removing().includes(item().id)"
        (click)="remove()"
      >
        Remove
      </button>
    </td>
  `,
})
export class ItemRowComponent {
  readonly item = input.required<MenuItem>();
  readonly disabled = input(false);

  protected readonly items = inject(ItemSetupStore);

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: nameValidators(ITEM_NAME_MAX_LENGTH),
      updateOn: 'blur',
    }),
    price: new FormControl('', {
      nonNullable: true,
      validators: [priceValidator, Validators.max(ITEM_MAX_PRICE / 100)],
      updateOn: 'blur',
    }),
    available: new FormControl(false, { nonNullable: true }),
    openPrice: new FormControl(false, { nonNullable: true }),
  });

  // a remote update must not wipe what is being typed; the field catches up on blur
  protected readonly editing = signal<'name' | 'price' | null>(null);

  private readonly highlighter = inject(HighlightDirective);
  private readonly confirm = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly changes$: Observable<Partial<MenuItemInput>> = defer(() => {
    const { name, price, available, openPrice } = this.form.controls;

    return merge(
      name.valueChanges.pipe(
        filter(() => name.valid),
        map(value => ({ name: value.trim() })),
      ),
      price.valueChanges.pipe(
        filter(() => price.valid),
        map(value => ({ price: parsePrice(value) })),
      ),
      available.valueChanges.pipe(map(value => ({ available: value }))),
      openPrice.valueChanges.pipe(
        map(value => ({ openPrice: value, price: value ? null : DEFAULT_ITEM_PRICE })),
      ),
    );
  });

  private readonly nameField =
    viewChild.required<FocusableDirective<HTMLInputElement>>(FocusableDirective);

  private readonly editedItem = computed(() => ({
    ...this.item(),
    ...this.items.edits()[this.item().id],
  }));

  constructor() {
    effect(() => this.syncForm(this.editedItem(), this.disabled(), this.editing()));

    this.items.update(this.changes$.pipe(map(changes => ({ id: this.item().id, changes }))));
  }

  focusName(): void {
    this.nameField().focus();
    this.nameField().element.select();
  }

  highlight(): void {
    this.highlighter.highlight();
  }

  protected remove(): void {
    const { id, name } = this.item();

    this.confirm
      .ask({
        title: `Remove ${name}?`,
        message: 'It disappears from the menu for guests right away.',
        action: 'Remove',
      })
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.items.remove(id));
  }

  private syncForm(item: MenuItem, locked: boolean, editing: 'name' | 'price' | null): void {
    const { name, price, available, openPrice } = this.form.controls;

    if (editing !== 'name' && !(name.dirty && name.invalid)) {
      name.setValue(item.name, { emitEvent: false });
    }

    if (editing !== 'price' && !(price.dirty && price.invalid)) {
      price.setValue(item.price === null ? '' : formatPrice(item.price), {
        emitEvent: false,
      });
    }

    available.setValue(item.available, { emitEvent: false });
    openPrice.setValue(item.openPrice, { emitEvent: false });

    disableControl(this.form, locked, { emitEvent: false });
    disableControl(price, locked || item.openPrice, { emitEvent: false });
  }
}
