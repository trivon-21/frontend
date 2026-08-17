import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InspectionTicketService } from '../../services/inspection-ticket.service';

@Component({
  selector: 'app-inspection-verified-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection-verified-payments.component.html',
  styleUrls: ['./inspection-verified-payments.component.css']
})
export class InspectionVerifiedPaymentsComponent implements OnInit {

  verifiedPayments: any[] = [];
  filteredPayments: any[] = [];
  selectedPayment: any = null;
  showDetailsModal = false;

  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;

  searchQuery = '';
  selectedFilter = 'All';
  selectedDate = '';

  constructor(private ticketService: InspectionTicketService) { }

  ngOnInit(): void {
    this.loadVerifiedPayments();
  }

  loadVerifiedPayments() {
    this.ticketService.getVerifiedPayments().subscribe({
      next: (data: any[]) => {
        this.verifiedPayments = data;
        this.applyFilters();
      },
      error: (err: any) => console.error('Failed to load verified payments:', err)
    });
  }

  applyFilters() {
    this.filteredPayments = this.verifiedPayments.filter(p => {
      const matchesSearch = this.searchQuery
        ? p.orderId?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.ticketId?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.customerName?.toLowerCase().includes(this.searchQuery.toLowerCase())
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

  openDetails(payment: any) { this.selectedPayment = payment; this.showDetailsModal = true; }
  closeModal() { this.selectedPayment = null; this.showDetailsModal = false; }

  shortId(id: any): string {
    if (!id) return '—';
    const value = id.toString();
    const suffix = value.includes('-') ? (value.split('-').pop() || value) : value;
    return suffix.slice(-6).toUpperCase();
  }
}