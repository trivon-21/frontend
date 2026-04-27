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
  selectedLocation: string = 'All Locations';
  inventoryItems: InventoryItem[] = [];
  loading = true;
  error: string | null = null;

  constructor(private inventoryService: InventoryManagerDashboardService) {}

  ngOnInit(): void {
    this.inventoryService.getInventory().subscribe({
      next: (items) => {
        // Map backend name to itemName if necessary, or just use as is
        // Our backend returns { name, sku, type, ... }
        // Let's ensure the frontend template uses 'name' or 'itemName'
        this.inventoryItems = items.map(item => ({
          ...item,
          itemName: (item as any).name || item.itemName
        }));
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load inventory';
        this.loading = false;
      }
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedType = 'All Types';
    this.selectedBrand = 'All Brands';
    this.selectedLocation = 'All Locations';
  }
}
