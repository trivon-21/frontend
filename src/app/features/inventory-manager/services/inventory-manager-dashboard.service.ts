import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

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
  timeAgo: string;
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
  constructor() {}

  getDashboard(): Observable<InventoryDashboardData> {
    const mockData: InventoryDashboardData = {
      managerName: 'Sarah',
      currentDate: new Date(),
      status: 'Operational',
      stats: {
        materialReservations: {
          total: 14,
          subStats: [
            { label: 'Installation Kits', value: 9 },
            { label: 'Repair Parts', value: 5 }
          ]
        },
        dispatchQueue: {
          total: 8,
          subStats: [
            { label: 'Awaiting Partner', value: 3 },
            { label: 'Missing Track ID', value: 5 }
          ]
        },
        assetHealth: {
          total: 112,
          subStats: [
            { label: 'Tools in Field', value: 110 },
            { label: 'Overdue/Calibrate', value: 2 }
          ]
        },
        stockAlerts: {
          total: 6,
          subStats: [
            { label: 'Below Reorder', value: 4 },
            { label: 'Out of Stock', value: 2 }
          ]
        }
      },
      recentActivity: [
        {
          id: '1',
          type: 'return',
          title: 'Lead Tech Sunil returned 5 items from Job #202 (3 restocked, 2 scrap).',
          description: 'Return completed',
          timeAgo: '10 mins ago',
          timestamp: new Date(Date.now() - 10 * 60000),
          actionLabel: 'View Details'
        },
        {
          id: '2',
          type: 'dispatch',
          title: 'Finance verified payment for Order #552.',
          description: 'Payment verified',
          timeAgo: '45 mins ago',
          timestamp: new Date(Date.now() - 45 * 60000),
          actionLabel: 'Proceed to Dispatch'
        },
        {
          id: '3',
          type: 'request',
          title: 'Main Tech uploaded a material list for Job #2134.',
          description: 'List uploaded',
          timeAgo: '2 hours ago',
          timestamp: new Date(Date.now() - 120 * 60000),
          actionLabel: 'Check Availability'
        },
        {
          id: '4',
          type: 'alert',
          title: 'Service Team requested a replacement compressor for Ticket #990 (Warranty Item).',
          description: 'RMA Request',
          timeAgo: '3 hours ago',
          timestamp: new Date(Date.now() - 180 * 60000),
          actionLabel: 'Process RMA'
        }
      ],
      reorderList: [
        { id: '1', itemName: 'Copper', avail: 15, rsvd: 20, status: 'critical' },
        { id: '2', itemName: 'Compres', avail: 2, rsvd: 2, status: 'critical' },
        { id: '3', itemName: 'Freon', avail: 10, rsvd: 5, status: 'normal' },
        { id: '4', itemName: 'Filter Drier', avail: 4, rsvd: 0, status: 'normal' }
      ],
      logistics: [
        { label: 'Scheduled Deliveries', current: 12, total: 15, subLabel: '3 pending pickup' },
        { label: 'Confirmed Tracking', current: 8, total: 15, subLabel: '7 missing tracking IDs' }
      ]
    };

    return of(mockData);
  }
}
