import { InventoryItem } from './inventory-domain';
import { OrderItem, Supplier } from './order-creation.service';
import { itemMatchesSupplier, relevantSuppliersFor } from './order-supplier-matching';

describe('order-supplier-matching', () => {
  const daikin: Supplier = { _id: 'sup-1', name: 'Daikin Lanka' };
  const carrier: Supplier = { _id: 'sup-2', name: 'Carrier Air' };
  const suppliers: Supplier[] = [daikin, carrier];

  describe('itemMatchesSupplier', () => {
    it('matches an item with no assigned supplier against any supplier', () => {
      const item = { name: 'Copper Pipe', sku: 'CP-01' } as InventoryItem;
      expect(itemMatchesSupplier(item, 'Daikin Lanka', daikin)).toBeTrue();
      expect(itemMatchesSupplier(item, 'Carrier Air', carrier)).toBeTrue();
    });

    it('matches by populated supplier id', () => {
      const item = { name: 'Cooling Coil', sku: 'CC-01', supplierId: { _id: 'sup-1', name: 'Daikin Lanka' } } as InventoryItem;
      expect(itemMatchesSupplier(item, 'Daikin Lanka', daikin)).toBeTrue();
      expect(itemMatchesSupplier(item, 'Carrier Air', carrier)).toBeFalse();
    });

    it('matches by supplier name when id is absent', () => {
      const item = { name: 'Cooling Coil', sku: 'CC-01', supplierName: 'Daikin Lanka' } as InventoryItem;
      expect(itemMatchesSupplier(item, 'Daikin Lanka')).toBeTrue();
      expect(itemMatchesSupplier(item, 'Carrier Air')).toBeFalse();
    });

    it('is case-insensitive and trims whitespace', () => {
      const item = { name: 'Cooling Coil', sku: 'CC-01', supplierName: '  Daikin Lanka  ' } as InventoryItem;
      expect(itemMatchesSupplier(item, 'daikin lanka')).toBeTrue();
    });
  });

  describe('relevantSuppliersFor', () => {
    it('returns [] when nothing constrains the order', () => {
      expect(relevantSuppliersFor([], '', suppliers)).toEqual([]);
    });

    it('returns the staged item supplier when no lines exist yet', () => {
      expect(relevantSuppliersFor([], 'Daikin Lanka', suppliers)).toEqual([daikin]);
    });

    it('returns the distinct suppliers of carted lines', () => {
      const lines: OrderItem[] = [
        { inventoryId: 'i-1', name: 'A', sku: 'A-1', quantity: 1, unitCost: 1, estimatedTotal: 1, supplierName: 'Daikin Lanka' },
        { inventoryId: 'i-2', name: 'B', sku: 'B-1', quantity: 1, unitCost: 1, estimatedTotal: 1, supplierName: 'Daikin Lanka' },
      ];
      expect(relevantSuppliersFor(lines, '', suppliers)).toEqual([daikin]);
    });

    it('ignores lines with no supplier name', () => {
      const lines: OrderItem[] = [
        { inventoryId: 'i-1', name: 'A', sku: 'A-1', quantity: 1, unitCost: 1, estimatedTotal: 1 },
      ];
      expect(relevantSuppliersFor(lines, '', suppliers)).toEqual([]);
    });

    it('skips a supplier name not found in the registered supplier list', () => {
      expect(relevantSuppliersFor([], 'Unknown Supplier', suppliers)).toEqual([]);
    });
  });
});
