import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'escalated';
export type TicketPriority = 'high' | 'medium' | 'low';
export type TicketCategory = 'installation' | 'repair' | 'maintenance' | 'inspection';

export interface Ticket {
  _id: string;
  ticketId: string;
  subject: string;
  description?: string;
  customer: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  slaDueAt?: Date | string;
  createdAt?: Date | string;
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

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private apiUrl = 'http://localhost:5000/api/manager';

  constructor(private http: HttpClient) {}

  getTickets(filters: TicketFilters = {}): Observable<TicketsResponse> {
    const params: Record<string, string> = {};
    if (filters.status) params['status'] = filters.status;
    if (filters.priority) params['priority'] = filters.priority;

    return this.http.get<TicketsResponse>(`${this.apiUrl}/tickets`, { params }).pipe(
      map((res) => ({
        ...res,
        tickets: res.tickets.map((t) => ({
          ...t,
          slaDueAt: t.slaDueAt ? new Date(t.slaDueAt) : undefined,
          createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
        })),
      })),
      catchError((err) => {
        console.error('Tickets backend unavailable. Using offline data.', err);
        return of(this.offline(filters));
      }),
    );
  }

  updateTicket(id: string, patch: Partial<Ticket>): Observable<Ticket | null> {
    return this.http
      .patch<Ticket>(`${this.apiUrl}/tickets/${id}`, patch)
      .pipe(catchError(() => of(null)));
  }

  // ── Offline fallback (mirrors the backend seeded set) ──
  private offline(filters: TicketFilters): TicketsResponse {
    const now = Date.now();
    const hour = 3600 * 1000;
    let tickets: Ticket[] = [
      { _id: 'off_t1', ticketId: 'T-2041', subject: 'Compressor failure after install', customer: 'Jane Smith', category: 'repair', priority: 'high', status: 'escalated', assignedTo: 'A. Fernando', slaDueAt: new Date(now + 3 * hour), createdAt: new Date(now - 0.75 * hour) },
      { _id: 'off_t2', ticketId: 'T-2042', subject: 'Annual maintenance visit', customer: 'Ravi Kumar', category: 'maintenance', priority: 'low', status: 'in-progress', assignedTo: 'M. Perera', slaDueAt: new Date(now + 20 * hour), createdAt: new Date(now - 5 * hour) },
      { _id: 'off_t3', ticketId: 'T-2043', subject: 'New AC installation request', customer: 'Acme Holdings', category: 'installation', priority: 'medium', status: 'open', assignedTo: '', slaDueAt: new Date(now + 48 * hour), createdAt: new Date(now - 8 * hour) },
      { _id: 'off_t4', ticketId: 'T-2044', subject: 'Thermostat not responding', customer: 'Nimal Perera', category: 'repair', priority: 'medium', status: 'open', assignedTo: '', slaDueAt: new Date(now + 12 * hour), createdAt: new Date(now - 2 * hour) },
      { _id: 'off_t5', ticketId: 'T-2039', subject: 'Post-service inspection', customer: 'Green Valley Hotel', category: 'inspection', priority: 'low', status: 'resolved', assignedTo: 'S. Jayasuriya', slaDueAt: new Date(now - 6 * hour), createdAt: new Date(now - 30 * hour) },
    ];

    const summary: TicketSummary = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      inProgress: tickets.filter((t) => t.status === 'in-progress').length,
      escalated: tickets.filter((t) => t.status === 'escalated').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
    };

    if (filters.status && filters.status !== 'all') {
      tickets = tickets.filter((t) => t.status === filters.status);
    }
    if (filters.priority && filters.priority !== 'all') {
      tickets = tickets.filter((t) => t.priority === filters.priority);
    }

    return { status: 'Offline', summary, tickets };
  }
}
