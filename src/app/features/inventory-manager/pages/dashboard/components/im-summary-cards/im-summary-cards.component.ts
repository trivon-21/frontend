import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../../../shared/components/portal-icons/portal-icons.module';
import { SummaryStats } from '../../../../services/inventory-manager-dashboard.service';

@Component({
  selector: 'app-im-summary-cards',
  standalone: true,
  imports: [CommonModule, RouterModule, PortalIconsModule],
  templateUrl: './im-summary-cards.component.html',
})
export class ImSummaryCardsComponent {
  @Input({ required: true }) stats!: SummaryStats;
}
