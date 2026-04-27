import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';

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

  constructor(private paymentService: PaymentService) { }

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

  approvePayment(payment: any): void {
    if (!confirm(`Approve payment for Order ${payment.orderId}?`)) return;
    this.isLoading = true;
    this.paymentService.approvePayment(payment._id).subscribe({
      next: (response: any) => {
        alert('✅ Payment approved! Confirmation email sent to customer.');
        // Remove from list immediately
        this.payments = this.payments.filter(p => p._id !== payment._id);
        this.isLoading = false;
      },
      error: (err) => { console.error(err); this.isLoading = false; alert('❌ Approval failed.'); }
    });
  }

  openRejectModal(payment: any): void {
    this.selectedPayment = payment; this.rejectionReason = ''; this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false; this.selectedPayment = null; this.rejectionReason = '';
  }

  rejectPayment(): void {
    if (!this.rejectionReason.trim()) { alert('Please enter a rejection reason.'); return; }
    this.isLoading = true;
    this.paymentService.rejectPayment(this.selectedPayment._id, this.rejectionReason).subscribe({
      next: (response: any) => {
        alert('✅ Payment rejected. Email with re-upload link sent to customer.');
        // Remove from list immediately
        this.payments = this.payments.filter(p => p._id !== this.selectedPayment._id);
        this.closeRejectModal();
        this.isLoading = false;
      },
      error: (err) => { console.error(err); this.isLoading = false; alert('❌ Rejection failed.'); }
    });
  }
}