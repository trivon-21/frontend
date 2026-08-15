import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import {
  InventoryItem,
  InventoryItemClass,
  InventoryManagerDashboardService,
  InventorySystemType,
} from '../../services/inventory-manager-dashboard.service';
import {
  INVENTORY_ITEM_CLASSES,
  INVENTORY_SUBCATEGORIES,
  INVENTORY_SYSTEM_TYPES,
  INVENTORY_UNITS,
  isValidSubcategory,
  supplierIdOf,
} from '../../services/inventory-domain';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  NonPoReason,
  PurchaseLine,
  PurchaseRequest,
  ReceiptAuthorization,
  ReceiptMode,
  outstanding,
} from '../../services/purchase-workflow';

interface RecentProcurement {
  id: string;
  invoiceNumber: string;
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
  financeReviewStatus?: string;
  receiptAuthorizationId?: { financeReviewStatus?: string; authorizationNumber?: string };
}

import { LucideAngularModule } from 'lucide-angular';

import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-procurement-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule, RouterModule],
  templateUrl: './procurement.component.html',
  styleUrls: ['./procurement.component.css'],
})
export class ProcurementDashboardComponent implements OnInit {
  currentStep = 1;
  grnForm!: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  showDetailsModal = false;
  selectedProcurement: RecentProcurement | null = null;

  suppliers: any[] = [];
  filteredSuppliers: any[] = [];
  showSupplierDropdown = false;
  isAddingNewSupplier = false;
  selectedSupplierId = '';
  searchQuery: string = '';
  existingItemQuery = '';
  inventoryItems: InventoryItem[] = [];
  filteredInventoryItems: InventoryItem[] = [];
  selectedExistingItem: InventoryItem | null = null;
  showExistingItemDropdown = false;
  showTechnicalFields = false;
  receiptMode: 'PO' | 'NON_PO' = 'PO';
  purchaseOrders: PurchaseRequest[] = [];
  selectedPurchaseOrder: PurchaseRequest | null = null;
  selectedPurchaseLine: PurchaseLine | null = null;
  authorizations: ReceiptAuthorization[] = [];
  selectedAuthorization: ReceiptAuthorization | null = null;
  grnFilter: 'all' | 'PO' | 'NON_PO' | 'EMERGENCY' | 'REPLACEMENT' | 'FINANCE' = 'all';
  readonly nonPoReasons: Array<{ value: NonPoReason; label: string }> = [
    { value: 'EMERGENCY_REPAIR', label: 'Emergency repair' },
    { value: 'LOCAL_PURCHASE', label: 'Local purchase' },
    { value: 'WARRANTY_REPLACEMENT', label: 'Warranty replacement' },
    { value: 'SUPPLIER_REPLACEMENT', label: 'Supplier replacement' },
    { value: 'OTHER', label: 'Other' },
  ];
  private pendingReceiptEventId = '';

  readonly itemClasses: InventoryItemClass[] = INVENTORY_ITEM_CLASSES;
  readonly subcategories = INVENTORY_SUBCATEGORIES;
  readonly systemTypes: InventorySystemType[] = INVENTORY_SYSTEM_TYPES;
  readonly units = INVENTORY_UNITS;
  private readonly preselectedInventoryId: string | null;

  procurements: RecentProcurement[] = [];

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryManagerDashboardService,
    route: ActivatedRoute,
  ) {
    this.preselectedInventoryId = route.snapshot.queryParamMap.get('inventoryId');
  }

  ngOnInit(): void {
    this.initForm();
    this.loadSuppliers();
    this.loadProcurements();
    this.loadInventory();
    this.loadWorkflowRecords();

    // Listen to supplier input changes for autocomplete
    this.grnForm
      .get('supplierInfo.supplier')
      ?.valueChanges.pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((value) => {
        if (typeof value === 'string') {
          const selectedSupplier = this.suppliers.find((supplier) => supplier._id === this.selectedSupplierId);
          if (selectedSupplier && selectedSupplier.name !== value) this.selectedSupplierId = '';
          this.filterSuppliers(value);
        }
      });

    // Listen to quantity changes to adjust serial number inputs
    this.grnForm.get('inventorySettings.available')?.valueChanges.subscribe((qty) => {
      this.updateSerialNumbersArray(qty);
    });
  }

  get serialNumbersControls() {
    return (this.grnForm.get('inventorySettings.serialNumbers') as FormArray).controls;
  }

  private updateSerialNumbersArray(qty: number) {
    const serials = this.grnForm.get('inventorySettings.serialNumbers') as FormArray;
    const currentLength = serials.length;
    const targetLength = this.grnForm.get('itemDetails.isSerialized')?.value && this.isFinalReceipt ? qty || 0 : 0;

    if (targetLength > currentLength) {
      for (let i = currentLength; i < targetLength; i++) {
        serials.push(this.fb.control('', Validators.required));
      }
    } else if (targetLength < currentLength) {
      for (let i = currentLength; i > targetLength; i--) {
        serials.removeAt(i - 1);
      }
    }
  }

  private initForm(): void {
    this.grnForm = this.fb.group({
      supplierInfo: this.fb.group({
        supplier: ['', Validators.required],
        sourceDocumentNumber: ['', Validators.required],
        invoiceNumber: [''],
        receivedDate: [new Date().toISOString().substring(0, 10), Validators.required],
        condition: ['Good', Validators.required],
        nonPoReason: ['EMERGENCY_REPAIR'],
        explanation: [''],
        affectedWorkType: ['NONE'],
        affectedWorkReference: [''],
        supportingDocumentUrl: ['', Validators.pattern(/^https?:\/\/\S+$/i)],
      }),
      itemDetails: this.fb.group({
        name: ['', Validators.required],
        sku: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9-]+$')]],
        brand: ['', Validators.required],
        type: ['Single', Validators.required],
        itemClass: ['Unclassified', [Validators.required, (control: AbstractControl) => control.value === 'Unclassified' ? { classification: true } : null]],
        subcategory: ['Unclassified', Validators.required],
        manufacturerPartNumber: [''],
        compatibleModels: [''],
        systemType: ['Not Applicable'],
        refrigerants: [''],
        capacityBtu: [null, Validators.min(0)],
        voltage: [''],
        phase: ['Not Applicable'],
        isSerialized: [false],
        specsUrl: [''],
      }),
      inventorySettings: this.fb.group({
        available: [1, [Validators.required, Validators.min(1)]],
        location: ['Warehouse', Validators.required],
        binLocation: [''],
        unit: ['units', Validators.required],
        reorderLevel: [10, [Validators.required, Validators.min(0)]],
        maxStockLevel: [100, [Validators.required, Validators.min(0)]],
        unitCost: [0, [Validators.required, Validators.min(0)]],
        serialNumbers: this.fb.array([]),
      }),
    });

    // Handle isSerialized toggle
    this.grnForm.get('itemDetails.isSerialized')?.valueChanges.subscribe((val) => {
      this.updateSerialNumbersArray(this.grnForm.get('inventorySettings.available')?.value || 0);
    });
    this.grnForm.get('itemDetails.itemClass')?.valueChanges.subscribe((itemClass) => {
      if (!this.selectedExistingItem) {
        const first = this.subcategories[itemClass as InventoryItemClass]?.[0] || 'Unclassified';
        this.grnForm.get('itemDetails.subcategory')?.setValue(first);
      }
    });
  }

  get isFinalReceipt(): boolean {
    return !!this.selectedPurchaseLine || !!this.selectedAuthorization;
  }

  get availablePoLines(): PurchaseLine[] {
    return this.selectedPurchaseOrder?.items.filter(line => outstanding(line) > 0) || [];
  }

  outstanding(line: PurchaseLine): number {
    return outstanding(line);
  }

  private loadWorkflowRecords(): void {
    this.inventoryService.getOrderRequests().subscribe({
      next: orders => this.purchaseOrders = orders.filter(order => ['ordered', 'partially-received'].includes(order.status)),
      error: () => this.purchaseOrders = [],
    });
    this.inventoryService.getReceiptAuthorizations().subscribe({
      next: items => {
        this.authorizations = items;
        const id = new URLSearchParams(window.location.search).get('authorizationId');
        const selected = items.find(item => item._id === id && ['approved', 'partially-received'].includes(item.status));
        if (selected) { this.receiptMode = 'NON_PO'; this.selectAuthorization(selected); }
      },
      error: () => this.authorizations = [],
    });
  }

  setReceiptMode(mode: 'PO' | 'NON_PO'): void {
    this.receiptMode = mode;
    this.selectedPurchaseOrder = null;
    this.selectedPurchaseLine = null;
    this.selectedAuthorization = null;
    this.resetForm();
  }

  selectPurchaseOrder(orderId: string): void {
    this.selectedPurchaseOrder = this.purchaseOrders.find(order => order._id === orderId) || null;
    this.selectedPurchaseLine = null;
  }

  selectPurchaseLine(lineId: string): void {
    const line = this.availablePoLines.find(item => item.lineId === lineId);
    if (!line || !this.selectedPurchaseOrder) return;
    this.selectedPurchaseLine = line;
    const item = this.inventoryItems.find(candidate => (candidate._id || candidate.id) === line.inventoryId);
    if (item) this.selectExistingItem(item);
    const supplier = this.suppliers.find(candidate => candidate._id === this.selectedPurchaseOrder?.supplierId)
      || this.suppliers.find(candidate => candidate.name === this.selectedPurchaseOrder?.supplierName);
    if (supplier) this.selectSupplier(supplier);
    this.grnForm.get('inventorySettings.available')?.setValue(outstanding(line));
    this.grnForm.get('inventorySettings.unitCost')?.setValue(line.unitCost);
  }

  selectAuthorization(authorization: ReceiptAuthorization): void {
    if (!['approved', 'partially-received'].includes(authorization.status)) return;
    this.selectedAuthorization = authorization;
    const item = authorization.inventoryId;
    if (item?._id || item?.id) this.selectExistingItem(item);
    else if (authorization.newItemSnapshot) {
      this.grnForm.get('itemDetails')?.patchValue({
        ...authorization.newItemSnapshot,
        compatibleModels: (authorization.newItemSnapshot.compatibleModels || []).join(', '),
        refrigerants: (authorization.newItemSnapshot.refrigerants || []).join(', '),
      });
      this.grnForm.get('inventorySettings')?.patchValue(authorization.newItemSnapshot);
    }
    const supplierId = typeof authorization.supplierId === 'string' ? authorization.supplierId : authorization.supplierId?._id;
    const supplier = this.suppliers.find(candidate => candidate._id === supplierId)
      || this.suppliers.find(candidate => candidate.name === authorization.supplierName);
    if (supplier) this.selectSupplier(supplier);
    this.grnForm.get('supplierInfo')?.patchValue({
      sourceDocumentNumber: authorization.sourceDocumentNumber,
      nonPoReason: authorization.nonPoReason,
      explanation: authorization.explanation,
      affectedWorkType: authorization.affectedWorkType,
      affectedWorkReference: authorization.affectedWorkReference || '',
      supportingDocumentUrl: authorization.supportingDocumentUrl || '',
    });
    this.grnForm.get('inventorySettings.available')?.setValue(authorization.authorizedQuantity - authorization.receivedQuantity);
    this.grnForm.get('inventorySettings.unitCost')?.setValue(authorization.unitCost);
    this.updateSerialNumbersArray(this.grnForm.get('inventorySettings.available')?.value || 0);
  }

  selectAuthorizationById(id: string): void {
    const authorization = this.authorizations.find(item => item._id === id);
    if (authorization) this.selectAuthorization(authorization);
    else {
      this.selectedAuthorization = null;
      this.resetForm();
    }
  }

  get availableSubcategories(): string[] {
    const itemClass = this.grnForm?.get('itemDetails.itemClass')?.value as InventoryItemClass;
    return this.subcategories[itemClass] || ['Unclassified'];
  }


  private loadSuppliers(): void {
    this.inventoryService.getSuppliers().subscribe({
      next: (data) => {
        this.suppliers = data;
        this.filteredSuppliers = data;
        this.applyPreferredSupplier();
      },
      error: (err) => console.error('Error loading suppliers:', err),
    });
  }

  private loadInventory(): void {
    this.inventoryService.getInventory().subscribe({
      next: (items) => {
        this.inventoryItems = items;
        this.filteredInventoryItems = items.slice(0, 8);
        const preselected = items.find((item) => (item._id || item.id) === this.preselectedInventoryId);
        if (preselected) this.selectExistingItem(preselected);
      },
      error: (err) => console.error('Error loading inventory:', err),
    });
  }

  private loadProcurements(): void {
    this.inventoryService.getProcurements().subscribe({
      next: (data) => (this.procurements = data),
      error: (err) => console.error('Error loading procurements:', err),
    });
  }

  get filteredProcurements() {
    const query = (this.searchQuery || '').toLowerCase().trim();
    return this.procurements.filter((p) => {
      const matchesFilter = this.grnFilter === 'all'
        || this.grnFilter === p.receiptMode
        || this.grnFilter === 'EMERGENCY' && p.nonPoReason === 'EMERGENCY_REPAIR'
        || this.grnFilter === 'REPLACEMENT' && ['WARRANTY_REPLACEMENT', 'SUPPLIER_REPLACEMENT'].includes(p.nonPoReason || '')
        || this.grnFilter === 'FINANCE' && p.receiptAuthorizationId?.financeReviewStatus === 'pending';
      const matchesQuery = !query ||
        p.invoiceNumber?.toLowerCase().includes(query) ||
        p.sourceDocumentNumber?.toLowerCase().includes(query) ||
        p.supplierName?.toLowerCase().includes(query) ||
        p.itemName?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.receivedBy?.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  }

  filterSuppliers(query: string) {
    if (!query) {
      this.filteredSuppliers = this.suppliers;
      return;
    }
    const lowQuery = query.toLowerCase();
    this.filteredSuppliers = this.suppliers.filter((s) => s.name.toLowerCase().includes(lowQuery));
  }

  selectSupplier(supplier: any) {
    if (supplier === 'new') {
      this.isAddingNewSupplier = true;
      this.showSupplierDropdown = false;
      return;
    }
    this.grnForm.get('supplierInfo.supplier')?.setValue(supplier.name, { emitEvent: false });
    this.selectedSupplierId = supplier._id;
    this.showSupplierDropdown = false;
    this.isAddingNewSupplier = false;
  }

  onSupplierInputBlur() {
    // Delay to allow click on dropdown items
    setTimeout(() => {
      this.showSupplierDropdown = false;
    }, 200);
  }

  onSupplierInputFocus() {
    this.showSupplierDropdown = true;
    this.filterSuppliers(this.grnForm.get('supplierInfo.supplier')?.value || '');
  }

  confirmNewSupplier() {
    const newName = this.grnForm.get('supplierInfo.supplier')?.value;
    if (!newName) return;

    this.isSubmitting = true;
    this.inventoryService.addSupplier(newName).subscribe({
      next: (supplier) => {
        this.suppliers.push(supplier);
        this.suppliers.sort((a, b) => a.name.localeCompare(b.name));
        this.isAddingNewSupplier = false;
        this.selectedSupplierId = supplier._id;
        this.isSubmitting = false;
        this.successMessage = `Supplier "${supplier.name}" added successfully!`;
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to add supplier';
      },
    });
  }

  cancelNewSupplier() {
    this.isAddingNewSupplier = false;
    this.grnForm.get('supplierInfo.supplier')?.setValue('');
  }

  filterExistingItems(query: string): void {
    this.existingItemQuery = query;
    const value = query.toLowerCase().trim();
    this.filteredInventoryItems = this.inventoryItems
      .filter((item) => !value || item.name.toLowerCase().includes(value) || item.sku.toLowerCase().includes(value))
      .slice(0, 8);
    this.showExistingItemDropdown = true;
  }

  selectExistingItem(item: InventoryItem): void {
    this.selectedExistingItem = item;
    this.existingItemQuery = `${item.sku} — ${item.name}`;
    this.showExistingItemDropdown = false;
    this.grnForm.get('itemDetails')?.patchValue({
      name: item.name,
      sku: item.sku,
      brand: item.brand,
      type: item.type,
      itemClass: item.itemClass || 'Unclassified',
      subcategory: item.subcategory || 'Unclassified',
      manufacturerPartNumber: item.manufacturerPartNumber || '',
      compatibleModels: (item.compatibleModels || []).join(', '),
      systemType: item.systemType || 'Not Applicable',
      refrigerants: (item.refrigerants || []).join(', '),
      capacityBtu: item.capacityBtu || null,
      voltage: item.voltage || '',
      phase: item.phase || 'Not Applicable',
      isSerialized: item.isSerialized,
      specsUrl: item.specsUrl || '',
    });
    this.grnForm.get('inventorySettings')?.patchValue({
      location: item.location,
      binLocation: item.binLocation || '',
      unit: item.unit,
      reorderLevel: item.reorderLevel,
      maxStockLevel: item.maxStockLevel,
      unitCost: item.unitCost,
    });
    this.applyPreferredSupplier();
  }

  clearExistingItem(): void {
    this.selectedExistingItem = null;
    this.existingItemQuery = '';
    this.grnForm.get('itemDetails')?.reset({
      name: '',
      sku: '',
      brand: '',
      type: 'Single',
      itemClass: 'Unclassified',
      subcategory: 'Unclassified',
      manufacturerPartNumber: '',
      compatibleModels: '',
      systemType: 'Not Applicable',
      refrigerants: '',
      capacityBtu: null,
      voltage: '',
      phase: 'Not Applicable',
      isSerialized: false,
      specsUrl: '',
    });
    this.grnForm.get('inventorySettings')?.patchValue({
      location: 'Warehouse',
      binLocation: '',
      unit: 'units',
      reorderLevel: 10,
      maxStockLevel: 100,
      unitCost: 0,
    });
  }

  nextStep() {
    if (this.canGoNext()) {
      if (this.currentStep < 3) {
        this.currentStep++;
      } else {
        this.onSubmit();
      }
    } else {
      this.markCurrentStepAsTouched();
    }
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  setStep(step: number) {
    if (step < this.currentStep) {
      this.currentStep = step;
    } else if (step > this.currentStep && this.canGoNext()) {
      this.currentStep = step;
    }
  }

  canGoNext(): boolean {
    if (this.currentStep === 1) {
      const supplierValid = this.grnForm.get('supplierInfo')!.valid && !!this.selectedSupplierId && !this.isAddingNewSupplier;
      if (this.receiptMode === 'PO') return supplierValid && !!this.selectedPurchaseLine;
      if (this.selectedAuthorization) return supplierValid;
      return supplierValid
        && !!String(this.grnForm.get('supplierInfo.explanation')?.value || '').trim()
        && !!this.grnForm.get('supplierInfo.nonPoReason')?.value;
    }
    if (this.currentStep === 2) {
      const details = this.grnForm.get('itemDetails')!;
      return details.valid && isValidSubcategory(details.get('itemClass')?.value, details.get('subcategory')?.value);
    }
    return this.grnForm.valid;
  }

  private markCurrentStepAsTouched() {
    const stepName = this.getStepGroupName(this.currentStep);
    this.grnForm.get(stepName)?.markAllAsTouched();
  }

  private getStepGroupName(step: number): string {
    switch (step) {
      case 1:
        return 'supplierInfo';
      case 2:
        return 'itemDetails';
      case 3:
        return 'inventorySettings';
      default:
        return '';
    }
  }
  viewProcurementDetails(p: RecentProcurement) {
    this.selectedProcurement = p;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedProcurement = null;
  }

  onSubmit() {
    if (this.grnForm.invalid) return;

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const itemPayload = this.selectedExistingItem ? undefined : {
      ...this.grnForm.get('itemDetails')?.value,
      ...this.grnForm.get('inventorySettings')?.value,
      compatibleModels: this.toList(this.grnForm.get('itemDetails.compatibleModels')?.value),
      refrigerants: this.toList(this.grnForm.get('itemDetails.refrigerants')?.value),
    };
    const sourceDocumentNumber = this.grnForm.get('supplierInfo.sourceDocumentNumber')?.value;
    const commonData = {
      inventoryId: this.selectedExistingItem?._id,
      item: itemPayload,
      quantity: this.grnForm.get('inventorySettings.available')?.value,
      serialNumbers: this.grnForm.get('inventorySettings.serialNumbers')?.value,
      supplierId: this.selectedSupplierId,
      invoiceNumber: this.grnForm.get('supplierInfo.invoiceNumber')?.value,
      sourceDocumentNumber,
      supportingDocumentUrl: this.grnForm.get('supplierInfo.supportingDocumentUrl')?.value,
      receivedDate: this.grnForm.get('supplierInfo.receivedDate')?.value,
      condition: this.grnForm.get('supplierInfo.condition')?.value,
      location: this.grnForm.get('inventorySettings.location')?.value,
      binLocation: this.grnForm.get('inventorySettings.binLocation')?.value,
      unitCost: this.grnForm.get('inventorySettings.unitCost')?.value,
    };

    if (this.receiptMode === 'NON_PO' && !this.selectedAuthorization) {
      this.inventoryService.createReceiptAuthorization({
        inventoryId: commonData.inventoryId,
        item: commonData.item,
        supplierId: commonData.supplierId,
        authorizedQuantity: commonData.quantity,
        unitCost: commonData.unitCost,
        nonPoReason: this.grnForm.get('supplierInfo.nonPoReason')?.value,
        explanation: this.grnForm.get('supplierInfo.explanation')?.value,
        affectedWorkType: this.grnForm.get('supplierInfo.affectedWorkType')?.value,
        affectedWorkReference: this.grnForm.get('supplierInfo.affectedWorkReference')?.value,
        sourceDocumentNumber,
        supportingDocumentUrl: commonData.supportingDocumentUrl,
      }).subscribe({
        next: authorization => {
          this.isSubmitting = false;
          this.successMessage = `${authorization.authorizationNumber} submitted to Manager. Stock has not changed.`;
          this.loadWorkflowRecords();
          this.resetForm();
        },
        error: err => {
          this.isSubmitting = false;
          this.errorMessage = err.error?.message || 'Failed to request Non-PO authorization.';
        },
      });
      return;
    }

    this.inventoryService.receiveInventory({
      ...commonData,
      receiptEventId: this.pendingReceiptEventId || (this.pendingReceiptEventId = crypto.randomUUID()),
      receiptMode: this.receiptMode,
      orderRequestId: this.selectedPurchaseOrder?._id,
      orderLineId: this.selectedPurchaseLine?.lineId,
      receiptAuthorizationId: this.selectedAuthorization?._id,
    }).subscribe({
      next: ({ item }) => {
        this.isSubmitting = false;
        this.successMessage = `Receipt posted for "${item.name}". Stock and GRN were updated together.`;
        this.loadProcurements(); // Refresh list from server
        this.loadWorkflowRecords();
        this.resetForm();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage =
          err.error?.message || 'Failed to add product. Please check SKU uniqueness.';
      },
    });
  }

  private resetForm() {
    this.currentStep = 1;
    this.grnForm.reset({
      supplierInfo: {
        receivedDate: new Date().toISOString().substring(0, 10),
        condition: 'Good',
        nonPoReason: 'EMERGENCY_REPAIR',
        affectedWorkType: 'NONE',
      },
      itemDetails: { type: 'Single', itemClass: 'Unclassified', subcategory: 'Unclassified', systemType: 'Not Applicable', phase: 'Not Applicable', isSerialized: false },
      inventorySettings: {
        available: 1,
        location: 'Warehouse',
        binLocation: '',
        unit: 'units',
        reorderLevel: 10,
        maxStockLevel: 100,
        unitCost: 0,
      },
    });
    // Clear serial numbers array
    const serials = this.grnForm.get('inventorySettings.serialNumbers') as FormArray;
    while (serials.length !== 0) {
      serials.removeAt(0);
    }
    this.selectedSupplierId = '';
    this.selectedExistingItem = null;
    this.selectedPurchaseOrder = null;
    this.selectedPurchaseLine = null;
    this.selectedAuthorization = null;
    this.existingItemQuery = '';
    this.showTechnicalFields = false;
    this.pendingReceiptEventId = '';
  }

  private toList(value: string): string[] {
    return [...new Set((value || '').split(',').map((entry) => entry.trim()).filter(Boolean))];
  }

  private applyPreferredSupplier(): void {
    if (!this.selectedExistingItem) return;
    const supplierId = supplierIdOf(this.selectedExistingItem);
    const supplier = this.suppliers.find((option) => option._id === supplierId);
    if (supplier) this.selectSupplier(supplier);
  }
}
