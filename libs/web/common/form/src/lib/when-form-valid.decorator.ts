import { AbstractControl } from '@angular/forms';

type SubmitMethod = (...args: any[]) => void;

type SubmitDecorator = <T extends TypedPropertyDescriptor<SubmitMethod>>(
  target: unknown,
  propertyKey: PropertyKey,
  descriptor: T,
) => T;

function readPath(host: unknown, keys: readonly string[]): unknown {
  return keys.reduce<unknown>(
    (held, key) =>
      typeof held === 'object' && held !== null
        ? (held as Record<string, unknown>)[key]
        : undefined,
    host,
  );
}

export function WhenFormValid(formPath = 'form'): SubmitDecorator {
  const keys = formPath.split('.');

  return (_target, _propertyKey, descriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (this: unknown, ...args: unknown[]): void {
      const form = readPath(this, keys);

      if (!(form instanceof AbstractControl)) {
        throw new TypeError(`WhenFormValid expects "${formPath}" to hold a form control`);
      }

      if (!form.valid) {
        form.markAllAsTouched();

        return;
      }

      originalMethod?.apply(this, args);
    };

    return descriptor;
  };
}
