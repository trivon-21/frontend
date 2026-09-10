import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortalIconsModule } from '../../../../../../../shared/components/portal-icons/portal-icons.module';
import { RouterModule } from '@angular/router';
import { InventoryItem, OrderItem } from '../../../../../services/order-creation.service';
import { supplierIdOf, supplierNameOf } from '../../../../../services/inventory-domain';

@Component({
  selector: 'app-order-item-search',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconsModule, RouterModule],
  templateUrl: './order-item-search.component.html',
  styleUrl: './order-item-search.component.css'
})
export class OrderItemSearchComponent implements OnChanges {
  @Input() inventoryItems: InventoryItem[] = [];
  @Output() itemAdded = new EventEmitter<OrderItem>();

  filteredInventory: InventoryItem[] = [];
  itemSearchQuery = '';
  showItemDropdown = false;
  selectedItem: InventoryItem | null = null;
  currentQuantity = 1;
  currentPrice = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inventoryItems']) {
      this.filteredInventory = this.inventoryItems;
    }
  }

  filterItems(): void {
    const q = (this.itemSearchQuery || '').toLowerCase().trim();
    if (!q) {
      this.filteredInventory = this.inventoryItems;
    } else {
      this.filteredInventory = this.inventoryItems.filter(i => i && (
        (i.name?.toLowerCase() || '').includes(q) ||
        (i.sku?.toLowerCase() || '').includes(q) ||
        (i.itemClass?.toLowerCase() || '').includes(q) ||
        (i.subcategory?.toLowerCase() || '').includes(q) ||
        (i.brand?.toLowerCase() || '').includes(q) ||
        (i.manufacturerPartNumber?.toLowerCase() || '').includes(q) ||
        (i.compatibleModels || []).some((model) => model.toLowerCase().includes(q))
      ));
    }
    this.showItemDropdown = true;
  }

  selectInventoryItem(item: InventoryItem): void {
    this.selectedItem = item;
    this.itemSearchQuery = item.name;
    this.currentQuantity = 1;
    this.currentPrice = item.unitCost;
    this.showItemDropdown = false;
  }

  clearSelection(): void {
    this.selectedItem = null;
    this.itemSearchQuery = '';
    this.currentQuantity = 1;
    this.currentPrice = 0;
  }

  onItemInputBlur(): void {
    setTimeout(() => { this.showItemDropdown = false; }, 250);
  }

  onItemInputFocus(): void {
    this.showItemDropdown = true;
    this.filterItems();
  }

  addLineItem(): void {
    if (!this.selectedItem || this.currentQuantity <= 0) return;
    this.itemAdded.emit({
        inventoryId: this.selectedItem._id || this.selectedItem.id || '',
        name: this.selectedItem.name,
        sku: this.selectedItem.sku,
        quantity: this.currentQuantity,
        unitCost: this.currentPrice,
        estimatedTotal: this.currentQuantity * this.currentPrice,
        available: this.selectedItem.available,
        reserved: this.selectedItem.reserved,
        itemClass: this.selectedItem.itemClass || 'Unclassified',
        subcategory: this.selectedItem.subcategory || 'Unclassified',
        unit: this.selectedItem.unit,
        manufacturerPartNumber: this.selectedItem.manufacturerPartNumber,
        supplierId: supplierIdOf(this.selectedItem),
        supplierName: supplierNameOf(this.selectedItem),
    });
    this.clearSelection();
  }

  formatCurrency(val: number): string {
    return `LKR ${(val || 0).toLocaleString()}`;
  }
}
