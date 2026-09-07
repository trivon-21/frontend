import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  InventoryManagerDashboardService,
  InventoryDashboardData,
  ActivityItem,
} from '../../services/inventory-manager-dashboard.service';
import { IconMappingService } from '../../../../shared/services/icon-mapping.service';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';

@Component({
  selector: 'app-inventory-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PortalIconsModule],
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
      awaitingReceipt: 0,
      awaitingFinance: 0,
    },
    logistics: [],
  };
  loading = false; // Structure should load immediately
  error: string | null = null;
  hasLoadedSuccess = false;
  isStale = false;

  constructor(
    private dashboardService: InventoryManagerDashboardService,
    private iconMappingService: IconMappingService,
    private router: Router,
  ) {}

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
