import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-invoice-pending',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-pending.component.html',
  styleUrls: ['./invoice-pending.component.css']
})
export class InvoicePendingComponent implements OnInit {

  searchQuery    = '';
  selectedFilter = 'All';
  selectedDate   = '';
  currentPage    = 1;
  itemsPerPage   = 8;
  totalItems     = 0;

  invoices:         any[] = [];
  filteredInvoices: any[] = [];
  selectedInvoice:  any   = null;
  showModal         = false;
  isSending         = false;
  isLoading         = false;

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit(): void { this.loadInvoices(); }

  loadInvoices(): void {
    this.isLoading = true;
    this.invoiceService.getPendingInvoices().subscribe({
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
        ? new Date(i.createdAt).toDateString() === new Date(this.selectedDate).toDateString()
        : true;
      return matchesSearch && matchesDate;
    });
    this.totalItems  = this.filteredInvoices.length;
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
  get endItem()   { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }
  nextPage() { if (this.currentPage * this.itemsPerPage < this.totalItems) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  goToPage(page: number) { this.currentPage = page; }

  viewInvoice(invoice: any) {
    this.selectedInvoice = invoice;
    this.showModal = true;
  }

  closeModal() { this.selectedInvoice = null; this.showModal = false; }

  sendToCustomer(): void {
    if (!confirm(`Send invoice ${this.selectedInvoice?.invoiceNumber} to ${this.selectedInvoice?.customerEmail}?`)) return;
    this.isSending = true;
    this.invoiceService.sendInvoiceToCustomer(this.selectedInvoice._id).subscribe({
      next: () => {
        alert('✅ Invoice PDF sent to customer email!');
        this.closeModal();
        this.loadInvoices();
        this.isSending = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isSending = false;
        alert('❌ Failed to send invoice: ' + err.message);
      }
    });
  }
}