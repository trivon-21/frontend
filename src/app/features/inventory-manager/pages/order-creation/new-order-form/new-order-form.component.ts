import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../../../core/services/api.service';

interface OrderItem {
  inventoryId: string;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
  estimatedTotal: number;
  available?: number;
  reserved?: number;
}

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  available: number;
  reserved: number;
  unitCost: number;
  unit: string;
  status: string;
  category: string;
  brand: string;
  reorderLevel: number;
}

interface Supplier {
  _id: string;
  name: string;
}

@Component({
  selector: 'app-new-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './new-order-form.component.html',
  styleUrls: ['./new-order-form.component.css']
})
export class NewOrderFormComponent implements OnInit {
  inventoryItems: InventoryItem[] = [];
  filteredInventory: InventoryItem[] = [];
  suppliers: Supplier[] = [];

  // Form data
  orderItems: OrderItem[] = [];
  selectedSupplier = '';
  orderNotes = '';
  
  // Suggested Items
  suggestedItems: InventoryItem[] = [];
  itemSearchQuery = '';
  showItemDropdown = false;
  selectedItem: InventoryItem | null = null;
  currentQuantity = 1;
  currentPrice = 0;

  // New Item State
  isAddingNewItem = false;
  newItemSku = '';

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadInventory();
    this.loadSuppliers();
    this.loadSuggestedItems();
  }

  loadInventory(): void {
    this.apiService.get<InventoryItem[]>('/inventory/list').subscribe({
      next: (data: InventoryItem[]) => {
        this.inventoryItems = data;
        this.filteredInventory = data;
      },
      error: (err: any) => console.error('Failed to load inventory:', err)
    });
  }

  loadSuppliers(): void {
    this.apiService.get<Supplier[]>('/inventory/suppliers').subscribe({
      next: (data: Supplier[]) => this.suppliers = data,
      error: (err: any) => console.error('Failed to load suppliers:', err)
    });
  }

  loadSuggestedItems(): void {
    this.apiService.get<InventoryItem[]>('/inventory/suggested-orders').subscribe({
      next: (data: InventoryItem[]) => this.suggestedItems = data,
      error: (err: any) => console.error('Failed to load suggested items:', err)
    });
  }

  filterItems(): void {
    const q = (this.itemSearchQuery || '').toLowerCase().trim();
    if (!q) {
      this.filteredInventory = this.inventoryItems;
    } else {
      this.filteredInventory = this.inventoryItems.filter(i => i && (
        (i.name?.toLowerCase() || '').includes(q) ||
        (i.sku?.toLowerCase() || '').includes(q) ||
        (i.category?.toLowerCase() || '').includes(q)
      ));
    }
    this.showItemDropdown = true;
  }

  selectInventoryItem(item: InventoryItem | 'new'): void {
    if (item === 'new') {
      this.isAddingNewItem = true;
      this.selectedItem = null;
      this.newItemSku = '';
      this.currentPrice = 0;
      this.showItemDropdown = false;
      return;
    }

    this.selectedItem = item;
    this.itemSearchQuery = item.name;
    this.currentQuantity = 1;
    this.currentPrice = item.unitCost;
    this.isAddingNewItem = false;
    this.showItemDropdown = false;
  }

  clearSelection(): void {
    this.resetSelection();
  }

  onItemInputBlur(): void {
    setTimeout(() => { this.showItemDropdown = false; }, 200);
  }

  onItemInputFocus(): void {
    this.filterItems();
  }

  addLineItem(): void {
    if (this.isAddingNewItem) {
      if (!this.itemSearchQuery || !this.newItemSku || this.currentQuantity <= 0) return;
      this.orderItems.push({
        inventoryId: '',
        name: this.itemSearchQuery,
        sku: this.newItemSku,
        quantity: this.currentQuantity,
        unitCost: this.currentPrice,
        estimatedTotal: this.currentQuantity * this.currentPrice,
        available: 0,
        reserved: 0
      });
    } else {
      if (!this.selectedItem || this.currentQuantity <= 0) return;

      const existingIndex = this.orderItems.findIndex(i => i.sku === this.selectedItem!.sku);
      if (existingIndex !== -1) {
        this.orderItems[existingIndex].quantity += this.currentQuantity;
        this.orderItems[existingIndex].estimatedTotal =
          this.orderItems[existingIndex].quantity * this.currentPrice;
        this.orderItems[existingIndex].unitCost = this.currentPrice;
      } else {
        this.orderItems.push({
          inventoryId: this.selectedItem._id,
          name: this.selectedItem.name,
          sku: this.selectedItem.sku,
          quantity: this.currentQuantity,
          unitCost: this.currentPrice,
          estimatedTotal: this.currentQuantity * this.currentPrice,
          available: this.selectedItem.available,
          reserved: this.selectedItem.reserved
        });
      }
    }
    this.resetSelection();
  }

  addFromSuggested(item: InventoryItem): void {
    const existingIndex = this.orderItems.findIndex(i => i.sku === item.sku);
    if (existingIndex !== -1) {
      this.orderItems[existingIndex].quantity += 1;
      this.orderItems[existingIndex].estimatedTotal =
        this.orderItems[existingIndex].quantity * item.unitCost;
    } else {
      this.orderItems.push({
        inventoryId: item._id,
        name: item.name,
        sku: item.sku,
        quantity: 1,
        unitCost: item.unitCost,
        estimatedTotal: item.unitCost,
        available: item.available,
        reserved: item.reserved
      });
    }
  }

  private resetSelection(): void {
    this.selectedItem = null;
    this.isAddingNewItem = false;
    this.itemSearchQuery = '';
    this.currentQuantity = 1;
    this.newItemSku = '';
    this.currentPrice = 0;
  }

  removeLineItem(index: number): void {
    this.orderItems.splice(index, 1);
  }

  updateItemQuantity(index: number, newQty: number): void {
    const item = this.orderItems[index];
    if (newQty <= 0) {
      this.removeLineItem(index);
      return;
    }
    item.quantity = newQty;
    item.estimatedTotal = item.quantity * item.unitCost;
  }

  get orderTotal(): number {
    return this.orderItems.reduce((sum, item) => sum + item.estimatedTotal, 0);
  }

  get canSubmit(): boolean {
    return this.orderItems.length > 0 && this.selectedSupplier.length > 0;
  }

  submitOrder(): void {
    if (!this.canSubmit) return;
    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = {
      items: this.orderItems.map(i => ({
        inventoryId: i.inventoryId,
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        unitCost: i.unitCost
      })),
      supplierName: this.selectedSupplier,
      notes: this.orderNotes,
      source: 'manual'
    };

    this.apiService.post('/inventory/order-requests', payload).subscribe({
      next: (data: any) => {
        this.isSubmitting = false;
        // Redirect back to dashboard on success
        this.router.navigate(['/inventory-manager/order-creation'], { 
          queryParams: { success: `Order ${data.requestId} submitted successfully!` } 
        });
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to submit order request';
      }
    });
  }

  saveDraft(): void {
    this.successMessage = 'Draft request saved successfully.';
    setTimeout(() => this.successMessage = '', 3000);
  }

  formatCurrency(val: number): string {
    return `LKR ${(val || 0).toLocaleString()}`;
  }

  goBack(): void {
    this.router.navigate(['/inventory-manager/order-creation']);
  }
}
