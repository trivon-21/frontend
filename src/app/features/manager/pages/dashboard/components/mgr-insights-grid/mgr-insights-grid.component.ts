import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../../../shared/components/portal-icons/portal-icons.module';
import { ManagerDashboardData, WorkloadEntry } from '../../../../services/manager-dashboard.service';
import { AnalyticsData } from '../../../../services/analytics.service';

@Component({
  selector: 'app-mgr-insights-grid',
  standalone: true,
  imports: [CommonModule, RouterModule, PortalIconsModule],
  templateUrl: './mgr-insights-grid.component.html',
  styleUrl: './mgr-insights-grid.component.css',
})
export class MgrInsightsGridComponent {
  @Input({ required: true }) data!: ManagerDashboardData;
  @Input() analyticsData: AnalyticsData | null = null;

  formatCurrency(value: number | undefined | null): string {
    return 'LKR ' + (Number(value) || 0).toLocaleString('en-US');
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

  get workloadList(): WorkloadEntry[] {
    return this.data.workloadPreview || [];
  }

  get totalTechniciansActive(): number {
    return this.workloadList.length;
  }

  get totalWorkloadSlaRisk(): number {
    return this.workloadList.reduce((sum, item) => sum + (item.slaRisk || 0), 0);
  }

  get totalWorkloadActiveTickets(): number {
    return this.workloadList.reduce((sum, item) => sum + (item.active || 0), 0);
  }
}
