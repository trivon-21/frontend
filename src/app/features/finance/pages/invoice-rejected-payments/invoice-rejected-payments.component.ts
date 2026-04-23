import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InspectionTicketService } from '../../services/inspection-ticket.service';

@Component({
  selector: 'app-invoice-rejected-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-rejected-payments.component.html',
  styleUrls: ['./invoice-rejected-payments.component.css']
})
export class InvoiceRejectedPaymentsComponent implements OnInit {

  searchQuery    = '';
  selectedFilter = 'All';
  selectedDate   = '';
  currentPage    = 1;
  itemsPerPage   = 8;
  totalItems     = 0;

  payments:         any[] = [];
  filteredPayments: any[] = [];
  selectedPayment:  any   = null;
  showModal         = false;
  isLoading         = false;

  constructor(private ticketService: InspectionTicketService) {}

  ngOnInit(): void {
    this.loadPayments();
    setInterval(() => this.loadPayments(), 10000);
  }

  loadPayments(): void {
    this.ticketService.getRejectedPayments().subscribe({
      next: (data: any[]) => {
        this.payments = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: any) => { console.error(err); this.isLoading = false; }
    });
  }

  applyFilters() {
    this.filteredPayments = this.payments.filter(p => {
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
    this.totalItems  = this.filteredPayments.length;
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
  get endItem()   { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }
  nextPage() { if (this.currentPage * this.itemsPerPage < this.totalItems) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  goToPage(page: number) { this.currentPage = page; }

  openDetails(payment: any) { this.selectedPayment = payment; this.showModal = true; }
  closeModal() { this.selectedPayment = null; this.showModal = false; }
}