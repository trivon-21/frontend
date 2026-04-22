import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface SummaryStats {
  pendingRequests: number;
  dispatchReady: number;
  toolsCheckedOut: number;
  lowStockAlerts: number;
}

export interface ActivityItem {
  id: string;
  type: 'return' | 'dispatch' | 'request' | 'grn' | 'alert';
  title: string;
  description: string;
  timeAgo: string;
  timestamp: Date;
}

export interface StockAlert {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  remaining: string;
}

export interface InventoryDashboardData {
  managerName: string;
  currentDate: Date;
  stats: SummaryStats;
  recentActivity: ActivityItem[];
  stockAlerts: StockAlert[];
}

@Injectable({
  providedIn: 'root',
})
export class InventoryManagerDashboardService {
  constructor() {}

  getDashboard(): Observable<InventoryDashboardData> {
    const mockData: InventoryDashboardData = {
      managerName: 'John Doe',
      currentDate: new Date(),
      stats: {
        pendingRequests: 5,
        dispatchReady: 12,
        toolsCheckedOut: 3,
        lowStockAlerts: 5,
      },
      recentActivity: [
        {
          id: '1',
          type: 'return',
          title: 'Technician Sunil returned Drill Kit #4',
          description: 'Return completed',
          timeAgo: '5 mins ago',
          timestamp: new Date(Date.now() - 5 * 60000),
        },
        {
          id: '2',
          type: 'dispatch',
          title: 'Order #552 dispatched to Site-A',
          description: 'Dispatch completed',
          timeAgo: '15 mins ago',
          timestamp: new Date(Date.now() - 15 * 60000),
        },
        {
          id: '3',
          type: 'request',
          title: 'New material request from Job #2134',
          description: 'Request created',
          timeAgo: '32 mins ago',
          timestamp: new Date(Date.now() - 32 * 60000),
        },
        {
          id: '4',
          type: 'grn',
          title: 'GRN #894 received - 50 items added',
          description: 'Goods received',
          timeAgo: '1 hour ago',
          timestamp: new Date(Date.now() - 60 * 60000),
        },
        {
          id: '5',
          type: 'alert',
          title: 'Low stock alert: R410A Refrigerant',
          description: 'Stock alert',
          timeAgo: '2 hours ago',
          timestamp: new Date(Date.now() - 120 * 60000),
        },
      ],
      stockAlerts: [
        {
          id: '1',
          itemName: 'R410A Refrigerant (1kg)',
          quantity: 2,
          unit: 'units',
          remaining: '2 units remaining',
        },
        {
          id: '2',
          itemName: 'Copper Tube 1/4"',
          quantity: 5,
          unit: 'meters',
          remaining: '5 meters remaining',
        },
        {
          id: '3',
          itemName: 'Compressor Oil (Synthetic)',
          quantity: 1,
          unit: 'bottle',
          remaining: '1 bottle remaining',
        },
        {
          id: '4',
          itemName: 'Filter Drier',
          quantity: 3,
          unit: 'pieces',
          remaining: '3 pieces remaining',
        },
        {
          id: '5',
          itemName: 'Thermostat Wire 18/8',
          quantity: 10,
          unit: 'meters',
          remaining: '10 meters remaining',
        },
      ],
    };

    return of(mockData);
  }
}
