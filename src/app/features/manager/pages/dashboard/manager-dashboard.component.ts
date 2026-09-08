import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import {
  ManagerDashboardData,
  ManagerDashboardService,
  PendingAction,
  WorkloadEntry,
} from '../../services/manager-dashboard.service';
import {
  AnalyticsData,
  AnalyticsService,
} from '../../services/analytics.service';

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
    workloadPreview: [],
  };
  analyticsData: AnalyticsData | null = null;
  analyticsLoading = false;
  loading = true;
  errorMessage = '';

  activeActionFilter: 'all' | 'approvals' | 'tickets' | 'inventory' = 'all';

  constructor(
    private dashboardService: ManagerDashboardService,
    private analyticsService: AnalyticsService,
  ) {}

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

    this.analyticsLoading = true;
    this.analyticsService.getAnalytics('7d').subscribe({
      next: (data) => {
        this.analyticsData = data;
        this.analyticsLoading = false;
      },
      error: () => {
        this.analyticsLoading = false;
      },
    });
  }

  setActionFilter(filter: 'all' | 'approvals' | 'tickets' | 'inventory'): void {
    this.activeActionFilter = filter;
  }

  get filteredActions(): PendingAction[] {
    const actions = this.data.pendingActions || [];
    if (this.activeActionFilter === 'approvals') {
      return actions.filter(
        (a) => a.type === 'approval' || a.category === 'approval' || a.type === 'order' || a.type === 'authorization',
      );
    }
    if (this.activeActionFilter === 'tickets') {
      return actions.filter(
        (a) => a.type === 'ticket' || a.type === 'sla' || a.type === 'escalation',
      );
    }
    if (this.activeActionFilter === 'inventory') {
      return actions.filter(
        (a) => a.type === 'inventory' || a.category === 'inventory',
      );
    }
    return actions;
  }

  get approvalActionsCount(): number {
    return (this.data.pendingActions || []).filter(
      (a) => a.type === 'approval' || a.category === 'approval' || a.type === 'order' || a.type === 'authorization',
    ).length;
  }

  get ticketActionsCount(): number {
    return (this.data.pendingActions || []).filter(
      (a) => a.type === 'ticket' || a.type === 'sla' || a.type === 'escalation',
    ).length;
  }

  get inventoryActionsCount(): number {
    return (this.data.pendingActions || []).filter(
      (a) => a.type === 'inventory' || a.category === 'inventory',
    ).length;
  }

  isApprovalAction(action: PendingAction): boolean {
    return action.type === 'approval' || action.category === 'approval' || action.type === 'order' || action.type === 'authorization';
  }

  formatCurrency(value: number | undefined | null): string {
    return 'LKR ' + (Number(value) || 0).toLocaleString('en-US');
  }

  getActivityIcon(type: string): string {
    if (type === 'escalation') return 'triangle-alert';
    if (type === 'order' || type === 'approval') return 'shopping-bag';
    if (type === 'authorization') return 'clipboard-check';
    return 'clipboard-list';
  }

  getPriorityClass(priority: string): string {
    return priority === 'high' ? 'critical' : priority === 'medium' ? 'warning' : 'normal';
  }

  get totalTicketsResolved(): number {
    return this.analyticsData?.performance?.ticketsResolved?.current ?? 0;
  }

  get averageResolutionHours(): number {
    return this.analyticsData?.performance?.averageResolutionHours?.current ?? 0;
  }

  get collectedRevenue(): number {
    return this.analyticsData?.financial?.collectedRevenue?.current ?? 0;
  }

  get operatingContribution(): number {
    return this.analyticsData?.financial?.operatingContribution?.current ?? 0;
  }

  get purchaseCommitments(): number {
    return this.analyticsData?.financial?.purchaseCommitments?.value ?? 0;
  }

  get pendingApprovalValue(): number {
    return this.analyticsData?.purchasing?.pendingApprovalValue?.value ?? 0;
  }

  get oldestPendingAgeHours(): number {
    return this.analyticsData?.purchasing?.oldestPendingAgeHours ?? 0;
  }

  get managerApprovalTurnaround(): number {
    return this.analyticsData?.purchasing?.averageManagerApprovalHours ?? 0;
  }

  get outOfStockCount(): number {
    return this.analyticsData?.inventoryRisk?.outOfStockItems?.value ?? 0;
  }

  get lowStockCount(): number {
    return (
      this.data.inventoryKpis?.lowStockAlerts?.value ??
      this.analyticsData?.inventoryRisk?.lowStockItems?.value ??
      0
    );
  }

  get totalStockRiskCount(): number {
    return this.lowStockCount + this.outOfStockCount;
  }

  get reservedItemsCount(): number {
    return (
      this.data.inventoryKpis?.reservedItems?.value ??
      this.analyticsData?.inventoryRisk?.reservedUnits?.value ??
      0
    );
  }

  get blockedRequestsCount(): number {
    return this.data.inventoryKpis?.blockedMaterialRequests?.value ?? 0;
  }

  get workloadList(): WorkloadEntry[] {
    return this.data.workloadPreview || [];
  }

  get totalTechniciansActive(): number {
    return this.workloadList.length;
  }

  get topLoadedTechnician(): WorkloadEntry | null {
    return this.workloadList.length > 0 ? this.workloadList[0] : null;
  }

  get totalWorkloadSlaRisk(): number {
    return this.workloadList.reduce((sum, item) => sum + (item.slaRisk || 0), 0);
  }

  get totalWorkloadActiveTickets(): number {
    return this.workloadList.reduce((sum, item) => sum + (item.active || 0), 0);
  }

  get nonPoExceptionsCount(): number {
    return this.analyticsData?.exceptions?.nonPoCount ?? 0;
  }

  get nonPoExceptionsValue(): number {
    return this.analyticsData?.exceptions?.nonPoValue ?? 0;
  }
}
