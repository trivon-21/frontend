import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import {
  ManagerDashboardData,
  ManagerDashboardService,
} from '../../services/manager-dashboard.service';
import { MgrSummaryCardsComponent } from './components/mgr-summary-cards/mgr-summary-cards.component';
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
    MgrPendingActionsComponent,
    MgrWorkforceCardComponent,
  ],
  templateUrl: './manager-dashboard.component.html',
  styleUrl: './manager-dashboard.component.css',
})
export class ManagerDashboardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

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
  // `loading`: no data has been rendered yet (first render is blank/placeholder).
  // `refreshing`: data is already on screen (possibly from cache) and a
  // background revalidation is in flight — never flashes zeros.
  loading = true;
  refreshing = false;
  errorMessage = '';

  constructor(private dashboardService: ManagerDashboardService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(options: { force?: boolean } = {}): void {
    this.errorMessage = '';
    this.dashboardService.getDashboard(options)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // A stale-cache hit emits the cached value immediately, then the
        // fresh value once the background revalidation lands — this handler
        // must stay idempotent across both emissions.
        next: (data) => {
          this.data = data;
          this.loading = false;
          this.refreshing = true;
        },
        complete: () => {
          this.refreshing = false;
        },
        error: () => {
          this.errorMessage = 'The Manager dashboard could not be loaded. Check your connection and try again.';
          this.loading = false;
          this.refreshing = false;
        },
      });
  }
}
