import { of, Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
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
    location: 'Central Warehouse',
    binLocation: 'Small Parts Racking',
    unit: 'units',
    unitCost: 185000,
    isSerialized: true,
    serialNumbers: ['ASSET-1001'],
    updatedAt: '2026-08-14T08:00:00.000Z',
    ...overrides,
  };
}

function createComponent(items: InventoryItem[], params: Record<string, string> = {}): InventoryListComponent {
  const service = {
    getInventory: () => of(items),
    getLocations: () => of([
      { warehouse: 'Central Warehouse', placementAreas: ['Small Parts Racking'] },
      { warehouse: 'Equipment Warehouse', placementAreas: ['Indoor Unit Storage'] },
      { warehouse: 'Service Warehouse', placementAreas: ['Tool Crib'] },
    ]),
  } as InventoryManagerDashboardService;
  const route = {
    queryParams: of(params),
    snapshot: { queryParams: params },
  } as unknown as ActivatedRoute;
  const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  const component = new InventoryListComponent(service, route, router);
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
      location: 'Service Warehouse',
      binLocation: 'Tool Crib',
      available: 7,
      reorderLevel: 2,
    });
    const component = createComponent([matching, other]);
    component.selectedItemClass = 'Spare Parts';
    component.selectedBrand = 'Copeland';
    component.selectedStockStatus = 'low-stock';
    component.selectedLocation = 'Central Warehouse';

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
    expect(component.locationOptions).toEqual(['Central Warehouse', 'Equipment Warehouse', 'Service Warehouse']);
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

  it('selects a saved product on its page and opens the save confirmation', () => {
    const items = Array.from({ length: 12 }, (_, index) => inventoryItem({
      _id: `item-${index}`,
      sku: `SKU-${index}`,
      name: `Product ${String(index).padStart(2, '0')}`,
    }));

    const component = createComponent(items, { selected: 'item-11', editSaved: '1' });

    expect(component.currentPage).toBe(2);
    expect(component.selectedRowId).toBe('item-11');
    expect(component.inventoryItems.some((item) => item._id === 'item-11')).toBeTrue();
    expect(component.showSaveConfirmation).toBeTrue();
    expect(component.savedProduct?._id).toBe('item-11');
  });

  it('triggers exactly one filter and navigation update after multiple retries when query params change', () => {
    const items = [inventoryItem({ _id: 'item-1', sku: 'AC-COMP-001' })];
    const service = {
      getInventory: jasmine.createSpy('getInventory').and.returnValue(of(items)),
      getLocations: () => of([{ warehouse: 'Central Warehouse', placementAreas: ['Small Parts Racking'] }]),
    } as unknown as InventoryManagerDashboardService;

    const queryParams$ = new Subject<Record<string, string>>();
    const route = {
      queryParams: queryParams$.asObservable(),
      snapshot: { queryParams: {} },
    } as unknown as ActivatedRoute;
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    const component = new InventoryListComponent(service, route, router);
    component.ngOnInit();

    // Multiple retries
    component.loadInventory();
    component.loadInventory();
    component.loadInventory();

    expect(service.getInventory).toHaveBeenCalledTimes(4); // 1 on init + 3 retries
    expect(router.navigate).toHaveBeenCalledTimes(0);

    const applyFiltersSpy = spyOn(component, 'applyFilters').and.callThrough();

    // Now emit a query parameter change with editSaved
    queryParams$.next({ search: 'AC-COMP-001', selected: 'item-1', editSaved: '1' });

    // With decoupled subscription, applyFilters and router.navigate are called exactly ONCE
    expect(applyFiltersSpy).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(component.showSaveConfirmation).toBeTrue();
    expect(component.savedProduct?._id).toBe('item-1');

    component.ngOnDestroy();
  });

  it('tears down query parameter subscription on destroy and ignores further route changes', () => {
    const items = [inventoryItem({ _id: 'item-1' })];
    const service = {
      getInventory: () => of(items),
      getLocations: () => of([]),
    } as unknown as InventoryManagerDashboardService;

    const queryParams$ = new Subject<Record<string, string>>();
    const route = {
      queryParams: queryParams$.asObservable(),
      snapshot: { queryParams: {} },
    } as unknown as ActivatedRoute;
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    const component = new InventoryListComponent(service, route, router);
    component.ngOnInit();

    component.ngOnDestroy();

    const applyFiltersSpy = spyOn(component, 'applyFilters').and.callThrough();
    queryParams$.next({ search: 'New Search' });

    expect(applyFiltersSpy).not.toHaveBeenCalled();
    expect(component.searchQuery).toBe('');
  });
});

