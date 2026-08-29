import { of } from 'rxjs';
import { InventoryItem } from '../../services/inventory-domain';
import { InventoryManagerDashboardService } from '../../services/inventory-manager-dashboard.service';
import { ListItemsComponent } from './list-items.component';

function item(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    _id: 'item-1', name: 'Compressor', sku: 'COMP-1', available: 1, reserved: 0,
    reorderLevel: 1, maxStockLevel: 5, status: 'warning', type: 'Single',
    category: 'Spare Parts', itemClass: 'Spare Parts', subcategory: 'Compressor',
    brand: 'Copeland', location: 'Warehouse', unit: 'units', unitCost: 100,
    isSerialized: false, ...overrides,
  };
}

describe('ListItemsComponent catalog health', () => {
  it('keeps complete records out of the quality queue', () => {
    const service = { getInventory: () => of([item()]) } as InventoryManagerDashboardService;
    const component = new ListItemsComponent(service);
    component.ngOnInit();
    expect(component.records).toEqual([]);
  });

  it('reports classification, threshold, and serialized-stock issues', () => {
    const service = { getInventory: () => of([item({
      itemClass: 'Unclassified', subcategory: 'Unclassified', reorderLevel: 10,
      maxStockLevel: 5, isSerialized: true, available: 2, reserved: 1,
      serialNumbers: ['TAG-1'],
    })]) } as InventoryManagerDashboardService;
    const component = new ListItemsComponent(service);
    component.ngOnInit();
    expect(component.records[0].masterIssues).toContain('Product classification required');
    expect(component.records[0].masterIssues).toContain('Invalid reorder or maximum stock level');
    expect(component.records[0].stockIssues).toContain('Asset-tag count does not match tracked stock');
  });
});
