import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

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
export class OrderService {
  private apiUrl = 'http://localhost:5000/api/orders';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  trackOrder(ref: string, phone?: string, email?: string): Observable<TrackedOrder> {
    let params = new HttpParams().set('ref', ref.trim().toUpperCase());
    if (phone) params = params.set('phone', phone.trim());
    if (email) params = params.set('email', email.trim());
    return this.http.get<TrackedOrder>(`${this.apiUrl}/track`, { params });
  }

  getOrders(): Observable<TrackedOrder[]> {
    return this.http.get<TrackedOrder[]>(this.apiUrl, { headers: this.headers() });
  }

  getOrder(id: string): Observable<TrackedOrder> {
    return this.http.get<TrackedOrder>(`${this.apiUrl}/${id}`, { headers: this.headers() });
  }

  cancelOrder(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${id}/cancel`, {}, { headers: this.headers() });
  }

  reuploadPayment(id: string, paymentSlipUrl: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/${id}/reupload-payment`,
      { paymentSlipUrl },
      { headers: this.headers() }
    );
  }
}
