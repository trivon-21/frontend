import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice.service';
import { NotificationService } from '../../../../services/notification.service';
import { ConfirmService } from '../../../../services/confirm.service';

@Component({
  selector: 'app-invoice-payment-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-payment-verification.component.html',
  styleUrls: ['./invoice-payment-verification.component.css']
})
export class InvoicePaymentVerificationComponent implements OnInit {

  activeTab: 'installation' | 'repair' = 'installation';

  // Installation
  payments: any[] = [];
  searchQuery = '';
  isLoading = false;

  // Repair
  repairPayments: any[] = [];
  repairSearchQuery = '';
  isRepairLoading = false;

  // Shared modal state
  showRejectModal = false;
  showDetailsModal = false;
  selectedPayment: any = null;
  rejectionReason = '';

  constructor(
    private invoiceService: InvoiceService,
    private notificationService: NotificationService,
    private confirmService: ConfirmService
  ) { }

  ngOnInit(): void { this.loadPayments(); this.loadRepairPayments(); }

  loadPayments(): void {
    this.isLoading = true;
    this.invoiceService.getPaymentVerificationQueue().subscribe({
      next: (data: any[]) => {
        this.payments = data.map(inv => ({
          ...inv,
          orderId: inv.orderRef || inv.orderId,
          invoiceId: inv.invoiceNumber,
          amount: inv.grandTotal,
          slipUrl: inv.paymentSlipUrl,
        }));
        this.isLoading = false;
      },
      error: (err: any) => { console.error(err); this.isLoading = false; }
    });
  }

  loadRepairPayments(): void {
    this.isRepairLoading = true;
    this.invoiceService.getRepairPaymentVerificationQueue().subscribe({
      next: (data: any[]) => {
        this.repairPayments = data.map(inv => ({
          ...inv,
          orderId: inv.orderRef || inv.orderId || '—',
          invoiceId: inv.invoiceNumber,
          amount: inv.grandTotal,
          slipUrl: inv.paymentSlipUrl,
        }));
        this.isRepairLoading = false;
      },
      error: (err: any) => { console.error(err); this.isRepairLoading = false; }
    });
  }

  get filteredPayments(): any[] {
    if (!this.searchQuery.trim()) return this.payments;
    const q = this.searchQuery.toLowerCase();
    return this.payments.filter(p =>
      p.orderId?.toLowerCase().includes(q) ||
      p.invoiceId?.toLowerCase().includes(q) ||
      p.customerName?.toLowerCase().includes(q)
    );
  }

  get filteredRepairPayments(): any[] {
    if (!this.repairSearchQuery.trim()) return this.repairPayments;
    const q = this.repairSearchQuery.toLowerCase();
    return this.repairPayments.filter(p =>
      p.invoiceId?.toLowerCase().includes(q) ||
      p.customerName?.toLowerCase().includes(q)
    );
  }

  viewDetails(payment: any): void { this.selectedPayment = payment; this.showDetailsModal = true; }
  closeDetailsModal(): void { this.showDetailsModal = false; this.selectedPayment = null; }

  isImage(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  async approvePayment(payment: any): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Approve Invoice Payment',
      message: `Approve invoice payment for ${payment.customerName}?`,
      confirmText: 'Approve',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    this.isLoading = true;
    this.invoiceService.approveInvoicePayment(payment._id).subscribe({
      next: () => {
        this.notificationService.show('✅ Payment approved! Email sent to customer.', 'success');
        this.loadPayments(); this.loadRepairPayments();
      },
      error: (err: any) => { console.error(err); this.isLoading = false; this.notificationService.show('❌ Failed to approve.', 'error'); }
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
    if (!this.rejectionReason.trim()) { this.notificationService.show('⚠️ Please enter a reason.', 'warning'); return; }
    this.isLoading = true;
    this.invoiceService.rejectInvoicePayment(this.selectedPayment._id, this.rejectionReason).subscribe({
      next: () => {
        this.notificationService.show('✅ Payment rejected. Email with re-upload link sent.', 'success');
        this.closeRejectModal(); this.loadPayments(); this.loadRepairPayments();
      },
      error: (err: any) => { console.error(err); this.isLoading = false; this.notificationService.show('❌ Failed to reject.', 'error'); }
    });
  }
}