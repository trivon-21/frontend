import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  InventoryManagerDashboardService,
  InventoryDashboardData,
  ActivityItem,
} from '../../services/inventory-manager-dashboard.service';

@Component({
  selector: 'app-inventory-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './inventory-manager-dashboard.component.html',
  styleUrl: './inventory-manager-dashboard.component.css',
})
export class InventoryManagerDashboardComponent implements OnInit, OnDestroy {
  data: InventoryDashboardData | null = null;
  loading = true;
  error: string | null = null;
  private timer: any;

  constructor(private dashboardService: InventoryManagerDashboardService) {}

  ngOnInit(): void {
    this.loadData();
    // Update time every minute for real-world accuracy
    this.timer = setInterval(() => {
      if (this.data) {
        this.data.currentDate = new Date();
      }
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  loadData(): void {
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

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
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
