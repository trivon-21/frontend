import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  CreateInventoryCatalogItemInput,
  InventoryItem,
  UpdateInventoryMasterDataInput,
} from './inventory-domain';
import { PurchaseRequest, ReceiptAuthorization } from './purchase-workflow';
import { environment } from '../../../../environments/environment';
export type {
  CreateInventoryCatalogItemInput,
  InventoryItem,
  InventoryItemClass,
  InventoryItemForm,
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

export interface InventoryDashboardData {
  managerName: string;
  currentDate: Date;
  status: string;
  stats: SummaryStats;
  recentActivity: ActivityItem[];
  reorderList: ReorderItem[];
  procurementWorkflow: { awaitingManager: number; awaitingReceipt: number; awaitingFinance: number };
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
        // Convert timestamp strings to Date objects and add timeAgo
        data.recentActivity = data.recentActivity.map(activity => ({
          ...activity,
          timestamp: new Date(activity.timestamp),
          timeAgo: this.getTimeAgo(new Date(activity.timestamp))
        }));
        data.currentDate = new Date(data.currentDate);
        return data;
      }),
      catchError(err => {
        console.error('Backend connection failed. Switching to Offline mode.', err);
        // Fallback object so the dashboard shell still renders
        return of({
          managerName: 'Manager',
          currentDate: new Date(),
          status: 'Offline',
          stats: {
            materialReservations: { total: 0, subStats: [] },
            dispatchQueue: { total: 0, subStats: [] },
            assetHealth: { total: 0, subStats: [] },
            stockAlerts: { total: 0, subStats: [] }
          },
          recentActivity: [],
          reorderList: [],
          procurementWorkflow: { awaitingManager: 0, awaitingReceipt: 0, awaitingFinance: 0 },
        });
      })
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

  getItem(id: string): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.apiUrl}/item/${id}`);
  }

  updateItem(id: string, data: UpdateInventoryMasterDataInput): Observable<InventoryItem> {
    return this.http.patch<InventoryItem>(`${this.apiUrl}/item/${id}`, data);
  }

  addItem(data: CreateInventoryCatalogItemInput): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.apiUrl}/item`, data);
  }

  receiveInventory(data: Record<string, unknown>): Observable<{ item: InventoryItem; procurement: any }> {
    return this.http.post<{ item: InventoryItem; procurement: any }>(`${this.apiUrl}/receipts`, data);
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
      catchError(() => of([]))
    );
  }

  // ── Returns & RMA Methods ──

  getReturnsSummary(): Observable<ReturnsSummary> {
    return this.http.get<ReturnsSummary>(`${this.apiUrl}/returns-summary`).pipe(
      catchError(() => of({
        leftoverReturns: { total: 0, restoredToStock: 0, movedToQuarantine: 0 },
        rmaCases: { total: 0, active: 0 },
        quarantine: { active: 0, disposed: 0 },
      }))
    );
  }

  getLeftoverReturns(): Observable<LeftoverReturnItem[]> {
    return this.http.get<LeftoverReturnItem[]>(`${this.apiUrl}/leftover-returns`).pipe(
      catchError(() => of([]))
    );
  }

  createLeftoverReturn(data: any): Observable<LeftoverReturnItem> {
    return this.http.post<LeftoverReturnItem>(`${this.apiUrl}/leftover-returns`, data);
  }

  getRmaCases(): Observable<RmaCaseItem[]> {
    return this.http.get<RmaCaseItem[]>(`${this.apiUrl}/rma-cases`).pipe(
      catchError(() => of([]))
    );
  }

  createRmaCase(data: any): Observable<RmaCaseItem> {
    return this.http.post<RmaCaseItem>(`${this.apiUrl}/rma-cases`, data);
  }

  updateRmaCase(rmaId: string, data: any): Observable<RmaCaseItem> {
    return this.http.patch<RmaCaseItem>(`${this.apiUrl}/rma-cases/${rmaId}`, data);
  }

  getQuarantineItems(): Observable<QuarantineItemData[]> {
    return this.http.get<QuarantineItemData[]>(`${this.apiUrl}/quarantine`).pipe(
      catchError(() => of([]))
    );
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

export interface RmaCaseItem {
  _id: string;
  rmaId: string;
  serialNumber: string;
  itemName: string;
  itemSku: string;
  faultDescription: string;
  reportedBy: string;
  status: 'reported' | 'under-review' | 'sent-to-supplier' | 'resolved' | 'closed';
  type: 'Single' | 'Kit' | 'Bundle';
  resolution: string;
  resolvedAt?: string;
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
  source: 'leftover-return' | 'rma' | 'manual';
  sourceRefId: string;
  status: 'quarantined' | 'disposed' | 'returned-to-supplier';
  disposedAt?: string;
  disposedBy?: string;
  createdAt: string;
}
