import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InspectionTicketService } from '../../services/inspection-ticket.service';

@Component({
  selector: 'app-inspection-payment-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection-payment-verification.component.html',
  styleUrls: ['./inspection-payment-verification.component.css']
})
export class InspectionPaymentVerificationComponent implements OnInit {

  payments: any[] = [];
  searchQuery = '';
  showRejectModal = false;
  showDetailsModal = false;
  selectedPayment: any = null;
  rejectionReason = '';
  isLoading = false;

  constructor(private ticketService: InspectionTicketService) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading = true;
    this.ticketService.getPendingVerification().subscribe({
      next: (data: any[]) => {
        this.payments = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load payments:', err);
        this.isLoading = false;
      }
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

  viewDetails(payment: any): void {
    this.selectedPayment = payment;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedPayment = null;
  }

  viewSlip(payment: any): void {
    if (payment.slipUrl) {
      window.open(payment.slipUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('No slip available.');
    }
  }

  approvePayment(payment: any): void {
    if (!confirm(`Approve inspection payment for Order #${payment.orderId}?`)) return;
    this.isLoading = true;
    this.ticketService.approvePayment(payment._id).subscribe({
      next: () => {
        alert('✅ Payment approved! Email sent to customer with scheduling link.');
        this.loadPayments();
      },
      error: (err: any) => {
        console.error('Approval failed:', err);
        this.isLoading = false;
        alert('❌ Failed to approve payment.');
      }
    });
  }

  openRejectModal(payment: any): void {
    this.selectedPayment = payment;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedPayment = null;
    this.rejectionReason = '';
  }

  rejectPayment(): void {
    if (!this.rejectionReason.trim()) {
      alert('⚠️ Please enter a rejection reason.');
      return;
    }
    this.isLoading = true;
    this.ticketService.rejectPayment(this.selectedPayment._id, this.rejectionReason).subscribe({
      next: () => {
        alert('✅ Payment rejected! Email sent to customer with re-upload link.');
        this.closeRejectModal();
        this.loadPayments();
      },
      error: (err: any) => {
        console.error('Rejection failed:', err);
        this.isLoading = false;
        alert('❌ Failed to reject payment.');
      }
    });
  }
}