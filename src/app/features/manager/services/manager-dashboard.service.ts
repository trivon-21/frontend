import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

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
  type: 'ticket' | 'order' | 'escalation' | 'authorization' | 'finance' | 'inventory' | 'sla';
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

@Injectable({ providedIn: 'root' })
export class ManagerDashboardService {
  constructor(private readonly api: ApiService) {}

  getDashboard(): Observable<ManagerDashboardData> {
    return this.api.get<ManagerDashboardData>('/manager/dashboard').pipe(
      map((data) => ({
        ...data,
        currentDate: new Date(data.currentDate),
        recentActivity: (data.recentActivity || []).map((activity) => {
          const timestamp = new Date(activity.timestamp);
          return { ...activity, timestamp, timeAgo: this.getTimeAgo(timestamp) };
        }),
      })),
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
