import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryManagerDashboardService, InventoryItem } from '../../services/inventory-manager-dashboard.service';

@Component({
  selector: 'app-list-items',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list-items.component.html',
  styleUrls: ['./list-items.component.css']
})
export class ListItemsComponent implements OnInit {
  searchQuery: string = '';
  selectedType: string = 'Tools';
  selectedBrand: string = 'All Brands';
  selectedLocation: string = 'Location';

  pendingItems: InventoryItem[] = [];
  listedItems: InventoryItem[] = [];
  loading = true;

  constructor(private inventoryService: InventoryManagerDashboardService) {}

  ngOnInit(): void {
    this.inventoryService.getInventory().subscribe({
      next: (items) => {
        // For demonstration, splitting items into pending and listed
        // In a real scenario, this would be based on a status field
        this.pendingItems = items.filter(item => item.status === 'warning' || item.status === 'critical');
        this.listedItems = items.filter(item => item.status === 'normal');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading items:', err);
        this.loading = false;
      }
    });
  }

  clearFilters() {
    this.searchQuery = '';
  }
}
