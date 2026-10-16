import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.open(message, undefined, { duration: 3000 });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 5000 });
  }
}
