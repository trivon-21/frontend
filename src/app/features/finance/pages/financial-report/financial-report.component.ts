import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinancialReportService } from '../../services/financial-report.service';

@Component({
  selector: 'app-financial-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financial-report.component.html',
  styleUrls: ['./financial-report.component.css']
})
export class FinancialReportComponent implements OnInit {

  activeTab = 'summary';

  // Date range
  startDate = this.firstOfMonth();
  endDate = this.today();

  // Summary tab
  summary: any = {};
  monthlyData: any[] = [];
  isLoadingSummary = false;

  // Collections tab
  collections: any[] = [];
  isLoadingCollections = false;

  // Transactions tab
  transactions: any[] = [];
  txTotal = 0;
  txPage = 1;
  txStatus = 'ALL';
  isLoadingTx = false;

  // Outstanding tab
  outstanding: any[] = [];
  isLoadingOutstanding = false;

  constructor(private reportService: FinancialReportService) { }

  ngOnInit(): void { this.loadTab(); }

  firstOfMonth(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  }
  today(): string { return new Date().toISOString().split('T')[0]; }

  setTab(tab: string): void { this.activeTab = tab; this.loadTab(); }

  loadTab(): void {
    switch (this.activeTab) {
      case 'summary': this.loadSummary(); break;
      case 'collections': this.loadCollections(); break;
      case 'transactions': this.loadTransactions(); break;
      case 'outstanding': this.loadOutstanding(); break;
    }
  }

  applyDateFilter(): void { this.txPage = 1; this.loadTab(); }

  // ── Summary ─────────────────────────────────────────────────────────────────
  loadSummary(): void {
    this.isLoadingSummary = true;
    this.reportService.getSummary(this.startDate, this.endDate).subscribe({
      next: (data) => { this.summary = data; this.monthlyData = data.monthlyData || []; this.isLoadingSummary = false; },
      error: (err) => { console.error(err); this.isLoadingSummary = false; }
    });
  }

  get maxMonthly(): number { return Math.max(...this.monthlyData.map(m => m.total), 1); }

  barHeight(val: number): number { return Math.round((val / this.maxMonthly) * 100); }

  // ── Collections ─────────────────────────────────────────────────────────────
  loadCollections(): void {
    this.isLoadingCollections = true;
    this.reportService.getCollections(this.startDate, this.endDate).subscribe({
      next: (data) => { this.collections = data; this.isLoadingCollections = false; },
      error: (err) => { console.error(err); this.isLoadingCollections = false; }
    });
  }

  getCollectionsTotal(): number {
    return this.collections.reduce((s, c) => s + (c.amount || 0), 0);
  }

  // ── Transactions ─────────────────────────────────────────────────────────────
  loadTransactions(): void {
    this.isLoadingTx = true;
    this.reportService.getTransactions(this.startDate, this.endDate, this.txStatus, this.txPage).subscribe({
      next: (data) => { this.transactions = data.transactions || []; this.txTotal = data.total || 0; this.isLoadingTx = false; },
      error: (err) => { console.error(err); this.isLoadingTx = false; }
    });
  }

  txNextPage(): void { if (this.txPage * 15 < this.txTotal) { this.txPage++; this.loadTransactions(); } }
  txPrevPage(): void { if (this.txPage > 1) { this.txPage--; this.loadTransactions(); } }

  // ── Outstanding ──────────────────────────────────────────────────────────────
  loadOutstanding(): void {
    this.isLoadingOutstanding = true;
    this.reportService.getOutstanding().subscribe({
      next: (data) => { this.outstanding = data; this.isLoadingOutstanding = false; },
      error: (err) => { console.error(err); this.isLoadingOutstanding = false; }
    });
  }

  get overdueCount(): number { return this.outstanding.filter(o => o.overdue).length; }
  get overdueAmount(): number { return this.outstanding.filter(o => o.overdue).reduce((s, o) => s + o.grandTotal, 0); }
  get totalOutstanding(): number { return this.outstanding.reduce((s, o) => s + o.grandTotal, 0); }

  // ── Status helpers ────────────────────────────────────────────────────────────
  statusClass(s: string): string {
    const m: any = { PAID: 'badge-paid', ACCEPTED: 'badge-accepted', DRAFT: 'badge-draft', SENT: 'badge-sent', REJECTED: 'badge-rejected', AUTO_CANCELLED: 'badge-cancelled' };
    return m[s] || '';
  }
  statusLabel(s: string): string {
    const m: any = { PAID: 'Paid', ACCEPTED: 'Accepted', DRAFT: 'Pending', SENT: 'Sent', REJECTED: 'Rejected', AUTO_CANCELLED: 'Cancelled' };
    return m[s] || s;
  }

  // ── Export CSV ────────────────────────────────────────────────────────────────
  exportCSV(): void {
    let csv = '';
    if (this.activeTab === 'transactions') {
      csv = 'Invoice No,Customer,Type,Amount,Status,Date\n' +
        this.transactions.map(t =>
          `${t.invoiceNumber},${t.customerName},${t.type},${t.grandTotal},${t.status},${new Date(t.createdAt).toLocaleDateString()}`
        ).join('\n');
    } else if (this.activeTab === 'collections') {
      csv = 'Date,Type,Reference,Customer,Amount,Status\n' +
        this.collections.map(c =>
          `${new Date(c.date).toLocaleDateString()},${c.type},${c.reference},${c.customer},${c.amount},${c.status}`
        ).join('\n');
    } else if (this.activeTab === 'outstanding') {
      csv = 'Invoice No,Customer,Amount,Due Date,Days Overdue\n' +
        this.outstanding.map(o =>
          `${o.invoiceNumber},${o.customerName},${o.grandTotal},${o.paymentDeadline ? new Date(o.paymentDeadline).toLocaleDateString() : '—'},${o.daysOverdue || 0}`
        ).join('\n');
    }
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `airlux-${this.activeTab}-${this.startDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  }
}