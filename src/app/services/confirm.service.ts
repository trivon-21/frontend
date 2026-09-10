import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Visual emphasis for the confirm button. 'danger' is for destructive/discard actions. */
  variant?: 'default' | 'danger';
}

export interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private stateSubject = new BehaviorSubject<ConfirmState>({
    isOpen: false,
    message: '',
    title: 'Confirm',
    confirmText: 'Yes',
    cancelText: 'No',
    variant: 'default'
  });

  state$ = this.stateSubject.asObservable();
  private activeResolver?: (value: boolean) => void;

  confirm(options: ConfirmOptions): Promise<boolean> {
    // Only one confirmation can be shown at a time. If a previous confirm() is
    // still pending, resolve it as cancelled rather than leaving it to hang
    // forever once its resolver is overwritten below.
    if (this.activeResolver) {
      this.close(false);
    }
    return new Promise(resolve => {
      this.activeResolver = resolve;
      this.stateSubject.next({
        isOpen: true,
        title: options.title ?? 'Confirm',
        message: options.message,
        confirmText: options.confirmText ?? 'Yes',
        cancelText: options.cancelText ?? 'No',
        variant: options.variant ?? 'default'
      });
    });
  }

  accept(): void {
    this.close(true);
  }

  cancel(): void {
    this.close(false);
  }

  private close(result: boolean): void {
    if (this.activeResolver) {
      this.activeResolver(result);
      this.activeResolver = undefined;
    }
    this.stateSubject.next({
      isOpen: false,
      title: 'Confirm',
      message: '',
      confirmText: 'Yes',
      cancelText: 'No',
      variant: 'default'
    });
  }
}
