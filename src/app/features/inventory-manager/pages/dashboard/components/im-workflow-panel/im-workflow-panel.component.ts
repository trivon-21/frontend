import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../../../shared/components/portal-icons/portal-icons.module';
import { ProcurementWorkflowSummary } from '../../../../services/inventory-manager-dashboard.service';

@Component({
  selector: 'app-im-workflow-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, PortalIconsModule],
  templateUrl: './im-workflow-panel.component.html',
  styleUrl: './im-workflow-panel.component.css',
})
export class ImWorkflowPanelComponent {
  @Input({ required: true }) workflow!: ProcurementWorkflowSummary;
}
