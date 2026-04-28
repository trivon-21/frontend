import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface LogUser {
  _id?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
}

export interface LogValueChange {
  before?: any;
  after?: any;
  oldValue?: any;
  newValue?: any;
}

export interface SystemLog {
  _id: string;
  performedBy?: LogUser | null;
  performedByRole?: string;
  logType: 'ACTIVITY' | 'ERROR' | 'SECURITY' | string;
  logLevel?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | string;
  module: string;
  action: string;
  actionCategory: string;
  entity: string;
  entityId?: string | null;
  changes?: Record<string, LogValueChange>;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: 'SUCCESS' | 'FAILED' | 'PARTIAL' | string;
  statusCode?: number | null;
  errorDetails?: {
    errorType?: string | null;
    errorMessage?: string | null;
  };
  securityDetails?: {
    attemptCount?: number | null;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string | null;
    securityFlags?: string[];
  };
  requestDetails?: {
    method?: string | null;
    endpoint?: string | null;
  };
  createdAt: string;
}

export interface LogPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface LogsResponse {
  success: boolean;
  data: SystemLog[];
  pagination: LogPagination;
}

export interface FilterOptionsResponse {
  success: boolean;
  options: {
    logTypes: string[];
    modules: string[];
    roles: string[];
    actionCategories: string[];
    statuses: string[];
  };
}

export interface LogStatisticsBucket {
  _id: string | null;
  count: number;
}

export interface LogStatistics {
  byLogType?: LogStatisticsBucket[];
  byModule?: LogStatisticsBucket[];
  byStatus?: LogStatisticsBucket[];
  byRole?: LogStatisticsBucket[];
  byActionCategory?: LogStatisticsBucket[];
  errorsSummary?: Array<{ _id: string | null; count: number; lastOccurred?: string }>;
  securityEventsCount?: Array<{ _id: string | null; count: number }>;
  totalLogs?: Array<{ _id: null; count: number }>;
}

export interface DashboardAnalyticsResponse {
  success: boolean;
  analytics: {
    stats: LogStatistics;
    recentLogs: SystemLog[];
    failedActions: SystemLog[];
    criticalSecurityEvents: SystemLog[];
    topErrors: Array<{ _id: string | null; count: number; lastOccurred: string }>;
    dateRange: {
      start: string;
      end: string;
      days: number;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class SystemLogsService {
  constructor(private apiService: ApiService) { }

  private buildFilterParams(
    page: number,
    limit: number,
    filters: {
      logType?: string;
      module?: string;
      actionCategory?: string;
      performedByRole?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });

    return params;
  }

  getLogs(
    page: number = 1,
    limit: number = 10,
    filters: {
      logType?: string;
      module?: string;
      actionCategory?: string;
      performedByRole?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Observable<LogsResponse> {
    const params = this.buildFilterParams(page, limit, filters);
    return this.apiService.get<LogsResponse>('/super-admin/logs', params);
  }

  searchLogs(
    query: string,
    page: number = 1,
    limit: number = 10,
    filters: {
      logType?: string;
      module?: string;
      status?: string;
      performedByRole?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Observable<LogsResponse> {
    let params = this.buildFilterParams(page, limit, filters)
      .set('query', query)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.apiService.get<LogsResponse>('/super-admin/logs/search', params);
  }

  exportLogsCsv(filters: {
    logType?: string;
    module?: string;
    actionCategory?: string;
    performedByRole?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Observable<Blob> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });

    return this.apiService.getBlob('/super-admin/logs/export/csv', params);
  }

  deleteLog(id: string): Observable<any> {
    return this.apiService.delete(`/super-admin/logs/${id}`);
  }

  bulkDelete(ids: string[]): Observable<any> {
    return this.apiService.post(`/super-admin/logs/bulk-delete`, { ids });
  }

  getDashboardAnalytics(days: number = 30): Observable<DashboardAnalyticsResponse> {
    const params = new HttpParams().set('days', days.toString());
    return this.apiService.get<DashboardAnalyticsResponse>('/super-admin/logs/analytics/dashboard', params);
  }

  getFilterOptions(): Observable<FilterOptionsResponse> {
    return this.apiService.get<FilterOptionsResponse>('/super-admin/logs/filters/options');
  }
}