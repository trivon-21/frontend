import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  ManagerDashboardService,
  ManagerDashboardData,
} from '../../services/manager-dashboard.service';
import { IconMappingService } from '../../../../shared/services/icon-mapping.service';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrl: './manager-dashboard.component.css',
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  data: ManagerDashboardData = {
    managerName: 'Manager',
    currentDate: new Date(),
    status: 'Syncing...',
    stats: {
      pendingTickets: { total: 0, subStats: [] },
      vehicleAvailability: { total: '0/0', subStats: [] },
      todaysSchedule: { total: 0, subStats: [] },
      escalations: { total: 0, subStats: [] }
    },
    inventoryKpis: {
      reservedItems: { label: 'Reserved Items', value: 0, icon: 'clipboard-check' },
      lowStockAlerts: { label: 'Low Stock Alerts', value: 0, icon: 'triangle-alert' },
      pendingDeliveries: { label: 'Pending Deliveries', value: 0, icon: 'truck' }
    },
    recentActivity: [],
    pendingActions: []
  };
  loading = false;
  error: string | null = null;
  private timer: any;

  constructor(
    private dashboardService: ManagerDashboardService,
    private iconMappingService: IconMappingService,
  ) {}

  ngOnInit(): void {
    this.loadData();
    // Update clock every minute
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
      next: (data: ManagerDashboardData) => {
        this.data = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to load manager dashboard data';
        this.loading = false;
      },
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
    if (type === 'escalation') return 'triangle-alert';
    if (type === 'vehicle') return 'truck';
    if (type === 'ticket') return 'clipboard-list';
    if (type === 'order') return 'shopping-bag';
    if (type === 'customer') return 'users';
    return this.iconMappingService.getActivityIcon(type) || 'info';
  }

  getPriorityClass(priority: string): string {
    if (priority === 'high') return 'critical';
    if (priority === 'medium') return 'warning';
    return 'normal';
  }
}
