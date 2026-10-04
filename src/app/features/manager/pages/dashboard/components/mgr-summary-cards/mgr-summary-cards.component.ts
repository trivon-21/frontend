import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../../../shared/components/portal-icons/portal-icons.module';
import { ManagerDashboardData } from '../../../../services/manager-dashboard.service';

@Component({
  selector: 'app-mgr-summary-cards',
  standalone: true,
  imports: [CommonModule, RouterModule, PortalIconsModule],
  templateUrl: './mgr-summary-cards.component.html',
  styleUrl: './mgr-summary-cards.component.css',
})
export class MgrSummaryCardsComponent {
  @Input({ required: true }) data!: ManagerDashboardData;

  // No arithmetic here — the dashboard endpoint already ships three
  // explicit, non-overlapping stock fields (belowReorder/outOfStock/total
  // union), computed with the same rule Inventory-Manager's own Stock
  // Alerts card uses, so the two portals can never disagree on the same
  // data. Adding lowStock + outOfStock here was the original double-count
  // bug — don't reintroduce it.
  get outOfStockCount(): number {
    return this.data.inventoryKpis?.outOfStockItems?.value ?? 0;
  }

  get lowStockCount(): number {
    return this.data.inventoryKpis?.belowReorderItems?.value ?? 0;
  }

  get totalStockRiskCount(): number {
    return this.data.inventoryKpis?.stockRiskItems?.value ?? 0;
  }

  get reservedItemsCount(): number {
    return this.data.inventoryKpis?.reservedItems?.value ?? 0;
  }
}
