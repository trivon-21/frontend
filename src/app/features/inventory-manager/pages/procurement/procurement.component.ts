import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-procurement',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="procurement-container">
      <div class="header">
        <h1>Procurement</h1>
      </div>
      <div class="glass-panel empty-state">
        <i class="icon-procurement"></i>
        <h2>Procurement Module</h2>
        <p>This module is currently being initialized. Please check back shortly.</p>
      </div>
    </div>
  `,
  styles: [`
    .procurement-container { padding: 32px; }
    h1 { font-size: 32px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px; }
    .empty-state { 
      padding: 64px; 
      text-align: center; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      gap: 16px;
    }
    .empty-state i { font-size: 48px; color: var(--primary-main); }
  `]
})
export class ProcurementComponent {}
