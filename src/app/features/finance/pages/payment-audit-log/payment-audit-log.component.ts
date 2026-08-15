import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../services/audit-log.service';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-payment-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-audit-log.component.html',
  styleUrls: ['./payment-audit-log.component.css']
})
export class PaymentAuditLogComponent implements OnInit {

  logs: any[] = [];
  selectedLog: any = null;
  showModal = false;
  isLoading = false;

  // Stats
  totalLogs = 0;
  approved = 0;
  rejected = 0;
  pending = 0;

  // Filters
  searchQuery = '';
  paymentType = 'ALL';
  eventType = 'ALL';
  startDate = '';
  endDate = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 15;
  totalItems = 0;

  showSlipPopup = false;
  showInvoicePopup = false;
  slipUrlToShow = '';
  invoiceToShow: any = null;

  paymentTypes = ['ALL', 'BUY_ONLY', 'INSPECTION', 'INVOICE', 'REPAIR', 'MAINTENANCE'];
  eventTypes = [
    'ALL',
    'PAYMENT_SUBMITTED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'PAYMENT_RESUBMITTED',
    'INVOICE_GENERATED', 'INVOICE_SENT', 'INVOICE_ACCEPTED', 'INVOICE_REJECTED',
    'INVOICE_REJECTION_CANCELLED', 'INVOICE_PAID', 'INVOICE_AUTO_CANCELLED',
    'SERVICE_PAYMENT_SUBMITTED', 'SERVICE_PAYMENT_APPROVED', 'SERVICE_PAYMENT_REJECTED',
  ];

  constructor(private auditLogService: AuditLogService, private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.loadStats();
    this.loadLogs();
  }

  loadStats(): void {
    this.auditLogService.getStats().subscribe({
      next: (s) => {
        this.totalLogs = s.total;
        this.approved = s.approved;
        this.rejected = s.rejected;
        this.pending = s.pending;
      },
      error: (err) => console.error(err)
    });
  }

  loadLogs(): void {
    this.isLoading = true;
    const filters: any = {
      page: this.currentPage,
      limit: this.itemsPerPage,
    };
    if (this.searchQuery.trim()) filters.search = this.searchQuery.trim();
    if (this.paymentType !== 'ALL') filters.paymentType = this.paymentType;
    if (this.eventType !== 'ALL') filters.eventType = this.eventType;
    if (this.startDate) filters.startDate = this.startDate;
    if (this.endDate) filters.endDate = this.endDate;

    this.auditLogService.getLogs(filters).subscribe({
      next: (res) => {
        this.logs = res.logs;
        this.totalItems = res.total;
        this.isLoading = false;
      },
      error: (err) => { console.error(err); this.isLoading = false; }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadLogs();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.paymentType = 'ALL';
    this.eventType = 'ALL';
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 1;
    this.loadLogs();
    this.loadStats();
  }

  openModal(log: any): void { this.selectedLog = log; this.showModal = true; }
  closeModal(): void { this.selectedLog = null; this.showModal = false; }

  viewSlip(): void {
    if (this.selectedLog?.slipUrl) {
      this.slipUrlToShow = this.selectedLog.slipUrl;
      this.showSlipPopup = true;
    }
  }
  closeSlipPopup(): void { this.showSlipPopup = false; this.slipUrlToShow = ''; }

  viewInvoice(): void {
    if (!this.selectedLog?.invoiceId) return;
    // Fetch invoice from backend
    const http = (this as any)._http; // inject HttpClient if not already
    // Simple approach: open a fetch via the audit log service or directly
    this.auditLogService.getInvoiceById(this.selectedLog.invoiceId).subscribe({
      next: (inv: any) => { this.invoiceToShow = inv; this.showInvoicePopup = true; },
      error: () => { this.notificationService.show('❌ Could not load invoice details.', 'error'); }
    });
  }

  closeInvoicePopup(): void { this.showInvoicePopup = false; this.invoiceToShow = null; }

  isImage(url: string): boolean {
    return !!url && (url.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url) ||
      (url.startsWith('http') && !url.includes('.pdf')));
  }
  isPDF(url: string): boolean {
    return !!url && (url.includes('.pdf') || url.startsWith('data:application/pdf'));
  }

  get totalPages(): number[] {
    return Array.from({ length: Math.ceil(this.totalItems / this.itemsPerPage) }, (_, i) => i + 1);
  }
  get startItem() { return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endItem() { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }
  nextPage() { if (this.currentPage * this.itemsPerPage < this.totalItems) { this.currentPage++; this.loadLogs(); } }
  prevPage() { if (this.currentPage > 1) { this.currentPage--; this.loadLogs(); } }
  goToPage(p: number) { this.currentPage = p; this.loadLogs(); }

  getEventLabel(e: string): string {
    const map: any = {
      PAYMENT_SUBMITTED: 'Slip Submitted',
      PAYMENT_APPROVED: 'Payment Approved',
      PAYMENT_REJECTED: 'Payment Rejected',
      PAYMENT_RESUBMITTED: 'Slip Re-uploaded',
      INVOICE_GENERATED: 'Invoice Generated',
      INVOICE_SENT: 'Invoice Sent',
      INVOICE_ACCEPTED: 'Invoice Accepted',
      INVOICE_REJECTED: 'Invoice Rejected',
      INVOICE_REJECTION_CANCELLED: 'Rejection Cancelled',
      INVOICE_PAID: 'Invoice Paid',
      INVOICE_AUTO_CANCELLED: 'Auto Cancelled',
      SERVICE_PAYMENT_SUBMITTED: 'Service Slip Submitted',
      SERVICE_PAYMENT_APPROVED: 'Service Payment Approved',
      SERVICE_PAYMENT_REJECTED: 'Service Payment Rejected',
    };
    return map[e] || e;
  }

  getEventClass(e: string): string {
    if (['PAYMENT_APPROVED', 'SERVICE_PAYMENT_APPROVED', 'INVOICE_ACCEPTED', 'INVOICE_PAID'].includes(e))
      return 'badge-approved';
    if (['PAYMENT_REJECTED', 'SERVICE_PAYMENT_REJECTED', 'INVOICE_REJECTED', 'INVOICE_AUTO_CANCELLED'].includes(e))
      return 'badge-rejected';
    if (['PAYMENT_SUBMITTED', 'SERVICE_PAYMENT_SUBMITTED', 'INVOICE_GENERATED', 'INVOICE_SENT'].includes(e))
      return 'badge-pending';
    if (['PAYMENT_RESUBMITTED', 'INVOICE_REJECTION_CANCELLED'].includes(e))
      return 'badge-info';
    return 'badge-pending';
  }

  getTypeLabel(t: string): string {
    const map: any = {
      BUY_ONLY: 'Buy Only',
      INSPECTION: 'Inspection',
      INVOICE: 'Invoice',
      REPAIR: 'Repair',
      MAINTENANCE: 'Maintenance',
    };
    return map[t] || t;
  }

  getTypeClass(t: string): string {
    const map: any = {
      BUY_ONLY: 'type-buy',
      INSPECTION: 'type-inspection',
      INVOICE: 'type-invoice',
      REPAIR: 'type-repair',
      MAINTENANCE: 'type-maintenance',
    };
    return map[t] || '';
  }

  getReference(log: any): string {
    return log.invoiceId || log.ticketId || log.orderId || '—';
  }

  hasAttachment(log: any): boolean {
    return !!(log.slipUrl || log.invoiceId);
  }
}