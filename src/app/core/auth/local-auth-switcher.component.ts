import { Component } from '@angular/core';
import {
  getLocalDevHomeRoute,
  getLocalDevRole,
  isLocalAuthBypassEnabled,
  LocalDevRole,
  setLocalDevRole,
} from './local-auth-dev';

@Component({
  selector: 'app-local-auth-switcher',
  standalone: true,
  template: `
    @if (enabled) {
      <aside class="local-auth-switcher" aria-label="Local development user">
        <span>Local user</span>
        <select [value]="role" (change)="changeRole($event)" aria-label="Select local user role">
          <option value="INVENTORY">Inventory</option>
          <option value="MANAGER">Manager</option>
        </select>
      </aside>
    }
  `,
  styles: `
    .local-auth-switcher {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--warning);
      border-radius: var(--border-radius-sm);
      background: var(--background-card);
      color: var(--text-primary);
      box-shadow: var(--shadow-large);
      font-family: var(--label-small-font-family);
      font-size: var(--label-small-font-size);
      font-weight: var(--label-small-font-weight);
      line-height: var(--label-small-line-height);
    }

    select {
      padding: var(--spacing-xs) var(--spacing-sm);
      border: 1px solid var(--warning);
      border-radius: var(--border-radius-xs);
      background: var(--background-input);
      color: var(--text-primary);
      font: inherit;
    }
  `,
})
export class LocalAuthSwitcherComponent {
  readonly enabled = isLocalAuthBypassEnabled();
  role: LocalDevRole = this.enabled ? getLocalDevRole() : 'INVENTORY';

  changeRole(event: Event): void {
    if (!this.enabled) return;

    const value = (event.target as HTMLSelectElement).value;
    const role: LocalDevRole = value === 'MANAGER' ? 'MANAGER' : 'INVENTORY';

    setLocalDevRole(role);
    window.location.assign(getLocalDevHomeRoute(role));
  }
}
