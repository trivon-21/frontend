import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryManagerDashboardService } from '../../services/inventory-manager-dashboard.service';

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

  productData: any = {
    name: '',
    sku: '',
    price: '',
    availability: 0,
    available: 0,
    reserved: 0,
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
    this.itemId = this.route.snapshot.paramMap.get('id');
    if (this.itemId) {
      this.loading = true;
      this.inventoryService.getItem(this.itemId).subscribe({
        next: (item) => {
          this.productData = { ...this.productData, ...item };
          // Ensure availability matches available for the form if needed
          this.productData.availability = item.available;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading item:', err);
          this.loading = false;
        }
      });
    }
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
}
