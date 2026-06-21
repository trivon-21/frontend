import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { OrderCreationService, OrderItem, InventoryItem, Supplier } from '../../../services/order-creation.service';
import { OrderSupplierSelectorComponent } from './components/order-supplier-selector/order-supplier-selector.component';
import { OrderItemSearchComponent } from './components/order-item-search/order-item-search.component';
import { OrderCartListComponent } from './components/order-cart-list/order-cart-list.component';
import { OrderSuggestedGridComponent } from './components/order-suggested-grid/order-suggested-grid.component';

@Component({
  selector: 'app-new-order-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    LucideAngularModule,
    OrderSupplierSelectorComponent,
    OrderItemSearchComponent,
    OrderCartListComponent,
    OrderSuggestedGridComponent
  ],
  templateUrl: './new-order-form.component.html',
  styleUrls: ['./new-order-form.component.css']
})
export class NewOrderFormComponent implements OnInit {
  inventoryItems: InventoryItem[] = [];
  suppliers: Supplier[] = [];
  suggestedItems: InventoryItem[] = [];

  // Form State
  orderItems: OrderItem[] = [];
  selectedSupplier = '';
  orderNotes = '';
  
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  isEditMode = false;
  orderId: string | null = null;

  constructor(
    private orderCreationService: OrderCreationService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadData();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.orderId = params['id'];
        this.loadOrder(this.orderId!);
      }
    });
  }

  loadData(): void {
    this.orderCreationService.getInventory().subscribe({
      next: data => this.inventoryItems = data,
      error: err => console.error('Failed to load inventory', err)
    });
    this.orderCreationService.getSuppliers().subscribe({
      next: data => this.suppliers = data,
      error: err => console.error('Failed to load suppliers', err)
    });
    this.orderCreationService.getSuggestedItems().subscribe({
      next: data => this.suggestedItems = data,
      error: err => console.error('Failed to load suggested items', err)
    });
  }

  loadOrder(id: string): void {
    this.orderCreationService.getOrderRequest(id).subscribe({
      next: (requests) => {
        const order = requests.find((r: any) => r.requestId === id);
        if (order) {
          this.selectedSupplier = order.supplierName;
          this.orderNotes = order.notes;
          this.orderItems = order.items.map((i: any) => ({
            ...i,
            inventoryId: i.inventoryId || ''
          }));
        }
      },
      error: (err) => console.error('Failed to load order:', err)
    });
  }

  // Event Handlers from Dumb Components
  onSupplierSelected(supplierName: string): void {
    this.selectedSupplier = supplierName;
  }

  onItemAdded(newItem: OrderItem): void {
    const existingIndex = this.orderItems.findIndex(i => i.sku === newItem.sku);
    if (existingIndex !== -1) {
      this.orderItems[existingIndex].quantity += newItem.quantity;
      this.orderItems[existingIndex].unitCost = newItem.unitCost;
      this.orderItems[existingIndex].estimatedTotal = this.orderItems[existingIndex].quantity * newItem.unitCost;
    } else {
      this.orderItems.push(newItem);
    }
  }

  onItemUpdated(event: {index: number, newQty: number}): void {
    const item = this.orderItems[event.index];
    if (event.newQty <= 0) {
      this.onItemRemoved(event.index);
      return;
    }
    item.quantity = event.newQty;
    item.estimatedTotal = item.quantity * item.unitCost;
  }

  onItemRemoved(index: number): void {
    this.orderItems.splice(index, 1);
  }

  get canSubmit(): boolean {
    return this.orderItems.length > 0 && this.selectedSupplier.length > 0;
  }

  submitOrder(): void {
    if (!this.canSubmit) return;
    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = this.buildPayload('pending-approval');

    this.orderCreationService.submitOrderRequest(payload, this.isEditMode, this.orderId!).subscribe({
      next: (data) => {
        this.isSubmitting = false;
        const msgId = this.isEditMode ? this.orderId : data.requestId;
        this.router.navigate(['/inventory-manager/order-creation'], { 
          queryParams: { success: `Order ${msgId} submitted successfully!` } 
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to submit order request';
      }
    });
  }

  saveDraft(): void {
    if (!this.canSubmit) {
      this.errorMessage = 'Please add at least one item and select a supplier before saving a draft.';
      return;
    }

    this.isSubmitting = true;
    const payload = this.buildPayload('draft');

    this.orderCreationService.submitOrderRequest(payload, this.isEditMode, this.orderId!).subscribe({
      next: (data) => {
        this.isSubmitting = false;
        if (!this.isEditMode) {
          this.isEditMode = true;
          this.orderId = data.requestId;
        }
        this.successMessage = 'Draft saved successfully.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = 'Failed to save draft.';
      }
    });
  }

  private buildPayload(status: string): any {
    return {
      items: this.orderItems.map(i => ({
        inventoryId: i.inventoryId,
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        unitCost: i.unitCost
      })),
      supplierName: this.selectedSupplier,
      notes: this.orderNotes,
      status: status,
      source: 'manual'
    };
  }

  goBack(): void {
    this.router.navigate(['/inventory-manager/order-creation']);
  }
}
