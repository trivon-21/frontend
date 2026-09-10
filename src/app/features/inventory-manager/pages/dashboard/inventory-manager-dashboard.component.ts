import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  InventoryManagerDashboardService,
  InventoryDashboardData,
  normalizeInventoryDashboard,
} from '../../services/inventory-manager-dashboard.service';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import { ImSummaryCardsComponent } from './components/im-summary-cards/im-summary-cards.component';
import { ImActivityFeedComponent } from './components/im-activity-feed/im-activity-feed.component';
import { ImReorderTableComponent } from './components/im-reorder-table/im-reorder-table.component';

@Component({
  selector: 'app-inventory-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PortalIconsModule,
    ImSummaryCardsComponent,
    ImActivityFeedComponent,
    ImReorderTableComponent,
  ],
  templateUrl: './inventory-manager-dashboard.component.html',
  styleUrl: './inventory-manager-dashboard.component.css',
})
export class InventoryManagerDashboardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  data: InventoryDashboardData = { ...normalizeInventoryDashboard(null), status: 'Syncing...' };
  loading = false; // Structure should load immediately
  refreshing = false;
  error: string | null = null;
  hasLoadedSuccess = false;
  isStale = false;

  constructor(private dashboardService: InventoryManagerDashboardService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(options: { force?: boolean } = {}): void {
    if (!this.hasLoadedSuccess) {
      this.loading = true;
    } else {
      this.refreshing = true;
    }
    this.error = null;
    this.dashboardService.getDashboard(options)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: InventoryDashboardData) => {
          this.data = data;
          this.hasLoadedSuccess = true;
          this.isStale = false;
          this.loading = false;
          this.refreshing = false;
        },
        complete: () => {
          this.loading = false;
          this.refreshing = false;
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Failed to load dashboard data';
          this.loading = false;
          this.refreshing = false;
          if (this.hasLoadedSuccess) {
            this.isStale = true;
          }
        },
      });
  }
}
