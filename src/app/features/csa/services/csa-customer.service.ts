import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CustomerProfile {
  _id: string;
  fullName: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  gender?: string;
  isActive?: boolean;
  ordersCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerListResponse {
  success: boolean;
  customers: CustomerProfile[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class CsaCustomerService {
  private apiUrl = `${environment.apiUrl}/csa/customers`;

  constructor(private http: HttpClient) {}

  getCustomers(search = '', page = 1, limit = 15): Observable<CustomerListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<CustomerListResponse>(this.apiUrl, { params });
  }

  createCustomer(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  getCustomerById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}
