import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PurchaseRequestLineItem {
  lineId?: string;
  inventoryId?: string;
  name: string;
  itemName?: string;
  sku?: string;
  itemClass?: string;
  subcategory?: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  unitCost?: number;
  total?: number;
  estimatedTotal?: number;
}

export interface PurchaseDecision {
  status: 'pending' | 'approved' | 'rejected' | 'not-required';
  actorId?: string;
  actorName?: string;
  comment?: string;
  decidedAt?: string | Date;
}

export interface PurchaseRequestItem {
  _id: string;
  requestId: string;
  items: PurchaseRequestLineItem[];
  supplierName?: string;
  supplierId?: string;
  totalEstimate: number;
  totalAmount?: number;
  status: 'draft' | 'pending-manager' | 'pending-finance' | 'approved' | 'rejected' | 'cancelled' | 'partially-fulfilled' | 'fulfilled';
  requestedBy: string;
  requestedById?: string | { _id: string; email?: string };
  requestedByEmail?: string;
  priority?: 'normal' | 'urgent';
  notes?: string;
  reason?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string | Date;
  rejectedAt?: string | Date;
  operationalApproval?: PurchaseDecision;
  financialApproval?: PurchaseDecision;
  workflowStages?: string[];
  statusVersion: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface PurchaseDecisionPayload {
  decision: 'approved' | 'rejected';
  comment: string;
  statusVersion: number;
}

@Injectable({ providedIn: 'root' })
export class PurchaseRequestService {
  private readonly apiUrl = `${(environment.apiUrl || '/api').replace(/\/api\/?$/, '')}/api/finance-workflow`;

  constructor(private http: HttpClient) { }

  /**
   * Fetch purchase requests matching a specific status or all requests.
   * Canonical endpoint: GET /api/finance-workflow/purchase-requests?status=...
   */
  getPurchaseRequests(status: 'pending-finance' | 'approved' | 'rejected' | 'all' = 'pending-finance'): Observable<PurchaseRequestItem[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<PurchaseRequestItem[]>(`${this.apiUrl}/purchase-requests`, { params });
  }

  getPendingRequests(): Observable<PurchaseRequestItem[]> {
    return this.getPurchaseRequests('pending-finance');
  }

  getApprovedRequests(): Observable<PurchaseRequestItem[]> {
    return this.getPurchaseRequests('approved');
  }

  getRejectedRequests(): Observable<PurchaseRequestItem[]> {
    return this.getPurchaseRequests('rejected');
  }

  /**
   * Canonical decision endpoint: POST /api/finance-workflow/purchase-requests/:id/decision
   */
  decideRequest(id: string, payload: PurchaseDecisionPayload): Observable<PurchaseRequestItem> {
    return this.http.post<PurchaseRequestItem>(`${this.apiUrl}/purchase-requests/${id}/decision`, payload);
  }

  approveRequest(id: string, statusVersion: number, comment: string = 'Approved by Finance'): Observable<PurchaseRequestItem> {
    return this.decideRequest(id, {
      decision: 'approved',
      comment: comment.trim() || 'Approved by Finance',
      statusVersion,
    });
  }

  rejectRequest(id: string, rejectionReason: string, statusVersion: number): Observable<PurchaseRequestItem> {
    return this.decideRequest(id, {
      decision: 'rejected',
      comment: rejectionReason.trim(),
      statusVersion,
    });
  }
}
