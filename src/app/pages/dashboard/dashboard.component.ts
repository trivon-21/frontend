import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  payments: any[] = [];
  filteredPayments: any[] = [];
  paginatedPayments: any[] = [];

  searchText = '';
  selectedStatus = 'ALL';
  selectedDate: string | null = null;

  // Stats
  totalAmount = 0;
  approvedAmount = 0;
  pendingAmount = 0;
  rejectedAmount = 0;

  approvedCount = 0;
  pendingCount = 0;
  rejectedCount = 0;

  // Percentages
  approvedPercentage = 0;
  pendingPercentage = 0;
  rejectedPercentage = 0;

  // Pagination
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;

  @ViewChild('datePicker') datePicker!: ElementRef;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadAllPayments();
  }

  loadAllPayments() {
    forkJoin({
      approved: this.paymentService.getApprovedPayments(),
      pending: this.paymentService.getPendingPayments(),
      rejected: this.paymentService.getRejectedPayments()
    }).subscribe({
      next: (res) => {
        const approved = res.approved || [];
        const pending = res.pending || [];
        const rejected = res.rejected || [];

        this.payments = [
          ...approved.map((p: any) => ({ ...p, status: 'APPROVED' })),
          ...pending.map((p: any) => ({ ...p, status: 'PENDING' })),
          ...rejected.map((p: any) => ({ ...p, status: 'REJECTED' }))
        ];

        this.totalItems = this.payments.length;
        this.calculateStats();
        this.applyFilters();
      }
    });
  }

  calculateStats() {
    this.totalAmount = this.payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    this.approvedAmount = this.payments
      .filter(p => p.status === 'APPROVED')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    this.pendingAmount = this.payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    this.rejectedAmount = this.payments
      .filter(p => p.status === 'REJECTED')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    this.approvedCount = this.payments.filter(p => p.status === 'APPROVED').length;
    this.pendingCount = this.payments.filter(p => p.status === 'PENDING').length;
    this.rejectedCount = this.payments.filter(p => p.status === 'REJECTED').length;

    const total = this.payments.length || 1;

    this.approvedPercentage = Math.round((this.approvedCount / total) * 100);
    this.pendingPercentage = Math.round((this.pendingCount / total) * 100);
    this.rejectedPercentage = Math.round((this.rejectedCount / total) * 100);
  }

  applyFilters() {
    this.filteredPayments = this.payments.filter(p => {
      const matchesSearch =
        p.orderId?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.customerName?.toLowerCase().includes(this.searchText.toLowerCase());

      const matchesStatus =
        this.selectedStatus === 'ALL' || p.status === this.selectedStatus;

      let matchesDate = true;
      if (this.selectedDate) {
      if (!p.updatedAt) return false;
      const paymentDate = new Date(p.updatedAt).toISOString().split('T')[0];
        matchesDate = paymentDate === this.selectedDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    this.totalItems = this.filteredPayments.length;
    this.currentPage = 1;
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedPayments = this.filteredPayments.slice(start, end);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePaginatedData();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }

  openDatePicker() {
    if (this.datePicker) {
      this.datePicker.nativeElement.showPicker();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get startItem(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  formatAmount(amount: number): string {
    return amount.toFixed(3);
  }

  formatDate(dateString: string | Date): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}