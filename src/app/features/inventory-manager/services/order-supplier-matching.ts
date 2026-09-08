import { InventoryItem, supplierIdOf, supplierNameOf } from './inventory-domain';
import { OrderItem, Supplier } from './order-creation.service';

/**
 * Whether a catalog item belongs to the given supplier for the purposes of the
 * new-order-form item search. An item with no assigned supplier matches every
 * supplier — it is stamped with the order's chosen supplier when added.
 */
export function itemMatchesSupplier(item: InventoryItem, supplierName: string, supplier?: Supplier): boolean {
  const sId = supplierIdOf(item);
  const sName = (supplierNameOf(item) || '').toLowerCase().trim();
  if (!sId && !sName) {
    return true;
  }
  if (supplier?._id && sId === supplier._id) {
    return true;
  }
  const targetName = (supplier?.name || supplierName || '').toLowerCase().trim();
  return !!targetName && sName === targetName;
}

/**
 * The distinct suppliers constraining the current order: every carted line's
 * supplier plus the currently staged item's supplier (if any), resolved against
 * the registered supplier list. Returns [] when nothing constrains the order yet.
 */
export function relevantSuppliersFor(
  lines: OrderItem[],
  stagedSupplierName: string,
  suppliers: Supplier[],
): Supplier[] {
  const names = new Set<string>();
  for (const line of lines) {
    if (line.supplierName) {
      names.add(line.supplierName.toLowerCase().trim());
    }
  }
  if (stagedSupplierName) {
    names.add(stagedSupplierName.toLowerCase().trim());
  }
  if (names.size === 0) {
    return [];
  }
  const resolved: Supplier[] = [];
  const seen = new Set<string>();
  for (const supplier of suppliers) {
    const key = supplier.name.toLowerCase().trim();
    if (names.has(key) && !seen.has(key)) {
      seen.add(key);
      resolved.push(supplier);
    }
  }
  return resolved;
}
