import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../../../shared/components/portal-icons/portal-icons.module';
import { LogisticsDashboardItem } from '../../../../services/inventory-manager-dashboard.service';

@Component({
  selector: 'app-im-logistics-table',
  standalone: true,
  imports: [CommonModule, RouterModule, PortalIconsModule],
  templateUrl: './im-logistics-table.component.html',
  styleUrl: './im-logistics-table.component.css',
})
export class ImLogisticsTableComponent {
  @Input({ required: true }) orders!: LogisticsDashboardItem[];
}
