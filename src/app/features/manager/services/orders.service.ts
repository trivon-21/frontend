import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export type OrderStatus = 'pending-approval' | 'approved' | 'rejected';

export interface OrderItem {
  name: string;
  sku: string;
  quantity: number;
  estimatedTotal?: number;
}

export interface PurchaseRequest {
  _id: string;
  requestId: string;
  supplierName: string;
  totalEstimate: number;
  status: OrderStatus;
  priority: 'normal' | 'urgent';
  requestedBy: string;
  items: OrderItem[];
  approvedBy?: string;
  rejectionReason?: string;
  createdAt?: Date | string;
}

export interface OrderSummary {
  pending: number;
  approved: number;
  rejected: number;
  pendingValue: number;
}

export interface OrdersResponse {
  status: string;
  summary: OrderSummary;
  orders: PurchaseRequest[];
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private apiUrl = 'http://localhost:5000/api/manager';

  constructor(private http: HttpClient) {}

  getOrders(status = 'all'): Observable<OrdersResponse> {
    const params: Record<string, string> = {};
    if (status && status !== 'all') params['status'] = status;

    return this.http
      .get<OrdersResponse>(`${this.apiUrl}/orders`, { params })
      .pipe(catchError(() => of(this.offline(status))));
  }

  decide(id: string, decision: 'approved' | 'rejected', reason = ''): Observable<PurchaseRequest | null> {
    return this.http
      .patch<PurchaseRequest>(`${this.apiUrl}/orders/${id}`, { decision, reason })
      .pipe(catchError(() => of(null)));
  }

  private offline(status: string): OrdersResponse {
    const now = Date.now();
    const hr = 3600 * 1000;
    let orders: PurchaseRequest[] = [
      { _id: 'off_or1', requestId: 'PR-1022', supplierName: 'CoolAir Distributors', totalEstimate: 184500, status: 'pending-approval', priority: 'urgent', requestedBy: 'Inventory Manager', items: [ { name: 'Outdoor Unit 2.0T', sku: 'AC-OU-20', quantity: 5, estimatedTotal: 125000 }, { name: 'Copper Pipe 1/4"', sku: 'CP-14', quantity: 40, estimatedTotal: 59500 } ], createdAt: new Date(now - 3 * hr) },
      { _id: 'off_or2', requestId: 'PR-1021', supplierName: 'ThermoParts Lanka', totalEstimate: 42300, status: 'pending-approval', priority: 'normal', requestedBy: 'Inventory Manager', items: [ { name: 'Thermostat Digital', sku: 'TH-DIG', quantity: 15, estimatedTotal: 42300 } ], createdAt: new Date(now - 26 * hr) },
      { _id: 'off_or3', requestId: 'PR-1019', supplierName: 'CoolAir Distributors', totalEstimate: 98000, status: 'approved', priority: 'normal', requestedBy: 'Inventory Manager', approvedBy: 'Manager', items: [ { name: 'Indoor Unit 1.5T', sku: 'AC-IU-15', quantity: 4, estimatedTotal: 98000 } ], createdAt: new Date(now - 3 * 24 * hr) },
      { _id: 'off_or4', requestId: 'PR-1016', supplierName: 'Generic Spares Co.', totalEstimate: 15600, status: 'rejected', priority: 'normal', requestedBy: 'Inventory Manager', rejectionReason: 'Non-preferred supplier', items: [ { name: 'Remote Controllers', sku: 'RC-STD', quantity: 20, estimatedTotal: 15600 } ], createdAt: new Date(now - 5 * 24 * hr) },
    ];

    const pending = orders.filter((o) => o.status === 'pending-approval');
    const summary: OrderSummary = {
      pending: pending.length,
      approved: orders.filter((o) => o.status === 'approved').length,
      rejected: orders.filter((o) => o.status === 'rejected').length,
      pendingValue: pending.reduce((s, o) => s + o.totalEstimate, 0),
    };

    if (status && status !== 'all') {
      orders = orders.filter((o) => o.status === status);
    }

    return { status: 'Offline', summary, orders };
  }
}
