import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  AnalyticsData,
  AnalyticsPeriod,
  AnalyticsService,
  ComparisonMetric,
  NamedValue,
} from '../../services/analytics.service';

interface TrendPoint {
  x: number;
  y: number;
  index: number;
  value: number;
  label: string;
}

interface DonutSegment extends NamedValue {
  percent: number;
  dash: string;
  offset: number;
  className: string;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
})
export class AnalyticsComponent implements OnInit {
  section: 'performance' | 'service' | 'purchasing' | 'inventory' = 'performance';
  readonly periods: Array<{ key: AnalyticsPeriod; label: string }> = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '12m', label: '12 Months' },
  ];
  readonly chartWidth = 680;
  readonly chartHeight = 260;
  readonly chartLeft = 42;
  readonly chartRight = 16;
  readonly chartTop = 18;
  readonly chartBottom = 38;
  readonly gridFractions = [0, 0.25, 0.5, 0.75, 1];

  activePeriod: AnalyticsPeriod = '7d';
  data: AnalyticsData | null = null;
  loading = false;
  errorMessage = '';
  activeTrendIndex: number | null = null;

  constructor(private readonly analyticsService: AnalyticsService, private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => this.section = data['analyticsSection'] || 'performance');
    this.load();
  }

  selectPeriod(period: AnalyticsPeriod): void {
    if (period === this.activePeriod && this.data) return;
    this.activePeriod = period;
    this.activeTrendIndex = null;
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

  max(items: NamedValue[]): number { return Math.max(1, ...items.map((item) => item.value)); }

  total(items: NamedValue[]): number { return items.reduce((sum, item) => sum + item.value, 0); }

  countTotal(items: Array<{ count: number }>): number { return items.reduce((sum, item) => sum + item.count, 0); }

  positive(items: NamedValue[]): NamedValue[] { return items.filter((item) => item.value > 0); }

  pendingPurchaseCount(report: AnalyticsData): number {
    return report.purchasing.currentPipeline
      .filter((item) => ['pending-manager', 'pending-finance'].includes(item.status))
      .reduce((sum, item) => sum + item.count, 0);
  }

  decisionCount(report: AnalyticsData, stage: 'manager' | 'finance'): number {
    return report.purchasing.periodDecisions
      .filter((item) => item.stage === stage)
      .reduce((sum, item) => sum + item.count, 0);
  }

  percentage(value: number, total: number): number { return total ? Math.round((value / total) * 100) : 0; }

  barWidth(value: number, max: number): number { return max > 0 ? Math.max(0, (value / max) * 100) : 0; }

  poProgress(report: AnalyticsData): number {
    const ordered = report.purchasing.poProgress.orderedQuantity;
    return ordered ? Math.min(100, (report.purchasing.poProgress.receivedQuantity / ordered) * 100) : 0;
  }

  deltaText(metric: ComparisonMetric): string {
    if (metric.deltaKind === 'new') return 'New vs previous period';
    if (metric.deltaKind === 'no-change') return 'No change';
    const prefix = Number(metric.deltaPercent) > 0 ? '+' : '';
    return `${prefix}${metric.deltaPercent}% vs previous period`;
  }

  deltaClass(metric: ComparisonMetric): string {
    if (metric.deltaKind !== 'percent' || metric.semantic === 'neutral' || metric.deltaPercent === 0) return 'neutral';
    const increase = Number(metric.deltaPercent) > 0;
    const favorable = metric.semantic === 'higher-is-better' ? increase : !increase;
    return favorable ? 'positive' : 'negative';
  }

  trendMax(report: AnalyticsData): number {
    return Math.max(1, ...report.serviceOperations.ticketTrend.created, ...report.serviceOperations.ticketTrend.resolved);
  }

  trendPoints(report: AnalyticsData, series: 'created' | 'resolved'): TrendPoint[] {
    const trend = report.serviceOperations.ticketTrend;
    const values = trend[series];
    const usableWidth = this.chartWidth - this.chartLeft - this.chartRight;
    const usableHeight = this.chartHeight - this.chartTop - this.chartBottom;
    const maximum = this.trendMax(report);
    return values.map((value, index) => ({
      x: this.chartLeft + (values.length <= 1 ? usableWidth / 2 : (index / (values.length - 1)) * usableWidth),
      y: this.chartTop + usableHeight - (value / maximum) * usableHeight,
      index,
      value,
      label: trend.labels[index],
    }));
  }

  linePath(points: TrendPoint[]): string {
    return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  }

  areaPath(report: AnalyticsData): string {
    const points = this.trendPoints(report, 'created');
    if (!points.length) return '';
    const baseline = this.chartHeight - this.chartBottom;
    return `${this.linePath(points)} L ${points.at(-1)?.x} ${baseline} L ${points[0].x} ${baseline} Z`;
  }

  gridY(fraction: number): number {
    return this.chartTop + (1 - fraction) * (this.chartHeight - this.chartTop - this.chartBottom);
  }

  gridValue(report: AnalyticsData, fraction: number): number {
    return Math.round(this.trendMax(report) * fraction);
  }

  showAxisLabel(index: number, count: number): boolean {
    if (count <= 12) return true;
    const interval = count >= 30 ? 5 : 2;
    return index === 0 || index === count - 1 || index % interval === 0;
  }

  hasTrendActivity(report: AnalyticsData): boolean {
    const trend = report.serviceOperations.ticketTrend;
    return [...trend.created, ...trend.resolved].some((value) => value > 0);
  }

  donutSegments(items: NamedValue[]): DonutSegment[] {
    const total = this.total(items);
    const circumference = 2 * Math.PI * 48;
    let consumed = 0;
    return items.map((item, index) => {
      const percent = total ? (item.value / total) * 100 : 0;
      const length = total ? (item.value / total) * circumference : 0;
      const segment = {
        ...item,
        percent: Math.round(percent),
        dash: `${length} ${circumference - length}`,
        offset: -consumed,
        className: `segment-${index % 5}`,
      };
      consumed += length;
      return segment;
    });
  }

  label(value: string): string {
    return value.replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
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
      ['Stock risk items', 'current-snapshot', report.currentPosition.stockRiskItems.value, report.currentPosition.stockRiskItems.asOf.toString()],
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
      ['PO progress', 'Ordered', 'Received'],
      ['Quantity', report.purchasing.poProgress.orderedQuantity, report.purchasing.poProgress.receivedQuantity],
      ['Value', report.purchasing.poProgress.orderedValue, report.purchasing.poProgress.receivedValue],
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
      ['Average authorization hours', report.exceptions.averageAuthorizationHours],
      ['Awaiting Finance', report.exceptions.awaitingFinance.value],
      ['Awaiting receipt', report.exceptions.awaitingReceipt.value],
      ['Authorized value', report.exceptions.authorizedValue],
      ['Received authorized value', report.exceptions.receivedAuthorizedValue],
      ['SLA-supported jobs', report.exceptions.slaProtectedJobs],
      [],
      ['Non-PO reason', 'Count', 'Value'],
      ...report.exceptions.byReason.map((item) => [item.label, item.count, item.value]),
      [],
      ['Non-PO supplier', 'Count', 'Value'],
      ...report.exceptions.bySupplier.map((item) => [item.label, item.count, item.value]),
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
