import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';
import { NotificationService } from '../../../../services/notification.service';
import { ConfirmService } from '../../../../services/confirm.service';

@Component({
  selector: 'app-payment-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-verification.component.html',
  styleUrls: ['./payment-verification.component.css']
})
export class PaymentVerificationComponent implements OnInit {

  payments: any[] = [];
  searchQuery = '';
  showRejectModal = false;
  showSlipModal = false;
  selectedPayment: any = null;
  rejectionReason = '';
  isLoading = false;

  constructor(
    private paymentService: PaymentService,
    private notificationService: NotificationService,
    private confirmService: ConfirmService
  ) { }

  ngOnInit(): void { this.loadPayments(); }

  loadPayments(): void {
    this.isLoading = true;
    this.paymentService.getPendingPayments().subscribe({
      next: (data) => { this.payments = data; this.isLoading = false; },
      error: (err) => { console.error(err); this.isLoading = false; }
    });
  }

  isImage(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.startsWith('data:image') ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  get filteredPayments(): any[] {
    if (!this.searchQuery.trim()) return this.payments;
    const q = this.searchQuery.toLowerCase();
    return this.payments.filter(p =>
      p.orderId?.toLowerCase().includes(q) ||
      p.customerName?.toLowerCase().includes(q) ||
      p.itemName?.toLowerCase().includes(q)
    );
  }

  openSlipModal(payment: any) { this.selectedPayment = payment; this.showSlipModal = true; }
  closeSlipModal() { this.showSlipModal = false; this.selectedPayment = null; }

  async approvePayment(payment: any): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Approve Payment',
      message: `Approve payment for Order ${payment.orderId}?`,
      confirmText: 'Approve',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    this.isLoading = true;
    this.paymentService.approvePayment(payment._id).subscribe({
      next: (response: any) => {
        this.notificationService.show('Payment approved! Confirmation email sent to customer.', 'success');
        // Remove from list immediately
        this.payments = this.payments.filter(p => p._id !== payment._id);
        this.isLoading = false;
      },
      error: (err) => { console.error(err); this.isLoading = false; this.notificationService.show('Approval failed.', 'error'); }
    });
  }

  openRejectModal(payment: any): void {
    this.selectedPayment = payment; this.rejectionReason = ''; this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false; this.selectedPayment = null; this.rejectionReason = '';
  }

  rejectPayment(): void {
    if (!this.rejectionReason.trim()) { this.notificationService.show('Please enter a rejection reason.', 'warning'); return; }
    this.isLoading = true;
    this.paymentService.rejectPayment(this.selectedPayment._id, this.rejectionReason).subscribe({
      next: (response: any) => {
        this.notificationService.show('Payment rejected. Email with re-upload link sent to customer.', 'success');
        // Remove from list immediately
        this.payments = this.payments.filter(p => p._id !== this.selectedPayment._id);
        this.closeRejectModal();
        this.isLoading = false;
      },
      error: (err) => { console.error(err); this.isLoading = false; this.notificationService.show('Rejection failed.', 'error'); }
    });
  }
}