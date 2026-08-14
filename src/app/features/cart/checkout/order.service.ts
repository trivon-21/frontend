import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  // Finalize order with shipping and payment slip
  submitPayment(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/submit-payment`, formData);
  }

  // Initial order creation (Step 1)
  createBuyOnlyOrder(orderData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/buy-only`, orderData);
  }

  createBuyAndInstallOrder(orderData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/buy-and-install`, orderData);
  }

  // Deprecated - use specific methods
  initializeOrder(orderData: any): Observable<any> {
    return this.createBuyOnlyOrder(orderData);
  }

  getOrdersByUser(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`);
  }

  getOrderById(orderId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/id/${orderId}`);
  }

  // Deprecated - use createBuyOnlyOrder + submitPayment
  placeOrder(formData: FormData): Observable<any> {
    return this.submitPayment(formData);
  }
}
