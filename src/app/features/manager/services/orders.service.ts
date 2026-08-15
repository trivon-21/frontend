import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PurchaseRequest, PurchaseStatus, ReceiptAuthorization } from '../../inventory-manager/services/purchase-workflow';

export type OrderStatus = PurchaseStatus;
export type { PurchaseRequest, ReceiptAuthorization };

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
    return this.http.get<OrdersResponse>(`${this.apiUrl}/orders`, { params }).pipe(catchError(() => of({
      status: 'Offline', summary: { pending: 0, approved: 0, rejected: 0, pendingValue: 0 }, orders: [],
    })));
  }

  decide(order: PurchaseRequest, decision: 'approved' | 'rejected', comment: string): Observable<PurchaseRequest> {
    return this.http.patch<PurchaseRequest>(`${this.apiUrl}/orders/${order._id}`, {
      decision, comment, statusVersion: order.statusVersion,
    });
  }

  getReceiptAuthorizations(status = 'all'): Observable<ReceiptAuthorization[]> {
    const params: Record<string, string> = {};
    if (status !== 'all') params['status'] = status;
    return this.http.get<ReceiptAuthorization[]>(`${this.apiUrl}/receipt-authorizations`, { params });
  }

  decideReceiptAuthorization(
    authorization: ReceiptAuthorization,
    decision: 'approved' | 'rejected',
    comment: string,
  ): Observable<ReceiptAuthorization> {
    return this.http.post<ReceiptAuthorization>(`${this.apiUrl}/receipt-authorizations/${authorization._id}/decision`, {
      decision, comment, statusVersion: authorization.statusVersion,
    });
  }
}
