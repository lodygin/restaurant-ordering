import { FormControl } from '@angular/forms';

import { disableControl } from './disable-control';

describe('disableControl', () => {
  it('disables or enables the control by the flag', () => {
    const control = new FormControl('soup');

    disableControl(control, true);

    expect(control.disabled).toBe(true);

    disableControl(control, false);

    expect(control.enabled).toBe(true);
  });

  it('passes the options through', () => {
    const control = new FormControl('soup');
    const disable = vi.spyOn(control, 'disable');

    disableControl(control, true, { emitEvent: false });

    expect(disable).toHaveBeenCalledWith({ emitEvent: false });
  });
});
