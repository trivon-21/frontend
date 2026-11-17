import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortalIconsModule } from '../../../../../../../shared/components/portal-icons/portal-icons.module';
import { InventoryItem, OrderItem } from '../../../../../services/order-creation.service';

@Component({
  selector: 'app-order-suggested-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconsModule],
  templateUrl: './order-suggested-grid.component.html',
  styleUrl: './order-suggested-grid.component.css'
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
        editQty: item.suggestedQuantity || 1
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
    const qty = itemState.editQty || itemState.suggestedQuantity || 1;
    const price = itemState.editPrice || 0;

    this.suggestedItemAdded.emit({
      inventoryId: itemState._id,
      name: itemState.name,
      sku: itemState.sku,
      quantity: qty,
      unitCost: price,
      estimatedTotal: qty * price,
      available: itemState.available,
      reserved: itemState.reserved,
      itemClass: itemState.itemClass || 'Unclassified',
      subcategory: itemState.subcategory || 'Unclassified',
      unit: itemState.unit || 'units',
      manufacturerPartNumber: itemState.manufacturerPartNumber || '',
      supplierId: typeof itemState.supplierId === 'object' ? itemState.supplierId._id : itemState.supplierId,
      supplierName: typeof itemState.supplierId === 'object' ? itemState.supplierId.name : itemState.supplierName,
    });

    itemState.isConfiguring = false;
    itemState.editQty = itemState.suggestedQuantity || 1;
  }

  formatCurrency(val: number): string {
    return `LKR ${(val || 0).toLocaleString()}`;
  }
}
