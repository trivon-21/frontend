import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryManagerDashboardService } from '../../services/inventory-manager-dashboard.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface RecentShipment {
  id: string;
  supplier: string;
  items: string;
  units: string;
  date: string;
  user: string;
}

@Component({
  selector: 'app-procurement-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './procurement.component.html',
  styleUrls: ['./procurement.component.css']
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

  shipments: RecentShipment[] = [
    { id: 'INV-LG-2025-0421', supplier: 'LG Electronics Lanka', items: '8 items', units: '45 units', date: '2025-02-17 02:30 PM', user: 'Saman Jayawardena' },
    { id: 'INV-SAM-2025-1204', supplier: 'Samsung Electronics', items: '5 items', units: '30 units', date: '2025-02-16 11:15 AM', user: 'Nimal Fernando' },
    { id: 'INV-DAI-2025-0789', supplier: 'Daikin Airconditioning India', items: '12 items', units: '68 units', date: '2025-02-15 09:45 AM', user: 'Kamal Wijesinghe' },
    { id: 'INV-ABN-2025-3312', supplier: 'Abans PLC', items: '6 items', units: '25 units', date: '2025-02-14 03:20 PM', user: 'Saman Jayawardena' }
  ];

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryManagerDashboardService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSuppliers();
    
    // Listen to supplier input changes for autocomplete
    this.grnForm.get('supplierInfo.supplier')?.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe(value => {
        if (typeof value === 'string') {
          this.filterSuppliers(value);
        }
      });
  }

  private initForm(): void {
    this.grnForm = this.fb.group({
      supplierInfo: this.fb.group({
        supplier: ['', Validators.required],
        invoiceNumber: ['', Validators.required]
      }),
      itemDetails: this.fb.group({
        name: ['', Validators.required],
        sku: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9-]+$')]],
        type: ['Single', Validators.required],
        category: ['General', Validators.required]
      }),
      inventorySettings: this.fb.group({
        available: [0, [Validators.required, Validators.min(0)]],
        location: ['Warehouse', Validators.required],
        unit: ['units', Validators.required],
        reorderLevel: [10, [Validators.required, Validators.min(0)]]
      })
    });
  }

  private loadSuppliers(): void {
    this.inventoryService.getSuppliers().subscribe({
      next: (data) => {
        this.suppliers = data;
        this.filteredSuppliers = data;
      },
      error: (err) => console.error('Error loading suppliers:', err)
    });
  }

  filterSuppliers(query: string) {
    if (!query) {
      this.filteredSuppliers = this.suppliers;
      return;
    }
    const lowQuery = query.toLowerCase();
    this.filteredSuppliers = this.suppliers.filter(s => 
      s.name.toLowerCase().includes(lowQuery)
    );
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
      }
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
      case 1: return 'supplierInfo';
      case 2: return 'itemDetails';
      case 3: return 'inventorySettings';
      default: return '';
    }
  }

  onSubmit() {
    if (this.grnForm.invalid) return;

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formData = {
      ...this.grnForm.get('itemDetails')?.value,
      ...this.grnForm.get('inventorySettings')?.value
    };

    this.inventoryService.addItem(formData).subscribe({
      next: (item) => {
        this.isSubmitting = false;
        this.successMessage = `Product "${item.name}" added successfully!`;
        this.addRecentShipment(item);
        this.resetForm();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to add product. Please check SKU uniqueness.';
      }
    });
  }

  private addRecentShipment(item: any) {
    const newShipment: RecentShipment = {
      id: `INV-NEW-${Math.floor(Math.random() * 10000)}`,
      supplier: this.grnForm.get('supplierInfo.supplier')?.value,
      items: '1 item',
      units: `${item.available} units`,
      date: new Date().toLocaleString(),
      user: 'Current Manager'
    };
    this.shipments.unshift(newShipment);
  }

  private resetForm() {
    this.currentStep = 1;
    this.grnForm.reset({
      itemDetails: { type: 'Single', category: 'General' },
      inventorySettings: { available: 0, location: 'Warehouse', unit: 'units', reorderLevel: 10 }
    });
  }
}
