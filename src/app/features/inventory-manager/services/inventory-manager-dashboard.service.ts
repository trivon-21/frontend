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
  itemName: string;
  avail: number;
  rsvd: number;
  status: 'critical' | 'warning' | 'normal';
}

export interface InventoryItem extends ReorderItem {
  sku: string;
  type: 'Single' | 'Bundle';
  category: string;
  location: string;
  unit: string;
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
}
