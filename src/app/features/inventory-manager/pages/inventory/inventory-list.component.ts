import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryManagerDashboardService, InventoryItem } from '../../services/inventory-manager-dashboard.service';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.css']
})
export class InventoryListComponent implements OnInit {
  searchQuery: string = '';
  selectedType: string = 'All Types';
  selectedBrand: string = 'All Brands';
  selectedCategory: string = 'All Categories';
  selectedLocation: string = 'All Locations';
  allInventoryItems: InventoryItem[] = [];
  inventoryItems: InventoryItem[] = [];
  loading = true;
  error: string | null = null;

  constructor(private inventoryService: InventoryManagerDashboardService) {}

  ngOnInit(): void {
    this.inventoryService.getInventory().subscribe({
      next: (items) => {
        this.allInventoryItems = items;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load inventory';
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.inventoryItems = this.allInventoryItems.filter(item => {
      const matchesSearch = !this.searchQuery || 
        item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesType = this.selectedType === 'All Types' || item.type === this.selectedType;
      const matchesBrand = this.selectedBrand === 'All Brands' || item.brand === this.selectedBrand;
      const matchesCategory = this.selectedCategory === 'All Categories' || item.category === this.selectedCategory;
      const matchesLocation = this.selectedLocation === 'All Locations' || item.location === this.selectedLocation;

      return matchesSearch && matchesType && matchesBrand && matchesCategory && matchesLocation;
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedType = 'All Types';
    this.selectedBrand = 'All Brands';
    this.selectedCategory = 'All Categories';
    this.selectedLocation = 'All Locations';
    this.applyFilters();
  }
}
