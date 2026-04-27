import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InvoiceService } from '../../../finance/services/invoice.service';

@Component({
  selector: 'app-customer-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-invoice.component.html',
  styleUrls: ['./customer-invoice.component.css']
})
export class CustomerInvoiceComponent implements OnInit {

  invoiceId = '';
  invoice: any = null;
  daysLeft = 0;
  isLoading = true;
  loadError = '';

  // UI state
  isAccepted = false;
  isRejected = false;
  showRejectModal = false;
  rejectionReason = '';
  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['invoiceId']) {
        this.invoiceId = params['invoiceId'];
        this.loadInvoice(this.invoiceId);
      } else {
        this.isLoading = false;
        this.loadError = 'No invoice ID provided.';
      }
    });
  }

  loadInvoice(id: string): void {
    this.invoiceService.getInvoiceForCustomer(id).subscribe({
      next: (data: any) => {
        this.invoice = data.invoice;
        this.daysLeft = data.daysLeft || 0;
        this.isAccepted = data.invoice.status === 'ACCEPTED';
        this.isRejected = data.invoice.status === 'REJECTED';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loadError = err.message || 'Failed to load invoice.';
        this.isLoading = false;
      }
    });
  }

  get customerName(): string { return this.invoice?.customerName || 'Customer'; }
  get isAutoCancelled(): boolean { return this.invoice?.status === 'AUTO_CANCELLED'; }
  get canCancelRejection(): boolean {
    return this.isRejected && this.daysLeft > 0;
  }

  acceptInvoice(): void {
    this.isSubmitting = true;
    this.invoiceService.acceptInvoice(this.invoiceId).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isAccepted = true;
        this.invoice.status = 'ACCEPTED';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        alert('❌ ' + err.message);
      }
    });
  }

  openRejectModal(): void {
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void { this.showRejectModal = false; this.rejectionReason = ''; }

  confirmReject(): void {
    if (!this.rejectionReason.trim()) { alert('Please provide a reason.'); return; }
    this.isSubmitting = true;
    this.invoiceService.rejectInvoice(this.invoiceId, this.rejectionReason).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isRejected = true;
        this.invoice.status = 'REJECTED';
        this.showRejectModal = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        alert('❌ ' + err.message);
      }
    });
  }

  cancelRejection(): void {
    if (!confirm('Cancel your rejection and accept this invoice?')) return;
    this.isSubmitting = true;
    this.invoiceService.cancelRejection(this.invoiceId).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isRejected = false;
        this.isAccepted = true;
        this.invoice.status = 'ACCEPTED';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        alert('❌ ' + err.message);
      }
    });
  }
}