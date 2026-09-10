import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../../../shared/components/portal-icons/portal-icons.module';
import { WorkloadEntry } from '../../../../services/manager-dashboard.service';

@Component({
  selector: 'app-mgr-workforce-card',
  standalone: true,
  imports: [CommonModule, RouterModule, PortalIconsModule],
  templateUrl: './mgr-workforce-card.component.html',
  styleUrl: './mgr-workforce-card.component.css',
})
export class MgrWorkforceCardComponent {
  @Input() workloadList: WorkloadEntry[] = [];
  @Input() unassignedTotal = 0;

  get totalWorkloadSlaRisk(): number {
    return this.workloadList.reduce((sum, item) => sum + (item.slaRisk || 0), 0);
  }

  get totalWorkloadActiveTickets(): number {
    return this.workloadList.reduce((sum, item) => sum + (item.active || 0), 0);
  }
}
