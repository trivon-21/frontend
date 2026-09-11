import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TtlCacheService } from '../../../core/services/ttl-cache.service';
import {
  CreateInventoryCatalogItemInput,
  InventoryItem,
  InventoryLocationOption,
  StockAdjustmentInput,
  StockMovement,
  UpdateInventoryMasterDataInput,
} from './inventory-domain';
import { PurchaseRequest, ReceiptAuthorization } from './purchase-workflow';
import { environment } from '../../../../environments/environment';
export type {
  CreateInventoryCatalogItemInput,
  InventoryItem,
  InventoryItemClass,
  InventoryItemForm,
  InventoryLocationOption,
  InventorySystemType,
  StockAdjustmentInput,
  StockAdjustmentMode,
  StockAdjustmentReasonCode,
  StockMovement,
  StockMovementType,
  StockStatus,
  UpdateInventoryMasterDataInput,
} from './inventory-domain';
export { STOCK_ADJUSTMENT_REASONS } from './inventory-domain';

export interface SubStat {
  label: string;
  value: number;
}

export interface SummaryStats {
  materialReservations: { total: number; subStats: SubStat[] };
  dispatchQueue: { total: number; subStats: SubStat[] };
  assetHealth: { total: number; subStats: SubStat[] };
  stockAlerts: { total: number; subStats: SubStat[] };
}

export interface ActivityItem {
  id: string;
  type: 'return' | 'dispatch' | 'request' | 'grn' | 'alert';
  title: string;
  description: string;
  timeAgo?: string;
  timestamp: Date;
  status?: string;
  actionLabel?: string;
}

export interface ReorderItem {
  _id?: string;
  id?: string;
  name: string;
  available: number;
  reserved: number;
  status: 'critical' | 'warning' | 'normal';
}

export interface ProcurementWorkflowSummary {
  awaitingManager: number;
  awaitingFinanceApproval: number;
  readyToIssue: number;
  readyToReceive: number;
  awaitingReceiptReconciliation: number;
  breakdown: {
    awaitingManager: { purchaseRequests: number; receiptAuthorizations: number };
    readyToReceive: { purchaseOrders: number; receiptAuthorizations: number };
  };
}

export interface LogisticsDashboardItem {
  orderId: string;
  customer: string;
  status: 'to-pack' | 'ready' | 'in-transit' | 'completed';
  courier?: string;
  trackId?: string;
  date?: string;
  lastMovedAt?: string | Date;
}

export interface InventoryListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  itemClass?: string;
  subcategory?: string;
  supplierId?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface InventoryPagedResult {
  items: InventoryItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface InventoryDashboardData {
  managerName: string;
  currentDate: Date;
  status: string;
  stats: SummaryStats;
  recentActivity: ActivityItem[];
  reorderList: ReorderItem[];
  procurementWorkflow: ProcurementWorkflowSummary;
  logistics: LogisticsDashboardItem[];
}

export interface ReceiveInventoryInput {
  inventoryId?: string;
  quantity: number;
  acceptedQuantity: number;
  damagedQuantity: number;
  missingQuantity: number;
  serialNumbers: string[];
  damagedSerialNumbers: string[];
  supplierId?: string;
  invoiceNumber?: string;
  sourceDocumentNumber: string;
  supportingDocumentUrl?: string;
  receivedDate: string;
  condition: 'Good' | 'Damaged' | 'Incomplete';
  location: string;
  binLocation: string;
  unitCost: number;
  receiptEventId: string;
  receiptMode: 'PO' | 'NON_PO';
  orderRequestId?: string;
  orderLineId?: string;
  receiptAuthorizationId?: string;
  discrepancyId?: string;
}

export interface ReceiptDiscrepancy {
  _id: string;
  discrepancyId: string;
  inventoryId: InventoryItem | string;
  supplierId: { _id: string; name: string } | string;
  supplierName: string;
  itemName: string;
  sku: string;
  receiptMode: 'PO' | 'NON_PO';
  orderRequestId?: { _id: string; requestId: string; poNumber?: string; status: string } | string;
  orderLineId?: string;
  receiptAuthorizationId?: { _id: string; authorizationNumber: string; status: string } | string;
  sourceDocumentNumber: string;
  expectedQuantity: number;
  acceptedQuantity: number;
  damagedQuantity: number;
  missingQuantity: number;
  outstandingQuantity: number;
  resolvedQuantity: number;
  unit: string;
  unitCost: number;
  disputedValue: number;
  status: 'open' | 'supplier-contacted' | 'replacement-pending' | 'resolved' | 'waived';
  createdAt: string;
}

export interface ReceiveInventoryResult {
  item: InventoryItem;
  procurement: {
    _id: string;
    acceptedQuantity: number;
    damagedQuantity: number;
    missingQuantity: number;
    acceptedTotalCost: number;
    disputedTotalCost: number;
  };
  discrepancy: ReceiptDiscrepancy | null;
  quarantine: QuarantineItemData | null;
}

function emptyProcurementWorkflow(): ProcurementWorkflowSummary {
  return {
    awaitingManager: 0,
    awaitingFinanceApproval: 0,
    readyToIssue: 0,
    readyToReceive: 0,
    awaitingReceiptReconciliation: 0,
    breakdown: {
      awaitingManager: { purchaseRequests: 0, receiptAuthorizations: 0 },
      readyToReceive: { purchaseOrders: 0, receiptAuthorizations: 0 },
    },
  };
}

function emptyDashboard(status = 'Offline'): InventoryDashboardData {
  return {
    managerName: 'Manager',
    currentDate: new Date(),
    status,
    stats: {
      materialReservations: { total: 0, subStats: [] },
      dispatchQueue: { total: 0, subStats: [] },
      assetHealth: { total: 0, subStats: [] },
      stockAlerts: { total: 0, subStats: [] },
    },
    recentActivity: [],
    reorderList: [],
    procurementWorkflow: emptyProcurementWorkflow(),
    logistics: [],
  };
}

export function normalizeInventoryDashboard(
  data: Partial<InventoryDashboardData> | null | undefined,
): InventoryDashboardData {
  const fallback = emptyDashboard(data?.status || 'Offline');
  const stats = data?.stats;
  const workflow = data?.procurementWorkflow;
  const readyToReceive = workflow?.readyToReceive ?? 0;
  const awaitingReceiptReconciliation = workflow?.awaitingReceiptReconciliation ?? 0;
  return {
    ...fallback,
    ...data,
    managerName: data?.managerName || fallback.managerName,
    currentDate: new Date(data?.currentDate || fallback.currentDate),
    stats: {
      materialReservations: { ...fallback.stats.materialReservations, ...stats?.materialReservations },
      dispatchQueue: { ...fallback.stats.dispatchQueue, ...stats?.dispatchQueue },
      assetHealth: { ...fallback.stats.assetHealth, ...stats?.assetHealth },
      stockAlerts: { ...fallback.stats.stockAlerts, ...stats?.stockAlerts },
    },
    recentActivity: (data?.recentActivity || []).map((activity) => {
      const timestamp = new Date(activity.timestamp);
      return { ...activity, timestamp };
    }),
    reorderList: data?.reorderList || [],
    procurementWorkflow: {
      awaitingManager: workflow?.awaitingManager ?? 0,
      awaitingFinanceApproval: workflow?.awaitingFinanceApproval ?? 0,
      readyToIssue: workflow?.readyToIssue ?? 0,
      readyToReceive,
      awaitingReceiptReconciliation,
      breakdown: {
        awaitingManager: {
          purchaseRequests: workflow?.breakdown?.awaitingManager?.purchaseRequests
            ?? workflow?.awaitingManager
            ?? 0,
          receiptAuthorizations: workflow?.breakdown?.awaitingManager?.receiptAuthorizations ?? 0,
        },
        readyToReceive: {
          purchaseOrders: workflow?.breakdown?.readyToReceive?.purchaseOrders ?? readyToReceive,
          receiptAuthorizations: workflow?.breakdown?.readyToReceive?.receiptAuthorizations ?? 0,
        },
      },
    },
    logistics: (data?.logistics || []).map((l) => ({ ...l })),
  };
}

const INVENTORY_CACHE_PREFIX = 'inventory:';
const DEFAULT_TTL_MS = 30 * 1000;

// Mirrors INVENTORY_CACHE_PREFIXES in the backend's inventory-manager.cache.js.
// Every key stays under INVENTORY_CACHE_PREFIX so a broad invalidate still
// clears all of them.
const CACHE_PREFIXES = {
  PROCUREMENT: 'inventory:procurement:',
  DISPATCH: 'inventory:dispatch:',
  CATALOG: 'inventory:catalog:',
  RETURNS: 'inventory:returns:',
  QUARANTINE: 'inventory:quarantine:',
  DASHBOARD: 'inventory:dashboard',
  ACTIVITY: 'inventory:activity',
} as const;

export interface ProcurementSummary {
  procurements: any[];
  inventoryItems: InventoryItem[];
  orderRequests: PurchaseRequest[];
  authorizations: ReceiptAuthorization[];
  discrepancies: ReceiptDiscrepancy[];
  locations: InventoryLocationOption[];
}

@Injectable({
  providedIn: 'root',
})
export class InventoryManagerDashboardService {
  private apiUrl = `${environment.apiUrl}/inventory`;

  constructor(
    private http: HttpClient,
    private cache: TtlCacheService,
  ) {}

  private requestCached<T>(
    key: string,
    factory: () => Observable<T>,
    options: { force?: boolean } = {},
    ttlMs: number = DEFAULT_TTL_MS,
  ): Observable<T> {
    return options.force
      ? this.cache.force(key, ttlMs, factory)
      : this.cache.observe(key, ttlMs, factory);
  }

  invalidateCache(prefix = INVENTORY_CACHE_PREFIX): void {
    this.cache.invalidate(prefix);
  }

  /** Clears only the named scopes — for writes that cannot change stock figures. */
  private invalidateScopes(...prefixes: string[]): void {
    for (const prefix of prefixes) this.cache.invalidate(prefix);
  }

  getDashboard(options: { force?: boolean } = {}): Observable<InventoryDashboardData> {
    return this.requestCached(
      `${INVENTORY_CACHE_PREFIX}dashboard`,
      () => this.http.get<InventoryDashboardData>(`${this.apiUrl}/dashboard`).pipe(
        map(data => {
          const normalized = normalizeInventoryDashboard(data);
          normalized.recentActivity = normalized.recentActivity.map(activity => ({
            ...activity,
            timeAgo: this.getTimeAgo(activity.timestamp),
          }));
          return normalized;
        }),
      ),
      options,
    );
  }

  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  getInventory(options: { force?: boolean } = {}): Observable<InventoryItem[]> {
    return this.requestCached(
      `${INVENTORY_CACHE_PREFIX}catalog:list`,
      () => this.http.get<InventoryItem[]>(`${this.apiUrl}/list`),
      options,
    );
  }

  /**
   * Server-side paginated inventory query (Epic 22 / AR-05).
   * Delegates filtering, search, sorting and pagination to the backend.
   */
  getInventoryPaged(params: InventoryListParams): Observable<InventoryPagedResult> {
    let httpParams = new HttpParams();
    if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params.pageSize !== undefined) httpParams = httpParams.set('pageSize', String(params.pageSize));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.itemClass) httpParams = httpParams.set('itemClass', params.itemClass);
    if (params.subcategory) httpParams = httpParams.set('subcategory', params.subcategory);
    if (params.supplierId) httpParams = httpParams.set('supplierId', params.supplierId);
    if (params.sortField) httpParams = httpParams.set('sortField', params.sortField);
    if (params.sortDirection) httpParams = httpParams.set('sortDirection', params.sortDirection);
    return this.http.get<InventoryPagedResult>(`${this.apiUrl}/list`, { params: httpParams });
  }

  getItem(id: string, options: { force?: boolean } = {}): Observable<InventoryItem> {
    return this.requestCached(
      `${INVENTORY_CACHE_PREFIX}item:${id}`,
      () => this.http.get<InventoryItem>(`${this.apiUrl}/item/${id}`),
      options,
    );
  }

  updateItem(id: string, data: UpdateInventoryMasterDataInput): Observable<InventoryItem> {
    return this.http.patch<InventoryItem>(`${this.apiUrl}/item/${id}`, data).pipe(
      tap(() => this.cache.invalidate(INVENTORY_CACHE_PREFIX)),
    );
  }

  /** Syncs the catalog unit cost when a Non-PO request is entered at a different price than the catalog default. */
  updateItemPrice(id: string, unitCost: number): Observable<InventoryItem> {
    return this.http.patch<InventoryItem>(`${this.apiUrl}/item/${id}`, { unitCost }).pipe(
      tap(() => this.cache.invalidate(INVENTORY_CACHE_PREFIX)),
    );
  }

  addItem(data: CreateInventoryCatalogItemInput): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.apiUrl}/item`, data).pipe(
      tap(() => this.cache.invalidate(INVENTORY_CACHE_PREFIX)),
    );
  }

  deleteItem(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${this.apiUrl}/item/${id}`).pipe(
      tap(() => this.cache.invalidate(INVENTORY_CACHE_PREFIX)),
    );
  }

  /**
   * Establishes or corrects an item's on-hand quantity through the audited
   * stock-adjustment workflow — the route around rejectProtectedStockFields
   * for opening balances, cycle-count corrections, and write-offs.
   */
  adjustStock(itemId: string, data: StockAdjustmentInput): Observable<{ item: InventoryItem; movement: StockMovement; duplicate: boolean }> {
    return this.http.post<{ item: InventoryItem; movement: StockMovement; duplicate: boolean }>(
      `${this.apiUrl}/item/${itemId}/stock-adjustments`,
      data,
    ).pipe(
      tap(() => this.cache.invalidate(INVENTORY_CACHE_PREFIX)),
    );
  }

  getStockMovements(itemId: string, options: { force?: boolean; limit?: number } = {}): Observable<StockMovement[]> {
    const params = options.limit ? new HttpParams().set('limit', String(options.limit)) : undefined;
    return this.requestCached(
      `${INVENTORY_CACHE_PREFIX}catalog:movements:${itemId}`,
      () => this.http.get<StockMovement[]>(`${this.apiUrl}/item/${itemId}/stock-movements`, { params }),
      options,
    );
  }

  receiveInventory(data: ReceiveInventoryInput): Observable<ReceiveInventoryResult> {
    return this.http.post<ReceiveInventoryResult>(`${this.apiUrl}/receipts`, data).pipe(
      tap(() => this.cache.invalidate(INVENTORY_CACHE_PREFIX)),
    );
  }

  getSuppliers(options: { force?: boolean } = {}): Observable<any[]> {
    return this.requestCached(
      `${CACHE_PREFIXES.CATALOG}suppliers`,
      () => this.http.get<any[]>(`${this.apiUrl}/suppliers`),
      options,
    );
  }

  addSupplier(name: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/suppliers`, { name }).pipe(
      tap(() => this.invalidateScopes(CACHE_PREFIXES.CATALOG, CACHE_PREFIXES.PROCUREMENT)),
    );
  }

  /** One request for the whole procurement page, replacing six parallel fetches. */
  getProcurementSummary(options: { force?: boolean } = {}): Observable<ProcurementSummary> {
    return this.requestCached(
      `${CACHE_PREFIXES.PROCUREMENT}summary`,
      () => this.http.get<ProcurementSummary>(`${this.apiUrl}/procurement/summary`),
      options,
    );
  }

  getProcurements(options: { force?: boolean } = {}): Observable<any[]> {
    return this.requestCached(
      `${CACHE_PREFIXES.PROCUREMENT}procurements`,
      () => this.http.get<any[]>(`${this.apiUrl}/procurements`),
      options,
    );
  }

  getReceiptDiscrepancies(status = 'all', options: { force?: boolean } = {}): Observable<ReceiptDiscrepancy[]> {
    return this.requestCached(
      `${CACHE_PREFIXES.PROCUREMENT}receipt-discrepancies:${status}`,
      () => this.http.get<ReceiptDiscrepancy[]>(`${this.apiUrl}/receipt-discrepancies`, {
        params: status === 'all' ? {} : { status },
      }),
      options,
    );
  }

  getOrderRequests(options: { force?: boolean } = {}): Observable<PurchaseRequest[]> {
    return this.requestCached(
      `${CACHE_PREFIXES.PROCUREMENT}order-requests`,
      () => this.http.get<PurchaseRequest[]>(`${this.apiUrl}/order-requests`),
      options,
    );
  }

  getReceiptAuthorizations(status?: string, options: { force?: boolean } = {}): Observable<ReceiptAuthorization[]> {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.requestCached(
      `${CACHE_PREFIXES.PROCUREMENT}receipt-authorizations:${status || 'all'}`,
      () => this.http.get<ReceiptAuthorization[]>(`${this.apiUrl}/receipt-authorizations`, { params }),
      options,
    );
  }

  createReceiptAuthorization(data: Record<string, unknown>): Observable<ReceiptAuthorization> {
    return this.http.post<ReceiptAuthorization>(`${this.apiUrl}/receipt-authorizations`, data).pipe(
      tap(() => this.invalidateScopes(
        CACHE_PREFIXES.PROCUREMENT,
        CACHE_PREFIXES.DASHBOARD,
        CACHE_PREFIXES.ACTIVITY,
      )),
    );
  }

  getActivityLog(options: { force?: boolean } = {}): Observable<ActivityItem[]> {
    return this.requestCached(
      `${INVENTORY_CACHE_PREFIX}activity`,
      () => this.http.get<ActivityItem[]>(`${this.apiUrl}/activity`).pipe(
        map(activities => activities.map(activity => ({
          ...activity,
          timestamp: new Date(activity.timestamp),
          timeAgo: this.getTimeAgo(new Date(activity.timestamp))
        }))),
      ),
      options,
    );
  }

  // ── Returns & RMA Methods ──

  getReturnsSummary(options: { force?: boolean } = {}): Observable<ReturnsSummary> {
    return this.requestCached(
      `${CACHE_PREFIXES.RETURNS}summary`,
      () => this.http.get<ReturnsSummary>(`${this.apiUrl}/returns-summary`),
      options,
    );
  }

  getLeftoverReturns(options: { force?: boolean } = {}): Observable<LeftoverReturnItem[]> {
    return this.requestCached(
      `${CACHE_PREFIXES.RETURNS}leftover-returns`,
      () => this.http.get<LeftoverReturnItem[]>(`${this.apiUrl}/leftover-returns`),
      options,
    );
  }

  getLocations(options: { force?: boolean } = {}): Observable<InventoryLocationOption[]> {
    return this.requestCached(
      `${INVENTORY_CACHE_PREFIX}locations`,
      () => this.http.get<InventoryLocationOption[]>(`${this.apiUrl}/locations`),
      options,
    );
  }

  getHandedOverMaterialRequests(options: { force?: boolean } = {}): Observable<HandedOverMaterialRequest[]> {
    return this.requestCached(
      `${INVENTORY_CACHE_PREFIX}material-requests:completed`,
      () => this.http.get<HandedOverMaterialRequest[]>(`${this.apiUrl}/material-requests`).pipe(
        map(requests => requests.filter(request => request.status === 'completed')),
      ),
      options,
    );
  }

  createLeftoverReturn(data: any): Observable<LeftoverReturnItem> {
    return this.http.post<LeftoverReturnItem>(`${this.apiUrl}/leftover-returns`, data).pipe(
      tap(() => this.cache.invalidate(INVENTORY_CACHE_PREFIX)),
    );
  }

  getRmaCases(options: { force?: boolean } = {}): Observable<RmaCaseItem[]> {
    return this.requestCached(
      `${CACHE_PREFIXES.RETURNS}rma-cases`,
      () => this.http.get<RmaCaseItem[]>(`${this.apiUrl}/rma-cases`),
      options,
    );
  }

  createRmaCase(data: any): Observable<RmaCaseItem> {
    return this.http.post<RmaCaseItem>(`${this.apiUrl}/rma-cases`, data).pipe(
      tap(() => this.invalidateScopes(
        CACHE_PREFIXES.RETURNS,
        CACHE_PREFIXES.DASHBOARD,
        CACHE_PREFIXES.ACTIVITY,
      )),
    );
  }

  updateRmaCase(rmaId: string, data: any): Observable<RmaCaseItem> {
    return this.http.patch<RmaCaseItem>(`${this.apiUrl}/rma-cases/${rmaId}`, data).pipe(
      tap(() => this.invalidateScopes(
        CACHE_PREFIXES.RETURNS,
        CACHE_PREFIXES.DASHBOARD,
        CACHE_PREFIXES.ACTIVITY,
      )),
    );
  }

  receiveRmaReplacement(rmaId: string, data: { serialNumber: string; notes?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rma-cases/${rmaId}/replacement`, data).pipe(
      tap(() => this.cache.invalidate(INVENTORY_CACHE_PREFIX)),
    );
  }

  getQuarantineItems(options: { force?: boolean } = {}): Observable<QuarantineItemData[]> {
    return this.requestCached(
      `${CACHE_PREFIXES.QUARANTINE}items`,
      () => this.http.get<QuarantineItemData[]>(`${this.apiUrl}/quarantine`),
      options,
    );
  }

  createQuarantineItem(data: any): Observable<QuarantineItemData> {
    return this.http.post<QuarantineItemData>(`${this.apiUrl}/quarantine`, data).pipe(
      tap(() => this.cache.invalidate(INVENTORY_CACHE_PREFIX)),
    );
  }

  disposeQuarantineItem(quarantineId: string): Observable<QuarantineItemData> {
    return this.http.patch<QuarantineItemData>(`${this.apiUrl}/quarantine/${quarantineId}/dispose`, {}).pipe(
      tap(() => this.cache.invalidate(INVENTORY_CACHE_PREFIX)),
    );
  }

  deleteQuarantineItem(quarantineId: string): Observable<QuarantineItemData> {
    return this.http.delete<QuarantineItemData>(`${this.apiUrl}/quarantine/${quarantineId}`).pipe(
      tap(() => this.cache.invalidate(INVENTORY_CACHE_PREFIX)),
    );
  }
}

// ── Returns & RMA Interfaces ──

export interface ReturnsSummary {
  leftoverReturns: { total: number; restoredToStock: number; movedToQuarantine: number };
  rmaCases: { total: number; active: number };
  quarantine: { active: number; disposed: number };
}

export interface LeftoverReturnItem {
  _id: string;
  returnId: string;
  jobId: string;
  itemId?: string;
  itemName: string;
  itemSku?: string;
  quantityReturned: number;
  condition: 'good' | 'damaged' | 'scrap';
  returnedBy: string;
  notes: string;
  restoredToStock: boolean;
  movedToQuarantine: boolean;
  createdAt: string;
}

export interface HandedOverMaterialLine {
  lineId: string;
  inventoryId: string;
  name: string;
  sku: string;
  qty: number;
}

export interface HandedOverMaterialRequest {
  _id: string;
  requestId: string;
  jobId: string;
  status: 'completed';
  assignedTeamName?: string;
  statusVersion: number;
  items: HandedOverMaterialLine[];
}

export interface RmaCaseItem {
  _id: string;
  rmaId: string;
  serialNumber: string;
  serializedAssetId?: string | { _id: string; serialNumber: string; status: string };
  itemName: string;
  itemSku: string;
  faultDescription: string;
  reportedBy: string;
  status: 'reported' | 'under-review' | 'sent-to-supplier' | 'replacement-pending' | 'resolved' | 'closed';
  type: 'Single' | 'Kit' | 'Bundle';
  resolutionType?: 'internal-repair' | 'supplier-replacement' | '';
  resolutionNote?: string;
  resolution: string;
  resolvedAt?: string;
  replacementSerializedAssetId?: string;
  createdAt: string;
}

export interface QuarantineItemData {
  _id: string;
  quarantineId: string;
  itemName: string;
  quantity: number;
  unit: string;
  reason: string;
  location: string;
  source: 'leftover-return' | 'rma' | 'receipt' | 'manual';
  sourceRefId: string;
  inventoryId?: string;
  status: 'quarantined' | 'disposed' | 'returned-to-supplier';
  disposedAt?: string;
  disposedBy?: string;
  createdAt: string;
}
