import { Component, effect, inject, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';

import { CATEGORY_NAME_MAX_LENGTH } from '@restaurant-ordering/shared/categories';
import { disableControl, WhenFormValid } from '@restaurant-ordering/web/common/form';
import { InputComponent } from '@restaurant-ordering/web/ui/form';

import { CategorySetupStore } from '../../store/category-setup.store';

@Component({
  selector: 'app-new-category-form',
  imports: [ReactiveFormsModule, MatButton, InputComponent],
  styleUrl: './new-category-form.component.scss',
  template: `
    <form [formGroup]="form" (ngSubmit)="add()">
      <input
        appInput
        placeholder="New category"
        aria-label="New category name"
        formControlName="name"
      />
      <button matButton="outlined" type="submit" [disabled]="categories.creating()">Add</button>
    </form>
  `,
})
export class NewCategoryFormComponent {
  readonly disabled = input(false);

  protected readonly categories = inject(CategorySetupStore);

  protected readonly form = new FormGroup(
    {
      name: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.maxLength(CATEGORY_NAME_MAX_LENGTH),
        ],
      }),
    },
    { updateOn: 'submit' },
  );

  constructor() {
    effect(() => disableControl(this.form, this.disabled()));
  }

  @WhenFormValid()
  protected add(): void {
    this.categories.create(this.form.getRawValue().name.trim());
    this.form.reset();
  }
}
