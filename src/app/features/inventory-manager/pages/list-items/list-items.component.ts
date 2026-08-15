import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { INVENTORY_ITEM_FORMS, InventoryItem, InventoryItemClass, isValidSubcategory } from '../../services/inventory-domain';
import { InventoryManagerDashboardService } from '../../services/inventory-manager-dashboard.service';

interface ProductQualityRecord {
  item: InventoryItem;
  masterIssues: string[];
  stockIssues: string[];
}

@Component({
  selector: 'app-list-items',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './list-items.component.html',
  styleUrls: ['./list-items.component.css'],
})
export class ListItemsComponent implements OnInit {
  searchQuery = '';
  records: ProductQualityRecord[] = [];
  filteredRecords: ProductQualityRecord[] = [];
  loading = true;
  errorMessage = '';

  constructor(private readonly inventoryService: InventoryManagerDashboardService) {}

  ngOnInit(): void {
    this.inventoryService.getInventory().subscribe({
      next: (items) => {
        this.records = items.map((item) => this.inspect(item)).filter((record) => record.masterIssues.length || record.stockIssues.length);
        this.applySearch();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load product quality checks.';
        this.loading = false;
      },
    });
  }

  applySearch(): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredRecords = this.records.filter((record) => !query || [
      record.item.name,
      record.item.sku,
      record.item.itemClass,
      record.item.subcategory,
      ...record.masterIssues,
      ...record.stockIssues,
    ].some((value) => value?.toLowerCase().includes(query)));
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applySearch();
  }

  itemId(item: InventoryItem): string {
    return item._id || item.id || '';
  }

  private inspect(item: InventoryItem): ProductQualityRecord {
    const masterIssues: string[] = [];
    const stockIssues: string[] = [];
    const itemClass = item.itemClass || 'Unclassified';
    const required: Array<[keyof InventoryItem, string]> = [
      ['name', 'Missing product name'], ['sku', 'Missing SKU'], ['brand', 'Missing brand'],
      ['type', 'Missing item form'], ['unit', 'Missing unit'], ['location', 'Missing location'],
    ];
    required.forEach(([field, message]) => {
      if (!String(item[field] ?? '').trim()) masterIssues.push(message);
    });
    if (!INVENTORY_ITEM_FORMS.includes(item.type)) masterIssues.push('Invalid item form');
    if (itemClass === 'Unclassified' || item.subcategory === 'Unclassified') {
      masterIssues.push('Product classification required');
    } else if (!isValidSubcategory(itemClass as InventoryItemClass, item.subcategory || '')) {
      masterIssues.push('Subcategory does not match product class');
    }
    if (Number(item.reorderLevel) < 0 || Number(item.maxStockLevel) < Number(item.reorderLevel)) {
      masterIssues.push('Invalid reorder or maximum stock level');
    }
    if (item.isSerialized && (item.serialNumbers?.length || 0) !== Number(item.available || 0) + Number(item.reserved || 0)) {
      stockIssues.push('Asset-tag count does not match tracked stock');
    }
    return { item, masterIssues, stockIssues };
  }
}
