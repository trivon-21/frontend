import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
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
} from '../../services/inventory-domain';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
}

import { LucideAngularModule } from 'lucide-angular';

import { RouterModule } from '@angular/router';

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

  readonly itemClasses: InventoryItemClass[] = INVENTORY_ITEM_CLASSES;
  readonly subcategories = INVENTORY_SUBCATEGORIES;
  readonly systemTypes: InventorySystemType[] = INVENTORY_SYSTEM_TYPES;

  procurements: RecentProcurement[] = [];

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryManagerDashboardService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSuppliers();
    this.loadProcurements();
    this.loadInventory();

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
    const targetLength = this.grnForm.get('itemDetails.isSerialized')?.value ? qty || 0 : 0;

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
        invoiceNumber: ['', Validators.required],
        receivedDate: [new Date().toISOString().substring(0, 10), Validators.required],
        condition: ['Good', Validators.required],
      }),
      itemDetails: this.fb.group({
        name: ['', Validators.required],
        sku: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9-]+$')]],
        brand: ['', Validators.required],
        type: ['Single', Validators.required],
        itemClass: ['Unclassified', Validators.required],
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
        available: [0, [Validators.required, Validators.min(0)]],
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

  get availableSubcategories(): string[] {
    const itemClass = this.grnForm?.get('itemDetails.itemClass')?.value as InventoryItemClass;
    return this.subcategories[itemClass] || ['Unclassified'];
  }


  private loadSuppliers(): void {
    this.inventoryService.getSuppliers().subscribe({
      next: (data) => {
        this.suppliers = data;
        this.filteredSuppliers = data;
      },
      error: (err) => console.error('Error loading suppliers:', err),
    });
  }

  private loadInventory(): void {
    this.inventoryService.getInventory().subscribe({
      next: (items) => {
        this.inventoryItems = items;
        this.filteredInventoryItems = items.slice(0, 8);
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
    if (!query) return this.procurements;
    return this.procurements.filter(
      (p) =>
        p.invoiceNumber?.toLowerCase().includes(query) ||
        p.supplierName?.toLowerCase().includes(query) ||
        p.itemName?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.receivedBy?.toLowerCase().includes(query),
    );
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
      return this.grnForm.get('supplierInfo')!.valid && !!this.selectedSupplierId && !this.isAddingNewSupplier;
    }
    if (this.currentStep === 2) return this.grnForm.get('itemDetails')!.valid;
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

    const formData = {
      inventoryId: this.selectedExistingItem?._id,
      item: this.selectedExistingItem ? undefined : {
        ...this.grnForm.get('itemDetails')?.value,
        ...this.grnForm.get('inventorySettings')?.value,
        compatibleModels: this.toList(this.grnForm.get('itemDetails.compatibleModels')?.value),
        refrigerants: this.toList(this.grnForm.get('itemDetails.refrigerants')?.value),
      },
      quantity: this.grnForm.get('inventorySettings.available')?.value,
      serialNumbers: this.grnForm.get('inventorySettings.serialNumbers')?.value,
      supplierId: this.selectedSupplierId,
      invoiceNumber: this.grnForm.get('supplierInfo.invoiceNumber')?.value,
      receivedDate: this.grnForm.get('supplierInfo.receivedDate')?.value,
      condition: this.grnForm.get('supplierInfo.condition')?.value,
      location: this.grnForm.get('inventorySettings.location')?.value,
      binLocation: this.grnForm.get('inventorySettings.binLocation')?.value,
      unitCost: this.grnForm.get('inventorySettings.unitCost')?.value,
    };

    this.inventoryService.receiveInventory(formData).subscribe({
      next: ({ item }) => {
        this.isSubmitting = false;
        this.successMessage = `Product "${item.name}" added successfully!`;
        this.loadProcurements(); // Refresh list from server
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
      },
      itemDetails: { type: 'Single', itemClass: 'Unclassified', subcategory: 'Unclassified', systemType: 'Not Applicable', phase: 'Not Applicable', isSerialized: false },
      inventorySettings: {
        available: 0,
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
    this.existingItemQuery = '';
    this.showTechnicalFields = false;
  }

  private toList(value: string): string[] {
    return [...new Set((value || '').split(',').map((entry) => entry.trim()).filter(Boolean))];
  }
}
