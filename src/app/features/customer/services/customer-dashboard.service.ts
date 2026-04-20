import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardOrder {
  id: string;
  itemName: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Returned' | 'Rejected';
}

export interface DashboardData {
  stats: {
    totalPurchases: number;
    returnOrders: number;
    pendingPayment: number;
    rejectedPayment: number;
    completed: number;
  };
  orders: DashboardOrder[];
  serviceRequests: {
    ongoing: number;
    addressed: number;
    closed: number;
  };
  inquiries: {
    ongoing: number;
    addressed: number;
  };
}

@Injectable({ providedIn: 'root' })
export class CustomerDashboardService {
  private apiUrl = 'http://localhost:5000/api/customer/dashboard';

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardData> {
    // Interceptor automatically adds Bearer token
    return this.http.get<DashboardData>(this.apiUrl);
  }
}
