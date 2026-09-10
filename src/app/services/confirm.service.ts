import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
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
    cancelText: 'No'
  });

  state$ = this.stateSubject.asObservable();
  private activeResolver?: (value: boolean) => void;

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise(resolve => {
      this.activeResolver = resolve;
      this.stateSubject.next({
        isOpen: true,
        title: options.title ?? 'Confirm',
        message: options.message,
        confirmText: options.confirmText ?? 'Yes',
        cancelText: options.cancelText ?? 'No'
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
      cancelText: 'No'
    });
  }
}
