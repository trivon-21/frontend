import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-rejected-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rejected-payments.component.html',
  styleUrls: ['./rejected-payments.component.css']
})
export class RejectedPaymentsComponent implements OnInit {

  rejectedPayments: any[] = [];
  filteredPayments: any[] = [];
  selectedPayment: any = null;
  showDetailsModal = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;

  // Filters/Search
  searchQuery = '';
  selectedFilter = 'All';
  selectedDate: string = '';

  loading = false;
  errorMessage = '';

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadRejectedPayments();

    // Polling every 10s to check if some reuploaded slips moved to PENDING
    setInterval(() => this.loadRejectedPayments(), 10000);
  }

  loadRejectedPayments() {
    this.loading = true;
    this.errorMessage = '';

    this.paymentService.getRejectedPayments().subscribe({
      next: (data: any[]) => {
        if (Array.isArray(data)) {
          this.rejectedPayments = data.map(p => ({
            orderId: p.orderId || p.order_id,
            itemName: p.itemName || p.item_name,
            customerName: p.customerName || p.customer_name,
            customerEmail: p.customerEmail || p.customer_email,
            amount: p.amount,
            status: p.status,
            rejectionReason: p.rejectionReason || p.rejected_reason || p.reason,
            updatedAt: new Date(p.updatedAt || p.updated_at)
          }));
          this.applyFilters();
        } else {
          this.errorMessage = 'Invalid data format from server.';
          this.rejectedPayments = [];
          this.filteredPayments = [];
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading rejected payments:', err);
        this.errorMessage = 'Failed to load rejected payments.';
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.filteredPayments = this.rejectedPayments.filter(payment => {
      const matchesSearch = this.searchQuery
        ? payment.orderId?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          payment.customerName?.toLowerCase().includes(this.searchQuery.toLowerCase())
        : true;

      const matchesStatus = this.selectedFilter === 'All' || payment.status === this.selectedFilter;

      const matchesDate = this.selectedDate
        ? new Date(payment.updatedAt).toDateString() ===
          new Date(this.selectedDate).toDateString()
        : true;

      return matchesSearch && matchesStatus && matchesDate;
    });

    this.totalItems = this.filteredPayments.length;
    this.currentPage = 1;
  }

  get paginatedPayments() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredPayments.slice(start, end);
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

  nextPage() { if (this.currentPage * this.itemsPerPage < this.totalItems) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  goToPage(page: number) { this.currentPage = page; }

  openDetails(payment: any) {
    this.selectedPayment = payment;
    this.showDetailsModal = true;
  }

  closeModal() {
    this.selectedPayment = null;
    this.showDetailsModal = false;
  }
}