import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-csa-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="csa-header">
      <div class="header-left">
        <h2 class="page-context">Customer Service Advisor</h2>
      </div>
      <div class="header-right">
        <span class="current-date">{{ today | date: 'EEEE, d MMMM yyyy' }}</span>
      </div>
    </header>
  `,
  styles: [`
    .csa-header {
      height: 60px;
      background: #fff;
      border-bottom: 1px solid #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      flex-shrink: 0;
    }

    .page-context {
      font-size: 15px;
      font-weight: 600;
      color: #374151;
      margin: 0;
    }

    .current-date {
      font-size: 13px;
      color: #9ca3af;
      font-weight: 500;
    }
  `]
})
export class CsaHeaderComponent {
  today = new Date();
}
