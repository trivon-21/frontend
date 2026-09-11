
import { Component, DestroyRef, HostListener, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import {
  InventoryItem,
  InventoryLocationOption,
  InventoryManagerDashboardService,
  ReceiptDiscrepancy,
  ReceiveInventoryInput,
} from '../../services/inventory-manager-dashboard.service';
import { NonPoReason, PurchaseLine, PurchaseRequest, ReceiptAuthorization, ReceiptMode, outstanding } from '../../services/purchase-workflow';
import { InventoryRack, rackTagFor, toBusinessDateString, warehouseLabelFor } from '../../services/inventory-domain';
import { HasPendingChanges } from '../../../../core/guards/pending-changes.guard';
import { ConfirmService } from '../../../../services/confirm.service';
import { confirmDiscard } from '../../../../core/services/unsaved-changes';

interface RecentProcurement {
  _id?: string;
  id?: string;
  invoiceNumber?: string;
  poNumber?: string;
  supplierName: string;
  itemName: string;
  sku: string;
  quantity: number;
  acceptedQuantity?: number;
  damagedQuantity?: number;
  missingQuantity?: number;
  acceptedTotalCost?: number;
  disputedTotalCost?: number;
  discrepancyId?: { discrepancyId?: string; status?: string } | string;
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
export class ProcurementDashboardComponent implements OnInit, HasPendingChanges {
  currentStep = 1;
  receiptMode: 'PO' | 'NON_PO' = 'PO';
  nonPoAction: 'create' | 'receive' = 'create';
  receiptForm!: FormGroup;
  nonPoRequestForm!: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  searchQuery = '';
  grnFilter: 'all' | 'PO' | 'NON_PO' | 'EMERGENCY' | 'FINANCE' = 'all';
  showDetailsModal = false;
  selectedProcurement: RecentProcurement | null = null;
  loading = true;
  loadError = '';

  purchaseOrders: PurchaseRequest[] = [];
  authorizations: ReceiptAuthorization[] = [];
  discrepancies: ReceiptDiscrepancy[] = [];
  discrepancyFilter: 'active' | 'resolved' | 'all' = 'active';
  procurements: RecentProcurement[] = [];
  inventoryItems: InventoryItem[] = [];
  locations: InventoryLocationOption[] = [];
  suppliers: { _id: string; name: string }[] = [];
  selectedPurchaseOrder: PurchaseRequest | null = null;
  selectedPurchaseLine: PurchaseLine | null = null;
  selectedAuthorization: ReceiptAuthorization | null = null;
  selectedItem: InventoryItem | null = null;
  selectedReplacement: ReceiptDiscrepancy | null = null;
  productSearchQuery = '';
  showProductDropdown = false;
  filteredProducts: InventoryItem[] = [];
  private readonly preselectedInventoryId: string | null;
  private pendingReceiptEventId = '';
  private justSubmitted = false;

  readonly nonPoReasonLabels: Record<string, string> = {
    EMERGENCY_REPAIR: 'Emergency repair',
    LOCAL_PURCHASE: 'Local purchase',
    WARRANTY_REPLACEMENT: 'Warranty replacement',
    SUPPLIER_REPLACEMENT: 'Supplier replacement',
    OTHER: 'Other',
  };
  readonly nonPoReasonKeys = Object.keys(this.nonPoReasonLabels);

  constructor(
    private readonly fb: FormBuilder,
    private readonly inventoryService: InventoryManagerDashboardService,
    private readonly confirmService: ConfirmService,
    route: ActivatedRoute,
    @Optional() private readonly destroyRef?: DestroyRef,
  ) {
    this.preselectedInventoryId = route.snapshot.queryParamMap.get('inventoryId');
    const mode = route.snapshot.queryParamMap.get('mode');
    if (mode === 'PO' || mode === 'NON_PO') this.receiptMode = mode;
    const grnFilter = route.snapshot.queryParamMap.get('grnFilter');
    if (grnFilter === 'PO' || grnFilter === 'NON_PO' || grnFilter === 'EMERGENCY' || grnFilter === 'FINANCE') {
      this.grnFilter = grnFilter;
    }
  }

  ngOnInit(): void {
    this.initForm();
    this.initNonPoRequestForm();
    this.loadAllData();
    this.inventoryService.getSuppliers().subscribe((suppliers) => (this.suppliers = suppliers));
  }

  get serialNumbersControls(): AbstractControl[] {
    return (this.receiptForm.get('stock.serialNumbers') as FormArray).controls;
  }

  get damagedSerialNumbersControls(): AbstractControl[] {
    return (this.receiptForm.get('stock.damagedSerialNumbers') as FormArray).controls;
  }

  get selectedQuantity(): number {
    return Number(this.receiptForm?.get('stock.quantity')?.value || 0);
  }

  get acceptedQuantity(): number {
    return Number(this.receiptForm?.get('stock.acceptedQuantity')?.value || 0);
  }

  get damagedQuantity(): number {
    return Number(this.receiptForm?.get('stock.damagedQuantity')?.value || 0);
  }

  get missingQuantity(): number {
    return Number(this.receiptForm?.get('stock.missingQuantity')?.value || 0);
  }

  get receiptBreakdownValid(): boolean {
    const condition = this.receiptForm?.get('source.condition')?.value;
    const values = [this.selectedQuantity, this.acceptedQuantity, this.damagedQuantity, this.missingQuantity];
    if (!values.every(Number.isInteger) || values.some((value) => value < 0) || this.selectedQuantity < 1) return false;
    if (this.acceptedQuantity + this.damagedQuantity + this.missingQuantity !== this.selectedQuantity) return false;
    if (condition === 'Good') return this.acceptedQuantity === this.selectedQuantity;
    if (condition === 'Damaged') return this.damagedQuantity > 0 && this.missingQuantity === 0;
    return condition === 'Incomplete' && this.missingQuantity > 0;
  }

  get isNonPoCreate(): boolean {
    return this.receiptMode === 'NON_PO' && this.nonPoAction === 'create';
  }

  get selectedUnitCost(): number {
    if (this.isNonPoCreate) return Number(this.nonPoRequestForm?.get('item.unitCost')?.value || 0);
    return Number(this.selectedPurchaseLine?.unitCost ?? this.selectedAuthorization?.unitCost ?? 0);
  }

  get nonPoRequestQuantity(): number {
    return Number(this.nonPoRequestForm?.get('item.authorizedQuantity')?.value || 0);
  }

  get nonPoRequestTotal(): number {
    return this.nonPoRequestQuantity * this.selectedUnitCost;
  }

  get remainingQuantity(): number {
    if (this.isNonPoCreate) return this.nonPoRequestQuantity;
    if (this.selectedPurchaseLine) return outstanding(this.selectedPurchaseLine);
    if (this.selectedAuthorization) {
      return Math.max(0, this.selectedAuthorization.authorizedQuantity - this.selectedAuthorization.receivedQuantity);
    }
    return 0;
  }

  get estimatedTotal(): number {
    return this.acceptedQuantity * this.selectedUnitCost;
  }

  get disputedTotal(): number {
    return (this.damagedQuantity + this.missingQuantity) * this.selectedUnitCost;
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

  get filteredDiscrepancies(): ReceiptDiscrepancy[] {
    if (this.discrepancyFilter === 'all') return this.discrepancies;
    if (this.discrepancyFilter === 'resolved') return this.discrepancies.filter((item) => item.status === 'resolved');
    return this.discrepancies.filter((item) => !['resolved', 'waived'].includes(item.status));
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
        acceptedQuantity: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
        damagedQuantity: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
        missingQuantity: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
        location: ['', Validators.required],
        rackTag: ['', Validators.required],
        binLocation: ['', Validators.required],
        serialNumbers: this.fb.array([]),
        damagedSerialNumbers: this.fb.array([]),
      }, { validators: this.storageLocationValidator }),
    });
    this.receiptForm.get('stock.quantity')?.valueChanges.subscribe(() => this.applyDispositionDefaults());
    this.receiptForm.get('source.condition')?.valueChanges.subscribe(() => this.applyDispositionDefaults());
    this.receiptForm.get('stock.acceptedQuantity')?.valueChanges.subscribe((q) => this.updateSerialNumbers(Number(q || 0)));
    this.receiptForm.get('stock.damagedQuantity')?.valueChanges.subscribe((q) => this.updateDamagedSerialNumbers(Number(q || 0)));
  }

  private today(): string {
    return toBusinessDateString(new Date());
  }

  private initNonPoRequestForm(): void {
    this.nonPoRequestForm = this.fb.group({
      item: this.fb.group({
        inventoryId: ['', Validators.required],
        unitCost: [null, [Validators.required, Validators.min(0)]],
        authorizedQuantity: [null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      }),
      documents: this.fb.group({
        supplierId: ['', Validators.required],
        nonPoReason: ['', Validators.required],
        sourceDocumentNumber: ['', [Validators.required, Validators.maxLength(80)]],
        explanation: ['', Validators.required],
        supportingDocumentUrl: ['', Validators.pattern(/^https?:\/\/\S+$/i)],
      }),
    });
    this.nonPoRequestForm.get('item.inventoryId')?.valueChanges.subscribe((id) => {
      this.selectedItem = this.inventoryItems.find((item) => (item._id || item.id) === id) || null;
    });
  }

  filterProducts(): void {
    const query = this.productSearchQuery.toLowerCase().trim();
    this.filteredProducts = !query ? this.inventoryItems : this.inventoryItems.filter((item) => (
      (item.name?.toLowerCase() || '').includes(query) || (item.sku?.toLowerCase() || '').includes(query)
    ));
    this.showProductDropdown = true;
  }

  onProductInputFocus(): void {
    this.filterProducts();
  }

  onProductInputBlur(): void {
    setTimeout(() => { this.showProductDropdown = false; }, 200);
  }

  selectProduct(item: InventoryItem): void {
    this.nonPoRequestForm.get('item.inventoryId')?.setValue(item._id || item.id);
    this.nonPoRequestForm.get('item.inventoryId')?.markAsDirty();
    this.nonPoRequestForm.get('item.unitCost')?.setValue(item.unitCost);
    this.productSearchQuery = item.name;
    this.showProductDropdown = false;
  }

  clearProductSelection(): void {
    this.nonPoRequestForm.get('item.inventoryId')?.setValue('');
    this.productSearchQuery = '';
    this.filteredProducts = this.inventoryItems;
  }

  setNonPoAction(action: 'create' | 'receive'): void {
    this.justSubmitted = false;
    this.nonPoAction = action;
    this.currentStep = 1;
    this.selectedAuthorization = null;
    this.selectedItem = null;
    this.errorMessage = '';
    this.nonPoRequestForm.reset();
    this.productSearchQuery = '';
    this.showProductDropdown = false;
  }

  private resetNonPoRequestForm(): void {
    this.currentStep = 1;
    this.nonPoRequestForm.reset();
    this.selectedItem = null;
    this.errorMessage = '';
    this.productSearchQuery = '';
    this.showProductDropdown = false;
  }

  submitNonPoRequest(): void {
    if (this.nonPoRequestForm.invalid || this.isSubmitting) {
      this.nonPoRequestForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';
    const item = this.nonPoRequestForm.get('item')!.value;
    const documents = this.nonPoRequestForm.get('documents')!.value;
    const enteredUnitCost = Number(item.unitCost);
    const catalogUnitCost = Number(this.selectedItem?.unitCost ?? enteredUnitCost);
    this.inventoryService.createReceiptAuthorization({
      inventoryId: item.inventoryId,
      unitCost: enteredUnitCost,
      authorizedQuantity: Number(item.authorizedQuantity),
      supplierId: documents.supplierId,
      nonPoReason: documents.nonPoReason,
      sourceDocumentNumber: documents.sourceDocumentNumber,
      explanation: documents.explanation,
      supportingDocumentUrl: documents.supportingDocumentUrl,
    }).subscribe({
      next: (authorization) => {
        this.isSubmitting = false;
        this.successMessage = `${authorization.authorizationNumber} submitted for Manager approval.`;
        this.justSubmitted = true;
        if (item.inventoryId && enteredUnitCost !== catalogUnitCost) {
          this.syncCatalogPrice(item.inventoryId, enteredUnitCost);
        }
        this.resetNonPoRequestForm();
        this.loadAllData({ force: true });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'The Non-PO request could not be submitted.';
      },
    });
  }

  /**
   * Keeps the catalog unit cost in sync when a Non-PO request is entered at a
   * different price. Fire-and-forget: a failure here shouldn't block the
   * request itself, since the authorization already carries the entered price.
   */
  private syncCatalogPrice(inventoryId: string, unitCost: number): void {
    let update$ = this.inventoryService.updateItemPrice(inventoryId, unitCost);
    if (this.destroyRef) {
      update$ = update$.pipe(takeUntilDestroyed(this.destroyRef));
    }
    update$.subscribe({
      error: () => {
        this.errorMessage = 'The request was submitted, but the catalog price could not be updated.';
      },
    });
  }

  loadAllData(options: { force?: boolean } = {}): void {
    this.loading = true;
    this.loadError = '';
    let stream$ = this.inventoryService.getProcurementSummary(options);
    if (this.destroyRef) {
      stream$ = stream$.pipe(takeUntilDestroyed(this.destroyRef));
    }
    stream$.subscribe({
      next: ({ procurements, inventoryItems, orderRequests: orders, authorizations, discrepancies, locations }) => {
        this.procurements = procurements;
        this.inventoryItems = inventoryItems;
        this.locations = locations;
        this.discrepancies = discrepancies;
        this.purchaseOrders = orders.filter((order) => {
          const isReady = order.workflowStages
            ? order.workflowStages.includes('ready-to-receive')
            : ['ordered', 'partially-received'].includes(order.status);
          return isReady && (order.items || []).some((line) => (
            outstanding(line) > 0 && !!this.findInventoryItem(this.inventoryIdOf(line.inventoryId))
          ));
        });
        this.authorizations = authorizations.filter((item) => this.isReceivableAuthorization(item));
        if (this.preselectedInventoryId) {
          const item = this.findInventoryItem(this.preselectedInventoryId);
          if (item) this.selectedItem = item;
        }
        const authorizationId = new URLSearchParams(window.location.search).get('authorizationId');
        const selected = this.authorizations.find((item) => item._id === authorizationId);
        if (selected) {
          this.receiptMode = 'NON_PO';
          this.nonPoAction = 'receive';
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
    this.justSubmitted = false;
    this.receiptMode = mode;
    this.nonPoAction = 'create';
    this.selectedPurchaseOrder = null;
    this.selectedPurchaseLine = null;
    this.selectedAuthorization = null;
    this.selectedItem = null;
    this.selectedReplacement = null;
    this.resetForm();
    this.nonPoRequestForm.reset();
    this.productSearchQuery = '';
    this.showProductDropdown = false;
  }

  selectPurchaseOrder(orderId: string): void {
    this.justSubmitted = false;
    this.selectedReplacement = null;
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
    this.justSubmitted = false;
    this.selectedReplacement = null;
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
      stock: { quantity, acceptedQuantity: quantity, damagedQuantity: 0, missingQuantity: 0, location: placement.location, rackTag: placement.rackTag, binLocation: placement.binLocation },
    });
    this.updateSerialNumbers(quantity);
    this.updateDamagedSerialNumbers(0);
    this.errorMessage = '';
  }

  private clearSelectionFields(): void {
    this.receiptForm.get('stock')?.reset({ quantity: null, acceptedQuantity: 0, damagedQuantity: 0, missingQuantity: 0, location: '', rackTag: '', binLocation: '' });
    this.clearSerialNumbers();
    this.clearDamagedSerialNumbers();
  }

  private findInventoryItem(id: string): InventoryItem | null {
    const candidate = this.selectedAuthorization?.inventoryId;
    if (candidate && typeof candidate !== 'string' && (candidate._id || candidate.id) === id) return candidate;
    const lineCandidate = this.selectedPurchaseLine as (PurchaseLine & { inventory?: InventoryItem }) | null;
    if (lineCandidate?.inventory && (lineCandidate.inventory._id || lineCandidate.inventory.id) === id) {
      return lineCandidate.inventory;
    }
    return this.inventoryItems.find((item) => (item._id || item.id) === id) || null;
  }

  get availableRacks(): InventoryRack[] {
    const warehouse = this.receiptForm?.get('stock.location')?.value;
    return this.locations.find((location) => location.warehouse === warehouse)?.racks || [];
  }

  get availableBins(): string[] {
    const rackTag = this.receiptForm?.get('stock.rackTag')?.value;
    return this.availableRacks.find((rack) => rack.rackTag === rackTag)?.bins || [];
  }

  warehouseLabel(location: InventoryLocationOption): string {
    return location.warehouseLabel || warehouseLabelFor(location.warehouse);
  }

  onWarehouseChange(): void {
    const rackControl = this.receiptForm.get('stock.rackTag');
    if (!this.availableRacks.some((rack) => rack.rackTag === rackControl?.value)) rackControl?.setValue('');
    this.onRackChange();
  }

  onRackChange(): void {
    const binControl = this.receiptForm.get('stock.binLocation');
    if (!this.availableBins.includes(binControl?.value)) binControl?.setValue('');
    this.receiptForm.get('stock')?.updateValueAndValidity();
  }

  private validPlacement(item: InventoryItem | null): { location: string; rackTag: string; binLocation: string } {
    const location = item?.location || '';
    const binLocation = item?.binLocation || '';
    const rackTag = rackTagFor(location, binLocation);
    const rack = this.locations
      .find((entry) => entry.warehouse === location)
      ?.racks.find((entry) => entry.rackTag === rackTag);
    return rack?.bins.includes(binLocation)
      ? { location, rackTag, binLocation }
      : { location: '', rackTag: '', binLocation: '' };
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

  private updateDamagedSerialNumbers(quantity: number): void {
    const serials = this.receiptForm.get('stock.damagedSerialNumbers') as FormArray;
    const target = this.selectedItem?.isSerialized ? quantity : 0;
    while (serials.length < target) serials.push(this.fb.control('', Validators.required));
    while (serials.length > target) serials.removeAt(serials.length - 1);
  }

  private applyDispositionDefaults(): void {
    const quantity = this.selectedQuantity;
    const condition = this.receiptForm.get('source.condition')?.value;
    const allocation = condition === 'Damaged'
      ? { acceptedQuantity: 0, damagedQuantity: quantity, missingQuantity: 0 }
      : condition === 'Incomplete'
        ? { acceptedQuantity: 0, damagedQuantity: 0, missingQuantity: quantity }
        : { acceptedQuantity: quantity, damagedQuantity: 0, missingQuantity: 0 };
    this.receiptForm.get('stock')?.patchValue(allocation, { emitEvent: false });
    this.updateSerialNumbers(allocation.acceptedQuantity);
    this.updateDamagedSerialNumbers(allocation.damagedQuantity);
  }

  private clearSerialNumbers(): void {
    const serials = this.receiptForm.get('stock.serialNumbers') as FormArray;
    while (serials.length) serials.removeAt(0);
  }

  private clearDamagedSerialNumbers(): void {
    const serials = this.receiptForm.get('stock.damagedSerialNumbers') as FormArray;
    while (serials.length) serials.removeAt(0);
  }

  private storageLocationValidator = (group: AbstractControl): Record<string, boolean> | null => {
    const location = group.get('location')?.value;
    const rackTag = group.get('rackTag')?.value;
    const binLocation = group.get('binLocation')?.value;
    const rack = this.locations
      .find((entry) => entry.warehouse === location)
      ?.racks.find((entry) => entry.rackTag === rackTag);
    return rack?.bins.includes(binLocation) ? null : { storageLocation: true };
  };

  get isDirty(): boolean {
    if (this.justSubmitted) return false;
    if (this.isNonPoCreate) return this.currentStep > 1 || this.nonPoRequestForm.dirty;
    return this.currentStep > 1 || this.receiptForm.dirty;
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (!this.isDirty) {
      return true;
    }
    return confirmDiscard(this.confirmService, 'receipt entry');
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.isDirty) event.preventDefault();
  }

  canGoNext(): boolean {
    if (this.isNonPoCreate) {
      if (this.currentStep === 1) return this.nonPoRequestForm.get('item')!.valid;
      if (this.currentStep === 2) return this.nonPoRequestForm.get('documents')!.valid;
      return this.nonPoRequestForm.valid;
    }
    if (this.currentStep === 1) {
      return !!this.selectedItem && (this.receiptMode === 'PO' ? !!this.selectedPurchaseLine : !!this.selectedAuthorization);
    }
    if (this.currentStep === 2) return this.receiptForm.get('source')!.valid;
    return this.receiptForm.valid
      && this.receiptBreakdownValid
      && this.selectedQuantity <= this.remainingQuantity
      && !!this.selectedItem;
  }

  nextStep(): void {
    if (!this.canGoNext()) {
      this.markCurrentStepAsTouched();
      return;
    }
    if (this.currentStep < 3) {
      this.currentStep += 1;
      return;
    }
    if (this.isNonPoCreate) this.submitNonPoRequest();
    else this.onSubmit();
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep -= 1;
  }

  setStep(step: number): void {
    if (step < this.currentStep || (step > this.currentStep && this.canGoNext())) this.currentStep = step;
  }

  private markCurrentStepAsTouched(): void {
    if (this.isNonPoCreate) {
      const group = this.currentStep === 1 ? 'item' : this.currentStep === 2 ? 'documents' : '';
      if (group) this.nonPoRequestForm.get(group)?.markAllAsTouched();
      return;
    }
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
    const request: ReceiveInventoryInput = {
        inventoryId: this.selectedItem._id || this.selectedItem.id,
        quantity: Number(stock.quantity),
        acceptedQuantity: Number(stock.acceptedQuantity),
        damagedQuantity: Number(stock.damagedQuantity),
        missingQuantity: Number(stock.missingQuantity),
        serialNumbers: stock.serialNumbers,
        damagedSerialNumbers: stock.damagedSerialNumbers,
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
        discrepancyId: this.selectedReplacement?._id,
      };
    this.inventoryService
      .receiveInventory(request)
      .subscribe({
        next: ({ item, procurement }) => {
          this.isSubmitting = false;
          this.successMessage = `GRN posted for ${item.name}: ${procurement.acceptedQuantity} accepted, ${procurement.damagedQuantity} damaged, ${procurement.missingQuantity} missing.`;
          this.justSubmitted = true;
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
      stock: { quantity: null, acceptedQuantity: 0, damagedQuantity: 0, missingQuantity: 0, location: '', binLocation: '' },
    });
    this.clearSerialNumbers();
    this.clearDamagedSerialNumbers();
    this.selectedReplacement = null;
    this.pendingReceiptEventId = '';
    this.errorMessage = '';
  }

  startReplacement(discrepancy: ReceiptDiscrepancy): void {
    const quantity = discrepancy.outstandingQuantity;
    if (quantity < 1) return;
    this.justSubmitted = false;

    if (discrepancy.receiptMode === 'PO') {
      const orderId = this.relationId(discrepancy.orderRequestId);
      const order = this.purchaseOrders.find((item) => item._id === orderId);
      const line = order?.items.find((item) => item.lineId === discrepancy.orderLineId);
      if (!order || !line) {
        this.errorMessage = 'The original purchase order is no longer available for receiving.';
        return;
      }
      this.receiptMode = 'PO';
      this.selectedPurchaseOrder = order;
      this.selectPurchaseLine(line.lineId);
    } else {
      const authorizationId = this.relationId(discrepancy.receiptAuthorizationId);
      const authorization = this.authorizations.find((item) => item._id === authorizationId);
      if (!authorization) {
        this.errorMessage = 'The original receipt authorization is no longer available for receiving.';
        return;
      }
      this.receiptMode = 'NON_PO';
      this.nonPoAction = 'receive';
      this.selectAuthorization(authorization);
    }

    this.selectedReplacement = discrepancy;
    const replacementQuantity = Math.min(quantity, this.remainingQuantity);
    this.receiptForm.patchValue({
      source: { condition: 'Good' },
      stock: { quantity: replacementQuantity, acceptedQuantity: replacementQuantity, damagedQuantity: 0, missingQuantity: 0 },
    });
    this.currentStep = 2;
  }

  private relationId(value: { _id: string } | string | undefined): string {
    return typeof value === 'string' ? value : value?._id || '';
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

  procurementDiscrepancyLabel(value?: RecentProcurement['discrepancyId']): string {
    if (!value) return '—';
    return typeof value === 'string' ? value : value.discrepancyId || '—';
  }
}
