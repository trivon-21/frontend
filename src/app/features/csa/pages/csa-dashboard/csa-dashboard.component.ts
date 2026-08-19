import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-csa-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="dashboard-container">
      <h2 class="page-title">CSA Dashboard</h2>
      <div class="quick-nav">
        <a routerLink="/csa/maintenance-schedules" class="nav-card">
          <div class="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <h3>Maintenance Schedules</h3>
            <p>Review and dispatch schedules to customers</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;flex-shrink:0"><path d="m9 18 6-6-6-6"/></svg>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { max-width: 900px; margin: 0 auto; }
    .page-title { font-size: 22px; font-weight: 800; color: #1a2e1a; margin-bottom: 24px; }
    .quick-nav { display: flex; flex-direction: column; gap: 14px; }
    .nav-card {
      display: flex;
      align-items: center;
      gap: 18px;
      background: #fff;
      padding: 22px 24px;
      border-radius: 14px;
      border: 1.5px solid #f3f4f6;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
      cursor: pointer;
    }
    .nav-card:hover { border-color: #d1d5db; box-shadow: 0 4px 12px rgba(0,0,0,0.06); transform: translateY(-1px); }
    .nav-icon { width: 52px; height: 52px; background: #eff6ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .nav-card h3 { margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #111827; }
    .nav-card p { margin: 0; font-size: 13px; color: #6b7280; }
  `]
})
export class CsaDashboardComponent {}
