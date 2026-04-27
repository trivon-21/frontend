import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-invoice-auto-cancelled',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-auto-cancelled.component.html',
  styleUrls: ['./invoice-auto-cancelled.component.css']
})
export class InvoiceAutoCancelledComponent implements OnInit {

  searchQuery = '';
  selectedFilter = 'All';
  selectedDate = '';
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;

  invoices: any[] = [];
  filteredInvoices: any[] = [];
  selectedInvoice: any = null;
  showModal = false;
  isLoading = false;

  constructor(private invoiceService: InvoiceService) { }

  ngOnInit(): void { this.loadInvoices(); }

  loadInvoices(): void {
    this.isLoading = true;
    this.invoiceService.getAutoCancelledInvoices().subscribe({
      next: (data: any[]) => {
        this.invoices = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: any) => { console.error(err); this.isLoading = false; }
    });
  }

  applyFilters() {
    this.filteredInvoices = this.invoices.filter(i => {
      const matchesSearch = this.searchQuery
        ? i.invoiceNumber?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        i.customerName?.toLowerCase().includes(this.searchQuery.toLowerCase())
        : true;
      const matchesDate = this.selectedDate
        ? new Date(i.cancelledAt || i.updatedAt).toDateString() === new Date(this.selectedDate).toDateString()
        : true;
      return matchesSearch && matchesDate;
    });
    this.totalItems = this.filteredInvoices.length;
    this.currentPage = 1;
  }

  get paginatedInvoices() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredInvoices.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number[] {
    return Array.from({ length: Math.ceil(this.totalItems / this.itemsPerPage) }, (_, i) => i + 1);
  }

  get startItem() { return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endItem() { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }
  nextPage() { if (this.currentPage * this.itemsPerPage < this.totalItems) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  goToPage(page: number) { this.currentPage = page; }

  viewInvoice(invoice: any) { this.selectedInvoice = invoice; this.showModal = true; }
  closeModal() { this.selectedInvoice = null; this.showModal = false; }
}