import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardData, DashboardOrder } from '../../services/dashboard.service';

@Component({
  selector: 'app-customer-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-dashboard-home.component.html',
  styleUrl: './customer-dashboard-home.component.css',
})
export class CustomerDashboardHomeComponent implements OnInit {
  data: DashboardData | null = null;
  loading = true;
  error: string | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load dashboard data';
        this.loading = false;
      }
    });
  }

  get orders(): DashboardOrder[] {
    return this.data?.orders ?? [];
  }

  formatAmount(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  pad(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
