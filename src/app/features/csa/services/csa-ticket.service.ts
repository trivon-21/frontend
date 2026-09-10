import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ServiceTicket {
  _id: string;
  customerId: {
    _id: string;
    fullName: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
  };
  category: 'repair' | 'maintenance' | 'installation' | 'inspection';
  requestType?: string;
  subject: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'New' | 'Reviewed' | 'Assigned' | 'open' | 'in-progress' | 'resolved' | 'escalated' | 'Rejected';
  acUnitModel?: string;
  acUnitSerial?: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  serviceFee?: number;
  assignedTechnicianId?: {
    _id: string;
    fullName: string;
    email?: string;
  };
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketListResponse {
  success: boolean;
  tickets: ServiceTicket[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class CsaTicketService {
  private apiUrl = `${environment.apiUrl}/csa/service-tickets`;

  constructor(private http: HttpClient) {}

  getTickets(filters: { search?: string; category?: string; status?: string; priority?: string; page?: number; limit?: number } = {}): Observable<TicketListResponse> {
    let params = new HttpParams();

    if (filters.search && filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.category && filters.category !== 'ALL') {
      params = params.set('category', filters.category);
    }
    if (filters.status && filters.status !== 'ALL') {
      params = params.set('status', filters.status);
    }
    if (filters.priority && filters.priority !== 'ALL') {
      params = params.set('priority', filters.priority);
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<TicketListResponse>(this.apiUrl, { params });
  }

  createTicket(ticketData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, ticketData);
  }

  updateTicketStatus(ticketId: string, statusData: { status: string; rejectionReason?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${ticketId}/status`, statusData);
  }

  getProducts(): Observable<{ success: boolean; products: any[] }> {
    return this.http.get<{ success: boolean; products: any[] }>(`${environment.apiUrl}/csa/products`);
  }
}
