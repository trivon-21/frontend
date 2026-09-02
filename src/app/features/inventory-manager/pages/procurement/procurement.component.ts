
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import { InventoryItem, InventoryLocationOption, InventoryManagerDashboardService } from '../../services/inventory-manager-dashboard.service';
import { NonPoReason, PurchaseLine, PurchaseRequest, ReceiptAuthorization, ReceiptMode, outstanding } from '../../services/purchase-workflow';

interface RecentProcurement {
  _id?: string;
  id?: string;
  invoiceNumber?: string;
  poNumber?: string;
  supplierName: string;
  itemName: string;
  sku: string;
  quantity: number;
  unit: string;
  receivedDate: string;
  condition: string;
  timestamp: string;
  receivedBy: string;
  receiptMode: ReceiptMode;
  nonPoReason?: NonPoReason;
  sourceDocumentNumber?: string;
  orderRequestId?: string;
  receiptAuthorizationId?: { authorizationNumber?: string; financeReviewStatus?: string };
}

type AuthItem = InventoryItem | string | undefined | null;

@Component({
  selector: 'app-procurement-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PortalIconsModule, RouterModule],
  templateUrl: './procurement.component.html',
  styleUrls: ['./procurement.component.css'],
})
export class ProcurementDashboardComponent implements OnInit {
  currentStep = 1;
  receiptMode: 'PO' | 'NON_PO' = 'PO';
  receiptForm!: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  searchQuery = '';
  grnFilter: 'all' | 'PO' | 'NON_PO' | 'EMERGENCY' | 'FINANCE' = 'all';
  authorizationStatus: 'all' | 'ready' | ReceiptAuthorization['status'] = 'all';
  showDetailsModal = false;
  selectedProcurement: RecentProcurement | null = null;
  loading = true;
  loadError = '';

  purchaseOrders: PurchaseRequest[] = [];
  authorizations: ReceiptAuthorization[] = [];
  allAuthorizations: ReceiptAuthorization[] = [];
  procurements: RecentProcurement[] = [];
  inventoryItems: InventoryItem[] = [];
  locations: InventoryLocationOption[] = [];
  selectedPurchaseOrder: PurchaseRequest | null = null;
  selectedPurchaseLine: PurchaseLine | null = null;
  selectedAuthorization: ReceiptAuthorization | null = null;
  selectedItem: InventoryItem | null = null;
  private readonly preselectedInventoryId: string | null;
  private pendingReceiptEventId = '';

  readonly nonPoReasonLabels: Record<string, string> = {
    EMERGENCY_REPAIR: 'Emergency repair',
    LOCAL_PURCHASE: 'Local purchase',
    WARRANTY_REPLACEMENT: 'Warranty replacement',
    SUPPLIER_REPLACEMENT: 'Supplier replacement',
    OTHER: 'Other',
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly inventoryService: InventoryManagerDashboardService,
    route: ActivatedRoute,
  ) {
    this.preselectedInventoryId = route.snapshot.queryParamMap.get('inventoryId');
    const mode = route.snapshot.queryParamMap.get('mode');
    if (mode === 'PO' || mode === 'NON_PO') this.receiptMode = mode;
    const grnFilter = route.snapshot.queryParamMap.get('grnFilter');
    if (grnFilter === 'PO' || grnFilter === 'NON_PO' || grnFilter === 'EMERGENCY' || grnFilter === 'FINANCE') {
      this.grnFilter = grnFilter;
    }
    const authorizationStatus = route.snapshot.queryParamMap.get('authorizationStatus');
    if (authorizationStatus === 'ready' || authorizationStatus === 'pending'
      || authorizationStatus === 'approved' || authorizationStatus === 'rejected'
      || authorizationStatus === 'partially-received' || authorizationStatus === 'completed') {
      this.authorizationStatus = authorizationStatus;
    }
  }

  ngOnInit(): void {
    this.initForm();
    this.loadAllData();
  }

  get serialNumbersControls(): AbstractControl[] {
    return (this.receiptForm.get('stock.serialNumbers') as FormArray).controls;
  }

  get selectedQuantity(): number {
    return Number(this.receiptForm?.get('stock.quantity')?.value || 0);
  }

  get selectedUnitCost(): number {
    return Number(this.selectedPurchaseLine?.unitCost ?? this.selectedAuthorization?.unitCost ?? 0);
  }

  get remainingQuantity(): number {
    if (this.selectedPurchaseLine) return outstanding(this.selectedPurchaseLine);
    if (this.selectedAuthorization) {
      return Math.max(0, this.selectedAuthorization.authorizedQuantity - this.selectedAuthorization.receivedQuantity);
    }
    return 0;
  }

  get estimatedTotal(): number {
    return this.selectedQuantity * this.selectedUnitCost;
  }

  get availablePoLines(): PurchaseLine[] {
    return (this.selectedPurchaseOrder?.items || []).filter(
      (line) => outstanding(line) > 0 && !!this.inventoryIdOf(line.inventoryId),
    );
  }

  outstanding(line: PurchaseLine): number {
    return outstanding(line);
  }

  get filteredProcurements(): RecentProcurement[] {
    const query = this.searchQuery.trim().toLowerCase();
    return this.procurements.filter((p) => {
      const filterMatch = this.grnFilter === 'all'
        || p.receiptMode === this.grnFilter
        || (this.grnFilter === 'EMERGENCY' && p.nonPoReason === 'EMERGENCY_REPAIR')
        || (this.grnFilter === 'FINANCE' && p.receiptAuthorizationId?.financeReviewStatus === 'pending');
      const queryMatch = !query || [
        p.sourceDocumentNumber, p.invoiceNumber, p.poNumber, p.supplierName, p.itemName, p.sku, p.receivedBy,
      ].some((value) => String(value || '').toLowerCase().includes(query));
      return filterMatch && queryMatch;
    });
  }

  get filteredAuthorizationQueue(): ReceiptAuthorization[] {
    if (this.authorizationStatus === 'all') return this.allAuthorizations;
    if (this.authorizationStatus === 'ready') {
      return this.allAuthorizations.filter((authorization) => this.isReceivableAuthorization(authorization));
    }
    return this.allAuthorizations.filter((authorization) => authorization.status === this.authorizationStatus);
  }

  private initForm(): void {
    this.receiptForm = this.fb.group({
      source: this.fb.group({
        sourceDocumentNumber: ['', [Validators.required, Validators.maxLength(80)]],
        invoiceNumber: ['', Validators.maxLength(80)],
        receivedDate: [this.today(), Validators.required],
        condition: ['Good', Validators.required],
        supportingDocumentUrl: ['', Validators.pattern(/^https?:\/\/\S+$/i)],
      }),
      stock: this.fb.group({
        quantity: [null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
        location: ['', Validators.required],
        binLocation: ['', Validators.required],
        serialNumbers: this.fb.array([]),
      }, { validators: this.storageLocationValidator }),
    });
    this.receiptForm.get('stock.quantity')?.valueChanges.subscribe((q) => this.updateSerialNumbers(Number(q || 0)));
  }

  private today(): string {
    return new Date().toISOString().substring(0, 10);
  }

  loadAllData(): void {
    this.loading = true;
    this.loadError = '';
    forkJoin({
      procurements: this.inventoryService.getProcurements(),
      inventoryItems: this.inventoryService.getInventory(),
      orders: this.inventoryService.getOrderRequests(),
      authorizations: this.inventoryService.getReceiptAuthorizations(),
      locations: this.inventoryService.getLocations(),
    }).subscribe({
      next: ({ procurements, inventoryItems, orders, authorizations, locations }) => {
        this.procurements = procurements;
        this.inventoryItems = inventoryItems;
        this.locations = locations;
        this.purchaseOrders = orders.filter((order) => {
          const isReady = order.workflowStages
            ? order.workflowStages.includes('ready-to-receive')
            : ['ordered', 'partially-received'].includes(order.status);
          return isReady && (order.items || []).some((line) => (
            outstanding(line) > 0 && !!this.findInventoryItem(this.inventoryIdOf(line.inventoryId))
          ));
        });
        this.allAuthorizations = authorizations;
        this.authorizations = authorizations.filter((item) => this.isReceivableAuthorization(item));
        if (this.preselectedInventoryId) {
          const item = this.findInventoryItem(this.preselectedInventoryId);
          if (item) this.selectedItem = item;
        }
        const authorizationId = new URLSearchParams(window.location.search).get('authorizationId');
        const selected = this.authorizations.find((item) => item._id === authorizationId);
        if (selected) {
          this.receiptMode = 'NON_PO';
          this.selectAuthorization(selected);
        }
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Procurement data could not be loaded. No partial workflow data has been shown.';
        this.loading = false;
      },
    });
  }

  setReceiptMode(mode: 'PO' | 'NON_PO'): void {
    this.receiptMode = mode;
    this.selectedPurchaseOrder = null;
    this.selectedPurchaseLine = null;
    this.selectedAuthorization = null;
    this.selectedItem = null;
    this.resetForm();
  }

  selectPurchaseOrder(orderId: string): void {
    this.selectedPurchaseOrder = this.purchaseOrders.find((order) => order._id === orderId) || null;
    this.selectedPurchaseLine = null;
    this.selectedItem = null;
    this.errorMessage = '';
    this.clearSelectionFields();
  }

  selectPurchaseLine(lineId: string): void {
    const line = this.availablePoLines.find((item) => item.lineId === lineId);
    if (!line || !this.selectedPurchaseOrder || !this.inventoryIdOf(line.inventoryId)) return;
    this.selectedPurchaseLine = line;
    this.selectedAuthorization = null;
    const inventoryId = this.inventoryIdOf(line.inventoryId);
    const populatedItem = line.inventoryId && typeof line.inventoryId !== 'string' ? line.inventoryId : null;
    this.selectedItem = this.findInventoryItem(inventoryId) || populatedItem;
    if (!this.selectedItem) {
      this.errorMessage = 'This PO line is not linked to an existing inventory item. Create it in Inventory first.';
      return;
    }
    this.applyTrustedReceiptValues(outstanding(line));
  }

  selectAuthorizationById(id: string): void {
    const authorization = this.authorizations.find((item) => item._id === id);
    if (authorization) this.selectAuthorization(authorization);
  }

  selectAuthorization(authorization: ReceiptAuthorization): void {
    if (!['approved', 'partially-received'].includes(authorization.status)) return;
    const inventoryId = this.inventoryIdOf(authorization.inventoryId);
    const populatedItem = authorization.inventoryId && typeof authorization.inventoryId !== 'string' ? authorization.inventoryId : null;
    const item = inventoryId
      ? this.findInventoryItem(inventoryId) || populatedItem
      : this.inventoryItemFromSnapshot(authorization);
    if (!item) {
      this.errorMessage = 'This authorization is not linked to an existing inventory item. Create it in Inventory first.';
      return;
    }
    this.selectedAuthorization = authorization;
    this.selectedPurchaseOrder = null;
    this.selectedPurchaseLine = null;
    this.selectedItem = item;
    const remaining = Math.max(0, authorization.authorizedQuantity - authorization.receivedQuantity);
    this.applyTrustedReceiptValues(remaining);
  }

  private applyTrustedReceiptValues(quantity: number): void {
    const placement = this.validPlacement(this.selectedItem);
    this.receiptForm.patchValue({
      source: { sourceDocumentNumber: '', invoiceNumber: '', receivedDate: this.today(), condition: 'Good', supportingDocumentUrl: '' },
      stock: { quantity, location: placement.location, binLocation: placement.binLocation },
    });
    this.updateSerialNumbers(quantity);
    this.errorMessage = '';
  }

  private clearSelectionFields(): void {
    this.receiptForm.get('stock')?.reset({ quantity: null, location: '', binLocation: '' });
    this.clearSerialNumbers();
  }

  private findInventoryItem(id: string): InventoryItem | null {
    const candidate = this.selectedAuthorization?.inventoryId;
    if (candidate && typeof candidate !== 'string' && (candidate._id || candidate.id) === id) return candidate;
    const lineCandidate = this.selectedPurchaseLine as PurchaseLine & { inventory?: InventoryItem };
    if (lineCandidate.inventory && (lineCandidate.inventory._id || lineCandidate.inventory.id) === id) {
      return lineCandidate.inventory;
    }
    return this.inventoryItems.find((item) => (item._id || item.id) === id) || null;
  }

  get availablePlacementAreas(): string[] {
    const warehouse = this.receiptForm?.get('stock.location')?.value;
    return this.locations.find((location) => location.warehouse === warehouse)?.placementAreas || [];
  }

  onWarehouseChange(): void {
    const placementArea = this.receiptForm.get('stock.binLocation');
    if (!this.availablePlacementAreas.includes(placementArea?.value)) placementArea?.setValue('');
    this.receiptForm.get('stock')?.updateValueAndValidity();
  }

  private validPlacement(item: InventoryItem | null): { location: string; binLocation: string } {
    const location = item?.location || '';
    const binLocation = item?.binLocation || '';
    const warehouse = this.locations.find((entry) => entry.warehouse === location);
    return warehouse?.placementAreas.includes(binLocation) ? { location, binLocation } : { location: '', binLocation: '' };
  }

  private inventoryItemFromSnapshot(authorization: ReceiptAuthorization): InventoryItem | null {
    const snapshot = authorization.newItemSnapshot;
    if (!snapshot?.name || !snapshot.sku) return null;
    return {
      ...snapshot,
      name: snapshot.name,
      sku: snapshot.sku,
      available: Number(snapshot.available || 0),
      reserved: Number(snapshot.reserved || 0),
      reorderLevel: Number(snapshot.reorderLevel || 0),
      maxStockLevel: Number(snapshot.maxStockLevel || 0),
      status: snapshot.status || 'normal',
      type: snapshot.type || 'Single',
      category: snapshot.category || snapshot.itemClass || 'Unclassified',
      brand: snapshot.brand || '',
      location: snapshot.location || '',
      unit: snapshot.unit || 'units',
      unitCost: Number(snapshot.unitCost ?? authorization.unitCost ?? 0),
      isSerialized: Boolean(snapshot.isSerialized),
    } as InventoryItem;
  }

  private isReceivableAuthorization(authorization: ReceiptAuthorization): boolean {
    if (authorization.workflowStages) {
      return authorization.workflowStages.includes('ready-to-receive');
    }
    const remaining = Number(authorization.authorizedQuantity || 0) - Number(authorization.receivedQuantity || 0);
    const hasItemSource = !!this.inventoryIdOf(authorization.inventoryId) || !!authorization.newItemSnapshot;
    return ['approved', 'partially-received'].includes(authorization.status)
      && remaining > 0
      && hasItemSource;
  }

  authorizationItemName(authorization: ReceiptAuthorization): string {
    if (authorization.inventoryId && typeof authorization.inventoryId !== 'string') {
      return authorization.inventoryId.name;
    }
    return authorization.newItemSnapshot?.name || 'Catalog item unavailable';
  }

  authorizationStatusLabel(status: ReceiptAuthorization['status']): string {
    return status.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
  }

  private inventoryIdOf(value: AuthItem): string {
    if (!value) return '';
    return typeof value === 'string' ? value : String(value._id || value.id || '');
  }

  private updateSerialNumbers(quantity: number): void {
    const serials = this.receiptForm.get('stock.serialNumbers') as FormArray;
    const target = this.selectedItem?.isSerialized ? quantity : 0;
    while (serials.length < target) serials.push(this.fb.control('', Validators.required));
    while (serials.length > target) serials.removeAt(serials.length - 1);
  }

  private clearSerialNumbers(): void {
    const serials = this.receiptForm.get('stock.serialNumbers') as FormArray;
    while (serials.length) serials.removeAt(0);
  }

  private storageLocationValidator = (group: AbstractControl): Record<string, boolean> | null => {
    const location = group.get('location')?.value;
    const binLocation = group.get('binLocation')?.value;
    const warehouse = this.locations.find((entry) => entry.warehouse === location);
    return warehouse?.placementAreas.includes(binLocation) ? null : { storageLocation: true };
  };

  canGoNext(): boolean {
    if (this.currentStep === 1) {
      return !!this.selectedItem && (this.receiptMode === 'PO' ? !!this.selectedPurchaseLine : !!this.selectedAuthorization);
    }
    if (this.currentStep === 2) return this.receiptForm.get('source')!.valid;
    return this.receiptForm.valid && this.selectedQuantity <= this.remainingQuantity && !!this.selectedItem;
  }

  nextStep(): void {
    if (!this.canGoNext()) {
      this.markCurrentStepAsTouched();
      return;
    }
    if (this.currentStep < 3) this.currentStep += 1;
    else this.onSubmit();
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep -= 1;
  }

  setStep(step: number): void {
    if (step < this.currentStep || (step > this.currentStep && this.canGoNext())) this.currentStep = step;
  }

  private markCurrentStepAsTouched(): void {
    const group = this.currentStep === 2 ? 'source' : this.currentStep === 3 ? 'stock' : '';
    if (group) this.receiptForm.get(group)?.markAllAsTouched();
    if (this.currentStep === 1 && !this.selectedItem) {
      this.errorMessage = 'Select an approved PO line or authorization linked to an existing inventory item.';
    }
  }

  onSubmit(): void {
    if (!this.canGoNext() || !this.selectedItem) return;
    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';
    const source = this.receiptForm.get('source')!.value;
    const stock = this.receiptForm.get('stock')!.value;
    this.inventoryService
      .receiveInventory({
        inventoryId: this.selectedItem._id || this.selectedItem.id,
        quantity: Number(stock.quantity),
        serialNumbers: stock.serialNumbers,
        supplierId: this.supplierIdForSelectedSource(),
        invoiceNumber: source.invoiceNumber,
        sourceDocumentNumber: source.sourceDocumentNumber,
        supportingDocumentUrl: source.supportingDocumentUrl,
        receivedDate: source.receivedDate,
        condition: source.condition,
        location: stock.location,
        binLocation: stock.binLocation,
        unitCost: this.selectedUnitCost,
        receiptEventId: this.pendingReceiptEventId || (this.pendingReceiptEventId = crypto.randomUUID()),
        receiptMode: this.receiptMode,
        orderRequestId: this.selectedPurchaseOrder?._id,
        orderLineId: this.selectedPurchaseLine?.lineId,
        receiptAuthorizationId: this.selectedAuthorization?._id,
      })
      .subscribe({
        next: ({ item }) => {
          this.isSubmitting = false;
          this.successMessage = `GRN posted for ${item.name}. Stock and workflow records were updated together.`;
          this.resetForm();
          this.loadAllData();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err.error?.message || 'The receipt could not be posted.';
        },
      });
  }

  private supplierIdForSelectedSource(): string | undefined {
    const supplier = this.selectedPurchaseOrder?.supplierId || this.selectedAuthorization?.supplierId;
    return typeof supplier === 'string' ? supplier : supplier?._id;
  }

  private resetForm(): void {
    this.currentStep = 1;
    this.receiptForm.reset({
      source: { sourceDocumentNumber: '', invoiceNumber: '', receivedDate: this.today(), condition: 'Good', supportingDocumentUrl: '' },
      stock: { quantity: null, location: '', binLocation: '' },
    });
    this.clearSerialNumbers();
    this.pendingReceiptEventId = '';
    this.errorMessage = '';
  }

  viewProcurementDetails(procurement: RecentProcurement): void {
    this.selectedProcurement = procurement;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedProcurement = null;
  }

  reasonLabel(reason?: string): string {
    return reason ? this.nonPoReasonLabels[reason] || reason : '—';
  }
}
