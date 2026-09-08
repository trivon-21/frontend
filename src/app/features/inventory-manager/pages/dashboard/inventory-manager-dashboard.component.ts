import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  InventoryManagerDashboardService,
  InventoryDashboardData,
} from '../../services/inventory-manager-dashboard.service';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import { ImSummaryCardsComponent } from './components/im-summary-cards/im-summary-cards.component';
import { ImWorkflowPanelComponent } from './components/im-workflow-panel/im-workflow-panel.component';
import { ImActivityFeedComponent } from './components/im-activity-feed/im-activity-feed.component';
import { ImReorderTableComponent } from './components/im-reorder-table/im-reorder-table.component';
import { ImLogisticsTableComponent } from './components/im-logistics-table/im-logistics-table.component';

@Component({
  selector: 'app-inventory-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PortalIconsModule,
    ImSummaryCardsComponent,
    ImWorkflowPanelComponent,
    ImActivityFeedComponent,
    ImReorderTableComponent,
    ImLogisticsTableComponent,
  ],
  templateUrl: './inventory-manager-dashboard.component.html',
  styleUrl: './inventory-manager-dashboard.component.css',
})
export class InventoryManagerDashboardComponent implements OnInit {
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
    procurementWorkflow: {
      awaitingManager: 0,
      awaitingFinanceApproval: 0,
      readyToIssue: 0,
      readyToReceive: 0,
      awaitingReceiptReconciliation: 0,
      breakdown: {
        awaitingManager: { purchaseRequests: 0, receiptAuthorizations: 0 },
        readyToReceive: { purchaseOrders: 0, receiptAuthorizations: 0 },
      },
    },
    logistics: [],
  };
  loading = false; // Structure should load immediately
  error: string | null = null;
  hasLoadedSuccess = false;
  isStale = false;

  constructor(private dashboardService: InventoryManagerDashboardService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;
    this.dashboardService.getDashboard().subscribe({
      next: (data: InventoryDashboardData) => {
        this.data = data;
        this.hasLoadedSuccess = true;
        this.isStale = false;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to load dashboard data';
        this.loading = false;
        if (this.hasLoadedSuccess) {
          this.isStale = true;
        }
      },
    });
  }
}
