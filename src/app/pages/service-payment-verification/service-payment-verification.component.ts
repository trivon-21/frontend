import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ServicePaymentService } from '../../services/service-payment.service';

@Component({
  selector: 'app-service-payment-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-payment-verification.component.html',
  styleUrls: ['./service-payment-verification.component.css']
})
export class ServicePaymentVerificationComponent implements OnInit {

  serviceType      = 'REPAIR';
  pageTitle        = 'Repair Payment Verification';
  payments:        any[] = [];
  searchQuery      = '';
  showRejectModal  = false;
  showSlipModal    = false;
  selectedPayment: any  = null;
  rejectionReason  = '';
  isLoading        = false;

  constructor(
    private servicePaymentService: ServicePaymentService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Auto-detect from URL: /services/repair-verification or /services/maintenance-verification
    const url = this.route.snapshot.url.map(s => s.path).join('/');
    if (url.includes('maintenance')) {
      this.serviceType = 'MAINTENANCE';
      this.pageTitle   = 'Maintenance Payment Verification';
    } else {
      this.serviceType = 'REPAIR';
      this.pageTitle   = 'Repair Payment Verification';
    }
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading = true;
    this.servicePaymentService.getPendingVerification(this.serviceType).subscribe({
      next:  (data) => { this.payments = data; this.isLoading = false; },
      error: (err)  => { console.error(err); this.isLoading = false; }
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

  isImage(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  openSlipModal(payment: any)  { this.selectedPayment = payment; this.showSlipModal = true; }
  closeSlipModal()             { this.showSlipModal = false; this.selectedPayment = null; }

  approvePayment(payment: any): void {
    if (!confirm(`Approve ${this.serviceType.toLowerCase()} payment for ${payment.customerName}?`)) return;
    this.isLoading = true;
    this.servicePaymentService.approvePayment(payment._id).subscribe({
      next: () => {
        alert('✅ Payment approved! Email sent to customer.');
        this.loadPayments();
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
    this.servicePaymentService.rejectPayment(this.selectedPayment._id, this.rejectionReason).subscribe({
      next: () => {
        alert('✅ Payment rejected. Email with re-upload link sent to customer.');
        this.closeRejectModal(); this.loadPayments();
      },
      error: (err) => { console.error(err); this.isLoading = false; alert('❌ Rejection failed.'); }
    });
  }
}