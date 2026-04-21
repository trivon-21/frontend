import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ServicePaymentService {

  private apiUrl = 'http://127.0.0.1:3000/api/service-payments';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.error?.message || error.message || 'Request failed'));
  }

  getPendingVerification(serviceType: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending/${serviceType}`)
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

  getVerifiedPayments(serviceType: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/verified/${serviceType}`)
      .pipe(catchError(this.handleError));
  }

  getRejectedPayments(serviceType: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/rejected/${serviceType}`)
      .pipe(catchError(this.handleError));
  }
}