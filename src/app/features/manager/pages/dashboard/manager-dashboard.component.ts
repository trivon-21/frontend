import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import { ManagerDashboardData, ManagerDashboardService } from '../../services/manager-dashboard.service';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PortalIconsModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrl: './manager-dashboard.component.css',
})
export class ManagerDashboardComponent implements OnInit {
  data: ManagerDashboardData = {
    managerName: 'Manager',
    currentDate: new Date(),
    status: 'Syncing',
    stats: {
      openTickets: { total: 0, subStats: [] },
      unassignedTickets: { total: 0, subStats: [] },
      slaRisk: { total: 0, subStats: [] },
      pendingApprovals: { total: 0, subStats: [] },
    },
    inventoryKpis: {
      reservedItems: { label: 'Reserved Items', value: 0, icon: 'clipboard-check' },
      lowStockAlerts: { label: 'Low Stock Alerts', value: 0, icon: 'triangle-alert' },
      pendingMaterialRequests: { label: 'Pending Material Requests', value: 0, icon: 'package' },
      blockedMaterialRequests: { label: 'Blocked Material Requests', value: 0, icon: 'triangle-alert' },
    },
    recentActivity: [],
    pendingActions: [],
  };
  loading = true;
  errorMessage = '';
  constructor(private dashboardService: ManagerDashboardService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'The Manager dashboard could not be loaded. Check your connection and try again.';
        this.loading = false;
      },
    });
  }

  getActivityIcon(type: string): string {
    if (type === 'escalation') return 'triangle-alert';
    if (type === 'order') return 'shopping-bag';
    return 'clipboard-list';
  }

  getPriorityClass(priority: string): string {
    return priority === 'high' ? 'critical' : priority === 'medium' ? 'warning' : 'normal';
  }
}
