import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  InventoryManagerDashboardService,
  InventoryItem,
} from '../../services/inventory-manager-dashboard.service';

import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.css'],
})
export class InventoryListComponent implements OnInit {
  Math = Math;
  searchQuery: string = '';
  selectedType: string = 'All Types';
  selectedBrand: string = 'All Brands';
  selectedCategory: string = 'All Categories';
  selectedLocation: string = 'All Locations';
  allInventoryItems: InventoryItem[] = [];
  filteredItems: InventoryItem[] = []; // Store filtered items separately
  inventoryItems: InventoryItem[] = []; // Current page items
  loading = true;
  error: string | null = null;

  // Modal State
  showDetailModal = false;
  selectedItem: InventoryItem | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  totalItems: number = 0;
  selectedRowId: string | null = null; // Track currently selected row for button visibility

  constructor(
    private inventoryService: InventoryManagerDashboardService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.inventoryService.getInventory().subscribe({
      next: (items) => {
        this.allInventoryItems = items;
        
        // Check for search query param
        this.route.queryParams.subscribe(params => {
          if (params['search']) {
            this.searchQuery = params['search'];
          }
          this.applyFilters();
        });
        
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load inventory';
        this.loading = false;
      },
    });
  }

  applyFilters() {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredItems = this.allInventoryItems.filter((item) => {
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query);

      const matchesType = this.selectedType === 'All Types' || item.type === this.selectedType;
      const matchesBrand = this.selectedBrand === 'All Brands' || item.brand === this.selectedBrand;
      const matchesCategory =
        this.selectedCategory === 'All Categories' || item.category === this.selectedCategory;
      const matchesLocation =
        this.selectedLocation === 'All Locations' || item.location === this.selectedLocation;

      return matchesSearch && matchesType && matchesBrand && matchesCategory && matchesLocation;
    });

    this.totalItems = this.filteredItems.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage) || 1;
    this.currentPage = 1; // Reset to first page on filter change
    this.updatePaginatedItems();
    
    // Default select first item
    if (this.inventoryItems.length > 0) {
      this.selectedRowId = this.inventoryItems[0].id || this.inventoryItems[0].sku || null;
    } else {
      this.selectedRowId = null;
    }
  }

  updatePaginatedItems() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.inventoryItems = this.filteredItems.slice(startIndex, endIndex);
  }

  openDetailModal(item: InventoryItem) {
    this.selectedItem = item;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedItem = null;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedItems();
      
      // Auto-select first item on new page
      if (this.inventoryItems.length > 0) {
        this.selectedRowId = this.inventoryItems[0].id || this.inventoryItems[0].sku || null;
      }
    }
  }

  selectRow(item: InventoryItem) {
    this.selectedRowId = item.id || item.sku || null;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedItems();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedItems();
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
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
