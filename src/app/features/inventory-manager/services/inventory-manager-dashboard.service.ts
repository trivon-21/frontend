import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
          logistics: []
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
}
