import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  InventoryItemClass,
  InventoryManagerDashboardService,
  InventorySystemType,
} from '../../services/inventory-manager-dashboard.service';
import {
  INVENTORY_ITEM_CLASSES,
  INVENTORY_SUBCATEGORIES,
  INVENTORY_SYSTEM_TYPES,
} from '../../services/inventory-domain';

@Component({
  selector: 'app-product-wizard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-wizard.component.html',
  styleUrls: ['./product-wizard.component.css']
})
export class ProductWizardComponent implements OnInit {
  currentStep: number = 1;
  totalSteps: number = 3;
  itemId: string | null = null;
  loading = false;
  successMessage = '';
  errorMessage = '';
  compatibleModelsText = '';
  refrigerantsText = '';
  serialNumbersText = '';
  suppliers: Array<{ _id: string; name: string }> = [];

  readonly itemClasses: InventoryItemClass[] = INVENTORY_ITEM_CLASSES;
  readonly subcategories: Record<InventoryItemClass, string[]> = INVENTORY_SUBCATEGORIES;
  readonly systemTypes: InventorySystemType[] = INVENTORY_SYSTEM_TYPES;

  productData: any = {
    name: '',
    sku: '',
    itemClass: 'Unclassified',
    subcategory: 'Unclassified',
    category: 'Unclassified',
    brand: '',
    manufacturerPartNumber: '',
    compatibleModels: [],
    systemType: 'Not Applicable',
    refrigerants: [],
    capacityBtu: null,
    voltage: '',
    phase: 'Not Applicable',
    type: 'Single',
    availability: 0,
    available: 0,
    reserved: 0,
    reorderLevel: 10,
    maxStockLevel: 100,
    unitCost: 0,
    unit: 'units',
    location: 'Warehouse',
    binLocation: '',
    supplierId: '',
    isSerialized: false,
    serialNumbers: [],
    description: '',
    specifications: {
      coolingCapacity: '',
      energyEfficiency: '',
      powerConsumption: '',
      refrigerantType: '',
      noiseLevel: { indoor: '', outdoor: '' },
      airFlow: '',
      dimensions: { indoor: '', outdoor: '' },
      warranty: ''
    },
    warrantyCoverage: {
      comprehensive: '',
      compressor: '',
      covered: '',
      notCovered: ''
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryManagerDashboardService
  ) {}

  ngOnInit(): void {
    this.inventoryService.getSuppliers().subscribe({
      next: (suppliers) => (this.suppliers = suppliers),
      error: () => (this.suppliers = []),
    });

    this.itemId = this.route.snapshot.paramMap.get('id');
    if (this.itemId) {
      this.loading = true;
      this.inventoryService.getItem(this.itemId).subscribe({
        next: (item) => {
          this.productData = { ...this.productData, ...item };
          this.productData.availability = item.available;
          this.productData.itemClass = item.itemClass || 'Unclassified';
          this.productData.subcategory = item.subcategory || 'Unclassified';
          this.compatibleModelsText = (item.compatibleModels || []).join(', ');
          this.refrigerantsText = (item.refrigerants || []).join(', ');
          this.serialNumbersText = (item.serialNumbers || []).join(', ');
          if (typeof item.supplierId === 'object') this.productData.supplierId = item.supplierId._id;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading item:', err);
          this.loading = false;
        }
      });
    }
  }

  get availableSubcategories(): string[] {
    return this.subcategories[this.productData.itemClass as InventoryItemClass] || ['Unclassified'];
  }

  onItemClassChange(): void {
    this.productData.subcategory = this.availableSubcategories[0] || 'Unclassified';
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  saveProduct() {
    this.productData.available = Number(this.productData.availability) || 0;
    this.productData.category = this.productData.itemClass || 'Unclassified';
    this.productData.compatibleModels = this.toList(this.compatibleModelsText);
    this.productData.refrigerants = this.toList(this.refrigerantsText);
    this.productData.serialNumbers = this.productData.isSerialized
      ? this.toList(this.serialNumbersText)
      : [];
    if (!this.productData.supplierId) delete this.productData.supplierId;

    if (this.itemId) {
      // Update
      this.inventoryService.updateItem(this.itemId, this.productData).subscribe({
        next: () => {
          this.successMessage = 'Product updated successfully!';
          setTimeout(() => this.router.navigate(['/inventory-manager/inventory']), 1500);
        },
        error: () => {
          this.errorMessage = 'Failed to update product. Please try again.';
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    } else {
      // Create
      this.inventoryService.addItem(this.productData).subscribe({
        next: () => {
          this.successMessage = 'Product created successfully!';
          setTimeout(() => this.router.navigate(['/inventory-manager/inventory']), 1500);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to create product. Please check SKU uniqueness.';
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    }
  }

  private toList(value: string): string[] {
    return [...new Set(value.split(',').map((entry) => entry.trim()).filter(Boolean))];
  }
}
