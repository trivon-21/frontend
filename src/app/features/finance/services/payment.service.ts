import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private apiUrl = 'http://127.0.0.1:5000/api/payments';

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    const msg = error.error?.message || error.message || 'Request failed';
    return throwError(() => new Error(msg));
  }

  getPendingPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending`)
      .pipe(catchError(this.handleError));
  }

  approvePayment(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/approve/${id}`, {})
      .pipe(catchError(this.handleError));
  }

  rejectPayment(id: string, reason: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/reject/${id}`, { rejectionReason: reason })
      .pipe(catchError(this.handleError));
  }

  getApprovedPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/approved`)
      .pipe(catchError(this.handleError));
  }

  getRejectedPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/rejected`)
      .pipe(catchError(this.handleError));
  }
}