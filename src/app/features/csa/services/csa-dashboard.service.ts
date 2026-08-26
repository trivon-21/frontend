import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DashboardMetrics {
  totalCustomers: number;
  activeTickets: number;
  highPriorityTickets: number;
  pendingInquiries: number;
  pendingMaintenance: number;
}

export interface DashboardData {
  success: boolean;
  metrics: DashboardMetrics;
  recentTickets: any[];
  recentInquiries: any[];
  recentCustomers: any[];
}

@Injectable({
  providedIn: 'root'
})
export class CsaDashboardService {
  private apiUrl = `${environment.apiUrl}/csa/dashboard-stats`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.apiUrl);
  }
}
