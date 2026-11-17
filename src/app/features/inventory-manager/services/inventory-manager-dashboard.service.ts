import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CreateInventoryCatalogItemInput,
  InventoryItem,
  InventoryLocationOption,
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
  StockStatus,
  UpdateInventoryMasterDataInput,
} from './inventory-domain';

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
  /** @deprecated Use readyToReceive. */
  awaitingReceipt: number;
  /** @deprecated Use awaitingReceiptReconciliation. */
  awaitingFinance: number;
}

export interface LogisticsDashboardItem {
  id: string;
  orderId: string;
  customer: string;
  status: 'to-pack' | 'ready' | 'in-transit' | 'completed';
  statusVersion: number;
  type: string;
  courier?: string;
  trackId?: string;
  itemCount: number;
  date?: string;
  lastMovedAt?: string | Date;
  completedAt?: string | Date;
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
    awaitingReceipt: 0,
    awaitingFinance: 0,
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
  const readyToReceive = workflow?.readyToReceive ?? workflow?.awaitingReceipt ?? 0;
  const awaitingReceiptReconciliation = workflow?.awaitingReceiptReconciliation
    ?? workflow?.awaitingFinance
    ?? 0;
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
      awaitingReceipt: readyToReceive,
      awaitingFinance: awaitingReceiptReconciliation,
    },
    logistics: (data?.logistics || []).map((l) => ({ ...l })),
  };
}

@Injectable({
  providedIn: 'root',
})
export class InventoryManagerDashboardService {
  private apiUrl = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<InventoryDashboardData> {
    return this.http.get<InventoryDashboardData>(`${this.apiUrl}/dashboard`).pipe(
      map(data => {
        const normalized = normalizeInventoryDashboard(data);
        normalized.recentActivity = normalized.recentActivity.map(activity => ({
          ...activity,
          timeAgo: this.getTimeAgo(activity.timestamp),
        }));
        return normalized;
      }),
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

  getInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.apiUrl}/list`);
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

  getItem(id: string): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.apiUrl}/item/${id}`);
  }

  updateItem(id: string, data: UpdateInventoryMasterDataInput): Observable<InventoryItem> {
    return this.http.patch<InventoryItem>(`${this.apiUrl}/item/${id}`, data);
  }

  addItem(data: CreateInventoryCatalogItemInput): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.apiUrl}/item`, data);
  }

  receiveInventory(data: ReceiveInventoryInput): Observable<ReceiveInventoryResult> {
    return this.http.post<ReceiveInventoryResult>(`${this.apiUrl}/receipts`, data);
  }

  getSuppliers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/suppliers`);
  }

  addSupplier(name: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/suppliers`, { name });
  }

  getProcurements(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/procurements`);
  }

  getReceiptDiscrepancies(status = 'all'): Observable<ReceiptDiscrepancy[]> {
    return this.http.get<ReceiptDiscrepancy[]>(`${this.apiUrl}/receipt-discrepancies`, {
      params: status === 'all' ? {} : { status },
    });
  }

  getOrderRequests(): Observable<PurchaseRequest[]> {
    return this.http.get<PurchaseRequest[]>(`${this.apiUrl}/order-requests`);
  }

  getReceiptAuthorizations(status?: string): Observable<ReceiptAuthorization[]> {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.http.get<ReceiptAuthorization[]>(`${this.apiUrl}/receipt-authorizations`, { params });
  }

  createReceiptAuthorization(data: Record<string, unknown>): Observable<ReceiptAuthorization> {
    return this.http.post<ReceiptAuthorization>(`${this.apiUrl}/receipt-authorizations`, data);
  }

  getActivityLog(): Observable<ActivityItem[]> {
    return this.http.get<ActivityItem[]>(`${this.apiUrl}/activity`).pipe(
      map(activities => activities.map(activity => ({
        ...activity,
        timestamp: new Date(activity.timestamp),
        timeAgo: this.getTimeAgo(new Date(activity.timestamp))
      }))),
    );
  }

  // ── Returns & RMA Methods ──

  getReturnsSummary(): Observable<ReturnsSummary> {
    return this.http.get<ReturnsSummary>(`${this.apiUrl}/returns-summary`);
  }

  getLeftoverReturns(): Observable<LeftoverReturnItem[]> {
    return this.http.get<LeftoverReturnItem[]>(`${this.apiUrl}/leftover-returns`);
  }

  getLocations(): Observable<InventoryLocationOption[]> {
    return this.http.get<InventoryLocationOption[]>(`${this.apiUrl}/locations`);
  }

  getHandedOverMaterialRequests(): Observable<HandedOverMaterialRequest[]> {
    return this.http.get<HandedOverMaterialRequest[]>(`${this.apiUrl}/material-requests`).pipe(
      map(requests => requests.filter(request => request.status === 'completed')),
    );
  }

  createLeftoverReturn(data: any): Observable<LeftoverReturnItem> {
    return this.http.post<LeftoverReturnItem>(`${this.apiUrl}/leftover-returns`, data);
  }

  getRmaCases(): Observable<RmaCaseItem[]> {
    return this.http.get<RmaCaseItem[]>(`${this.apiUrl}/rma-cases`);
  }

  createRmaCase(data: any): Observable<RmaCaseItem> {
    return this.http.post<RmaCaseItem>(`${this.apiUrl}/rma-cases`, data);
  }

  updateRmaCase(rmaId: string, data: any): Observable<RmaCaseItem> {
    return this.http.patch<RmaCaseItem>(`${this.apiUrl}/rma-cases/${rmaId}`, data);
  }

  receiveRmaReplacement(rmaId: string, data: { serialNumber: string; notes?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rma-cases/${rmaId}/replacement`, data);
  }

  getQuarantineItems(): Observable<QuarantineItemData[]> {
    return this.http.get<QuarantineItemData[]>(`${this.apiUrl}/quarantine`);
  }

  createQuarantineItem(data: any): Observable<QuarantineItemData> {
    return this.http.post<QuarantineItemData>(`${this.apiUrl}/quarantine`, data);
  }

  disposeQuarantineItem(quarantineId: string): Observable<QuarantineItemData> {
    return this.http.patch<QuarantineItemData>(`${this.apiUrl}/quarantine/${quarantineId}/dispose`, {});
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
  status: 'quarantined' | 'disposed' | 'returned-to-supplier';
  disposedAt?: string;
  disposedBy?: string;
  createdAt: string;
}
