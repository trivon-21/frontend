import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { InspectionTicketService } from '../../services/inspection-ticket.service';
import { PaymentService } from '../../services/payment.service';
import { ServicePaymentService } from '../../services/service-payment.service';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  activeFilter: 'ALL' | 'BUY_ONLY' | 'INSPECTION' | 'INVOICE' | 'REPAIR' | 'MAINTENANCE' = 'ALL';
  searchText = '';
  selectedStatus = 'ALL';
  selectedDate = '';
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;

  totalBalance = 0;
  approvedAmount = 0;
  pendingAmount = 0;
  rejectedAmount = 0;
  approvedPercentage = 0;
  pendingPercentage = 0;
  rejectedPercentage = 0;
  verificationCount = 0;
  pendingCount = 0;
  rejectedCount = 0;

  allPayments: any[] = [];
  filteredPayments: any[] = [];
  paginatedPayments: any[] = [];

  constructor(
    private ticketService: InspectionTicketService,
    private paymentService: PaymentService,
    private servicePaymentService: ServicePaymentService,
    private invoiceService: InvoiceService
  ) { }

  ngOnInit(): void { this.loadAllPayments(); }

  loadAllPayments(): void {
    forkJoin({
      buyPending: this.paymentService.getPendingPayments(),
      buyVerified: this.paymentService.getApprovedPayments(),
      buyRejected: this.paymentService.getRejectedPayments(),
      inspVerified: this.ticketService.getVerifiedPayments(),
      inspPending: this.ticketService.getPendingVerification(),
      inspRejected: this.ticketService.getRejectedPayments(),
      repairPending: this.servicePaymentService.getPendingVerification('REPAIR'),
      repairVerified: this.servicePaymentService.getVerifiedPayments('REPAIR'),
      repairRejected: this.servicePaymentService.getRejectedPayments('REPAIR'),
      maintPending: this.servicePaymentService.getPendingVerification('MAINTENANCE'),
      maintVerified: this.servicePaymentService.getVerifiedPayments('MAINTENANCE'),
      maintRejected: this.servicePaymentService.getRejectedPayments('MAINTENANCE'),
      invoicePaid: this.invoiceService.getPaidInvoices(),
      invoiceAccepted: this.invoiceService.getAcceptedInvoices(),
      invoicePending: this.invoiceService.getPendingInvoices(),
    }).subscribe({
      next: (res: any) => {
        const buyPending = (res.buyPending || []).map((p: any) => ({ ...p, paymentType: 'BUY_ONLY', status: 'PENDING', displayDate: p.updatedAt }));
        const buyVerified = (res.buyVerified || []).map((p: any) => ({ ...p, paymentType: 'BUY_ONLY', status: 'APPROVED', displayDate: p.updatedAt }));
        const buyRejected = (res.buyRejected || []).map((p: any) => ({ ...p, paymentType: 'BUY_ONLY', status: 'REJECTED', displayDate: p.updatedAt }));
        const inspPending = (res.inspPending || []).map((p: any) => ({ ...p, paymentType: 'INSPECTION', status: 'PENDING', invoiceId: p.ticketId, displayDate: p.date || p.updatedAt }));
        const inspVerified = (res.inspVerified || []).map((p: any) => ({ ...p, paymentType: 'INSPECTION', status: 'APPROVED', invoiceId: p.ticketId, displayDate: p.updatedAt }));
        const inspRejected = (res.inspRejected || []).map((p: any) => ({ ...p, paymentType: 'INSPECTION', status: 'REJECTED', invoiceId: p.ticketId, displayDate: p.updatedAt }));
        const repairPending = (res.repairPending || []).map((p: any) => ({ ...p, paymentType: 'REPAIR', status: 'PENDING', invoiceId: p.ticketId, displayDate: p.slipUploadedAt || p.updatedAt }));
        const repairVerified = (res.repairVerified || []).map((p: any) => ({ ...p, paymentType: 'REPAIR', status: 'APPROVED', invoiceId: p.ticketId, displayDate: p.approvedAt || p.updatedAt }));
        const repairRejected = (res.repairRejected || []).map((p: any) => ({ ...p, paymentType: 'REPAIR', status: 'REJECTED', invoiceId: p.ticketId, displayDate: p.rejectedAt || p.updatedAt }));
        const maintPending = (res.maintPending || []).map((p: any) => ({ ...p, paymentType: 'MAINTENANCE', status: 'PENDING', invoiceId: p.ticketId, displayDate: p.slipUploadedAt || p.updatedAt }));
        const maintVerified = (res.maintVerified || []).map((p: any) => ({ ...p, paymentType: 'MAINTENANCE', status: 'APPROVED', invoiceId: p.ticketId, displayDate: p.approvedAt || p.updatedAt }));
        const maintRejected = (res.maintRejected || []).map((p: any) => ({ ...p, paymentType: 'MAINTENANCE', status: 'REJECTED', invoiceId: p.ticketId, displayDate: p.rejectedAt || p.updatedAt }));
        const invoicePaid = (res.invoicePaid || []).map((p: any) => ({
          ...p,
          paymentType: 'INVOICE',
          status: 'APPROVED',
          orderId: p.orderId,
          invoiceId: p.invoiceNumber,
          customerName: p.customerName,
          amount: p.grandTotal || 0,
          displayDate: p.paidAt || p.updatedAt,
        }));

        const invoiceAccepted = (res.invoiceAccepted || []).map((p: any) => ({
          ...p,
          paymentType: 'INVOICE',
          status: 'PENDING',
          orderId: p.orderId,
          invoiceId: p.invoiceNumber,
          customerName: p.customerName,
          amount: p.grandTotal || 0,
          displayDate: p.acceptedAt || p.updatedAt,
        }));

        const invoiceDraft = (res.invoicePending || []).map((p: any) => ({
          ...p,
          paymentType: 'INVOICE',
          status: 'PENDING',
          orderId: p.orderId,
          invoiceId: p.invoiceNumber,
          customerName: p.customerName,
          amount: p.grandTotal || 0,
          displayDate: p.createdAt,
        }));

        this.allPayments = [
          ...buyPending, ...buyVerified, ...buyRejected,
          ...inspPending, ...inspVerified, ...inspRejected,
          ...repairPending, ...repairVerified, ...repairRejected,
          ...maintPending, ...maintVerified, ...maintRejected,
          ...invoicePaid, ...invoiceAccepted, ...invoiceDraft
        ];
        this.calculateStats(this.allPayments);
        this.applyFilters();
      },
      error: (err: any) => console.error('Dashboard load failed:', err)
    });
  }


  calculateStats(payments: any[]) {
    this.totalBalance = payments.reduce((s, p) => s + (p.amount || 0), 0);
    this.approvedAmount = payments.filter(p => p.status === 'APPROVED').reduce((s, p) => s + (p.amount || 0), 0);
    this.pendingAmount = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + (p.amount || 0), 0);
    this.rejectedAmount = payments.filter(p => p.status === 'REJECTED').reduce((s, p) => s + (p.amount || 0), 0);
    this.verificationCount = payments.filter(p => p.status === 'APPROVED').length;
    this.pendingCount = payments.filter(p => p.status === 'PENDING').length;
    this.rejectedCount = payments.filter(p => p.status === 'REJECTED').length;
    const total = payments.length || 1;
    this.approvedPercentage = Math.round((this.verificationCount / total) * 100);
    this.pendingPercentage = Math.round((this.pendingCount / total) * 100);
    this.rejectedPercentage = Math.round((this.rejectedCount / total) * 100);
  }

  setFilter(filter: 'ALL' | 'BUY_ONLY' | 'INSPECTION' | 'INVOICE' | 'REPAIR' | 'MAINTENANCE') {
    this.activeFilter = filter;
    this.applyFilters();
  }

  applyFilters() {
    let base = this.allPayments;
    if (this.activeFilter !== 'ALL') {
      base = base.filter(p => p.paymentType === this.activeFilter);
    }
    this.filteredPayments = base.filter(p => {
      const matchesSearch =
        p.orderId?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.invoiceId?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.customerName?.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesStatus = this.selectedStatus === 'ALL' || p.status === this.selectedStatus;
      const matchesDate = this.selectedDate
        ? new Date(p.displayDate).toISOString().split('T')[0] === this.selectedDate
        : true;
      return matchesSearch && matchesStatus && matchesDate;
    });
    this.calculateStats(this.filteredPayments);
    this.totalItems = this.filteredPayments.length;
    this.currentPage = 1;
    this.updatePaginated();
  }

  updatePaginated() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedPayments = this.filteredPayments.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number[] {
    return Array.from({ length: Math.ceil(this.totalItems / this.itemsPerPage) }, (_, i) => i + 1);
  }

  get startItem() { return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endItem() { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }
  nextPage() { if (this.currentPage * this.itemsPerPage < this.totalItems) { this.currentPage++; this.updatePaginated(); } }
  prevPage() { if (this.currentPage > 1) { this.currentPage--; this.updatePaginated(); } }
  goToPage(p: number) { this.currentPage = p; this.updatePaginated(); }

  getStatusClass(s: string): string {
    switch (s) {
      case 'APPROVED': return 'approved';
      case 'PENDING': return 'pending';
      case 'REJECTED': return 'rejected';
      default: return '';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'BUY_ONLY': return 'Buy Only';
      case 'INSPECTION': return 'Inspection';
      case 'INVOICE': return 'Invoice';
      case 'REPAIR': return 'Repair';
      case 'MAINTENANCE': return 'Maintenance';
      default: return type;
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'BUY_ONLY': return 'type-buy';
      case 'INSPECTION': return 'type-inspection';
      case 'INVOICE': return 'type-invoice';
      case 'REPAIR': return 'type-repair';
      case 'MAINTENANCE': return 'type-maintenance';
      default: return '';
    }
  }

  formatAmount(n: number): string { return (n || 0).toFixed(3); }

  formatDate(d: any): string {
    if (!d) return 'N/A';
    const date = new Date(d);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  openDatePicker(el: HTMLInputElement) { el.showPicker(); }
}
