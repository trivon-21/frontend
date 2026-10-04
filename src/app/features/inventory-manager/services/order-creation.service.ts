import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { TtlCacheService } from '../../../core/services/ttl-cache.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InventoryItem } from './inventory-domain';
import { PurchaseRequest } from './purchase-workflow';
export type { InventoryItem } from './inventory-domain';

export interface OrderItem {
  inventoryId: string;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
  estimatedTotal: number;
  available?: number;
  reserved?: number;
  itemClass?: string;
  subcategory?: string;
  unit?: string;
  manufacturerPartNumber?: string;
  supplierId?: string;
  supplierName?: string;
}

export interface Supplier {
  _id: string;
  name: string;
}

const INVENTORY_CACHE_PREFIX = 'inventory:';
const DEFAULT_TTL_MS = 30 * 1000;

// Keys are shared with InventoryManagerDashboardService via the root-provided
// TtlCacheService, so both must use the same scoped names.
const CACHE_PREFIXES = {
  PROCUREMENT: 'inventory:procurement:',
  CATALOG: 'inventory:catalog:',
  DASHBOARD: 'inventory:dashboard',
  ACTIVITY: 'inventory:activity',
} as const;

@Injectable({
  providedIn: 'root'
})
export class OrderCreationService {
  constructor(
    private apiService: ApiService,
    private cache: TtlCacheService,
  ) {}

  private requestCached<T>(
    key: string,
    factory: () => Observable<T>,
    options: { force?: boolean } = {},
  ): Observable<T> {
    return options.force
      ? this.cache.force(key, DEFAULT_TTL_MS, factory)
      : this.cache.observe(key, DEFAULT_TTL_MS, factory);
  }

  /** Clears only the named scopes — for writes that cannot change stock figures. */
  private invalidateScopes(...prefixes: string[]): void {
    for (const prefix of prefixes) this.cache.invalidate(prefix);
  }

  private invalidatePurchasingScopes(): void {
    this.invalidateScopes(
      CACHE_PREFIXES.PROCUREMENT,
      CACHE_PREFIXES.DASHBOARD,
      CACHE_PREFIXES.ACTIVITY,
    );
  }

  getInventory(options: { force?: boolean } = {}): Observable<InventoryItem[]> {
    return this.requestCached(
      `${INVENTORY_CACHE_PREFIX}catalog:list`,
      () => this.apiService.get<InventoryItem[]>('/inventory/list'),
      options,
    );
  }

  getSuppliers(options: { force?: boolean } = {}): Observable<Supplier[]> {
    return this.requestCached(
      `${CACHE_PREFIXES.CATALOG}suppliers`,
      () => this.apiService.get<Supplier[]>('/inventory/suppliers'),
      options,
    );
  }

  addSupplier(name: string): Observable<Supplier> {
    return this.apiService.post<Supplier>('/inventory/suppliers', { name }).pipe(
      tap(() => this.invalidateScopes(CACHE_PREFIXES.CATALOG, CACHE_PREFIXES.PROCUREMENT)),
    );
  }

  /** Reassigns a catalog product's default supplier — used when a product is pulled onto a different order's supplier. */
  updateItemSupplier(inventoryId: string, supplierId: string): Observable<InventoryItem> {
    return this.apiService.patch<InventoryItem>(`/inventory/item/${inventoryId}`, { supplierId }).pipe(
      tap(() => this.invalidateScopes(CACHE_PREFIXES.CATALOG, CACHE_PREFIXES.PROCUREMENT)),
    );
  }

  getSuggestedItems(options: { force?: boolean } = {}): Observable<InventoryItem[]> {
    return this.requestCached(
      `${CACHE_PREFIXES.CATALOG}suggested-orders`,
      () => this.apiService.get<InventoryItem[]>('/inventory/suggested-orders'),
      options,
    );
  }

  getOrderRequests(options: { force?: boolean } = {}): Observable<PurchaseRequest[]> {
    return this.requestCached(
      `${CACHE_PREFIXES.PROCUREMENT}order-requests`,
      () => this.apiService.get<PurchaseRequest[]>('/inventory/order-requests'),
      options,
    );
  }

  submitOrderRequest(payload: Record<string, unknown>, isEditMode: boolean, orderId?: string): Observable<PurchaseRequest> {
    const request$ = isEditMode && orderId
      ? this.apiService.patch<PurchaseRequest>(`/inventory/order-requests/${orderId}`, payload)
      : this.apiService.post<PurchaseRequest>('/inventory/order-requests', payload);
    return request$.pipe(
      tap(() => this.invalidatePurchasingScopes()),
    );
  }

  submitForManager(order: PurchaseRequest): Observable<PurchaseRequest> {
    return this.apiService.post<PurchaseRequest>(`/inventory/order-requests/${order.requestId}/submit`, {
      statusVersion: order.statusVersion,
    }).pipe(
      tap(() => this.invalidatePurchasingScopes()),
    );
  }

  issuePurchaseOrder(order: PurchaseRequest): Observable<PurchaseRequest> {
    return this.apiService.post<PurchaseRequest>(`/inventory/order-requests/${order.requestId}/issue-po`, {
      statusVersion: order.statusVersion,
    }).pipe(
      tap(() => this.invalidatePurchasingScopes()),
    );
  }
}
