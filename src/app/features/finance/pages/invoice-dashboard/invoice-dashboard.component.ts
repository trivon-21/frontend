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

  searchQuery = '';
  selectedStatus = 'ALL';
  selectedDate = '';
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;

  acceptedCount = 0;
  pendingCount = 0;
  paidCount = 0;
  rejectedCount = 0;

  allInvoices: any[] = [];
  filteredInvoices: any[] = [];
  paginatedInvoices: any[] = [];

  @ViewChild('datePicker') datePicker!: ElementRef;

  constructor(private invoiceService: InvoiceService) { }

  ngOnInit(): void { this.loadDashboard(); }

  loadDashboard(): void {
    this.invoiceService.getDashboardStats().subscribe({
      next: (data: any) => {
        this.acceptedCount = data.accepted || 0;
        this.pendingCount = data.pending || 0;
        this.paidCount = data.paid || 0;
        this.rejectedCount = data.rejected || 0;
        this.allInvoices = data.tableData || [];
        this.applyFilters();
      },
      error: (err: any) => console.error('Dashboard load failed:', err)
    });
  }

  applyFilters() {
    this.filteredInvoices = this.allInvoices.filter(i => {
      const matchesSearch = this.searchQuery
        ? i.invoiceNumber?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        i.customerName?.toLowerCase().includes(this.searchQuery.toLowerCase())
        : true;
      const matchesStatus = this.selectedStatus === 'ALL' || i.status === this.selectedStatus;
      const matchesDate = this.selectedDate
        ? new Date(i.updatedAt).toISOString().split('T')[0] === this.selectedDate
        : true;
      return matchesSearch && matchesStatus && matchesDate;
    });
    this.totalItems = this.filteredInvoices.length;
    this.currentPage = 1;
    this.updatePaginated();
  }

  updatePaginated() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedInvoices = this.filteredInvoices.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number[] {
    return Array.from({ length: Math.ceil(this.totalItems / this.itemsPerPage) }, (_, i) => i + 1);
  }

  get startItem() { return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endItem() { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }

  nextPage() { if (this.currentPage * this.itemsPerPage < this.totalItems) { this.currentPage++; this.updatePaginated(); } }
  prevPage() { if (this.currentPage > 1) { this.currentPage--; this.updatePaginated(); } }
  goToPage(p: number) { this.currentPage = p; this.updatePaginated(); }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACCEPTED': return 'status-accepted';
      case 'DRAFT': return 'status-pending';
      case 'SENT': return 'status-pending';
      case 'PAID': return 'status-paid';
      case 'REJECTED': return 'status-rejected';
      case 'AUTO_CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'DRAFT': return 'Pending';
      case 'SENT': return 'Sent';
      case 'ACCEPTED': return 'Accepted';
      case 'REJECTED': return 'Rejected';
      case 'PAID': return 'Paid';
      case 'AUTO_CANCELLED': return 'Auto Cancelled';
      default: return status;
    }
  }

  openDatePicker() {
    if (this.datePicker) this.datePicker.nativeElement.showPicker();
  }
}