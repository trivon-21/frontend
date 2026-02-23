import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-verified-payments',
  templateUrl: './verified-payments.component.html',
  styleUrls: ['./verified-payments.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class VerifiedPaymentsComponent implements OnInit {

  approvedPayments: any[] = [];
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

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadApprovedPayments();
  }

  loadApprovedPayments() {
    this.paymentService.getApprovedPayments().subscribe(data => {
      this.approvedPayments = data;
      this.applyFilters();
    });
  }

  applyFilters() {
    this.filteredPayments = this.approvedPayments.filter(payment => {

      // Search filter
      const matchesSearch = this.searchQuery
        ? payment.orderId?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          payment.customerName?.toLowerCase().includes(this.searchQuery.toLowerCase())
        : true;

      // Status filter
      const matchesStatus =
        this.selectedFilter === 'All'
          ? true
          : payment.status === this.selectedFilter;

      // Date filter
      const matchesDate = this.selectedDate
        ? new Date(payment.updatedAt).toDateString() ===
          new Date(this.selectedDate).toDateString()
        : true;

      return matchesSearch && matchesStatus && matchesDate;
    });

    this.totalItems = this.filteredPayments.length;
    this.currentPage = 1;
  }

  // Pagination helpers
  get paginatedPayments() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredPayments.slice(start, end);
  }

  get totalPages(): number[] {
    return Array.from(
      { length: Math.ceil(this.totalItems / this.itemsPerPage) },
      (_, i) => i + 1
    );
  }

  get startItem(): number {
    return this.totalItems === 0
      ? 0
      : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return this.totalItems === 0
      ? 0
      : Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  nextPage() {
    if (this.currentPage * this.itemsPerPage < this.totalItems) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
  }

  openDetails(payment: any) {
    this.selectedPayment = payment;
    this.showDetailsModal = true;
  }

  closeModal() {
    this.showDetailsModal = false;
    this.selectedPayment = null;
  }
}