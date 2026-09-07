import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-csa-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand-wrapper">
        <a routerLink="/csa/dashboard" class="sidebar-brand">AirLux</a>
        <span class="role-badge">CSA Portal</span>
      </div>

      <nav class="nav-menu">
        <p class="nav-section-label">MAIN</p>
        <ul>
          <li routerLink="/csa/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            <span>Dashboard</span>
          </li>
          <li routerLink="/csa/customers" routerLinkActive="active">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
            <span>Customer Profiles</span>
          </li>
          <li routerLink="/csa/service-tickets" routerLinkActive="active">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
            </span>
            <span>Service Tickets</span>
          </li>
          <li routerLink="/csa/inquiries" routerLinkActive="active">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </span>
            <span>Customer Inquiries</span>
          </li>
          <li routerLink="/csa/maintenance-schedules" routerLinkActive="active">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </span>
            <span>Maintenance Schedules</span>
          </li>
        </ul>

        <p class="nav-section-label" style="margin-top: 18px;">PREFERENCES</p>
        <ul>
          <li routerLink="/csa/profile" routerLinkActive="active">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            <span>My Profile</span>
          </li>
          <li routerLink="/csa/settings" routerLinkActive="active">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </span>
            <span>Settings</span>
          </li>
          <li routerLink="/csa/notifications" routerLinkActive="active">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </span>
            <span>Notifications</span>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <div class="user-pill" routerLink="/csa/profile" title="View Profile">
          <div class="user-avatar">{{ userInitials }}</div>
          <div class="user-info">
            <span class="user-name">{{ userName }}</span>
            <span class="user-role">CSA Agent</span>
          </div>
          <button class="logout-btn" (click)="onLogout($event)" title="Sign out">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 230px;
      height: 100vh;
      background: #fff;
      border-right: 1px solid rgba(0, 0, 0, 0.07);
      display: flex;
      flex-direction: column;
      padding: 24px 0 20px;
      flex-shrink: 0;
    }

    .sidebar-brand-wrapper {
      padding: 0 20px 24px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sidebar-brand {
      font-family: 'Inter', sans-serif;
      font-size: 22px;
      font-weight: 800;
      color: var(--primary-main, #00843D);
      letter-spacing: -0.5px;
      text-decoration: none;
      line-height: 1;
    }

    .sidebar-brand:hover {
      color: var(--primary-hover, #006B32);
    }

    .role-badge {
      font-size: 10px;
      font-weight: 700;
      color: var(--primary-main, #00843D);
      background: var(--primary-lighter, #e8fdf0);
      padding: 3px 8px;
      border-radius: 999px;
      letter-spacing: 0.02em;
    }

    .nav-section-label {
      font-size: 10px;
      font-weight: 700;
      color: #9aa09e;
      letter-spacing: 0.08em;
      padding: 0 20px 8px;
      margin: 0;
    }

    .nav-menu {
      flex: 1;
      overflow-y: auto;
    }

    .nav-menu ul {
      list-style: none;
      margin: 0;
      padding: 0 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-menu li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      color: #566463;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: background 0.13s, color 0.13s;
    }

    .nav-menu li:hover {
      background: var(--primary-lighter, #e8fdf0);
      color: var(--primary-main, #00843D);
    }

    .nav-menu li.active {
      background: var(--primary-lighter, #e8fdf0);
      color: var(--primary-main, #00843D);
      font-weight: 600;
    }

    .nav-menu li.active .icon svg {
      stroke: var(--primary-main, #00843D);
    }

    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: inherit;
    }

    .sidebar-footer {
      margin-top: auto;
      padding: 16px 14px 0;
      border-top: 1px solid rgba(0, 0, 0, 0.07);
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      background: #f8faf9;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .user-pill:hover {
      background: #f0f4f2;
      border-color: rgba(0, 132, 61, 0.2);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-main, #00843D);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .user-name {
      font-size: 13px;
      color: #1b2f27;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 11px;
      color: #6c757d;
      line-height: 1.1;
    }

    .logout-btn {
      background: none;
      border: none;
      color: #8a9693;
      cursor: pointer;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;
    }

    .logout-btn:hover {
      color: #dc3545;
      background: rgba(220, 53, 69, 0.08);
    }
  `]
})
export class CsaSidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  get userName(): string {
    const user = this.authService.getCurrentUser();
    return user?.fullName || 'CSA Agent';
  }

  get userInitials(): string {
    const user = this.authService.getCurrentUser();
    if (!user || !user.fullName) return 'CS';
    return user.fullName
      .split(' ')
      .filter((part: string) => !!part)
      .map((part: string) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  onLogout(event: Event): void {
    event.stopPropagation();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
