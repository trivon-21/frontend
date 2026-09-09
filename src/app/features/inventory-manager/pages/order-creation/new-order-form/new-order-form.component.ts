import { Component, DestroyRef, HostListener, OnInit, Optional, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PortalIconsModule } from '../../../../../shared/components/portal-icons/portal-icons.module';
import { OrderCreationService, OrderItem, InventoryItem, Supplier } from '../../../services/order-creation.service';
import { OrderSupplierSelectorComponent } from './components/order-supplier-selector/order-supplier-selector.component';
import { OrderItemSearchComponent } from './components/order-item-search/order-item-search.component';
import { OrderCartListComponent } from './components/order-cart-list/order-cart-list.component';
import { supplierIdOf, supplierNameOf } from '../../../services/inventory-domain';
import { itemMatchesSupplier, relevantSuppliersFor } from '../../../services/order-supplier-matching';
import { switchMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { HasPendingChanges } from '../../../../../core/guards/pending-changes.guard';

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
    OrderCartListComponent
  ],
  templateUrl: './new-order-form.component.html',
  styleUrls: ['./new-order-form.component.css']
})
export class NewOrderFormComponent implements OnInit, HasPendingChanges {
  inventoryItems: InventoryItem[] = [];
  suppliers: Supplier[] = [];
  suggestedItems: InventoryItem[] = [];

  // Form State
  orderItems: OrderItem[] = [];
  selectedSupplier = '';
  orderNotes = '';
  showAdditionalDetails = false;

  isSubmitting = false;
  isCreatingSupplier = false;
  isRegisteringNewSupplier = false;
  newlyRegisteredSupplierNames = new Set<string>();
  autoSelectedSupplier = false;
  successMessage = '';
  errorMessage = '';
  loading = true;
  loadError = '';

  isEditMode = false;
  orderId: string | null = null;
  statusVersion = 0;
  sourceMaterialRequestId = '';

  // Supplier the currently staged (not-yet-added) item search selection belongs to,
  // used to restrict the supplier dropdown before any line item has been added.
  stagedItemSupplierName = '';
  supplierRevertSignal = 0;

  private relevantSuppliersCache: Supplier[] = [];
  private relevantSuppliersSignature = '';

  @ViewChild(OrderItemSearchComponent) itemSearchRef?: OrderItemSearchComponent;

  private initialSnapshot = '';
  private submittedSuccessfully = false;

  constructor(
    private orderCreationService: OrderCreationService,
    private router: Router,
    private route: ActivatedRoute,
    @Optional() private destroyRef?: DestroyRef
  ) {}

  takeSnapshot(): string {
    return JSON.stringify({
      supplier: this.selectedSupplier,
      notes: this.orderNotes.trim(),
      items: this.orderItems.map((i) => ({
        inventoryId: i.inventoryId,
        quantity: i.quantity,
        unitCost: i.unitCost,
      })),
    });
  }

  get isDirty(): boolean {
    if (this.submittedSuccessfully) {
      return false;
    }
    if (!this.initialSnapshot) {
      return this.orderItems.length > 0 || !!this.selectedSupplier || !!this.orderNotes.trim();
    }
    return this.takeSnapshot() !== this.initialSnapshot;
  }

  canDeactivate(): boolean {
    if (!this.isDirty) {
      return true;
    }
    return window.confirm('Discard your unsaved order changes?');
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.isDirty) {
      event.preventDefault();
    }
  }

  ngOnInit(): void {
    this.loadData();

    // Check for suggested item passed via router state
    const navState = history.state;
    this.sourceMaterialRequestId = navState?.sourceMaterialRequestId || '';
    if (Array.isArray(navState?.shortageItems)) {
      const firstSupplier = navState.shortageItems.find((item: any) => item.supplierId)?.supplierId;
      const compatibleItems = firstSupplier
        ? navState.shortageItems.filter((item: any) => !item.supplierId || item.supplierId === firstSupplier)
        : navState.shortageItems;
      for (const item of compatibleItems) {
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
          supplierId: item.supplierId,
          supplierName: item.supplierName,
        });
      }
      if (compatibleItems.length) this.selectPreferredSupplier(compatibleItems[0]);
      if (compatibleItems.length !== navState.shortageItems.length) {
        this.errorMessage = 'This order contains one supplier. Create another linked order for shortages from other suppliers.';
      }
    }
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

    let params$ = this.route.params;
    if (this.destroyRef) {
      params$ = params$.pipe(takeUntilDestroyed(this.destroyRef));
    }
    params$.subscribe(params => {
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
    let stream$ = forkJoin({
      inventoryItems: this.orderCreationService.getInventory(),
      suppliers: this.orderCreationService.getSuppliers(),
      suggestedItems: this.orderCreationService.getSuggestedItems(),
    });
    if (this.destroyRef) {
      stream$ = stream$.pipe(takeUntilDestroyed(this.destroyRef));
    }
    stream$.subscribe({
      next: ({ inventoryItems, suppliers, suggestedItems }) => {
        this.inventoryItems = inventoryItems;
        this.suppliers = suppliers;
        this.suggestedItems = suggestedItems;
        this.loading = false;

        const itemId = this.route.snapshot?.queryParams?.['itemId'];
        if (itemId && !this.isEditMode && this.orderItems.length === 0) {
          const item = this.inventoryItems.find((inv) => inv._id === itemId || inv.id === itemId);
          if (item) {
            this.orderItems.push({
              inventoryId: item._id || item.id || '',
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
        }

        if (!this.isEditMode) {
          this.initialSnapshot = this.takeSnapshot();
        }
      },
      error: () => {
        this.loadError = 'Order form data could not be loaded. No partial options have been shown.';
        this.loading = false;
      },
    });
  }

  loadOrder(id: string): void {
    let req$ = this.orderCreationService.getOrderRequests();
    if (this.destroyRef) {
      req$ = req$.pipe(takeUntilDestroyed(this.destroyRef));
    }
    req$.subscribe({
      next: (requests) => {
        const order = requests.find((request) => request.requestId === id);
        if (order) {
          this.statusVersion = order.statusVersion;
          this.selectedSupplier = order.supplierName;
          this.orderNotes = order.notes || '';
          this.showAdditionalDetails = !!this.orderNotes;
          this.orderItems = order.items.map((i: any) => ({
            ...i,
            inventoryId: typeof i.inventoryId === 'object' && i.inventoryId !== null ? (i.inventoryId._id || i.inventoryId.id || '') : (i.inventoryId || i.id || ''),
            supplierId: typeof i.supplierId === 'object' && i.supplierId !== null ? (i.supplierId._id || i.supplierId.id || '') : (i.supplierId || ''),
          }));
          this.initialSnapshot = this.takeSnapshot();
        }
      },
      error: () => this.loadError = 'The draft order could not be loaded.'
    });
  }

  get availableInventoryItems(): InventoryItem[] {
    return this.filterForSelectedSupplier(this.inventoryItems);
  }

  get availableSuggestedItems(): InventoryItem[] {
    return this.filterForSelectedSupplier(this.suggestedItems);
  }

  // Suppliers currently constraining the order: the staged (not-yet-added) item's
  // supplier plus every carted line's supplier. Empty means nothing constrains the
  // order yet, so the supplier dropdown opens unrestricted. Cached by content so the
  // array reference stays stable across change-detection cycles when the underlying
  // set hasn't changed — otherwise a fresh array on every check would re-trigger the
  // child selector's ngOnChanges and collapse "Change Supplier" back to restricted.
  get relevantSuppliers(): Supplier[] {
    const computed = relevantSuppliersFor(this.orderItems, this.stagedItemSupplierName, this.suppliers);
    const signature = computed.map((s) => s._id).join('|');
    if (signature !== this.relevantSuppliersSignature) {
      this.relevantSuppliersSignature = signature;
      this.relevantSuppliersCache = computed;
    }
    return this.relevantSuppliersCache;
  }

  private filterForSelectedSupplier(items: InventoryItem[]): InventoryItem[] {
    if (!this.selectedSupplier) {
      return items;
    }
    if (this.isRegisteringNewSupplier || this.isCreatingSupplier || this.newlyRegisteredSupplierNames.has(this.selectedSupplier.toLowerCase().trim())) {
      return items;
    }
    const supplier = this.suppliers.find(
      (s) => s.name.toLowerCase().trim() === this.selectedSupplier.toLowerCase().trim()
    );
    return items.filter((item) => itemMatchesSupplier(item, this.selectedSupplier, supplier));
  }

  resolveItemSupplierName(item: InventoryItem): string {
    const directName = supplierNameOf(item);
    if (directName) {
      const match = this.suppliers.find(s => s.name.toLowerCase().trim() === directName.toLowerCase().trim());
      if (match) return match.name;
      return directName;
    }
    const sId = supplierIdOf(item);
    if (sId) {
      const match = this.suppliers.find(s => s._id === sId);
      if (match) return match.name;
    }
    return '';
  }

  // Event Handlers from Dumb Components
  onSupplierSelected(supplierName: string): void {
    this.errorMessage = '';
    if (!supplierName) {
      this.selectedSupplier = '';
      this.autoSelectedSupplier = false;
      return;
    }
    const supplier = this.suppliers.find(
      (candidate) => candidate.name.toLowerCase() === supplierName.toLowerCase().trim()
    );
    if (!supplier) {
      this.selectedSupplier = '';
      this.autoSelectedSupplier = false;
      return;
    }

    const isSameSupplier = supplier.name.toLowerCase().trim() === (this.selectedSupplier || '').toLowerCase().trim();
    if (!isSameSupplier && this.orderItems.length > 0) {
      const count = this.orderItems.length;
      const confirmed = window.confirm(
        `Switching to ${supplier.name} will remove ${count} item${count === 1 ? '' : 's'} from this order. Continue?`
      );
      if (!confirmed) {
        this.supplierRevertSignal++;
        return;
      }
      this.orderItems = [];
      this.itemSearchRef?.clearSelection();
      this.stagedItemSupplierName = '';
    }

    this.autoSelectedSupplier = false;
    this.selectedSupplier = supplier.name;

    if (this.itemSearchRef?.selectedItem) {
      const itemSupplier = this.resolveItemSupplierName(this.itemSearchRef.selectedItem);
      if (itemSupplier && this.selectedSupplier && itemSupplier.toLowerCase().trim() !== this.selectedSupplier.toLowerCase().trim()) {
        this.itemSearchRef.clearSelection();
      }
    }
  }

  onAddNewSupplier(supplierName: string): void {
    const trimmed = (supplierName || '').trim();
    if (!trimmed) return;

    const existing = this.suppliers.find(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      this.onSupplierSelected(existing.name);
      return;
    }

    this.isCreatingSupplier = true;
    this.isRegisteringNewSupplier = false;
    this.errorMessage = '';
    let add$ = this.orderCreationService.addSupplier(trimmed);
    if (this.destroyRef) {
      add$ = add$.pipe(takeUntilDestroyed(this.destroyRef));
    }
    add$.subscribe({
      next: (created) => {
        this.suppliers = [...this.suppliers, created];
        this.selectedSupplier = created.name;
        this.newlyRegisteredSupplierNames.add(created.name.toLowerCase().trim());
        this.isCreatingSupplier = false;
      },
      error: (err) => {
        this.isCreatingSupplier = false;
        this.selectedSupplier = '';
        this.errorMessage = err.error?.message || 'Unable to add supplier.';
      },
    });
  }

  onRegisteringNewSupplier(isRegistering: boolean): void {
    this.isRegisteringNewSupplier = isRegistering;
  }

  onItemSelected(item: InventoryItem): void {
    const supplierName = this.resolveItemSupplierName(item);
    this.stagedItemSupplierName = supplierName;
    if (supplierName) {
      const conflictingItem = this.orderItems.find(
        (existing) => existing.supplierName && existing.supplierName.toLowerCase().trim() !== supplierName.toLowerCase().trim()
      );
      if (conflictingItem) {
        this.errorMessage = `${item.name} is assigned to ${supplierName}. Create a separate order for that supplier.`;
        return;
      }
      this.errorMessage = '';
      this.selectedSupplier = supplierName;
      this.autoSelectedSupplier = true;
    }
  }

  onItemCleared(): void {
    this.stagedItemSupplierName = '';
    if (this.orderItems.length === 0 && this.autoSelectedSupplier) {
      this.selectedSupplier = '';
      this.autoSelectedSupplier = false;
      this.errorMessage = '';
    }
  }

  onItemAdded(newItem: OrderItem): void {
    const preferredSupplier = this.suppliers.find((supplier) => supplier._id === newItem.supplierId);
    const preferredSupplierName = preferredSupplier?.name || newItem.supplierName;
    if (preferredSupplierName && this.selectedSupplier && preferredSupplierName.toLowerCase().trim() !== this.selectedSupplier.toLowerCase().trim()) {
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
      && !!this.suppliers.find((supplier) => supplier.name.toLowerCase() === (this.selectedSupplier || '').toLowerCase())
      && !this.isCreatingSupplier;
  }

  submitOrder(): void {
    if (this.orderItems.length === 0 && this.itemSearchRef?.selectedItem) {
      this.itemSearchRef.addLineItem();
    }
    if (this.isSubmitting) {
      return;
    }
    if (!this.selectedSupplier) {
      this.errorMessage = 'Please select a supplier before submitting.';
      return;
    }
    if (this.orderItems.length === 0) {
      this.errorMessage = 'Please add at least one inventory item before submitting.';
      return;
    }
    if (!this.canSubmit) {
      this.errorMessage = 'Select a valid supplier and add at least one inventory item before submitting.';
      return;
    }
    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = this.buildPayload();

    let submit$ = this.orderCreationService.submitOrderRequest(payload, this.isEditMode, this.orderId!).pipe(
      switchMap((saved) => this.orderCreationService.submitForManager(saved)),
    );
    if (this.destroyRef) {
      submit$ = submit$.pipe(takeUntilDestroyed(this.destroyRef));
    }
    submit$.subscribe({
      next: (data) => {
        this.isSubmitting = false;
        this.submittedSuccessfully = true;
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
    if (this.orderItems.length === 0 && this.itemSearchRef?.selectedItem) {
      this.itemSearchRef.addLineItem();
    }
    if (this.isSubmitting) {
      return;
    }
    if (this.orderItems.length === 0) {
      this.errorMessage = 'Please add at least one item before saving a draft.';
      return;
    }
    if (!this.selectedSupplier) {
      this.errorMessage = 'Please select a supplier before saving a draft.';
      return;
    }
    if (!this.canSubmit) {
      this.errorMessage = 'Please add at least one item and select a supplier before saving a draft.';
      return;
    }

    this.isSubmitting = true;
    const payload = this.buildPayload();

    let draft$ = this.orderCreationService.submitOrderRequest(payload, this.isEditMode, this.orderId!);
    if (this.destroyRef) {
      draft$ = draft$.pipe(takeUntilDestroyed(this.destroyRef));
    }
    draft$.subscribe({
      next: (data) => {
        this.isSubmitting = false;
        this.statusVersion = data.statusVersion;
        if (!this.isEditMode) {
          this.isEditMode = true;
          this.orderId = data.requestId;
        }
        this.initialSnapshot = this.takeSnapshot();
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
    const supplier = this.suppliers.find(
      item => item.name.toLowerCase() === (this.selectedSupplier || '').toLowerCase()
    );
    const targetSupplierId = supplier?._id;
    return {
      items: this.orderItems.map(i => {
        const itemAny = i as any;
        const invRef = itemAny.inventoryId;
        const supRef = itemAny.supplierId;
        const invId = typeof invRef === 'object' && invRef !== null ? (invRef._id || invRef.id || '') : (invRef || itemAny.id || '');
        const supId = targetSupplierId || (typeof supRef === 'object' && supRef !== null ? (supRef._id || supRef.id) : supRef) || undefined;
        return {
          inventoryId: invId,
          name: i.name,
          sku: i.sku,
          quantity: i.quantity,
          unitCost: i.unitCost,
          itemClass: i.itemClass || 'Unclassified',
          subcategory: i.subcategory || 'Unclassified',
          unit: i.unit || 'units',
          manufacturerPartNumber: i.manufacturerPartNumber || '',
          supplierId: supId,
        };
      }),
      supplierName: supplier?.name || this.selectedSupplier,
      supplierId: targetSupplierId,
      notes: this.orderNotes,
      source: this.sourceMaterialRequestId ? 'material-request' : 'manual',
      ...(this.sourceMaterialRequestId ? { sourceMaterialRequestId: this.sourceMaterialRequestId } : {}),
      ...(this.isEditMode ? { statusVersion: this.statusVersion } : {}),
    };
  }

  private selectPreferredSupplier(item: InventoryItem): void {
    let supplierName = supplierNameOf(item);
    if (!supplierName) {
      const sId = supplierIdOf(item);
      if (sId) {
        const matchingSupplier = this.suppliers.find(s => s._id === sId);
        if (matchingSupplier) supplierName = matchingSupplier.name;
      }
    }
    if (supplierName && !this.selectedSupplier) this.selectedSupplier = supplierName;
  }

  goBack(): void {
    this.router.navigate(['/inventory-manager/order-creation']);
  }
}
