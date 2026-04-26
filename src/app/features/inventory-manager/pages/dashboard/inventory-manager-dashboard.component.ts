import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  InventoryManagerDashboardService,
  InventoryDashboardData,
  ActivityItem,
} from '../../services/inventory-manager-dashboard.service';

@Component({
  selector: 'app-inventory-manager-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory-manager-dashboard.component.html',
  styleUrl: './inventory-manager-dashboard.component.css',
})
export class InventoryManagerDashboardComponent implements OnInit {
  data: InventoryDashboardData | null = null;
  loading = true;
  error: string | null = null;

  constructor(private dashboardService: InventoryManagerDashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (data: InventoryDashboardData) => {
        this.data = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to load dashboard data';
        this.loading = false;
      },
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'return':
      case 'dispatch':
      case 'grn':
        return '✓';
      case 'request':
        return '📋';
      case 'alert':
        return '⏱';
      default:
        return '•';
    }
  }

  onScanQR(): void {
    console.log('Open QR Scanner');
  }

  onProcurement(): void {
    console.log('Navigate to Procurement');
  }

  onFindSerial(): void {
    // TODO: Navigate to find serial
    console.log('Navigate to Find Serial');
  }

  onLendItem(): void {
    // TODO: Navigate to lend item
    console.log('Navigate to Lend Item');
  }

  onReorder(alertId: string): void {
    console.log('Reorder for item:', alertId);
  }

  getProgressBarWidth(current: number, total: number): string {
    return `${(current / total) * 100}%`;
  }
}
