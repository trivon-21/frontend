import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class InspectionOfficerService {

  private apiUrl = 'http://127.0.0.1:5000/api/inspection-officer';

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.error?.message || error.message || 'Request failed'));
  }

 getDashboardStats(inspectorId?: string): Observable<any> {
  const url = inspectorId ? `${this.apiUrl}/dashboard?inspectorId=${inspectorId}` : `${this.apiUrl}/dashboard`;
  return this.http.get<any>(url).pipe(catchError(this.handleError));
}

  getScheduledInspections(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/scheduled`).pipe(catchError(this.handleError));
  }

  // Now optionally records which inspector started this job — additive only,
  // existing callers that don't pass inspectorId keep working exactly as before
  startInspection(ticketId: string, arrivalTime: string, inspectorId?: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/start/${ticketId}`, { arrivalTime, inspectorId }).pipe(catchError(this.handleError));
  }

 getOngoingInspections(inspectorId?: string): Observable<any[]> {
  const url = inspectorId ? `${this.apiUrl}/ongoing?inspectorId=${inspectorId}` : `${this.apiUrl}/ongoing`;
  return this.http.get<any[]>(url).pipe(catchError(this.handleError));
}

  saveReport(ticketId: string, reportData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/save-report/${ticketId}`, reportData).pipe(catchError(this.handleError));
  }

  recordReport(ticketId: string, reportData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/record-report/${ticketId}`, reportData).pipe(catchError(this.handleError));
  }

 getCompletedInspections(inspectorId?: string): Observable<any[]> {
  const url = inspectorId ? `${this.apiUrl}/completed?inspectorId=${inspectorId}` : `${this.apiUrl}/completed`;
  return this.http.get<any[]>(url).pipe(catchError(this.handleError));
}


  getReport(ticketId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/report/${ticketId}`).pipe(catchError(this.handleError));
  }

  submitReport(ticketId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/submit-report/${ticketId}`, {}).pipe(catchError(this.handleError));
  }
}