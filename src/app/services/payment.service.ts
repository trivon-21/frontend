import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Payment } from '../shared/models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private apiUrl = 'http://127.0.0.1:3000/api/payments';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.error('❌ HTTP Error:', {
      status: error.status,
      message: error.message,
      url: error.url
    });
    
    if (error.status === 0) {
      return throwError(() => new Error('Cannot connect to backend. Is server running on port 3000?\n\nTry: node backend/server.js'));
    }
    if (error.status === 404) {
      return throwError(() => new Error('API endpoint not found. Check URL.'));
    }
    if (error.status === 500) {
      return throwError(() => new Error('Server error. Check backend console.'));
    }
    
    return throwError(() => new Error(error.error?.message || error.message || 'Request failed'));
  }

  getPendingPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/pending`)
      .pipe(catchError(this.handleError));
  }

  getApprovedPayments() {
  return this.http.get<any[]>(`${this.apiUrl}/approved`);
}
approvePayment(id: string) {
  return this.http.put(`${this.apiUrl}/approve/${id}`, {})
      .pipe(catchError(this.handleError));
  }

rejectPayment(id: string, reason: string) {
 
  return this.http.put(`${this.apiUrl}/reject/${id}`, { rejectionReason: reason })
      .pipe(catchError(this.handleError));
}
getRejectedPayments() {
  return this.http.get<any[]>(`${this.apiUrl}/rejected`);
}
  reuploadSlip(id: string, slipUrl: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/reupload`, { slipUrl })
      .pipe(catchError(this.handleError));
  }
}