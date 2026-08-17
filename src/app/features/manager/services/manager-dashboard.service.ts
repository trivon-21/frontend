import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface CardStat {
  total: number;
  subStats: Array<{ label: string; value: number }>;
}

export interface ManagerSummaryStats {
  openTickets: CardStat;
  unassignedTickets: CardStat;
  slaRisk: CardStat;
  pendingApprovals: CardStat;
}

export interface InventoryKpiItem {
  label: string;
  value: number;
  icon: string;
}

export interface DashboardLink {
  route: string;
  queryParams?: Record<string, string>;
}

export interface ActivityItem extends DashboardLink {
  id: string;
  type: 'ticket' | 'order' | 'escalation';
  title: string;
  description: string;
  timestamp: Date;
  timeAgo?: string;
}

export interface PendingAction extends DashboardLink {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  createdAt?: Date | string;
}

export interface ManagerDashboardData {
  managerName: string;
  currentDate: Date;
  status: string;
  stats: ManagerSummaryStats;
  inventoryKpis: {
    reservedItems: InventoryKpiItem;
    lowStockAlerts: InventoryKpiItem;
    pendingMaterialRequests: InventoryKpiItem;
  };
  recentActivity: ActivityItem[];
  pendingActions: PendingAction[];
}

const EMPTY_DASHBOARD: ManagerDashboardData = {
  managerName: 'Manager',
  currentDate: new Date(),
  status: 'Offline',
  stats: {
    openTickets: { total: 0, subStats: [] },
    unassignedTickets: { total: 0, subStats: [] },
    slaRisk: { total: 0, subStats: [] },
    pendingApprovals: { total: 0, subStats: [] },
  },
  inventoryKpis: {
    reservedItems: { label: 'Reserved Items', value: 0, icon: 'clipboard-check' },
    lowStockAlerts: { label: 'Low Stock Alerts', value: 0, icon: 'triangle-alert' },
    pendingMaterialRequests: { label: 'Pending Material Requests', value: 0, icon: 'package' },
  },
  recentActivity: [],
  pendingActions: [],
};

@Injectable({ providedIn: 'root' })
export class ManagerDashboardService {
  private apiUrl = 'http://localhost:5000/api/manager';

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<ManagerDashboardData> {
    return this.http.get<ManagerDashboardData>(`${this.apiUrl}/dashboard`).pipe(
      map((data) => ({
        ...data,
        currentDate: new Date(data.currentDate),
        recentActivity: (data.recentActivity || []).map((activity) => {
          const timestamp = new Date(activity.timestamp);
          return { ...activity, timestamp, timeAgo: this.getTimeAgo(timestamp) };
        }),
      })),
      catchError((error) => {
        console.error('Manager dashboard unavailable.', error);
        return of({ ...EMPTY_DASHBOARD, currentDate: new Date() });
      }),
    );
  }

  private getTimeAgo(date: Date): string {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}
