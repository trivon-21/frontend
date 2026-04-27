import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface InventoryItem {
  sku: string;
  name: string;
  type: 'Single' | 'Bundle';
  available: number;
  reserved: number;
  location: string;
}

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.css']
})
export class InventoryListComponent {
  searchQuery: string = '';
  selectedType: string = 'All Types';
  selectedBrand: string = 'All Brands';
  selectedLocation: string = 'All Locations';

  inventoryItems: InventoryItem[] = [
    { sku: 'AC-COMP-001', name: '2 Ton Split AC Compressor', type: 'Single', available: 1, reserved: 13, location: 'Logistic Area 1' },
    { sku: 'REF-R410A-1KG', name: 'R410A Refrigerant (1kg)', type: 'Single', available: 4, reserved: 6, location: 'Logistic Area 1' },
    { sku: 'PIPE-CU-025', name: 'Copper Tube 1/4" x 50m', type: 'Single', available: 6, reserved: 0, location: 'Logistic Area 2' },
    { sku: 'KIT-INST-PRO', name: 'Professional Installation Kit', type: 'Bundle', available: 2, reserved: 0, location: 'Logistic Area 2' },
    { sku: 'TOOL-DRILL-001', name: 'Cordless Drill Kit', type: 'Single', available: 2, reserved: 1, location: 'Logistic Area 3' },
    { sku: 'FILTER-DRIER-01', name: 'Filter Drier - Standard', type: 'Single', available: 7, reserved: 4, location: 'Logistic Area 1' },
    { sku: 'THERMOSTAT-DIG', name: 'Digital Thermostat', type: 'Single', available: 8, reserved: 6, location: 'Logistic Area 2' },
    { sku: 'KIT-MAINT-STD', name: 'Standard Maintenance Bundle', type: 'Bundle', available: 5, reserved: 1, location: 'Logistic Area 3' }
  ];

  clearFilters() {
    this.searchQuery = '';
    this.selectedType = 'All Types';
    this.selectedBrand = 'All Brands';
    this.selectedLocation = 'All Locations';
  }
}
