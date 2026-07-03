import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Customer {
  _id: string;
  fullName: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  gender?: string;
  createdAt?: Date | string;
}

export interface CustomersResponse {
  status: string;
  total: number;
  customers: Customer[];
}

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private apiUrl = 'http://localhost:5000/api/manager';

  constructor(private http: HttpClient) {}

  getCustomers(search = ''): Observable<CustomersResponse> {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;

    return this.http
      .get<CustomersResponse>(`${this.apiUrl}/customers`, { params })
      .pipe(catchError(() => of(this.offline(search))));
  }

  private offline(search: string): CustomersResponse {
    const now = Date.now();
    const day = 24 * 3600 * 1000;
    let customers: Customer[] = [
      { _id: 'off_c1', fullName: 'Jane Smith', email: 'jane.smith@example.com', phoneNumber: '+94 77 123 4567', address: 'Colombo 05', createdAt: new Date(now - 120 * day) },
      { _id: 'off_c2', fullName: 'Ravi Kumar', email: 'ravi.k@example.com', phoneNumber: '+94 71 987 6543', address: 'Kandy', createdAt: new Date(now - 80 * day) },
      { _id: 'off_c3', fullName: 'Nimal Perera', email: 'nimal.p@example.com', phoneNumber: '+94 76 555 1212', address: 'Galle', createdAt: new Date(now - 45 * day) },
      { _id: 'off_c4', fullName: 'Acme Holdings', email: 'facilities@acme.lk', phoneNumber: '+94 11 234 5678', address: 'Colombo 03', createdAt: new Date(now - 30 * day) },
      { _id: 'off_c5', fullName: 'Green Valley Hotel', email: 'maintenance@greenvalley.lk', phoneNumber: '+94 81 222 3333', address: 'Nuwara Eliya', createdAt: new Date(now - 12 * day) },
    ];

    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.phoneNumber || '').toLowerCase().includes(q),
      );
    }

    return { status: 'Offline', total: customers.length, customers };
  }
}
