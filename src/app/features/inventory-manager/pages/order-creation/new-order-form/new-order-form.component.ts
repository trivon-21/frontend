import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../../shared/components/portal-icons/portal-icons.module';
import { OrderCreationService, OrderItem, InventoryItem, Supplier } from '../../../services/order-creation.service';
import { OrderSupplierSelectorComponent } from './components/order-supplier-selector/order-supplier-selector.component';
import { OrderItemSearchComponent } from './components/order-item-search/order-item-search.component';
import { OrderCartListComponent } from './components/order-cart-list/order-cart-list.component';
import { OrderSuggestedGridComponent } from './components/order-suggested-grid/order-suggested-grid.component';
import { supplierIdOf, supplierNameOf } from '../../../services/inventory-domain';
import { switchMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-new-order-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PortalIconsModule,
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
  isCreatingSupplier = false;
  successMessage = '';
  errorMessage = '';
  loading = true;
  loadError = '';

  isEditMode = false;
  orderId: string | null = null;
  statusVersion = 0;

  constructor(
    private orderCreationService: OrderCreationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadData();

    // Check for suggested item passed via router state
    const navState = history.state;
    if (navState?.suggestedItem) {
      const item = navState.suggestedItem;
      this.orderItems.push({
        inventoryId: item._id,
        name: item.name,
        sku: item.sku,
        quantity: item.suggestedQuantity || 1,
        unitCost: item.unitCost || 0,
        estimatedTotal: (item.suggestedQuantity || 1) * (item.unitCost || 0),
        itemClass: item.itemClass || 'Unclassified',
        subcategory: item.subcategory || 'Unclassified',
        unit: item.unit || 'units',
        manufacturerPartNumber: item.manufacturerPartNumber || '',
        supplierId: supplierIdOf(item),
        supplierName: supplierNameOf(item),
      });
      this.selectPreferredSupplier(item);
    }

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.orderId = params['id'];
        this.loadOrder(this.orderId!);
      }
    });
  }

  loadData(): void {
    this.loading = true;
    this.loadError = '';
    forkJoin({
      inventoryItems: this.orderCreationService.getInventory(),
      suppliers: this.orderCreationService.getSuppliers(),
      suggestedItems: this.orderCreationService.getSuggestedItems(),
    }).subscribe({
      next: ({ inventoryItems, suppliers, suggestedItems }) => {
        this.inventoryItems = inventoryItems;
        this.suppliers = suppliers;
        this.suggestedItems = suggestedItems;
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Order form data could not be loaded. No partial options have been shown.';
        this.loading = false;
      },
    });
  }

  loadOrder(id: string): void {
    this.orderCreationService.getOrderRequests().subscribe({
      next: (requests) => {
        const order = requests.find((request) => request.requestId === id);
        if (order) {
          this.statusVersion = order.statusVersion;
          this.selectedSupplier = order.supplierName;
          this.orderNotes = order.notes || '';
          this.orderItems = order.items.map((i: any) => ({
            ...i,
            inventoryId: typeof i.inventoryId === 'object' ? i.inventoryId._id : i.inventoryId || '',
            supplierId: typeof i.supplierId === 'object' ? i.supplierId._id : i.supplierId || '',
          }));
        }
      },
      error: () => this.loadError = 'The draft order could not be loaded.'
    });
  }

  // Event Handlers from Dumb Components
  onSupplierSelected(supplierName: string): void {
    const supplier = this.suppliers.find((candidate) => candidate.name === supplierName);
    if (!supplier && supplierName.trim()) {
      this.isCreatingSupplier = true;
      this.errorMessage = '';
      this.orderCreationService.addSupplier(supplierName.trim()).subscribe({
        next: (created) => {
          this.suppliers = [...this.suppliers, created];
          this.selectedSupplier = created.name;
          this.isCreatingSupplier = false;
        },
        error: (err) => {
          this.isCreatingSupplier = false;
          this.selectedSupplier = '';
          this.errorMessage = err.error?.message || 'Unable to add supplier.';
        },
      });
      return;
    }
    const conflictingItem = this.orderItems.find((item) => item.supplierId && item.supplierId !== supplier?._id);
    if (conflictingItem) {
      this.errorMessage = `${conflictingItem.name} is assigned to a different preferred supplier.`;
      return;
    }
    this.selectedSupplier = supplierName;
  }

  onItemAdded(newItem: OrderItem): void {
    const preferredSupplier = this.suppliers.find((supplier) => supplier._id === newItem.supplierId);
    const preferredSupplierName = preferredSupplier?.name || newItem.supplierName;
    if (preferredSupplierName && this.selectedSupplier && preferredSupplierName !== this.selectedSupplier) {
      this.errorMessage = `This item is assigned to ${preferredSupplierName}. Create a separate order for that supplier.`;
      return;
    }
    if (preferredSupplierName && !this.selectedSupplier) this.selectedSupplier = preferredSupplierName;
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
    return this.orderItems.length > 0
      && !!this.suppliers.find((supplier) => supplier.name === this.selectedSupplier)
      && !this.isCreatingSupplier;
  }

  submitOrder(): void {
    if (!this.canSubmit || this.isSubmitting) {
      this.errorMessage = 'Select a supplier and add at least one inventory item before submitting.';
      return;
    }
    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = this.buildPayload();

    this.orderCreationService.submitOrderRequest(payload, this.isEditMode, this.orderId!).pipe(
      switchMap((saved) => this.orderCreationService.submitForManager(saved)),
    ).subscribe({
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
    const payload = this.buildPayload();

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

  private buildPayload(): Record<string, unknown> {
    const supplier = this.suppliers.find(item => item.name === this.selectedSupplier);
    return {
      items: this.orderItems.map(i => ({
        inventoryId: i.inventoryId,
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        unitCost: i.unitCost,
        itemClass: i.itemClass || 'Unclassified',
        subcategory: i.subcategory || 'Unclassified',
        unit: i.unit || 'units',
        manufacturerPartNumber: i.manufacturerPartNumber || '',
        supplierId: i.supplierId || undefined,
      })),
      supplierName: this.selectedSupplier,
      supplierId: supplier?._id,
      notes: this.orderNotes,
      source: 'manual',
      ...(this.isEditMode ? { expectedVersion: this.statusVersion } : {}),
    };
  }

  private selectPreferredSupplier(item: InventoryItem): void {
    const supplierName = supplierNameOf(item);
    if (supplierName && !this.selectedSupplier) this.selectedSupplier = supplierName;
  }

  goBack(): void {
    this.router.navigate(['/inventory-manager/order-creation']);
  }
}
