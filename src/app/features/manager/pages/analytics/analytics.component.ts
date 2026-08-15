import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AnalyticsData, AnalyticsPeriod, AnalyticsService, NamedValue } from '../../services/analytics.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
})
export class AnalyticsComponent implements OnInit {
  readonly periods: Array<{ key: AnalyticsPeriod; label: string }> = [
    { key: '7d', label: '7 Days' }, { key: '30d', label: '30 Days' }, { key: '12m', label: '12 Months' },
  ];
  activePeriod: AnalyticsPeriod = '7d';
  data: AnalyticsData | null = null;
  loading = false;
  private readonly palette = ['#2a78d6', '#1baf7a', '#eda100', '#e34948', '#4a3aa7'];

  constructor(private analyticsService: AnalyticsService) {}
  ngOnInit(): void { this.load(); }
  selectPeriod(period: AnalyticsPeriod): void { this.activePeriod = period; this.load(); }

  load(): void {
    this.loading = true;
    this.analyticsService.getAnalytics(this.activePeriod).subscribe((data) => {
      this.data = data;
      this.loading = false;
    });
  }

  color(index: number): string { return this.palette[index % this.palette.length]; }
  max(items: NamedValue[]): number { return Math.max(1, ...items.map((item) => item.value)); }
  maxWorkload(data: AnalyticsData): number { return Math.max(1, ...data.technicianWorkload.map((item) => item.assigned)); }
  maxTrend(data: AnalyticsData): number { return Math.max(1, ...data.ticketTrend.created, ...data.ticketTrend.resolved); }

  exportCsv(): void {
    if (!this.data) return;
    const data = this.data;
    const rows = [
      ['Metric', 'Value'],
      ['Tickets created', data.kpis.ticketsCreated],
      ['Tickets resolved', data.kpis.ticketsResolved],
      ['Average resolution hours', data.kpis.avgResolutionHours],
      ['Pending approval value', data.kpis.pendingApprovalValue],
      [],
      ['Period', 'Tickets created', 'Tickets resolved'],
      ...data.ticketTrend.labels.map((label, index) => [label, data.ticketTrend.created[index], data.ticketTrend.resolved[index]]),
      [],
      ['Ticket status', 'Count'],
      ...data.ticketStatus.map((item) => [item.label, item.value]),
      [],
      ['Technician', 'Assigned tickets'],
      ...data.technicianWorkload.map((item) => [item.name, item.assigned]),
      [],
      ['Approval status', 'Count', 'Value'],
      ...data.approvalSummary.map((item) => [item.status, item.count, item.value]),
      [],
      ['Procurement exception', 'Value'],
      ['PO ordered quantity', data.procurementSignals.orderedQuantity],
      ['PO received quantity', data.procurementSignals.receivedQuantity],
      ['Non-PO count', data.procurementSignals.nonPoCount],
      ['Non-PO value', data.procurementSignals.nonPoValue],
      ['Emergency count', data.procurementSignals.emergencyCount],
      ['Emergency value', data.procurementSignals.emergencyValue],
      ['Non-PO percentage', data.procurementSignals.nonPoPercentage],
      ['Average approval hours', data.procurementSignals.averageApprovalHours],
      ['Awaiting Finance', data.procurementSignals.awaitingFinance],
      ['Awaiting receipt', data.procurementSignals.awaitingReceipt],
      ['Authorized value', data.procurementSignals.authorizedValue],
      ['Received authorized value', data.procurementSignals.receivedAuthorizedValue],
      [],
      ['Non-PO reason', 'Count', 'Value'],
      ...data.procurementSignals.byReason.map(item => [item.label, item.count, item.value]),
      [],
      ['Repeated Non-PO SKU', 'Count'],
      ...data.procurementSignals.repeatedSkus.map(item => [item.sku, item.count]),
    ];
    const csv = rows.map((row) => row.map((value) => this.csv(String(value ?? ''))).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `airlux-manager-analytics-${this.activePeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private csv(value: string): string { return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value; }
}
