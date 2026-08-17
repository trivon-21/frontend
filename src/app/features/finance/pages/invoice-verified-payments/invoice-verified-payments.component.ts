import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-invoice-verified-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-verified-payments.component.html',
  styleUrls: ['./invoice-verified-payments.component.css']
})
export class InvoiceVerifiedPaymentsComponent implements OnInit {

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

  constructor(private invoiceService: InvoiceService) { }

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading = true;
    this.invoiceService.getPaidInvoices().subscribe({
      next: (data: any[]) => {
        this.payments = data || [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredPayments = this.payments.filter((payment) => {
      const matchesSearch = this.searchQuery
        ? payment.invoiceNumber?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          payment.orderId?.toString().toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          payment.customerName?.toLowerCase().includes(this.searchQuery.toLowerCase())
        : true;

      const matchesStatus = this.selectedFilter === 'All' ? true : payment.status === this.selectedFilter;
      const matchesDate = this.selectedDate
        ? new Date(payment.paidAt || payment.updatedAt).toDateString() === new Date(this.selectedDate).toDateString()
        : true;

      return matchesSearch && matchesStatus && matchesDate;
    });

    this.totalItems = this.filteredPayments.length;
    this.currentPage = 1;
  }

  get paginatedPayments(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPayments.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number[] {
    return Array.from({ length: Math.ceil(this.totalItems / this.itemsPerPage) }, (_, i) => i + 1);
  }

  get startItem(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return this.totalItems === 0 ? 0 : Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  nextPage(): void {
    if (this.currentPage * this.itemsPerPage < this.totalItems) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  openDetails(payment: any): void {
    this.selectedPayment = payment;
    this.showModal = true;
  }

  closeModal(): void {
    this.selectedPayment = null;
    this.showModal = false;
  }

  shortId(id: any): string {
    return id ? id.toString().slice(-6).toUpperCase() : '—';
  }
}
