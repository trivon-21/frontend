import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';

export interface HasPendingChanges {
  canDeactivate(): boolean | Promise<boolean> | Observable<boolean>;
}

export const pendingChangesGuard: CanDeactivateFn<HasPendingChanges> = (component) => component.canDeactivate();
