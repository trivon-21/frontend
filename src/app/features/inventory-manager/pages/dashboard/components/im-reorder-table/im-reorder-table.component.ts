import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../../../shared/components/portal-icons/portal-icons.module';
import { ReorderItem } from '../../../../services/inventory-manager-dashboard.service';

@Component({
  selector: 'app-im-reorder-table',
  standalone: true,
  imports: [CommonModule, RouterModule, PortalIconsModule],
  templateUrl: './im-reorder-table.component.html',
  styleUrl: './im-reorder-table.component.css',
})
export class ImReorderTableComponent {
  @Input({ required: true }) items!: ReorderItem[];
}
