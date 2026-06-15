import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface SubStat {
  label: string;
  value: number | string;
}

export interface CardStat {
  total: number | string;
  subStats: SubStat[];
}

export interface ManagerSummaryStats {
  pendingTickets: CardStat;
  vehicleAvailability: CardStat;
  todaysSchedule: CardStat;
  escalations: CardStat;
}

export interface InventoryKpiItem {
  label: string;
  value: number;
  icon: string;
  trend?: string;
}

export interface InventoryKpis {
  reservedItems: InventoryKpiItem;
  lowStockAlerts: InventoryKpiItem;
  pendingDeliveries: InventoryKpiItem;
}

export interface ActivityItem {
  id: string;
  type: 'ticket' | 'vehicle' | 'order' | 'customer' | 'alert' | 'escalation';
  title: string;
  description: string;
  timeAgo?: string;
  timestamp: Date;
  status?: string;
  actionLabel?: string;
}

export interface PendingAction {
  id: string;
  type: string;
  title: string;
  description: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ManagerDashboardData {
  managerName: string;
  currentDate: Date;
  status: string;
  stats: ManagerSummaryStats;
  inventoryKpis: InventoryKpis;
  recentActivity: ActivityItem[];
  pendingActions: PendingAction[];
}

@Injectable({
  providedIn: 'root',
})
export class ManagerDashboardService {
  private apiUrl = 'http://localhost:5000/api/manager';

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<ManagerDashboardData> {
    return this.http.get<ManagerDashboardData>(`${this.apiUrl}/dashboard`).pipe(
      map(data => {
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
        return of({
          managerName: 'Manager',
          currentDate: new Date(),
          status: 'Offline',
          stats: {
            pendingTickets: {
              total: 12,
              subStats: [
                { label: 'Unassigned', value: 5 },
                { label: 'In Progress', value: 7 }
              ]
            },
            vehicleAvailability: {
              total: '8/12',
              subStats: [
                { label: 'Active', value: 8 },
                { label: 'Maintenance', value: 2 }
              ]
            },
            todaysSchedule: {
              total: 15,
              subStats: [
                { label: 'Completed', value: 4 },
                { label: 'Remaining', value: 11 }
              ]
            },
            escalations: {
              total: 3,
              subStats: [
                { label: 'Critical', value: 2 },
                { label: 'High', value: 1 }
              ]
            }
          },
          inventoryKpis: {
            reservedItems: { label: 'Reserved Items', value: 45, icon: 'clipboard-check', trend: 'For upcoming jobs' },
            lowStockAlerts: { label: 'Low Stock Alerts', value: 4, icon: 'triangle-alert', trend: 'Affects 2 jobs' },
            pendingDeliveries: { label: 'Pending Deliveries', value: 8, icon: 'truck', trend: 'To job sites' }
          },
          recentActivity: [
            {
              id: '1',
              type: 'escalation',
              title: 'Critical Escalation on Ticket #T-1002',
              description: 'Customer reported leak after AC installation',
              timestamp: new Date(Date.now() - 30 * 60 * 1000)
            },
            {
              id: '2',
              type: 'vehicle',
              title: 'Vehicle Assigned',
              description: 'Van 3 assigned to Tech team for ticket #T-1005',
              timestamp: new Date(Date.now() - 120 * 60 * 1000)
            },
            {
              id: '3',
              type: 'ticket',
              title: 'New Service Ticket Created',
              description: 'Annual inspection requested by John Doe',
              timestamp: new Date(Date.now() - 300 * 60 * 1000)
            }
          ],
          pendingActions: [
            {
              id: 'act1',
              type: 'vehicle',
              title: 'Assign Vehicle to Ticket #T-1008',
              description: 'Installation scheduled for 2:00 PM today has no vehicle assigned.',
              priority: 'high'
            },
            {
              id: 'act2',
              type: 'escalation',
              title: 'Resolve Escalation: Ticket #T-1002',
              description: 'Leak report needs immediate dispatcher reallocation.',
              priority: 'high'
            },
            {
              id: 'act3',
              type: 'order',
              title: 'Approve Purchase Request #PR-409',
              description: 'Awaiting manager approval for 5 outdoor units.',
              priority: 'medium'
            }
          ]
        } as ManagerDashboardData);
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
}
