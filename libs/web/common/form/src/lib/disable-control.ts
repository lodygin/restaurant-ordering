import { type AbstractControl } from '@angular/forms';

export function disableControl(
  control: AbstractControl,
  isDisabled: boolean,
  options?: Partial<Record<'onlySelf' | 'emitEvent', boolean>>,
): void {
  if (isDisabled) {
    control.disable(options);

    return;
  }

  control.enable(options);
}
