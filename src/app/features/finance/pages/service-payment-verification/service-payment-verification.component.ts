import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicePaymentService } from '../../services/service-payment.service';
import { NotificationService } from '../../../../services/notification.service';
import { ConfirmService } from '../../../../services/confirm.service';

@Component({
  selector: 'app-service-payment-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-payment-verification.component.html',
  styleUrls: ['./service-payment-verification.component.css']
})
export class ServicePaymentVerificationComponent implements OnInit {

  serviceType = 'MAINTENANCE';
  pageTitle = 'Maintenance Payment Verification';
  payments: any[] = [];
  searchQuery = '';
  showRejectModal = false;
  showSlipModal = false;
  selectedPayment: any = null;
  rejectionReason = '';
  isLoading = false;

  constructor(
    private servicePaymentService: ServicePaymentService,
    private notificationService: NotificationService,
    private confirmService: ConfirmService
  ) { }

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading = true;
    this.servicePaymentService.getPendingVerification().subscribe({
      next: (data) => { this.payments = data; this.isLoading = false; },
      error: (err) => { console.error(err); this.isLoading = false; }
    });
  }

  get filteredPayments(): any[] {
    if (!this.searchQuery.trim()) return this.payments;
    const q = this.searchQuery.toLowerCase();
    return this.payments.filter(p =>
      p.ticketId?.toLowerCase().includes(q) ||
      p.customerName?.toLowerCase().includes(q)
    );
  }

  isImage(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  openSlipModal(payment: any) { this.selectedPayment = payment; this.showSlipModal = true; }
  closeSlipModal() { this.showSlipModal = false; this.selectedPayment = null; }

  async approvePayment(payment: any): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Approve Payment',
      message: `Approve maintenance payment for ${payment.customerName}?`,
      confirmText: 'Approve',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    this.isLoading = true;
    this.servicePaymentService.approvePayment(payment._id).subscribe({
      next: () => {
        this.notificationService.show('Payment approved! Email sent to customer.', 'success');
        this.loadPayments();
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
    this.servicePaymentService.rejectPayment(this.selectedPayment._id, this.rejectionReason).subscribe({
      next: () => {
        this.notificationService.show('Payment rejected. Email with re-upload link sent to customer.', 'success');
        this.closeRejectModal(); this.loadPayments();
      },
      error: (err) => { console.error(err); this.isLoading = false; this.notificationService.show('Rejection failed.', 'error'); }
    });
  }
}