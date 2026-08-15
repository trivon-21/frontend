import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'escalated';
export type TicketPriority = 'high' | 'medium' | 'low';
export type TicketCategory = 'installation' | 'repair' | 'maintenance' | 'inspection';

export interface SafeUserReference {
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  role?: 'MAIN_TECH' | 'SERVICE_TEAM' | 'INSPECTION';
}

export interface Technician extends SafeUserReference {
  role: 'MAIN_TECH' | 'SERVICE_TEAM' | 'INSPECTION';
}

export interface Ticket {
  _id: string;
  ticketId: string;
  subject: string;
  description?: string;
  customer: string;
  customerId?: SafeUserReference | string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  assignedTechnicianId?: Technician | string;
  slaDueAt?: Date | string;
  resolvedAt?: Date | string;
  createdAt?: Date | string;
  inventoryConstraints?: Array<{
    authorizationId: string; authorizationNumber: string; reason: string; status: string;
    financeReviewStatus: string; authorizedQuantity: number; receivedQuantity: number;
    item?: { name?: string; sku?: string; available?: number; reorderLevel?: number };
  }>;
}

export interface TicketSummary {
  total: number;
  open: number;
  inProgress: number;
  escalated: number;
  resolved: number;
}

export interface TicketsResponse {
  status: string;
  summary: TicketSummary;
  tickets: Ticket[];
}

export interface TicketFilters {
  status?: string;
  priority?: string;
}

export type TicketUpdate = Partial<Pick<Ticket, 'status' | 'priority'>> & {
  assignedTechnicianId?: string | null;
};

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private apiUrl = 'http://localhost:5000/api/manager';

  constructor(private http: HttpClient) {}

  getTickets(filters: TicketFilters = {}): Observable<TicketsResponse> {
    const params: Record<string, string> = {};
    if (filters.status && filters.status !== 'all') params['status'] = filters.status;
    if (filters.priority && filters.priority !== 'all') params['priority'] = filters.priority;
    return this.http.get<TicketsResponse>(`${this.apiUrl}/tickets`, { params }).pipe(
      map((response) => ({
        ...response,
        tickets: response.tickets.map((ticket) => ({
          ...ticket,
          slaDueAt: ticket.slaDueAt ? new Date(ticket.slaDueAt) : undefined,
          resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : undefined,
          createdAt: ticket.createdAt ? new Date(ticket.createdAt) : undefined,
        })),
      })),
      catchError((error) => {
        console.error('Tickets backend unavailable.', error);
        return of({
          status: 'Offline',
          summary: { total: 0, open: 0, inProgress: 0, escalated: 0, resolved: 0 },
          tickets: [],
        });
      }),
    );
  }

  getTechnicians(): Observable<Technician[]> {
    return this.http.get<{ technicians: Technician[] }>(`${this.apiUrl}/technicians`).pipe(
      map((response) => response.technicians),
      catchError(() => of([])),
    );
  }

  updateTicket(id: string, patch: TicketUpdate): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/tickets/${id}`, patch);
  }
}
