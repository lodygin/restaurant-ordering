import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

import { type ConfirmOptions } from './types';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatButton, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  template: `
    <h2 mat-dialog-title>{{ options.title }}</h2>
    <mat-dialog-content>{{ options.message }}</mat-dialog-content>
    <mat-dialog-actions>
      <button matButton [mat-dialog-close]="false">Cancel</button>
      <button matButton="filled" [mat-dialog-close]="true">{{ options.action }}</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  protected readonly options = inject<ConfirmOptions>(MAT_DIALOG_DATA);
}
