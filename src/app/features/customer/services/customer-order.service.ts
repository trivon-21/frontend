import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';

export interface TrackedOrder {
  id: string;
  orderRef: string;
  itemName: string;
  productImage: string;
  quantity: number;
  amount: number;
  status: 'Completed' | 'Pending' | 'Returned';
  paymentStatus: 'Pending Payment' | 'Under Review' | 'Confirmed' | 'Rejected';
  orderType: 'Buy Only' | 'Buy & Install';
  orderStatus:
    | 'Order Placed'
    | 'Payment Uploaded'
    | 'Payment Confirmed'
    | 'Inventory Approved'
    | 'Shipped'
    | 'Delivered'
    | 'Installation Scheduled'
    | 'Installation Completed';
  deliveryTrackingId: string;
  deliveryPartnerUrl: string;
  warrantyStart: string | null;
  warrantyExpiry: string | null;
  amcStatus: 'Active' | 'Expired' | 'Not Available';
  paymentSlipUrl: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerOrderService {
  private apiUrl = `${environment.apiUrl}/customer/orders`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  trackOrder(ref: string, phone?: string, email?: string): Observable<TrackedOrder> {
    let params = new HttpParams().set('ref', ref.trim().toUpperCase());
    if (phone) params = params.set('phone', phone.trim());
    if (email) params = params.set('email', email.trim());
    // Interceptor automatically adds Bearer token
    return this.http.get<TrackedOrder>(`${this.apiUrl}/track`, { params });
  }

  getOrders(): Observable<TrackedOrder[]> {
    // Interceptor automatically adds Bearer token
    return this.http.get<TrackedOrder[]>(this.apiUrl);
  }

  getOrder(id: string): Observable<TrackedOrder> {
    // Interceptor automatically adds Bearer token
    return this.http.get<TrackedOrder>(`${this.apiUrl}/${id}`);
  }

  cancelOrder(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${id}/cancel`, {}).pipe(
      tap(() => {
        this.notificationService.notifyGeneral('Order Cancelled', 'Your order has been cancelled successfully');
      })
    );
  }

  reuploadPayment(id: string, paymentSlipUrl: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/${id}/reupload-payment`,
      { paymentSlipUrl}
    ).pipe(
      tap(() => {
        this.notificationService.notifyGeneral('Payment Resubmitted', 'Your payment slip has been resubmitted for review');
      })
    );
  }
}
