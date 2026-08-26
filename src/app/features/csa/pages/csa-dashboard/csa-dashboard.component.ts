import { Component, OnInit } from '@angular/core';
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
export class CsaDashboardComponent implements OnInit {
  isLoading = true;
  errorMessage = '';
  dashboardData: DashboardData | null = null;
  currentDate = new Date();

  constructor(private dashboardService: CsaDashboardService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
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
        this.errorMessage = 'Failed to load dashboard metrics. Please refresh.';
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
