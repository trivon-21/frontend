import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DashboardAnalyticsResponse,
  LogStatisticsBucket,
  SystemLog,
  SystemLogsService,
} from '../../services/system-logs.service';

type LogFilters = {
  performedByRole: string;
  module?: string;
  status: string;
  startDate: string;
  search: string;
};

@Component({
  selector: 'app-system-logs-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system-logs-monitoring.component.html',
  styleUrls: ['./system-logs-monitoring.component.css'],
})
export class SystemLogsMonitoringComponent implements OnInit {
  loadingLogs = false;
  loadingAnalytics = false;
  loadingFilters = false;
  exportingCsv = false;
  error: string | null = null;

  logs: SystemLog[] = [];
  recentLogs: SystemLog[] = [];
  criticalSecurityEvents: SystemLog[] = [];
  topErrors: Array<{ _id: string | null; count: number; lastOccurred: string }> = [];
  analytics: DashboardAnalyticsResponse['analytics'] | null = null;

  currentPage = 1;
  totalPages = 1;
  pageSize = 10;
  totalLogs = 0;

  filterOptions = {
    logTypes: [] as string[],
    modules: [] as string[],
    roles: [] as string[],
    actionCategories: [] as string[],
    statuses: [] as string[],
  };

  // Selection state for deletion
  selectedIds: Set<string> = new Set();
  selectAllOnPage = false;

  filters: LogFilters = {
    performedByRole: '',
    module: '',
    status: '',
    startDate: '',
    search: '',
  };

  constructor(private systemLogsService: SystemLogsService) { }

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadAnalytics();
    this.loadLogs();
  }

  loadFilterOptions(): void {
    this.loadingFilters = true;
    this.systemLogsService.getFilterOptions().subscribe({
      next: (response) => {
        this.filterOptions = {
          logTypes: response.options.logTypes || [],
          modules: response.options.modules || [],
          roles: response.options.roles || [],
          actionCategories: response.options.actionCategories || [],
          statuses: response.options.statuses || [],
        };
        this.loadingFilters = false;
      },
      error: (error) => {
        console.error('Error loading log filter options:', error);
        this.loadingFilters = false;
      },
    });
  }

  loadAnalytics(): void {
    this.loadingAnalytics = true;
    this.systemLogsService.getDashboardAnalytics(30).subscribe({
      next: (response) => {
        this.analytics = response.analytics;
        this.recentLogs = response.analytics.recentLogs || [];
        this.criticalSecurityEvents = response.analytics.criticalSecurityEvents || [];
        this.topErrors = response.analytics.topErrors || [];
        this.loadingAnalytics = false;
      },
      error: (error) => {
        console.error('Error loading log analytics:', error);
        this.loadingAnalytics = false;
      },
    });
  }

  loadLogs(): void {
    this.loadingLogs = true;
    this.error = null;

    const baseFilters = {
      performedByRole: this.filters.performedByRole || undefined,
      module: this.filters.module || undefined,
      status: this.filters.status || undefined,
      startDate: this.filters.startDate || undefined,
    };

    const request$ = this.filters.search.trim()
      ? this.systemLogsService.searchLogs(this.filters.search.trim(), this.currentPage, this.pageSize, {
        performedByRole: baseFilters.performedByRole,
        status: baseFilters.status,
        startDate: baseFilters.startDate,
      })
      : this.systemLogsService.getLogs(this.currentPage, this.pageSize, baseFilters);

    request$.subscribe({
      next: (response) => {
        this.logs = response.data || [];
        this.totalLogs = response.pagination?.total || 0;
        this.totalPages = response.pagination?.pages || 1;
        this.currentPage = response.pagination?.page || this.currentPage;
        this.loadingLogs = false;
      },
      error: (error) => {
        console.error('Error loading system logs:', error);
        this.error = error.error?.message || 'Failed to load system logs';
        this.loadingLogs = false;
      },
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadLogs();
  }

  clearFilters(): void {
    this.filters = {
      performedByRole: '',
      status: '',
      startDate: '',
      search: '',
    };
    this.currentPage = 1;
    this.loadLogs();
  }

  refreshAll(): void {
    this.loadAnalytics();
    this.loadLogs();
  }

  downloadFilteredCsv(): void {
    this.exportingCsv = true;
    this.error = null;

    const exportFilters = {
      performedByRole: this.filters.performedByRole || undefined,
      module: this.filters.module || undefined,
      status: this.filters.status || undefined,
      startDate: this.filters.startDate || undefined,
    };

    this.systemLogsService.exportLogsCsv(exportFilters).subscribe({
      next: (blob) => {
        const now = new Date().toISOString().replace(/[:.]/g, '-');
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `system-logs-${now}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
        this.exportingCsv = false;
      },
      error: (error) => {
        console.error('Error exporting CSV:', error);
        this.error = error.error?.message || 'Failed to export filtered logs as CSV';
        this.exportingCsv = false;
      },
    });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.loadLogs();
  }

  countFromBucket(items: LogStatisticsBucket[] | undefined, key: string): number {
    return items?.find((item) => item._id === key)?.count || 0;
  }

  totalFromBuckets(items: LogStatisticsBucket[] | undefined): number {
    return items?.reduce((sum, item) => sum + item.count, 0) || 0;
  }

  formatActor(log: SystemLog): string {
    const actor = log.performedBy;
    if (!actor) {
      return 'System';
    }

    const name = actor.fullName || [actor.firstName, actor.lastName].filter(Boolean).join(' ');
    return name || actor.email || 'System';
  }

  formatActorMeta(log: SystemLog): string {
    const actor = log.performedBy;
    if (!actor) {
      return log.performedByRole || 'SYSTEM';
    }

    const contact = actor.email || actor.phoneNumber;
    return [actor.role || log.performedByRole, contact].filter(Boolean).join(' · ');
  }

  formatLabel(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  logTypeTone(logType: string): string {
    if (logType === 'ERROR') return 'danger';
    if (logType === 'SECURITY') return 'warning';
    return 'success';
  }

  statusTone(status: string | undefined): string {
    if (status === 'FAILED') return 'danger';
    if (status === 'PARTIAL') return 'warning';
    return 'success';
  }

  get totalActivityLogs(): number {
    return this.countFromBucket(this.analytics?.stats.byLogType, 'ACTIVITY');
  }

  get totalErrorLogs(): number {
    return this.countFromBucket(this.analytics?.stats.byLogType, 'ERROR');
  }

  get totalSecurityLogs(): number {
    return this.countFromBucket(this.analytics?.stats.byLogType, 'SECURITY');
  }

  get totalCriticalSecurityEvents(): number {
    return this.countFromBucket(this.analytics?.stats.securityEventsCount, 'CRITICAL');
  }

  get hasResults(): boolean {
    return this.logs.length > 0;
  }

  toggleSelectAllOnPage(): void {
    this.selectAllOnPage = !this.selectAllOnPage;
    if (this.selectAllOnPage) {
      this.logs.forEach((l) => this.selectedIds.add(l._id));
    } else {
      this.logs.forEach((l) => this.selectedIds.delete(l._id));
    }
  }

  toggleSelect(log: SystemLog): void {
    if (this.selectedIds.has(log._id)) {
      this.selectedIds.delete(log._id);
    } else {
      this.selectedIds.add(log._id);
    }
  }

  deleteSingle(log: SystemLog): void {
    const confirmed = confirm(`Delete log ${log._id}? This cannot be undone.`);
    if (!confirmed) return;

    this.systemLogsService.deleteLog(log._id).subscribe({
      next: () => {
        this.selectedIds.delete(log._id);
        this.loadLogs();
      },
      error: (err) => {
        console.error('Error deleting log:', err);
        this.error = err.error?.message || 'Failed to delete log';
      },
    });
  }

  deleteSelected(): void {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) {
      alert('No logs selected');
      return;
    }
    const confirmMsg = `Delete ${ids.length} selected log(s)? This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    this.systemLogsService.bulkDelete(ids).subscribe({
      next: () => {
        this.selectedIds.clear();
        this.selectAllOnPage = false;
        this.loadLogs();
      },
      error: (err) => {
        console.error('Error bulk deleting logs:', err);
        this.error = err.error?.message || 'Failed to delete selected logs';
      },
    });
  }
}