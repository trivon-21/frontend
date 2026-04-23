import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InspectionTicketService } from '../../services/inspection-ticket.service';

@Component({
  selector: 'app-invoice-payment-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-payment-verification.component.html',
  styleUrls: ['./invoice-payment-verification.component.css']
})
export class InvoicePaymentVerificationComponent implements OnInit {

  payments:         any[] = [];
  searchQuery       = '';
  showRejectModal   = false;
  showDetailsModal  = false;
  selectedPayment:  any   = null;
  rejectionReason   = '';
  isLoading         = false;

  constructor(private ticketService: InspectionTicketService) {}

  ngOnInit(): void { this.loadPayments(); }

  loadPayments(): void {
    this.isLoading = true;
    this.ticketService.getPendingVerification().subscribe({
      next: (data: any[]) => { this.payments = data; this.isLoading = false; },
      error: (err: any)   => { console.error(err); this.isLoading = false; }
    });
  }

  get filteredPayments(): any[] {
    if (!this.searchQuery.trim()) return this.payments;
    const q = this.searchQuery.toLowerCase();
    return this.payments.filter(p =>
      p.orderId?.toLowerCase().includes(q) ||
      p.ticketId?.toLowerCase().includes(q) ||
      p.customerName?.toLowerCase().includes(q)
    );
  }

  viewDetails(payment: any): void { this.selectedPayment = payment; this.showDetailsModal = true; }
  closeDetailsModal(): void { this.showDetailsModal = false; this.selectedPayment = null; }

  approvePayment(payment: any): void {
    if (!confirm(`Approve invoice payment for Order #${payment.orderId}?`)) return;
    this.isLoading = true;
    this.ticketService.approvePayment(payment._id).subscribe({
      next: () => { alert('✅ Payment approved!'); this.loadPayments(); },
      error: (err: any) => { console.error(err); this.isLoading = false; alert('❌ Failed to approve.'); }
    });
  }

  openRejectModal(payment: any): void {
    this.selectedPayment  = payment;
    this.rejectionReason  = '';
    this.showRejectModal  = true;
  }

  closeRejectModal(): void {
    this.showRejectModal  = false;
    this.selectedPayment  = null;
    this.rejectionReason  = '';
  }

  rejectPayment(): void {
    if (!this.rejectionReason.trim()) { alert('⚠️ Please enter a reason.'); return; }
    this.isLoading = true;
    this.ticketService.rejectPayment(this.selectedPayment._id, this.rejectionReason).subscribe({
      next: () => { alert('✅ Payment rejected!'); this.closeRejectModal(); this.loadPayments(); },
      error: (err: any) => { console.error(err); this.isLoading = false; alert('❌ Failed to reject.'); }
    });
  }
}