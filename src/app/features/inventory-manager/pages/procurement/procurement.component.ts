import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
} from '@angular/forms';
import { InventoryManagerDashboardService } from '../../services/inventory-manager-dashboard.service';
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

@Component({
  selector: 'app-procurement-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './procurement.component.html',
  styleUrls: ['./procurement.component.css'],
})
export class ProcurementDashboardComponent implements OnInit {
  currentStep = 1;
  grnForm!: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  suppliers: any[] = [];
  filteredSuppliers: any[] = [];
  showSupplierDropdown = false;
  isAddingNewSupplier = false;
  searchQuery: string = '';

  procurements: RecentProcurement[] = [];

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryManagerDashboardService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSuppliers();
    this.loadProcurements();

    // Listen to supplier input changes for autocomplete
    this.grnForm
      .get('supplierInfo.supplier')
      ?.valueChanges.pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((value) => {
        if (typeof value === 'string') {
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
        poNumber: [this.generatePoNumber(), Validators.required],
        receivedDate: [new Date().toISOString().substring(0, 10), Validators.required],
        condition: ['Good', Validators.required],
      }),
      itemDetails: this.fb.group({
        name: ['', Validators.required],
        sku: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9-]+$')]],
        brand: ['', Validators.required],
        type: ['Single', Validators.required],
        category: ['General', Validators.required],
        isSerialized: [false],
        specsUrl: [''],
      }),
      inventorySettings: this.fb.group({
        available: [0, [Validators.required, Validators.min(0)]],
        location: ['Warehouse', Validators.required],
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
  }

  private generatePoNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `PO-${year}${month}${day}-${hours}${minutes}`;
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
      return this.grnForm.get('supplierInfo')!.valid && !this.isAddingNewSupplier;
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

  onSubmit() {
    if (this.grnForm.invalid) return;

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formData = {
      ...this.grnForm.get('itemDetails')?.value,
      ...this.grnForm.get('inventorySettings')?.value,
      supplierName: this.grnForm.get('supplierInfo.supplier')?.value,
      invoiceNumber: this.grnForm.get('supplierInfo.invoiceNumber')?.value,
      poNumber: this.grnForm.get('supplierInfo.poNumber')?.value,
      receivedDate: this.grnForm.get('supplierInfo.receivedDate')?.value,
      condition: this.grnForm.get('supplierInfo.condition')?.value,
    };

    this.inventoryService.addItem(formData).subscribe({
      next: (item) => {
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
        poNumber: this.generatePoNumber(),
        receivedDate: new Date().toISOString().substring(0, 10),
        condition: 'Good',
      },
      itemDetails: { type: 'Single', category: 'General', isSerialized: false },
      inventorySettings: {
        available: 0,
        location: 'Warehouse',
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
  }
}
