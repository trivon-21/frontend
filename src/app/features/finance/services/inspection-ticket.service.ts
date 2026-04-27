import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class InspectionTicketService {

  private apiUrl = 'http://127.0.0.1:3000/api/inspection-tickets';

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0)
      return throwError(() => new Error('Cannot connect to backend.'));
    return throwError(() => new Error(error.error?.message || error.message || 'Request failed'));
  }

  getOrCreateTicket(orderId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/order/${orderId}`)
      .pipe(catchError(this.handleError));
  }

  uploadSlip(ticketId: string, slipData: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/upload-slip/${ticketId}`, { slipUrl: slipData })
      .pipe(catchError(this.handleError));
  }

  getAvailableDates(ticketId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/available-dates/${ticketId}`)
      .pipe(catchError(this.handleError));
  }

  confirmScheduling(ticketId: string, selectedDate: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/confirm-scheduling/${ticketId}`, { selectedDate })
      .pipe(catchError(this.handleError));
  }

  rescheduleInspection(ticketId: string, newDate: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/reschedule/${ticketId}`, { newDate })
      .pipe(catchError(this.handleError));
  }

  getPendingVerification(): Observable<any[]> {
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

  getVerifiedPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/verified`)
      .pipe(catchError(this.handleError));
  }

  getRejectedPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/rejected`)
      .pipe(catchError(this.handleError));
  }
}