import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ServicePaymentService } from '../../services/service-payment.service';

@Component({
  selector: 'app-service-verified-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-verified-payments.component.html',
  styleUrls: ['./service-verified-payments.component.css']
})
export class ServiceVerifiedPaymentsComponent implements OnInit {

  serviceType = 'REPAIR';
  pageTitle = 'Repair Verified Payments';
  payments: any[] = [];
  filteredPayments: any[] = [];
  selectedPayment: any = null;
  showModal = false;
  searchQuery = '';
  selectedDate = '';
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;

  constructor(
    private servicePaymentService: ServicePaymentService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const url = this.route.snapshot.url.map(s => s.path).join('/');
    if (url.includes('maintenance')) {
      this.serviceType = 'MAINTENANCE';
      this.pageTitle = 'Maintenance Verified Payments';
    }
    this.loadPayments();
  }

  loadPayments(): void {
    this.servicePaymentService.getVerifiedPayments(this.serviceType).subscribe({
      next: (data) => { this.payments = data; this.applyFilters(); },
      error: (err) => console.error(err)
    });
  }

  applyFilters(): void {
    this.filteredPayments = this.payments.filter(p => {
      const matchesSearch = this.searchQuery
        ? p.orderId?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.ticketId?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.customerName?.toLowerCase().includes(this.searchQuery.toLowerCase())
        : true;
      const matchesDate = this.selectedDate
        ? new Date(p.approvedAt || p.updatedAt).toDateString() === new Date(this.selectedDate).toDateString()
        : true;
      return matchesSearch && matchesDate;
    });
    this.totalItems = this.filteredPayments.length;
    this.currentPage = 1;
  }

  get paginatedPayments() {
    const s = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPayments.slice(s, s + this.itemsPerPage);
  }
  get totalPages(): number[] {
    return Array.from({ length: Math.ceil(this.totalItems / this.itemsPerPage) }, (_, i) => i + 1);
  }
  get startItem() { return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endItem() { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }
  nextPage() { if (this.currentPage * this.itemsPerPage < this.totalItems) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  goToPage(p: number) { this.currentPage = p; }

  openModal(p: any) { this.selectedPayment = p; this.showModal = true; }
  closeModal() { this.selectedPayment = null; this.showModal = false; }
}