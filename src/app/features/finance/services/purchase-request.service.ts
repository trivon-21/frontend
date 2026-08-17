import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PurchaseRequestService {
  private api = 'http://127.0.0.1:3000/api/purchase-requests';

  constructor(private http: HttpClient) { }

  getPendingRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/pending`);
  }

  getApprovedRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/approved`);
  }

  getRejectedRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/rejected`);
  }

  approveRequest(id: string): Observable<any> {
    return this.http.put<any>(`${this.api}/approve/${id}`, {});
  }

  rejectRequest(id: string, rejectionReason: string): Observable<any> {
    return this.http.put<any>(`${this.api}/reject/${id}`, { rejectionReason });
  }
}