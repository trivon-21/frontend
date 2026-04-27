import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-wizard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-wizard.component.html',
  styleUrls: ['./product-wizard.component.css']
})
export class ProductWizardComponent {
  currentStep: number = 1;
  totalSteps: number = 3;

  productData = {
    name: '2 Ton Split AC Compressor',
    sku: 'AC-COMP-001',
    price: '',
    availability: '',
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
}
