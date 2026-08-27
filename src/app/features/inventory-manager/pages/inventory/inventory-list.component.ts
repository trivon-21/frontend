import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  InventoryItem,
  InventoryManagerDashboardService,
} from '../../services/inventory-manager-dashboard.service';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import {
  deriveStockStatus,
  StockStatus,
  supplierNameOf,
} from '../../services/inventory-domain';
export { deriveStockStatus } from '../../services/inventory-domain';

export type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'reserved';
export type DerivedStockStatus = StockStatus;
export type InventorySortField =
  | 'name'
  | 'sku'
  | 'available'
  | 'stockStatus'
  | 'unitCost'
  | 'updatedAt';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PortalIconsModule],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.css'],
})
export class InventoryListComponent implements OnInit {
  Math = Math;
  searchQuery = '';
  selectedItemClass = 'All Product Classes';
  selectedSubcategory = 'All Subcategories';
  selectedStockStatus: StockFilter = 'all';
  selectedLocation = 'All Locations';

  showAdvancedFilters = false;
  selectedBrand = 'All Brands';
  selectedSystemType = 'All Systems';
  selectedRefrigerant = 'All Refrigerants';
  selectedVoltage = 'All Voltages';
  selectedPhase = 'All Phases';
  selectedSerialization = 'All Tracking';
  selectedType = 'All Item Forms';
  selectedSupplier = 'All Suppliers';
  selectedUnit = 'All Units';
  capacityMin: number | null = null;
  capacityMax: number | null = null;
  updatedFrom = '';
  updatedTo = '';

  sortField: InventorySortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  allInventoryItems: InventoryItem[] = [];
  filteredItems: InventoryItem[] = [];
  inventoryItems: InventoryItem[] = [];
  loading = true;
  error: string | null = null;

  showDetailModal = false;
  selectedItem: InventoryItem | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  totalItems = 0;
  selectedRowId: string | null = null;

  constructor(
    private inventoryService: InventoryManagerDashboardService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.loading = true;
    this.error = null;
    this.inventoryService.getInventory().subscribe({
      next: (items) => {
        this.allInventoryItems = items;
        this.route.queryParams.subscribe((params) => {
          if (params['search']) this.searchQuery = params['search'];
          this.applyFilters();
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load inventory';
        this.loading = false;
      },
    });
  }

  get itemClassOptions(): string[] {
    return this.unique(this.allInventoryItems.map((item) => this.itemClassOf(item)));
  }

  get subcategoryOptions(): string[] {
    const items = this.selectedItemClass === 'All Product Classes'
      ? this.allInventoryItems
      : this.allInventoryItems.filter((item) => this.itemClassOf(item) === this.selectedItemClass);
    return this.unique(items.map((item) => item.subcategory || 'Unclassified'));
  }

  get brandOptions(): string[] {
    return this.unique(this.allInventoryItems.map((item) => item.brand));
  }

  get locationOptions(): string[] {
    return this.unique(this.allInventoryItems.flatMap((item) => [
      item.location,
      item.binLocation ? this.getDisplayLocation(item) : undefined,
    ]));
  }

  get systemTypeOptions(): string[] {
    return this.unique(this.allInventoryItems.map((item) => item.systemType));
  }

  get refrigerantOptions(): string[] {
    return this.unique(this.allInventoryItems.flatMap((item) => item.refrigerants || []));
  }

  get voltageOptions(): string[] {
    return this.unique(this.allInventoryItems.map((item) => item.voltage));
  }

  get phaseOptions(): string[] {
    return this.unique(this.allInventoryItems.map((item) => item.phase));
  }

  get supplierOptions(): string[] {
    return this.unique(this.allInventoryItems.map((item) => this.supplierOf(item)));
  }

  get unitOptions(): string[] {
    return this.unique(this.allInventoryItems.map((item) => item.unit));
  }

  get hasAdvancedFilters(): boolean {
    return this.selectedBrand !== 'All Brands'
      || this.selectedSystemType !== 'All Systems'
      || this.selectedRefrigerant !== 'All Refrigerants'
      || this.selectedVoltage !== 'All Voltages'
      || this.selectedPhase !== 'All Phases'
      || this.selectedSerialization !== 'All Tracking'
      || this.selectedType !== 'All Item Forms'
      || this.selectedSupplier !== 'All Suppliers'
      || this.selectedUnit !== 'All Units'
      || this.capacityMin !== null
      || this.capacityMax !== null
      || !!this.updatedFrom
      || !!this.updatedTo;
  }

  onItemClassChange(): void {
    this.selectedSubcategory = 'All Subcategories';
    this.applyFilters();
  }

  applyFilters(): void {
    const query = this.searchQuery.toLowerCase().trim();
    const fromDate = this.updatedFrom ? new Date(`${this.updatedFrom}T00:00:00`) : null;
    const toDate = this.updatedTo ? new Date(`${this.updatedTo}T23:59:59.999`) : null;

    this.filteredItems = this.allInventoryItems.filter((item) => {
      const searchable = [
        item.name,
        item.sku,
        item.brand,
        item.category,
        item.itemClass,
        item.subcategory,
        item.manufacturerPartNumber,
        ...(item.compatibleModels || []),
        ...(item.serialNumbers || []),
      ];
      const updatedAt = item.updatedAt ? new Date(item.updatedAt) : null;
      const stockStatus = deriveStockStatus(item);

      return (!query || searchable.some((value) => value?.toLowerCase().includes(query)))
        && (this.selectedItemClass === 'All Product Classes' || this.itemClassOf(item) === this.selectedItemClass)
        && (this.selectedSubcategory === 'All Subcategories' || (item.subcategory || 'Unclassified') === this.selectedSubcategory)
        && (this.selectedStockStatus === 'all'
          || (this.selectedStockStatus === 'reserved' ? item.reserved > 0 : stockStatus === this.selectedStockStatus))
        && (this.selectedLocation === 'All Locations'
          || item.location === this.selectedLocation
          || this.getDisplayLocation(item) === this.selectedLocation)
        && (this.selectedBrand === 'All Brands' || item.brand === this.selectedBrand)
        && (this.selectedSystemType === 'All Systems' || item.systemType === this.selectedSystemType)
        && (this.selectedRefrigerant === 'All Refrigerants' || item.refrigerants?.includes(this.selectedRefrigerant))
        && (this.selectedVoltage === 'All Voltages' || item.voltage === this.selectedVoltage)
        && (this.selectedPhase === 'All Phases' || item.phase === this.selectedPhase)
        && (this.selectedSerialization === 'All Tracking'
          || (this.selectedSerialization === 'Serialized' ? item.isSerialized : !item.isSerialized))
        && (this.selectedType === 'All Item Forms' || item.type === this.selectedType)
        && (this.selectedSupplier === 'All Suppliers' || this.supplierOf(item) === this.selectedSupplier)
        && (this.selectedUnit === 'All Units' || item.unit === this.selectedUnit)
        && (this.capacityMin === null || Number(item.capacityBtu) >= this.capacityMin)
        && (this.capacityMax === null || Number(item.capacityBtu) <= this.capacityMax)
        && (!fromDate || (!!updatedAt && updatedAt >= fromDate))
        && (!toDate || (!!updatedAt && updatedAt <= toDate));
    });

    this.sortFilteredItems();
    this.totalItems = this.filteredItems.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage) || 1;
    this.currentPage = 1;
    this.updatePaginatedItems();
    this.selectedRowId = this.inventoryItems.length ? this.getItemId(this.inventoryItems[0]) : null;
  }

  sortFilteredItems(): void {
    const direction = this.sortDirection === 'asc' ? 1 : -1;
    const statusRank: Record<DerivedStockStatus, number> = {
      'out-of-stock': 0,
      'low-stock': 1,
      'in-stock': 2,
    };

    this.filteredItems.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';
      switch (this.sortField) {
        case 'available':
        case 'unitCost':
          aValue = Number(a[this.sortField]) || 0;
          bValue = Number(b[this.sortField]) || 0;
          break;
        case 'stockStatus':
          aValue = statusRank[deriveStockStatus(a)];
          bValue = statusRank[deriveStockStatus(b)];
          break;
        case 'updatedAt':
          aValue = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          bValue = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          break;
        default:
          aValue = (a[this.sortField] || '').toString().toLowerCase();
          bValue = (b[this.sortField] || '').toString().toLowerCase();
      }
      return aValue < bValue ? -direction : aValue > bValue ? direction : 0;
    });
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  updatePaginatedItems(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.inventoryItems = this.filteredItems.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getStockStatus(item: InventoryItem): DerivedStockStatus {
    return deriveStockStatus(item);
  }

  getStockStatusLabel(item: InventoryItem): string {
    return {
      'out-of-stock': 'Out of stock',
      'low-stock': 'Low stock',
      'in-stock': 'In stock',
    }[deriveStockStatus(item)];
  }

  getDisplayLocation(item: InventoryItem): string {
    return item.binLocation ? `${item.location} · ${item.binLocation}` : item.location;
  }

  getSupplierName(item: InventoryItem): string {
    return this.supplierOf(item);
  }

  openDetailModal(item: InventoryItem): void {
    this.selectedItem = item;
    this.selectedRowId = this.getItemId(item);
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedItem = null;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedItems();
      if (this.inventoryItems.length) this.selectRow(this.inventoryItems[0]);
    }
  }

  selectRow(item: InventoryItem): void {
    this.selectedRowId = this.getItemId(item);
    this.selectedItem = item;
  }

  getItemId(item: InventoryItem): string | null {
    return item._id || item.id || item.sku || null;
  }

  trackByItem(_index: number, item: InventoryItem): string {
    return item._id || item.id || item.sku || String(_index);
  }

  isRowSelected(item: InventoryItem): boolean {
    return this.selectedRowId === this.getItemId(item);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedItems();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedItems();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let page = start; page <= end; page++) pages.push(page);
    return pages;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedItemClass = 'All Product Classes';
    this.selectedSubcategory = 'All Subcategories';
    this.selectedStockStatus = 'all';
    this.selectedLocation = 'All Locations';
    this.selectedBrand = 'All Brands';
    this.selectedSystemType = 'All Systems';
    this.selectedRefrigerant = 'All Refrigerants';
    this.selectedVoltage = 'All Voltages';
    this.selectedPhase = 'All Phases';
    this.selectedSerialization = 'All Tracking';
    this.selectedType = 'All Item Forms';
    this.selectedSupplier = 'All Suppliers';
    this.selectedUnit = 'All Units';
    this.capacityMin = null;
    this.capacityMax = null;
    this.updatedFrom = '';
    this.updatedTo = '';
    this.sortField = 'name';
    this.sortDirection = 'asc';
    this.showAdvancedFilters = false;
    this.applyFilters();
  }

  private itemClassOf(item: InventoryItem): string {
    return item.itemClass || 'Unclassified';
  }

  private supplierOf(item: InventoryItem): string {
    return supplierNameOf(item);
  }

  private unique(values: Array<string | undefined>): string[] {
    return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => !!value))]
      .sort((a, b) => a.localeCompare(b));
  }
}
