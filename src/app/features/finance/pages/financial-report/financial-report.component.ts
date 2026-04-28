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
    const fd = (d: any) => d ? `"${new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}"` : '"—"';
    let csv = '';

    if (this.activeTab === 'summary') {
      csv = 'Category,Amount (LKR)\n' +
        `Buy Only Revenue,${this.summary.buyOnlyRevenue || 0}\n` +
        `Inspection Fees,${this.summary.inspectionRevenue || 0}\n` +
        `Service Revenue,${this.summary.serviceRevenue || 0}\n` +
        `Invoice Payments,${this.summary.salesRevenue || 0}\n` +
        `Total Collected,${this.summary.totalCollected || 0}\n` +
        `Pending Collection,${this.summary.pendingRevenue || 0}`;
    } else if (this.activeTab === 'collections') {
      csv = 'Date,Type,Reference,Customer,Amount (LKR),Status\n' +
        this.collections.map(c =>
          `${fd(c.date)},${c.type},${c.reference},"${c.customer || '—'}",${c.amount},${c.status}`
        ).join('\n');
    } else if (this.activeTab === 'transactions') {
      csv = 'Invoice No,Customer,Type,Amount (LKR),Status,Created Date\n' +
        this.transactions.map(t =>
          `${t.invoiceNumber},"${t.customerName || '—'}",${t.type},${t.grandTotal || 0},${t.status},${fd(t.createdAt)}`
        ).join('\n');
    } else if (this.activeTab === 'outstanding') {
      csv = 'Invoice No,Customer,Amount Due (LKR),Accepted Date,Due Date,Days Overdue\n' +
        this.outstanding.map(o =>
          `${o.invoiceNumber},"${o.customerName || '—'}",${o.grandTotal},${fd(o.acceptedAt)},${fd(o.paymentDeadline)},${o.daysOverdue || 0}`
        ).join('\n');
    }

    if (!csv) return;
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `airlux-${this.activeTab}-${this.startDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  // PDF export — generates and downloads a formatted PDF version of the CSV data
  exportPDF(): void {
    const fd = (d: any) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    let rows: string[][] = [];
    let headers: string[] = [];
    let title = '';

    if (this.activeTab === 'summary') {
      title = 'Revenue Summary';
      headers = ['Category', 'Amount (LKR)'];
      rows = [
        ['Buy Only Revenue', (this.summary.buyOnlyRevenue || 0).toLocaleString()],
        ['Inspection Fees', (this.summary.inspectionRevenue || 0).toLocaleString()],
        ['Service Revenue', (this.summary.serviceRevenue || 0).toLocaleString()],
        ['Invoice Payments', (this.summary.salesRevenue || 0).toLocaleString()],
        ['Total Collected', (this.summary.totalCollected || 0).toLocaleString()],
        ['Pending Collection', (this.summary.pendingRevenue || 0).toLocaleString()],
      ];
    } else if (this.activeTab === 'collections') {
      title = 'Payment Collections';
      headers = ['Date', 'Type', 'Reference', 'Customer', 'Amount (LKR)', 'Status'];
      rows = this.collections.map(c => [fd(c.date), c.type, c.reference, c.customer || '—', (c.amount || 0).toLocaleString(), c.status]);
      rows.push(['', '', '', 'TOTAL', this.getCollectionsTotal().toLocaleString(), '']);
    } else if (this.activeTab === 'transactions') {
      title = 'Invoices / Transactions';
      headers = ['Invoice No', 'Customer', 'Amount (LKR)', 'Status', 'Date'];
      rows = this.transactions.map(t => [t.invoiceNumber, t.customerName || '—', (t.grandTotal || 0).toLocaleString(), t.status, fd(t.createdAt)]);
    } else if (this.activeTab === 'outstanding') {
      title = 'Outstanding Payments';
      headers = ['Invoice No', 'Customer', 'Amount Due', 'Due Date', 'Days Overdue'];
      rows = this.outstanding.map(o => [o.invoiceNumber, o.customerName || '—', (o.grandTotal || 0).toLocaleString(), fd(o.paymentDeadline), String(o.daysOverdue || 0)]);
    }

    // Build a printable HTML page and trigger print-to-PDF
    const colWidths = headers.map((_, i) => `${Math.floor(100 / headers.length)}%`).join(' ');
    const tableRows = rows.map(r =>
      `<tr>${r.map(c => `<td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:12px;">${c}</td>`).join('')}</tr>`
    ).join('');

    const html = `<!DOCTYPE html><html><head><title>AirLux ${title}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:32px;color:#1f2937;}
    h1{font-size:20px;color:#2d1b69;margin-bottom:4px;}
    .meta{font-size:12px;color:#6b7280;margin-bottom:20px;}
    table{width:100%;border-collapse:collapse;}
    th{background:#2d1b69;color:white;padding:10px;font-size:12px;text-align:left;}
    tr:nth-child(even){background:#f9fafb;}
    @media print{body{padding:16px;}}
  </style></head><body>
  <h1>AirLux Financial Report — ${title}</h1>
  <p class="meta">Period: ${this.startDate} to ${this.endDate} | Generated: ${new Date().toLocaleDateString('en-GB')}</p>
  <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${tableRows}</tbody></table>
  </body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 500);
    }
  }
}