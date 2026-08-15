import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  InventoryManagerDashboardService,
  InventoryItem,
} from '../../services/inventory-manager-dashboard.service';

import { LucideAngularModule } from 'lucide-angular';
import { deriveStockStatus } from '../../services/inventory-domain';

@Component({
  selector: 'app-list-items',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './list-items.component.html',
  styleUrls: ['./list-items.component.css'],
})
export class ListItemsComponent implements OnInit {
  searchQuery: string = '';
  allItems: InventoryItem[] = [];
  pendingItems: InventoryItem[] = [];
  listedItems: InventoryItem[] = [];
  loading = true;

  constructor(private inventoryService: InventoryManagerDashboardService) {}

  ngOnInit(): void {
    this.inventoryService.getInventory().subscribe({
      next: (items) => {
        this.allItems = items;
        this.applySearch();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  applySearch(): void {
    const query = (this.searchQuery || '').toLowerCase().trim();
    const filtered = query
      ? this.allItems.filter(
          (item) =>
            item.name?.toLowerCase().includes(query) ||
            item.sku?.toLowerCase().includes(query),
        )
      : this.allItems;

    this.pendingItems = filtered.filter(
      (item) => deriveStockStatus(item) !== 'in-stock',
    );
    this.listedItems = filtered.filter((item) => deriveStockStatus(item) === 'in-stock');
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.applySearch();
  }
}
