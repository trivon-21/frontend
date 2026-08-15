import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import {
  InventoryItem,
  InventoryManagerDashboardService,
} from '../../services/inventory-manager-dashboard.service';
import { deriveStockStatus, InventoryListComponent } from './inventory-list.component';

function inventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    _id: 'item-1',
    name: 'Split AC Scroll Compressor',
    sku: 'AC-COMP-001',
    available: 5,
    reserved: 0,
    reorderLevel: 5,
    maxStockLevel: 20,
    status: 'warning',
    type: 'Single',
    category: 'Spare Parts',
    itemClass: 'Spare Parts',
    subcategory: 'Compressor',
    brand: 'Copeland',
    manufacturerPartNumber: 'ZP24K5E',
    compatibleModels: ['DAIKIN-RXZ24'],
    systemType: 'Split',
    refrigerants: ['R410A'],
    capacityBtu: 24000,
    voltage: '230 V',
    phase: 'Single Phase',
    location: 'Main Warehouse',
    binLocation: 'SP-A01',
    unit: 'units',
    unitCost: 185000,
    isSerialized: true,
    serialNumbers: ['ASSET-1001'],
    updatedAt: '2026-08-14T08:00:00.000Z',
    ...overrides,
  };
}

function createComponent(items: InventoryItem[]): InventoryListComponent {
  const service = { getInventory: () => of(items) } as InventoryManagerDashboardService;
  const route = { queryParams: of({}) } as ActivatedRoute;
  const component = new InventoryListComponent(service, route);
  component.ngOnInit();
  return component;
}

describe('InventoryListComponent filtering', () => {
  it('derives stock status at threshold boundaries', () => {
    expect(deriveStockStatus(inventoryItem({ available: 0, reorderLevel: 5 }))).toBe('out-of-stock');
    expect(deriveStockStatus(inventoryItem({ available: 1, reorderLevel: 5 }))).toBe('low-stock');
    expect(deriveStockStatus(inventoryItem({ available: 5, reorderLevel: 5 }))).toBe('low-stock');
    expect(deriveStockStatus(inventoryItem({ available: 6, reorderLevel: 5 }))).toBe('in-stock');
  });

  it('searches SKU, model number, and serialized asset tag', () => {
    const component = createComponent([inventoryItem()]);

    for (const query of ['AC-COMP-001', 'DAIKIN-RXZ24', 'ASSET-1001']) {
      component.searchQuery = query;
      component.applyFilters();
      expect(component.filteredItems.length).withContext(query).toBe(1);
    }
  });

  it('combines class, brand, stock status, and location filters', () => {
    const matching = inventoryItem({ available: 2, reserved: 1 });
    const other = inventoryItem({
      _id: 'item-2',
      sku: 'TOOL-VAC-001',
      name: 'Vacuum Pump',
      itemClass: 'Tools and Test Equipment',
      subcategory: 'Vacuum Pump',
      brand: 'Fieldpiece',
      location: 'Tool Store',
      available: 7,
      reorderLevel: 2,
    });
    const component = createComponent([matching, other]);
    component.selectedItemClass = 'Spare Parts';
    component.selectedBrand = 'Copeland';
    component.selectedStockStatus = 'low-stock';
    component.selectedLocation = 'Main Warehouse';

    component.applyFilters();

    expect(component.filteredItems).toEqual([matching]);
  });

  it('shows reserved items independently of their available-stock status', () => {
    const reserved = inventoryItem({ available: 12, reorderLevel: 5, reserved: 2 });
    const free = inventoryItem({ _id: 'item-2', sku: 'FREE-001', reserved: 0 });
    const component = createComponent([reserved, free]);
    component.selectedStockStatus = 'reserved';

    component.applyFilters();

    expect(component.filteredItems).toEqual([reserved]);
  });

  it('derives unique options and keeps legacy records as Unclassified', () => {
    const legacy = inventoryItem({
      _id: 'legacy',
      sku: 'LEGACY-001',
      itemClass: undefined,
      subcategory: undefined,
      brand: 'Copeland',
    });
    const component = createComponent([inventoryItem(), legacy]);

    expect(component.brandOptions).toEqual(['Copeland']);
    expect(component.itemClassOptions).toEqual(['Spare Parts', 'Unclassified']);
    component.selectedItemClass = 'Unclassified';
    component.applyFilters();
    expect(component.filteredItems).toEqual([legacy]);
  });

  it('clears every filter and resets pagination', () => {
    const items = Array.from({ length: 12 }, (_, index) => inventoryItem({
      _id: `item-${index}`,
      sku: `SKU-${index}`,
    }));
    const component = createComponent(items);
    component.currentPage = 2;
    component.searchQuery = 'missing';
    component.selectedBrand = 'Fieldpiece';
    component.capacityMin = 30000;

    component.clearFilters();

    expect(component.currentPage).toBe(1);
    expect(component.totalItems).toBe(12);
    expect(component.searchQuery).toBe('');
    expect(component.hasAdvancedFilters).toBeFalse();
  });
});
