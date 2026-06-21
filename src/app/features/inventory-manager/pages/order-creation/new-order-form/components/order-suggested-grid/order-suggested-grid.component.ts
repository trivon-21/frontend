import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { InventoryItem, OrderItem } from '../../../../../services/order-creation.service';

@Component({
  selector: 'app-order-suggested-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './order-suggested-grid.component.html',
  styleUrl: './order-suggested-grid.component.css',
  encapsulation: ViewEncapsulation.None
})
export class OrderSuggestedGridComponent implements OnChanges {
  @Input() suggestedItems: InventoryItem[] = [];
  @Output() suggestedItemAdded = new EventEmitter<OrderItem>();

  suggestedItemsState: any[] = [];
  selectedSuggestedIndex: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['suggestedItems'] && this.suggestedItems) {
      this.suggestedItemsState = this.suggestedItems.map(item => ({
        ...item,
        isEditingPrice: false,
        isConfiguring: false,
        editPrice: item.unitCost,
        editQty: 1
      }));
      if (this.suggestedItemsState.length > 0) {
        this.selectedSuggestedIndex = 0;
      }
    }
  }

  selectSuggestedItem(index: number): void {
    this.selectedSuggestedIndex = index;
  }

  startConfiguring(itemState: any): void {
    itemState.isConfiguring = true;
  }

  cancelConfiguring(itemState: any): void {
    itemState.isConfiguring = false;
    itemState.editQty = 1;
  }

  addFromSuggested(itemState: any): void {
    const qty = itemState.editQty || 1;
    const price = itemState.editPrice || 0;

    this.suggestedItemAdded.emit({
      inventoryId: itemState._id,
      name: itemState.name,
      sku: itemState.sku,
      quantity: qty,
      unitCost: price,
      estimatedTotal: qty * price,
      available: itemState.available,
      reserved: itemState.reserved
    });

    itemState.isConfiguring = false;
    itemState.editQty = 1;
  }

  formatCurrency(val: number): string {
    return `LKR ${(val || 0).toLocaleString()}`;
  }
}
