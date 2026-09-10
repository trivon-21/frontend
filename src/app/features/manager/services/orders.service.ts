import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PurchaseRequest, PurchaseStatus, ReceiptAuthorization } from '../../inventory-manager/services/purchase-workflow';
import { ApiService } from '../../../core/services/api.service';
import { TtlCacheService } from '../../../core/services/ttl-cache.service';

export type OrderStatus = PurchaseStatus;
export type { PurchaseRequest, ReceiptAuthorization };

export interface OrderSummary {
  pending: number;
  awaitingFinance: number;
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
  constructor(
    private readonly api: ApiService,
    private readonly cache: TtlCacheService,
  ) {}

  getOrders(status = 'all'): Observable<OrdersResponse> {
    let params = new HttpParams();
    if (status && status !== 'all') params = params.set('status', status);
    return this.api.get<OrdersResponse>('/manager/orders', params);
  }

  decide(order: PurchaseRequest, decision: 'approved' | 'rejected', comment: string): Observable<PurchaseRequest> {
    return this.api.patch<PurchaseRequest>(`/manager/orders/${order._id}`, {
      decision, comment, statusVersion: order.statusVersion,
    }).pipe(tap(() => {
      this.cache.invalidate('manager:');
      // The decision moves the request into 'pending-finance', which the
      // inventory manager's order list renders from its own cached scope.
      this.cache.invalidate('inventory:');
    }));
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
    }).pipe(tap(() => this.cache.invalidate('manager:')));
  }
}
