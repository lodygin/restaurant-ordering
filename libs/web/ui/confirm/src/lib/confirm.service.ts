import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, type Observable } from 'rxjs';

import { ConfirmDialogComponent } from './confirm-dialog.component';
import { type ConfirmOptions } from './types';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(MatDialog);

  ask(options: ConfirmOptions): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialogComponent, ConfirmOptions, boolean>(ConfirmDialogComponent, {
        data: options,
        width: '400px',
      })
      .afterClosed()
      .pipe(map(Boolean));
  }
}
