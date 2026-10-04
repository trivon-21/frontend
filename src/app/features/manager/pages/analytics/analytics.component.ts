import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import {
  AnalyticsData,
  AnalyticsPeriod,
  AnalyticsService,
  ComparisonMetric,
} from '../../services/analytics.service';
import { MgrAnalyticsPerformanceComponent } from './components/mgr-analytics-performance/mgr-analytics-performance.component';
import { MgrAnalyticsFinancialComponent } from './components/mgr-analytics-financial/mgr-analytics-financial.component';
import { MgrAnalyticsServiceComponent } from './components/mgr-analytics-service/mgr-analytics-service.component';
import { MgrAnalyticsPurchasingComponent } from './components/mgr-analytics-purchasing/mgr-analytics-purchasing.component';
import { MgrAnalyticsInventoryComponent } from './components/mgr-analytics-inventory/mgr-analytics-inventory.component';
import { MgrAnalyticsCoverageComponent } from './components/mgr-analytics-coverage/mgr-analytics-coverage.component';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    PortalIconsModule,
    MgrAnalyticsPerformanceComponent,
    MgrAnalyticsFinancialComponent,
    MgrAnalyticsServiceComponent,
    MgrAnalyticsPurchasingComponent,
    MgrAnalyticsInventoryComponent,
    MgrAnalyticsCoverageComponent,
  ],
  templateUrl: './analytics.component.html',
  styleUrls: ['./components/analytics-section-shared.css', './analytics.component.css'],
})
export class AnalyticsComponent implements OnInit {
  section: 'performance' | 'service' | 'financial' | 'purchasing' | 'inventory' = 'performance';
  readonly periods: Array<{ key: AnalyticsPeriod; label: string }> = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '12m', label: '12 Months' },
  ];

  activePeriod: AnalyticsPeriod = '7d';
  data: AnalyticsData | null = null;
  loading = false;
  errorMessage = '';

  constructor(private readonly analyticsService: AnalyticsService, private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => this.section = data['analyticsSection'] || 'performance');
    this.load();
  }

  selectPeriod(period: AnalyticsPeriod): void {
    if (period === this.activePeriod && this.data) return;
    this.activePeriod = period;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.analyticsService.getAnalytics(this.activePeriod).subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: (error) => {
        this.data = null;
        this.loading = false;
        this.errorMessage = error.error?.message || 'Live analytics are unavailable. Please try again.';
      },
    });
  }

  exportCsv(): void {
    if (!this.data) return;
    const report = this.data;
    const bounds = report.reportingPeriod;
    const rows: Array<Array<string | number>> = [
      ['Airlux Manager Analytics'],
      ['Selected period', report.period],
      ['Current period start', bounds.currentStart.toISOString()],
      ['Current period end', bounds.currentEnd.toISOString()],
      ['Previous period start', bounds.previousStart.toISOString()],
      ['Previous period end', bounds.previousEnd.toISOString()],
      ['Generated at', report.generatedAt.toISOString()],
      [],
      ['Performance metric', 'Scope', 'Current', 'Previous', 'Delta type', 'Delta percent'],
      ...this.performanceCsvRows(report),
      [],
      ['Current position', 'Scope', 'Value', 'As of'],
      ['Open ticket backlog', 'current-snapshot', report.currentPosition.openTickets.value, report.currentPosition.openTickets.asOf.toString()],
      ['Unassigned tickets', 'current-snapshot', report.currentPosition.unassignedTickets.value, report.currentPosition.unassignedTickets.asOf.toString()],
      ['SLA risk tickets', 'current-snapshot', report.currentPosition.slaRiskTickets.value, report.currentPosition.slaRiskTickets.asOf.toString()],
      ['Pending approval value', 'current-snapshot', report.currentPosition.pendingApprovalValue.value, report.currentPosition.pendingApprovalValue.asOf.toString()],
      [],
      ['Financial metric', 'Scope', 'Current', 'Previous', 'Delta type', 'Delta percent'],
      ['Collected revenue', 'period', report.financial.collectedRevenue.current, report.financial.collectedRevenue.previous, report.financial.collectedRevenue.deltaKind, report.financial.collectedRevenue.deltaPercent ?? ''],
      ['Received procurement spend', 'period', report.financial.procurementSpend.current, report.financial.procurementSpend.previous, report.financial.procurementSpend.deltaKind, report.financial.procurementSpend.deltaPercent ?? ''],
      ['Operating contribution before overhead', 'period', report.financial.operatingContribution.current, report.financial.operatingContribution.previous, report.financial.operatingContribution.deltaKind, report.financial.operatingContribution.deltaPercent ?? ''],
      [],
      ['Financial position', 'Count', 'Value', 'As of'],
      ['Outstanding receivables', report.financial.outstandingReceivables.count, report.financial.outstandingReceivables.value, report.financial.outstandingReceivables.asOf.toString()],
      ['Purchase commitments', '', report.financial.purchaseCommitments.value, report.financial.purchaseCommitments.asOf.toString()],
      [],
      ['Financial bucket', 'Collected revenue', 'Received procurement spend'],
      ...report.financial.trend.labels.map((label, index) => [label, report.financial.trend.collectedRevenue[index], report.financial.trend.procurementSpend[index]]),
      [],
      ['Bucket', 'Tickets created', 'Tickets resolved'],
      ...report.serviceOperations.ticketTrend.labels.map((item, index) => [item, report.serviceOperations.ticketTrend.created[index], report.serviceOperations.ticketTrend.resolved[index]]),
      [],
      ['Current ticket status', 'Count'],
      ...report.serviceOperations.currentTicketStatus.map((item) => [item.label, item.value]),
      [],
      ['Current assignee', 'Active', 'SLA risk', 'Escalated', 'Awaiting action', 'Completed in period'],
      ...report.workforce.currentWorkload.map((item) => [item.name, item.active, item.slaRisk, item.escalated, item.awaitingAction, item.completedInPeriod]),
      [],
      ['Current purchase stage', 'Count', 'Value'],
      ...report.purchasing.currentPipeline.map((item) => [item.status, item.count, item.value]),
      [],
      ['Decision stage', 'Decision', 'Count', 'Value'],
      ...report.purchasing.periodDecisions.map((item) => [item.stage, item.decision, item.count, item.value]),
      [],
      ['Inventory risk', 'Status', 'Available', 'Reserved', 'Reorder level'],
      ...report.inventoryRisk.topRisks.map((item) => [`${item.sku} ${item.name}`, item.status, item.available, item.reserved, item.reorderLevel]),
      [],
      ['Exception metric', 'Value'],
      ['Non-PO count', report.exceptions.nonPoCount],
      ['Non-PO value', report.exceptions.nonPoValue],
      ['Emergency count', report.exceptions.emergencyCount],
      ['Emergency value', report.exceptions.emergencyValue],
      ['Non-PO percentage', report.exceptions.nonPoPercentage],
      ['Awaiting Finance', report.exceptions.awaitingFinance.value],
      ['Awaiting receipt', report.exceptions.awaitingReceipt.value],
      ['SLA-supported jobs', report.exceptions.slaProtectedJobs],
      [],
      ['Non-PO reason', 'Count', 'Value'],
      ...report.exceptions.byReason.map((item) => [item.label, item.count, item.value]),
      [],
      ['Data coverage', 'Status', 'Detail'],
      ...report.dataCoverage.map((item) => [item.key, item.status, item.message]),
    ];
    const csv = rows.map((row) => row.map((value) => this.csv(String(value ?? ''))).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `airlux-manager-analytics-${this.activePeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private performanceCsvRows(report: AnalyticsData): Array<Array<string | number>> {
    const rows: Array<[string, ComparisonMetric]> = [
      ['Tickets created', report.performance.ticketsCreated],
      ['Tickets resolved', report.performance.ticketsResolved],
      ['Average resolution hours', report.performance.averageResolutionHours],
      ['Purchase request count', report.performance.purchaseRequestCount],
      ['Purchase request value', report.performance.purchaseRequestValue],
      ['Manager decisions', report.performance.managerDecisions],
      ['Finance decisions', report.performance.financeDecisions],
    ];
    return rows.map(([label, metric]) => [label, 'period', metric.current, metric.previous, metric.deltaKind, metric.deltaPercent ?? '']);
  }

  private csv(value: string): string {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }
}
