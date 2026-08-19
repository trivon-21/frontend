import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-csa-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
          </svg>
        </div>
        <div class="logo-text-group">
          <h1 class="logo-text">AirLux</h1>
          <span class="logo-role">CSA Portal</span>
        </div>
      </div>

      <nav class="nav-menu">
        <p class="nav-section-label">MAIN</p>
        <ul>
          <li routerLink="/csa/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            Dashboard
          </li>
          <li routerLink="/csa/maintenance-schedules" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </span>
            Maintenance Schedules
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <div class="user-pill">
          <div class="user-avatar">CSA</div>
          <span class="user-name">CSA User</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      min-height: 100vh;
      background: #1a2e1a;
      display: flex;
      flex-direction: column;
      padding: 0;
      flex-shrink: 0;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 20px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.12);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .logo-text-group {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
      margin: 0;
      line-height: 1;
    }

    .logo-role {
      font-size: 11px;
      color: rgba(255,255,255,0.45);
      font-weight: 500;
      letter-spacing: 0.04em;
    }

    .nav-section-label {
      font-size: 10px;
      font-weight: 700;
      color: rgba(255,255,255,0.3);
      letter-spacing: 0.1em;
      padding: 20px 20px 8px;
      margin: 0;
    }

    .nav-menu ul {
      list-style: none;
      margin: 0;
      padding: 0 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-menu li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 14px;
      border-radius: 10px;
      cursor: pointer;
      color: rgba(255,255,255,0.65);
      font-size: 14px;
      font-weight: 500;
      transition: all 0.18s;
    }

    .nav-menu li:hover {
      background: rgba(255,255,255,0.08);
      color: #fff;
    }

    .nav-menu li.active {
      background: rgba(255,255,255,0.14);
      color: #fff;
      font-weight: 600;
    }

    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .sidebar-footer {
      margin-top: auto;
      padding: 16px 14px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: rgba(255,255,255,0.07);
      border-radius: 10px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }

    .user-name {
      font-size: 13px;
      color: rgba(255,255,255,0.75);
      font-weight: 500;
    }
  `]
})
export class CsaSidebarComponent {}
