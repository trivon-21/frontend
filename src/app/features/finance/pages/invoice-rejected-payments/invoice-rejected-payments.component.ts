import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-invoice-rejected-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-rejected-payments.component.html',
  styleUrls: ['./invoice-rejected-payments.component.css']
})
export class InvoiceRejectedPaymentsComponent implements OnInit {

  activeTab: 'installation' | 'repair' = 'installation';

  searchQuery = '';
  selectedFilter = 'All';
  selectedDate = '';
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;

  payments: any[] = [];
  filteredPayments: any[] = [];
  selectedPayment: any = null;
  showModal = false;
  isLoading = false;

  // Repair
  repairSearchQuery = '';
  repairSelectedDate = '';
  repairCurrentPage = 1;
  repairTotalItems = 0;
  repairPayments: any[] = [];
  filteredRepairPayments: any[] = [];
  selectedRepairPayment: any = null;
  showRepairModal = false;
  isRepairLoading = false;

  constructor(private invoiceService: InvoiceService) { }

  ngOnInit(): void {
    this.loadPayments();
    this.loadRepairPayments();
  }

  // NOTE: a rejected PAYMENT SLIP moves the invoice back to "ACCEPTED" status
  // with paymentRejectionReason set — it does NOT use the invoice "REJECTED"
  // status (that's reserved for the customer rejecting the invoice itself).
  // So we filter accepted invoices that have a paymentRejectionReason set.
  loadPayments(): void {
    this.isLoading = true;
    this.invoiceService.getAcceptedInvoices().subscribe({
      next: (data: any[]) => {
        this.payments = (data || []).filter(p => !!p.paymentRejectionReason);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: any) => { console.error(err); this.isLoading = false; }
    });
  }

  applyFilters(): void {
    this.filteredPayments = this.payments.filter(p => {
      const q = this.searchQuery.toLowerCase();
      const matchesSearch = this.searchQuery
        ? p.invoiceNumber?.toLowerCase().includes(q) ||
          p.orderId?.toString().toLowerCase().includes(q) ||
          p.customerName?.toLowerCase().includes(q)
        : true;
      const matchesDate = this.selectedDate
        ? new Date(p.updatedAt).toDateString() === new Date(this.selectedDate).toDateString()
        : true;
      return matchesSearch && matchesDate;
    });
    this.totalItems = this.filteredPayments.length;
    this.currentPage = 1;
  }

  get paginatedPayments() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPayments.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number[] {
    return Array.from({ length: Math.ceil(this.totalItems / this.itemsPerPage) }, (_, i) => i + 1);
  }

  get startItem() { return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endItem() { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }
  nextPage() { if (this.currentPage * this.itemsPerPage < this.totalItems) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  goToPage(page: number) { this.currentPage = page; }

  openDetails(payment: any) { this.selectedPayment = payment; this.showModal = true; }
  closeModal() { this.selectedPayment = null; this.showModal = false; }

  // ── Repair ───────────────────────────────────────────────────────────────────
  loadRepairPayments(): void {
    this.isRepairLoading = true;
    this.invoiceService.getRepairAcceptedInvoices().subscribe({
      next: (data: any[]) => {
        this.repairPayments = (data || []).filter(p => !!p.paymentRejectionReason);
        this.applyRepairFilters();
        this.isRepairLoading = false;
      },
      error: (err: any) => { console.error(err); this.isRepairLoading = false; }
    });
  }

  applyRepairFilters(): void {
    this.filteredRepairPayments = this.repairPayments.filter(p => {
      const q = this.repairSearchQuery.toLowerCase();
      const matchesSearch = this.repairSearchQuery
        ? p.invoiceNumber?.toLowerCase().includes(q) ||
          p.customerName?.toLowerCase().includes(q)
        : true;
      const matchesDate = this.repairSelectedDate
        ? new Date(p.updatedAt).toDateString() === new Date(this.repairSelectedDate).toDateString()
        : true;
      return matchesSearch && matchesDate;
    });
    this.repairTotalItems = this.filteredRepairPayments.length;
    this.repairCurrentPage = 1;
  }

  get paginatedRepairPayments() {
    const start = (this.repairCurrentPage - 1) * this.itemsPerPage;
    return this.filteredRepairPayments.slice(start, start + this.itemsPerPage);
  }

  get repairTotalPages(): number[] {
    return Array.from({ length: Math.ceil(this.repairTotalItems / this.itemsPerPage) }, (_, i) => i + 1);
  }

  get repairStartItem() { return this.repairTotalItems === 0 ? 0 : (this.repairCurrentPage - 1) * this.itemsPerPage + 1; }
  get repairEndItem() { return Math.min(this.repairCurrentPage * this.itemsPerPage, this.repairTotalItems); }
  repairNextPage() { if (this.repairCurrentPage * this.itemsPerPage < this.repairTotalItems) this.repairCurrentPage++; }
  repairPrevPage() { if (this.repairCurrentPage > 1) this.repairCurrentPage--; }
  repairGoToPage(page: number) { this.repairCurrentPage = page; }

  openRepairDetails(payment: any) { this.selectedRepairPayment = payment; this.showRepairModal = true; }
  closeRepairModal() { this.selectedRepairPayment = null; this.showRepairModal = false; }

  shortId(id: any): string {
    return id ? id.toString().slice(-6).toUpperCase() : '—';
  }
}