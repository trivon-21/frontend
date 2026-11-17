import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FinancialReportService {
  private api = 'http://127.0.0.1:5000/api/financial-report';

  constructor(private http: HttpClient) { }

  getSummary(startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<any>(`${this.api}/summary`, { params });
  }

  getTransactions(startDate?: string, endDate?: string, status?: string, page = 1): Observable<any> {
    let params = new HttpParams().set('page', page).set('limit', '15');
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (status && status !== 'ALL') params = params.set('status', status);
    return this.http.get<any>(`${this.api}/transactions`, { params });
  }

  getOutstanding(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/outstanding`);
  }

  getCollections(startDate?: string, endDate?: string): Observable<any[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<any[]>(`${this.api}/collections`, { params });
  }
}