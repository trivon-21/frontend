import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InspectionTicketService } from '../../services/inspection-ticket.service';
import { NotificationService } from '../../../../services/notification.service';
import { ConfirmService } from '../../../../services/confirm.service';

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

  constructor(
    private ticketService: InspectionTicketService,
    private notificationService: NotificationService,
    private confirmService: ConfirmService
  ) { }

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
      this.notificationService.show('No slip available.', 'warning');
    }
  }

  async approvePayment(payment: any): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Approve Inspection Payment',
      message: `Approve inspection payment for Order #${payment.orderId}?`,
      confirmText: 'Approve',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    this.isLoading = true;
    this.ticketService.approvePayment(payment._id).subscribe({
      next: () => {
        this.notificationService.show('Payment approved! Email sent to customer with scheduling link.', 'success');
        this.loadPayments();
      },
      error: (err: any) => {
        console.error('Approval failed:', err);
        this.isLoading = false;
        this.notificationService.show('Failed to approve payment.', 'error');
      }
    });
  }

  openRejectModal(payment: any): void {
    this.selectedPayment = {...payment};
    this.rejectionReason = '';
    this.showRejectModal = true;
    console.log('Selected payment:', this.selectedPayment);
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedPayment = null;
    this.rejectionReason = '';
  }

  rejectPayment(): void {
    if (!this.rejectionReason.trim()) {
      this.notificationService.show('Please enter a rejection reason.', 'warning');
      return;
    }
    this.isLoading = true;
    this.ticketService.rejectPayment(this.selectedPayment._id, this.rejectionReason).subscribe({
      next: () => {
        this.notificationService.show('Payment rejected! Email sent to customer with re-upload link.', 'success');
        this.closeRejectModal();
        this.loadPayments();
      },
      error: (err: any) => {
        console.error('Rejection failed:', err);
        this.isLoading = false;
        this.notificationService.show('Failed to reject payment.', 'error');
      }
    });
  }

  shortId(id: any): string {
    if (!id) return '—';
    const value = id.toString();
    const suffix = value.includes('-') ? (value.split('-').pop() || value) : value;
    return suffix.slice(-6).toUpperCase();
  }
}