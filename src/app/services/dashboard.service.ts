import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface DashboardOrder {
  id: string;
  itemName: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Returned';
}

export interface DashboardData {
  stats: {
    totalPurchases: number;
    returnOrders: number;
    pendingPayment: number;
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
export class DashboardService {
  private apiUrl = 'http://localhost:5000/api/dashboard';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.apiUrl, { headers: this.headers() });
  }
}
