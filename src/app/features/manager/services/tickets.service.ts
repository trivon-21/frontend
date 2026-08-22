import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

export type WorkItemSource = 'service' | 'inspection' | 'installation' | 'maintenance';
export type WorkItemPriority = 'high' | 'medium' | 'low';
export type WorkItemStatus =
  | 'open' | 'ready' | 'assigned' | 'scheduled' | 'in-progress' | 'blocked'
  | 'awaiting-payment' | 'payment-review' | 'awaiting-verification'
  | 'escalated' | 'closed' | 'cancelled' | 'unknown';
export type WorkItemAction = 'update-control' | 'escalate' | 'clear-escalation' | 'close' | 'reopen';

export interface SafeCustomer {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
}

export interface SafeTeam { id: string; teamName: string; specialization?: string; }
export interface SafeTechnician { id: string; fullName: string; role: string; }
export interface OperationalBlocker { type: string; message: string; status?: string; }
export interface WorkItemChild {
  type: string;
  id: string;
  status: string;
  jobType?: string;
  repairStatus?: string;
  submittedAt?: Date | null;
  nextServiceDate?: Date | null;
  itemCount?: number;
  authorizationNumber?: string;
}

export interface OperationalWorkItem {
  id: string;
  sourceType: WorkItemSource;
  sourceId: string;
  reference: string;
  customer: SafeCustomer | null;
  category: string;
  operationalStatus: WorkItemStatus;
  domainStatus: string;
  priority: WorkItemPriority;
  slaDueAt: Date | null;
  assignedTeam: SafeTeam | null;
  assignedTechnician: SafeTechnician | null;
  escalated: boolean;
  managerClosed: boolean;
  blockers: OperationalBlocker[];
  children: WorkItemChild[];
  allowedActions: WorkItemAction[];
  version: number;
  technicalComplete: boolean;
  reportComplete: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface WorkItemSummary {
  total: number;
  open: number;
  inProgress: number;
  escalated: number;
  awaitingVerification: number;
  closed: number;
}

export interface WorkItemsResponse {
  status: string;
  summary: WorkItemSummary;
  page: number;
  limit: number;
  total: number;
  items: OperationalWorkItem[];
}

export interface WorkItemFilters {
  type?: string;
  status?: string;
  priority?: string;
  assignment?: string;
  sla?: string;
  page?: number;
}

const EMPTY_RESPONSE: WorkItemsResponse = {
  status: 'Offline',
  summary: { total: 0, open: 0, inProgress: 0, escalated: 0, awaitingVerification: 0, closed: 0 },
  page: 1,
  limit: 25,
  total: 0,
  items: [],
};

function hydrate(item: OperationalWorkItem): OperationalWorkItem {
  return {
    ...item,
    slaDueAt: item.slaDueAt ? new Date(item.slaDueAt) : null,
    createdAt: item.createdAt ? new Date(item.createdAt) : null,
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
    children: (item.children || []).map((child) => ({
      ...child,
      submittedAt: child.submittedAt ? new Date(child.submittedAt) : null,
      nextServiceDate: child.nextServiceDate ? new Date(child.nextServiceDate) : null,
    })),
  };
}

@Injectable({ providedIn: 'root' })
export class TicketsService {
  constructor(private readonly api: ApiService) {}

  getWorkItems(filters: WorkItemFilters = {}): Observable<WorkItemsResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '' && value !== 'all') params = params.set(key, String(value));
    }
    return this.api.get<WorkItemsResponse>('/manager/work-items', params).pipe(
      map((response) => ({ ...response, items: response.items.map(hydrate) })),
      catchError(() => of(EMPTY_RESPONSE)),
    );
  }

  updateControl(item: OperationalWorkItem, priority: WorkItemPriority, slaDueAt: string | null): Observable<OperationalWorkItem> {
    return this.api.patch<OperationalWorkItem>(`/manager/work-items/${item.sourceType}/${item.sourceId}/control`, {
      priority,
      slaDueAt,
      expectedVersion: item.version,
    }).pipe(map(hydrate));
  }

  runAction(item: OperationalWorkItem, action: Exclude<WorkItemAction, 'update-control'>, reason: string): Observable<OperationalWorkItem> {
    return this.api.post<OperationalWorkItem>(`/manager/work-items/${item.sourceType}/${item.sourceId}/${action}`, {
      reason,
      expectedVersion: item.version,
    }).pipe(map(hydrate));
  }
}
