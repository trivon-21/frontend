import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortalIconsModule } from '../../../../../../../shared/components/portal-icons/portal-icons.module';
import { RouterModule } from '@angular/router';
import { InventoryItem, OrderItem } from '../../../../../services/order-creation.service';
import { supplierIdOf, supplierNameOf } from '../../../../../services/inventory-domain';

export interface StagedItemSelection {
  item: InventoryItem;
  /** Chosen from the all-suppliers list, so it adopts the order's supplier on add. */
  reassign: boolean;
}

export interface ProductSupplierChange {
  inventoryId: string;
  supplierId: string;
  supplierName: string;
}

@Component({
  selector: 'app-order-item-search',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconsModule, RouterModule],
  templateUrl: './order-item-search.component.html',
  styleUrl: './order-item-search.component.css'
})
export class OrderItemSearchComponent implements OnChanges {
  @Input() inventoryItems: InventoryItem[] = [];
  /** Unrestricted catalog, browsed via the "Add existing product" action. */
  @Input() allInventoryItems: InventoryItem[] = [];
  @Input() selectedSupplierId = '';
  @Input() selectedSupplierName = '';
  @Output() itemAdded = new EventEmitter<OrderItem>();
  @Output() itemSelected = new EventEmitter<StagedItemSelection>();
  @Output() itemCleared = new EventEmitter<void>();
  /** Fired only when Add to List commits a cross-supplier product onto the order's supplier. */
  @Output() productSupplierChanged = new EventEmitter<ProductSupplierChange>();

  filteredInventory: InventoryItem[] = [];
  itemSearchQuery = '';
  showItemDropdown = false;
  selectedItem: InventoryItem | null = null;
  currentQuantity = 1;
  currentPrice = 0;
  showAllProducts = false;
  private stagedFromAllProducts = false;

  get sourceItems(): InventoryItem[] {
    return this.showAllProducts ? this.allInventoryItems : this.inventoryItems;
  }

  /**
   * With nothing in the supplier's catalog there is nothing to browse, so the
   * only useful action is creating a product. Otherwise offer the wider catalog.
   */
  get isCreateAction(): boolean {
    return this.showAllProducts || this.inventoryItems.length === 0;
  }

  get pinnedActionLabel(): string {
    return this.isCreateAction ? 'Create catalog product first' : 'Add existing product';
  }

  onPinnedAction(): void {
    if (this.isCreateAction) {
      return;
    }
    this.showAllProducts = true;
    this.itemSearchQuery = '';
    this.filterItems();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inventoryItems'] || changes['allInventoryItems']) {
      this.filteredInventory = this.matchingItems();
    }
  }

  private matchingItems(): InventoryItem[] {
    const q = (this.itemSearchQuery || '').toLowerCase().trim();
    if (!q) {
      return this.sourceItems;
    }
    return this.sourceItems.filter(i => i && (
      (i.name?.toLowerCase() || '').includes(q) ||
      (i.sku?.toLowerCase() || '').includes(q) ||
      (i.itemClass?.toLowerCase() || '').includes(q) ||
      (i.subcategory?.toLowerCase() || '').includes(q) ||
      (i.brand?.toLowerCase() || '').includes(q) ||
      (i.manufacturerPartNumber?.toLowerCase() || '').includes(q) ||
      (i.compatibleModels || []).some((model) => model.toLowerCase().includes(q))
    ));
  }

  filterItems(): void {
    this.filteredInventory = this.matchingItems();
    this.showItemDropdown = true;
  }

  selectInventoryItem(item: InventoryItem): void {
    this.selectedItem = item;
    this.itemSearchQuery = item.name;
    this.currentQuantity = 1;
    this.currentPrice = item.unitCost;
    this.showItemDropdown = false;
    this.stagedFromAllProducts = this.showAllProducts;
    this.itemSelected.emit({ item, reassign: this.willReassign });
  }

  /** True when adding this item moves it onto the order's supplier. */
  get willReassign(): boolean {
    if (!this.stagedFromAllProducts || !this.selectedSupplierName) {
      return false;
    }
    const itemSupplier = supplierNameOf(this.selectedItem as InventoryItem) || '';
    return itemSupplier.toLowerCase().trim() !== this.selectedSupplierName.toLowerCase().trim();
  }

  clearSelection(): void {
    this.selectedItem = null;
    this.itemSearchQuery = '';
    this.currentQuantity = 1;
    this.currentPrice = 0;
    this.showAllProducts = false;
    this.stagedFromAllProducts = false;
    this.filteredInventory = this.matchingItems();
    this.itemCleared.emit();
  }

  onItemInputBlur(): void {
    setTimeout(() => { this.showItemDropdown = false; }, 250);
  }

  onItemInputFocus(): void {
    this.showItemDropdown = true;
    this.filterItems();
  }

  itemSupplier(item: InventoryItem): string {
    return supplierNameOf(item);
  }

  addLineItem(): void {
    if (!this.selectedItem || this.currentQuantity <= 0) return;
    // The supplier move is committed here, not when the product was picked.
    const reassign = this.willReassign;
    if (reassign) {
      this.productSupplierChanged.emit({
        inventoryId: this.selectedItem._id || this.selectedItem.id || '',
        supplierId: this.selectedSupplierId,
        supplierName: this.selectedSupplierName,
      });
    }
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
        supplierId: reassign ? this.selectedSupplierId : supplierIdOf(this.selectedItem),
        supplierName: reassign ? this.selectedSupplierName : supplierNameOf(this.selectedItem),
    });
    this.clearSelection();
  }

  formatCurrency(val: number): string {
    return `LKR ${(val || 0).toLocaleString()}`;
  }
}
