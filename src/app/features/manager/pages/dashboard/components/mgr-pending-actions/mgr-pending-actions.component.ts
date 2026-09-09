import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../../../shared/components/portal-icons/portal-icons.module';
import { ManagerDashboardData, PendingAction } from '../../../../services/manager-dashboard.service';

@Component({
  selector: 'app-mgr-pending-actions',
  standalone: true,
  imports: [CommonModule, RouterModule, PortalIconsModule],
  templateUrl: './mgr-pending-actions.component.html',
  styleUrl: './mgr-pending-actions.component.css',
})
export class MgrPendingActionsComponent {
  @Input({ required: true }) data!: ManagerDashboardData;

  isApprovalAction(action: PendingAction): boolean {
    return action.type === 'approval' || action.category === 'approval' || action.type === 'order' || action.type === 'authorization';
  }

  getPriorityClass(priority: string): string {
    return priority === 'high' ? 'critical' : priority === 'medium' ? 'warning' : 'normal';
  }

  formatCurrency(value: number | undefined | null): string {
    return 'LKR ' + (Number(value) || 0).toLocaleString('en-US');
  }

  get pendingActionsTotal(): number {
    return this.data.pendingActionsTotal ?? this.data.pendingActions.length;
  }

  get hasMorePendingActions(): boolean {
    return this.pendingActionsTotal > this.data.pendingActions.length;
  }
}
