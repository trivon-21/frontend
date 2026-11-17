import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PurchaseRequest, PurchaseStatus, ReceiptAuthorization } from '../../inventory-manager/services/purchase-workflow';
import { ApiService } from '../../../core/services/api.service';

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
  constructor(private readonly api: ApiService) {}

  getOrders(status = 'all'): Observable<OrdersResponse> {
    let params = new HttpParams();
    if (status && status !== 'all') params = params.set('status', status);
    return this.api.get<OrdersResponse>('/manager/orders', params);
  }

  decide(order: PurchaseRequest, decision: 'approved' | 'rejected', comment: string): Observable<PurchaseRequest> {
    return this.api.patch<PurchaseRequest>(`/manager/orders/${order._id}`, {
      decision, comment, statusVersion: order.statusVersion,
    });
  }

  getReceiptAuthorizations(status = 'all'): Observable<ReceiptAuthorization[]> {
    let params = new HttpParams();
    if (status !== 'all') params = params.set('status', status);
    return this.api.get<ReceiptAuthorization[]>('/manager/receipt-authorizations', params);
  }

  decideReceiptAuthorization(
    authorization: ReceiptAuthorization,
    decision: 'approved' | 'rejected',
    comment: string,
  ): Observable<ReceiptAuthorization> {
    return this.api.post<ReceiptAuthorization>(`/manager/receipt-authorizations/${authorization._id}/decision`, {
      decision, comment, statusVersion: authorization.statusVersion,
    });
  }
}
