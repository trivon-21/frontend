import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export type AnalyticsPeriod = '7d' | '30d' | '12m';
export interface NamedValue { label: string; value: number; }
export interface ApprovalSummary { status: string; count: number; value: number; }
export interface AnalyticsData {
  period: AnalyticsPeriod;
  status: string;
  generatedAt: Date;
  kpis: {
    ticketsCreated: number;
    ticketsResolved: number;
    avgResolutionHours: number;
    pendingApprovalValue: number;
  };
  ticketTrend: { labels: string[]; created: number[]; resolved: number[] };
  ticketStatus: NamedValue[];
  serviceTypes: NamedValue[];
  technicianWorkload: Array<{ name: string; assigned: number }>;
  approvalSummary: ApprovalSummary[];
  inventorySignals: { lowStockAlerts: number; reservedItems: number; pendingRequests: number };
  procurementSignals: {
    orderedQuantity: number; receivedQuantity: number;
    nonPoCount: number; nonPoValue: number; emergencyCount: number; emergencyValue: number;
    nonPoPercentage: number; averageApprovalHours: number; awaitingFinance: number; awaitingReceipt: number;
    byReason: Array<{ label: string; count: number; value: number }>;
    repeatedSkus: Array<{ sku: string; count: number }>;
    authorizedValue: number; receivedAuthorizedValue: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private apiUrl = 'http://localhost:5000/api/manager';
  constructor(private http: HttpClient) {}

  getAnalytics(period: AnalyticsPeriod): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(`${this.apiUrl}/analytics`, { params: { period } }).pipe(
      map((data) => ({ ...data, generatedAt: new Date(data.generatedAt) })),
      catchError((error) => {
        console.error('Manager analytics unavailable.', error);
        return of({
          period,
          status: 'Offline',
          generatedAt: new Date(),
          kpis: { ticketsCreated: 0, ticketsResolved: 0, avgResolutionHours: 0, pendingApprovalValue: 0 },
          ticketTrend: { labels: [], created: [], resolved: [] },
          ticketStatus: [],
          serviceTypes: [],
          technicianWorkload: [],
          approvalSummary: [],
          inventorySignals: { lowStockAlerts: 0, reservedItems: 0, pendingRequests: 0 },
          procurementSignals: {
            orderedQuantity: 0, receivedQuantity: 0, nonPoCount: 0, nonPoValue: 0,
            emergencyCount: 0, emergencyValue: 0, nonPoPercentage: 0, averageApprovalHours: 0,
            awaitingFinance: 0, awaitingReceipt: 0, byReason: [], repeatedSkus: [],
            authorizedValue: 0, receivedAuthorizedValue: 0,
          },
        });
      }),
    );
  }
}
