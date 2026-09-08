import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import {
  ManagerDashboardData,
  ManagerDashboardService,
} from '../../services/manager-dashboard.service';
import {
  AnalyticsData,
  AnalyticsService,
} from '../../services/analytics.service';
import { MgrSummaryCardsComponent } from './components/mgr-summary-cards/mgr-summary-cards.component';
import { MgrInsightsGridComponent } from './components/mgr-insights-grid/mgr-insights-grid.component';
import { MgrPendingActionsComponent } from './components/mgr-pending-actions/mgr-pending-actions.component';
import { MgrWorkforceCardComponent } from './components/mgr-workforce-card/mgr-workforce-card.component';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PortalIconsModule,
    MgrSummaryCardsComponent,
    MgrInsightsGridComponent,
    MgrPendingActionsComponent,
    MgrWorkforceCardComponent,
  ],
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
      belowReorderItems: { label: 'Below Reorder', value: 0, icon: 'triangle-alert' },
      outOfStockItems: { label: 'Out of Stock', value: 0, icon: 'triangle-alert' },
      stockRiskItems: { label: 'Stock Risk', value: 0, icon: 'triangle-alert' },
      blockedMaterialRequests: { label: 'Blocked Material Requests', value: 0, icon: 'triangle-alert' },
    },
    pendingActions: [],
    pendingActionsTotal: 0,
    workloadPreview: [],
  };
  analyticsData: AnalyticsData | null = null;
  analyticsLoading = false;
  loading = true;
  errorMessage = '';

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
}
