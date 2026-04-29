import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
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
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
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
  // Item Selection
  itemSearchQuery = '';
  showItemDropdown = false;
  selectedItem: InventoryItem | null = null;
  currentQuantity = 1;
  currentPrice = 0;

  // Supplier Autocomplete
  supplierSearchQuery = '';
  filteredSuppliers: Supplier[] = [];
  showSupplierDropdown = false;
  isAddingNewSupplier = false;

  // For suggested items interactions
  suggestedItemsState: any[] = [];

  // New Item State
  isAddingNewItem = false;
  newItemSku = '';

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  // Row selection states
  selectedLineItemIndex: number | null = null;
  selectedSuggestedIndex: number | null = null;

  isEditMode = false;
  orderId: string | null = null;

  constructor(
    private apiService: ApiService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadInventory();
    this.loadSuppliers();
    this.loadSuggestedItems();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.orderId = params['id'];
        this.loadOrder(this.orderId!);
      }
    });
  }

  loadOrder(id: string): void {
    this.apiService.get<any>('/inventory/order-requests').subscribe({
      next: (requests: any[]) => {
        const order = requests.find(r => r.requestId === id);
        if (order) {
          this.selectedSupplier = order.supplierName;
          this.supplierSearchQuery = order.supplierName;
          this.orderNotes = order.notes;
          this.orderItems = order.items.map((i: any) => ({
            ...i,
            inventoryId: i.inventoryId || ''
          }));
        }
      },
      error: (err: any) => console.error('Failed to load order:', err)
    });
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
      next: (data: Supplier[]) => {
        this.suppliers = data;
        this.filteredSuppliers = data;
        // Don't auto-select first supplier anymore, let user search/select
      },
      error: (err: any) => console.error('Failed to load suppliers:', err)
    });
  }

  loadSuggestedItems(): void {
    this.apiService.get<InventoryItem[]>('/inventory/suggested-orders').subscribe({
      next: (data: InventoryItem[]) => {
        this.suggestedItems = data;
        this.suggestedItemsState = data.map(item => ({
          ...item,
          isEditingPrice: false,
          isConfiguring: false,
          editPrice: item.unitCost,
          editQty: 1
        }));
        
        // Per user request: first option should be automatically selected
        if (this.suggestedItemsState.length > 0) {
          this.selectedSuggestedIndex = 0;
        }
      },
      error: (err: any) => console.error('Failed to load suggested items:', err)
    });
  }

  filterSuppliers(): void {
    const q = (this.supplierSearchQuery || '').toLowerCase().trim();
    if (!q) {
      this.filteredSuppliers = this.suppliers;
    } else {
      this.filteredSuppliers = this.suppliers.filter(s => 
        s.name.toLowerCase().includes(q)
      );
    }
    
    // Auto-select if exact match found while typing
    const exactMatch = this.suppliers.find(s => s.name.toLowerCase() === q);
    if (exactMatch) {
      this.selectedSupplier = exactMatch.name;
    } else if (!this.isAddingNewSupplier) {
      this.selectedSupplier = ''; // Clear if doesn't match and not adding new
    }
    
    this.showSupplierDropdown = true;
  }

  onSupplierInputFocus(): void {
    this.showSupplierDropdown = true;
    this.filterSuppliers();
  }

  onSupplierInputBlur(): void {
    // Increase delay slightly to ensure clicks register on slower devices
    setTimeout(() => { this.showSupplierDropdown = false; }, 300);
  }

  selectSupplier(supplier: Supplier | 'new'): void {
    if (supplier === 'new') {
      this.isAddingNewSupplier = true;
      this.showSupplierDropdown = false;
      return;
    }

    this.selectedSupplier = supplier.name;
    this.supplierSearchQuery = supplier.name;
    this.isAddingNewSupplier = false;
    this.showSupplierDropdown = false;
    this.errorMessage = ''; // Clear errors if any
  }

  confirmNewSupplier(): void {
    if (!this.supplierSearchQuery.trim()) return;
    this.selectedSupplier = this.supplierSearchQuery.trim();
    this.isAddingNewSupplier = false;
  }

  cancelNewSupplier(): void {
    this.isAddingNewSupplier = false;
    this.supplierSearchQuery = this.selectedSupplier || '';
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
    // Slight delay to allow mousedown to trigger selectInventoryItem
    setTimeout(() => { 
      this.showItemDropdown = false; 
    }, 250);
  }

  onItemInputFocus(): void {
    this.showItemDropdown = true;
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

  addFromSuggested(itemState: any): void {
    const existingIndex = this.orderItems.findIndex(i => i.sku === itemState.sku);
    const qty = itemState.editQty || 1;
    const price = itemState.editPrice || 0;

    if (existingIndex !== -1) {
      this.orderItems[existingIndex].quantity += qty;
      this.orderItems[existingIndex].unitCost = price; // Update to latest price
      this.orderItems[existingIndex].estimatedTotal =
        this.orderItems[existingIndex].quantity * price;
    } else {
      this.orderItems.push({
        inventoryId: itemState._id,
        name: itemState.name,
        sku: itemState.sku,
        quantity: qty,
        unitCost: price,
        estimatedTotal: qty * price,
        available: itemState.available,
        reserved: itemState.reserved
      });
    }
    
    // Reset state after adding
    itemState.isConfiguring = false;
    itemState.editQty = 1;
  }

  togglePriceEdit(itemState: any): void {
    itemState.isEditingPrice = !itemState.isEditingPrice;
  }

  startConfiguring(itemState: any): void {
    // If already configuring, this acts as "Confirm" or we can have a separate confirm button
    // But per user request "add to order should be visible to edit when clicked"
    itemState.isConfiguring = true;
  }

  cancelConfiguring(itemState: any): void {
    itemState.isConfiguring = false;
    itemState.editQty = 1;
  }

  selectLineItem(index: number): void {
    this.selectedLineItemIndex = index;
  }

  selectSuggestedItem(index: number): void {
    this.selectedSuggestedIndex = index;
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
      status: 'pending-approval',
      source: 'manual'
    };

    if (this.isEditMode && this.orderId) {
      this.apiService.patch(`/inventory/order-requests/${this.orderId}`, payload).subscribe({
        next: (data: any) => {
          this.isSubmitting = false;
          this.router.navigate(['/inventory-manager/order-creation'], { 
            queryParams: { success: `Order ${this.orderId} submitted successfully!` } 
          });
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.errorMessage = err.error?.message || 'Failed to submit order request';
        }
      });
    } else {
      this.apiService.post('/inventory/order-requests', payload).subscribe({
        next: (data: any) => {
          this.isSubmitting = false;
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
  }

  saveDraft(): void {
    if (this.orderItems.length === 0 || !this.selectedSupplier) {
      this.errorMessage = 'Please add at least one item and select a supplier before saving a draft.';
      return;
    }

    this.isSubmitting = true;
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
      status: 'draft',
      source: 'manual'
    };

    if (this.isEditMode && this.orderId) {
      this.apiService.patch(`/inventory/order-requests/${this.orderId}`, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.successMessage = 'Draft updated successfully.';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = 'Failed to update draft.';
        }
      });
    } else {
      this.apiService.post('/inventory/order-requests', payload).subscribe({
        next: (data: any) => {
          this.isSubmitting = false;
          this.isEditMode = true;
          this.orderId = data.requestId;
          this.successMessage = 'Draft saved successfully.';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = 'Failed to save draft.';
        }
      });
    }
  }

  formatCurrency(val: number): string {
    return `LKR ${(val || 0).toLocaleString()}`;
  }

  goBack(): void {
    this.router.navigate(['/inventory-manager/order-creation']);
  }
}
