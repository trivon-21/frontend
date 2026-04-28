import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  id: string;
  name: string;
  available: number;
  reserved: number;
  status: 'critical' | 'warning' | 'normal';
}

export interface InventoryItem extends ReorderItem {
  sku: string;
  type: 'Single' | 'Bundle';
  category: string;
  brand: string;
  location: string;
  unit: string;
  unitCost: number;
  maxStockLevel: number;
  isSerialized: boolean;
  serialNumbers?: string[];
  specsUrl?: string;
  time?: string;
}

export interface LogisticsItem {
  label: string;
  current: number;
  total: number;
  subLabel?: string;
}

export interface InventoryDashboardData {
  managerName: string;
  currentDate: Date;
  status: string;
  stats: SummaryStats;
  recentActivity: ActivityItem[];
  reorderList: ReorderItem[];
  logistics: LogisticsItem[];
}

@Injectable({
  providedIn: 'root',
})
export class InventoryManagerDashboardService {
  private apiUrl = 'http://localhost:5000/api/inventory';

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<InventoryDashboardData> {
    return this.http.get<InventoryDashboardData>(`${this.apiUrl}/dashboard`);
  }

  getInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.apiUrl}/list`);
  }

  getItem(id: string): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.apiUrl}/item/${id}`);
  }

  updateItem(id: string, data: any): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(`${this.apiUrl}/item/${id}`, data);
  }

  addItem(data: any): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.apiUrl}/item`, data);
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
}
