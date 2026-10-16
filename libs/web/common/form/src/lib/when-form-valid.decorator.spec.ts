import { FormControl, FormGroup, Validators } from '@angular/forms';

import { WhenFormValid } from './when-form-valid.decorator';

function requiredGroup(value: string): FormGroup {
  return new FormGroup({
    name: new FormControl(value, { nonNullable: true, validators: [Validators.required] }),
  });
}

describe('WhenFormValid', () => {
  it('runs the method when the form is valid', () => {
    const run = vi.fn();

    class Host {
      protected readonly form = requiredGroup('filled');

      @WhenFormValid()
      submit(): void {
        run();
      }
    }

    new Host().submit();

    expect(run).toHaveBeenCalledOnce();
  });

  it('blocks the method and marks the form touched when it is invalid', () => {
    const run = vi.fn();

    class Host {
      readonly form = requiredGroup('');

      @WhenFormValid()
      submit(): void {
        run();
      }
    }

    const host = new Host();

    host.submit();

    expect(run).not.toHaveBeenCalled();
    expect(host.form.controls['name']?.touched).toBe(true);
  });

  it('blocks the method while async validation is pending', () => {
    const run = vi.fn();
    const form = requiredGroup('filled');

    form.markAsPending();

    class Host {
      readonly form = form;

      @WhenFormValid()
      submit(): void {
        run();
      }
    }

    new Host().submit();

    expect(form.pending).toBe(true);
    expect(run).not.toHaveBeenCalled();
  });

  it('passes the arguments through and keeps the instance as this', () => {
    const run = vi.fn();

    class Host {
      readonly form = requiredGroup('filled');
      readonly label = 'host';

      @WhenFormValid()
      submit(first: string, second: number): void {
        run(this.label, first, second);
      }
    }

    new Host().submit('a', 2);

    expect(run).toHaveBeenCalledWith('host', 'a', 2);
  });

  it('reads the form from the key it was given', () => {
    const run = vi.fn();

    class Host {
      readonly draft = requiredGroup('');

      @WhenFormValid('draft')
      submit(): void {
        run();
      }
    }

    const host = new Host();

    host.submit();

    expect(run).not.toHaveBeenCalled();
    expect(host.draft.controls['name']?.touched).toBe(true);
  });

  it('reads the form from a nested path', () => {
    const run = vi.fn();

    class Host {
      readonly draft = { form: requiredGroup('') };

      @WhenFormValid('draft.form')
      submit(): void {
        run();
      }
    }

    const host = new Host();

    host.submit();

    expect(run).not.toHaveBeenCalled();
    expect(host.draft.form.controls['name']?.touched).toBe(true);
  });

  it('throws when the path breaks before its last key', () => {
    class Host {
      readonly draft = undefined;

      @WhenFormValid('draft.form')
      submit(): void {
        return;
      }
    }

    expect(() => new Host().submit()).toThrow(TypeError);
  });

  it('throws when the key holds something other than a control', () => {
    class Host {
      readonly form = 'not a control';

      @WhenFormValid()
      submit(): void {
        return;
      }
    }

    expect(() => new Host().submit()).toThrow(TypeError);
  });

  describe('stacked on two forms', () => {
    class Host {
      readonly outer: FormGroup;
      readonly inner: FormGroup;
      readonly run = vi.fn();

      constructor(outer: string, inner: string) {
        this.outer = requiredGroup(outer);
        this.inner = requiredGroup(inner);
      }

      @WhenFormValid('outer')
      @WhenFormValid('inner')
      submit(): void {
        this.run();
      }
    }

    it('runs the method only when both forms are valid', () => {
      const host = new Host('filled', 'filled');

      host.submit();

      expect(host.run).toHaveBeenCalledOnce();
    });

    it('blocks when either form is invalid', () => {
      const outerInvalid = new Host('', 'filled');
      const innerInvalid = new Host('filled', '');

      outerInvalid.submit();
      innerInvalid.submit();

      expect(outerInvalid.run).not.toHaveBeenCalled();
      expect(innerInvalid.run).not.toHaveBeenCalled();
    });

    it('marks only the outer form when both are invalid, because the outer guard returns first', () => {
      const host = new Host('', '');

      host.submit();

      expect(host.outer.controls['name']?.touched).toBe(true);
      expect(host.inner.controls['name']?.touched).toBe(false);
    });
  });
});
