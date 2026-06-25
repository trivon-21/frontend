import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  InventoryManagerDashboardService,
  InventoryDashboardData,
  ActivityItem,
} from '../../services/inventory-manager-dashboard.service';
import { IconMappingService } from '../../../../shared/services/icon-mapping.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-inventory-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './inventory-manager-dashboard.component.html',
  styleUrl: './inventory-manager-dashboard.component.css',
})
export class InventoryManagerDashboardComponent implements OnInit, OnDestroy {
  data: InventoryDashboardData = {
    managerName: 'Manager',
    currentDate: new Date(),
    status: 'Syncing...',
    stats: {
      materialReservations: { total: 0, subStats: [] },
      dispatchQueue: { total: 0, subStats: [] },
      assetHealth: { total: 0, subStats: [] },
      stockAlerts: { total: 0, subStats: [] }
    },
    recentActivity: [],
    reorderList: [],
  };
  loading = false; // Structure should load immediately
  error: string | null = null;
  private timer: any;

  constructor(
    private dashboardService: InventoryManagerDashboardService,
    private iconMappingService: IconMappingService,
    private router: Router,
  ) {}

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
    this.loading = true;
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
      hour12: true,
    });
  }

  getActivityIcon(type: string): string {
    return this.iconMappingService.getActivityIcon(type);
  }

  handleActivityAction(activity: ActivityItem): void {
    const routes: Record<string, string> = {
      'View GRN': '/inventory-manager/procurement',
      'View Asset': '/inventory-manager/asset-management',
      'View Log': '/inventory-manager/asset-management',
      'View Order': '/inventory-manager/order-creation',
      'View Procurement': '/inventory-manager/procurement',
      'View Returns': '/inventory-manager/returns-rma',
      'View RMA': '/inventory-manager/returns-rma',
      'View Quarantine': '/inventory-manager/returns-rma',
    };
    const route = routes[activity.actionLabel || ''];
    if (route) {
      this.router.navigate([route]);
    }
  }
}
