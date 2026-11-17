import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuditLogService {

  private apiUrl = 'http://127.0.0.1:5000/api/audit-logs';

  constructor(private http: HttpClient) { }

  getLogs(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(k => {
      if (filters[k] !== null && filters[k] !== '' && filters[k] !== undefined) {
        params = params.set(k, filters[k]);
      }
    });
    return this.http.get<any>(this.apiUrl, { params });
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  getLog(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
  getInvoiceById(invoiceId: string): Observable<any> {
    return this.http.get<any>(`http://127.0.0.1:5000/api/invoices/by-number/${invoiceId}`);
  }
}