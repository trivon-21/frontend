import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-invoice-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-dashboard.component.html',
  styleUrls: ['./invoice-dashboard.component.css']
})
export class InvoiceDashboardComponent implements OnInit {

  activeTab: 'installation' | 'repair' = 'installation';

  // Installation
  searchQuery    = '';
  selectedStatus = 'ALL';
  selectedDate   = '';
  currentPage    = 1;
  itemsPerPage   = 8;
  totalItems     = 0;
  acceptedCount  = 0;
  pendingCount   = 0;
  paidCount      = 0;
  rejectedCount  = 0;
  allInvoices:        any[] = [];
  filteredInvoices:   any[] = [];
  paginatedInvoices:  any[] = [];

  // Repair
  repairSearchQuery    = '';
  repairSelectedStatus = 'ALL';
  repairSelectedDate   = '';
  repairCurrentPage    = 1;
  repairTotalItems     = 0;
  repairAcceptedCount  = 0;
  repairPendingCount   = 0;
  repairPaidCount      = 0;
  repairRejectedCount  = 0;
  allRepairInvoices:       any[] = [];
  filteredRepairInvoices:  any[] = [];
  paginatedRepairInvoices: any[] = [];

  @ViewChild('datePicker')       datePicker!: ElementRef;
  @ViewChild('repairDatePicker') repairDatePicker!: ElementRef;

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit(): void { this.loadDashboard(); this.loadRepairDashboard(); }

  // ── Installation ─────────────────────────────────────────────────────────────
  loadDashboard(): void {
    this.invoiceService.getDashboardStats().subscribe({
      next: (data: any) => {
        this.acceptedCount = data.accepted || 0;
        this.pendingCount  = data.pending  || 0;
        this.paidCount     = data.paid     || 0;
        this.rejectedCount = data.rejected || 0;
        this.allInvoices   = data.tableData || [];
        this.applyFilters();
      },
      error: (err) => console.error(err)
    });
  }

  applyFilters(): void {
    this.filteredInvoices = this.allInvoices.filter(i => {
      const matchSearch = this.searchQuery
        ? i.invoiceNumber?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          i.customerName?.toLowerCase().includes(this.searchQuery.toLowerCase())
        : true;
      const matchStatus = this.selectedStatus === 'ALL' || i.status === this.selectedStatus;
      const matchDate   = this.selectedDate
        ? new Date(i.updatedAt).toISOString().split('T')[0] === this.selectedDate : true;
      return matchSearch && matchStatus && matchDate;
    });
    this.totalItems  = this.filteredInvoices.length;
    this.currentPage = 1;
    this.updatePaginated();
  }

  updatePaginated(): void {
    const s = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedInvoices = this.filteredInvoices.slice(s, s + this.itemsPerPage);
  }

  get totalPages(): number[] {
    return Array.from({ length: Math.ceil(this.totalItems / this.itemsPerPage) }, (_, i) => i + 1);
  }
  get startItem() { return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endItem()   { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }
  nextPage()  { if (this.currentPage * this.itemsPerPage < this.totalItems) { this.currentPage++; this.updatePaginated(); } }
  prevPage()  { if (this.currentPage > 1) { this.currentPage--; this.updatePaginated(); } }
  goToPage(p: number) { this.currentPage = p; this.updatePaginated(); }

  // ── Repair ───────────────────────────────────────────────────────────────────
  loadRepairDashboard(): void {
    this.invoiceService.getRepairDashboardStats().subscribe({
      next: (data: any) => {
        this.repairAcceptedCount = data.accepted || 0;
        this.repairPendingCount  = data.pending  || 0;
        this.repairPaidCount     = data.paid     || 0;
        this.repairRejectedCount = data.rejected || 0;
        this.allRepairInvoices   = data.tableData || [];
        this.applyRepairFilters();
      },
      error: (err) => console.error(err)
    });
  }

  applyRepairFilters(): void {
    this.filteredRepairInvoices = this.allRepairInvoices.filter(i => {
      const matchSearch = this.repairSearchQuery
        ? i.invoiceNumber?.toLowerCase().includes(this.repairSearchQuery.toLowerCase()) ||
          i.customerName?.toLowerCase().includes(this.repairSearchQuery.toLowerCase())
        : true;
      const matchStatus = this.repairSelectedStatus === 'ALL' || i.status === this.repairSelectedStatus;
      const matchDate   = this.repairSelectedDate
        ? new Date(i.updatedAt).toISOString().split('T')[0] === this.repairSelectedDate : true;
      return matchSearch && matchStatus && matchDate;
    });
    this.repairTotalItems   = this.filteredRepairInvoices.length;
    this.repairCurrentPage  = 1;
    this.updateRepairPaginated();
  }

  updateRepairPaginated(): void {
    const s = (this.repairCurrentPage - 1) * this.itemsPerPage;
    this.paginatedRepairInvoices = this.filteredRepairInvoices.slice(s, s + this.itemsPerPage);
  }

  get repairTotalPages(): number[] {
    return Array.from({ length: Math.ceil(this.repairTotalItems / this.itemsPerPage) }, (_, i) => i + 1);
  }
  get repairStartItem() { return this.repairTotalItems === 0 ? 0 : (this.repairCurrentPage - 1) * this.itemsPerPage + 1; }
  get repairEndItem()   { return Math.min(this.repairCurrentPage * this.itemsPerPage, this.repairTotalItems); }
  repairNextPage()  { if (this.repairCurrentPage * this.itemsPerPage < this.repairTotalItems) { this.repairCurrentPage++; this.updateRepairPaginated(); } }
  repairPrevPage()  { if (this.repairCurrentPage > 1) { this.repairCurrentPage--; this.updateRepairPaginated(); } }
  repairGoToPage(p: number) { this.repairCurrentPage = p; this.updateRepairPaginated(); }

  // ── Shared helpers ────────────────────────────────────────────────────────────
  getStatusClass(status: string): string {
    const m: any = { ACCEPTED: 'status-accepted', DRAFT: 'status-pending', SENT: 'status-pending',
      PAID: 'status-paid', REJECTED: 'status-rejected', AUTO_CANCELLED: 'status-cancelled' };
    return m[status] || '';
  }
  getStatusLabel(status: string): string {
    const m: any = { DRAFT: 'Pending', SENT: 'Sent', ACCEPTED: 'Accepted',
      REJECTED: 'Rejected', PAID: 'Paid', AUTO_CANCELLED: 'Auto Cancelled' };
    return m[status] || status;
  }
  openDatePicker()       { if (this.datePicker)       this.datePicker.nativeElement.showPicker(); }
  openRepairDatePicker() { if (this.repairDatePicker) this.repairDatePicker.nativeElement.showPicker(); }
}