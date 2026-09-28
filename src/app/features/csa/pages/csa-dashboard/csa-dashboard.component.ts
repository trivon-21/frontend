import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CsaDashboardService, DashboardData } from '../../services/csa-dashboard.service';

@Component({
  selector: 'app-csa-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './csa-dashboard.component.html',
  styleUrl: './csa-dashboard.component.css'
})
export class CsaDashboardComponent implements OnInit, OnDestroy {
  isLoading = true;
  errorMessage = '';
  dashboardData: DashboardData | null = null;
  currentDate = new Date();
  private pollInterval: any = null;
  private onFocusHandler = () => this.loadStats(false);

  constructor(private dashboardService: CsaDashboardService) {}

  ngOnInit(): void {
    this.loadStats(true);

    // Auto-update dashboard metrics live every 8 seconds
    this.pollInterval = setInterval(() => {
      this.loadStats(false);
    }, 8000);

    // Refresh immediately when returning to the tab/window
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.onFocusHandler);
      document.addEventListener('visibilitychange', this.onFocusHandler);
    }
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.onFocusHandler);
      document.removeEventListener('visibilitychange', this.onFocusHandler);
    }
  }

  loadStats(showLoading = true): void {
    if (showLoading) {
      this.isLoading = true;
    }
    this.errorMessage = '';

    this.dashboardService.getDashboardStats().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success) {
          this.dashboardData = res;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load CSA dashboard stats:', err);
        if (showLoading) {
          this.errorMessage = 'Failed to load dashboard metrics. Please refresh.';
        }
      }
    });
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  getInitials(name: string | undefined): string {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
}
