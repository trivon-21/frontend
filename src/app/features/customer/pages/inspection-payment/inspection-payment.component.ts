import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InspectionTicketService } from '../../../finance/services/inspection-ticket.service';

@Component({
  selector: 'app-inspection-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection-payment.component.html',
  styleUrls: ['./inspection-payment.component.css']
})
export class InspectionPaymentComponent implements OnInit {

  // Order data — loaded from backend
  customerName = '';
  orderId = '';
  items: any[] = [];
  totalAmount = 0;
  ticketId = '';

  bankDetails = {
    bankName: '',
    branchName: '',
    accountName: '',
    accountNo: '',
    inspectionAmount: 0
  };

  paymentStatus = 'Pending Payment';

  // Upload state
  uploadedFile: File | null = null;
  isDragOver = false;
  isSubmitting = false;
  errorMsg = '';
  slipSubmitted = false;
  isLoading = true;
  loadError = '';

  constructor(
    private ticketService: InspectionTicketService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const orderId = params['orderId'];
      if (orderId) {
        this.loadOrderData(orderId);
      } else {
        this.isLoading = false;
        this.loadError = 'No order ID provided.';
      }
    });
  }
  loadOrderData(orderId: string): void {
    this.isLoading = true;
    this.ticketService.getOrCreateTicket(orderId).subscribe({
      next: (data: any) => {
        this.ticketId = data.ticket._id;
        this.orderId = data.order.orderId;
        this.customerName = data.order.customerName || 'Customer';
        this.items = Array.isArray(data.order.items)
          ? data.order.items
          : [data.order.itemName];
        this.totalAmount = data.order.amount;

        // Map backend bankDetails fields to frontend bankDetails object
        this.bankDetails = {
          bankName: data.bankDetails.bankName,
          branchName: data.bankDetails.branchName,
          accountName: data.bankDetails.accountName,
          accountNo: data.bankDetails.accountNo,
          inspectionAmount: data.bankDetails.inspectionFee  // ← map inspectionFee → inspectionAmount
        };

        if (data.ticket.status === 'PAYMENT_UNDER_REVIEW') {
          this.slipSubmitted = true;
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load order:', err);
        this.loadError = 'Failed to load order details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  triggerFileInput() {
    const input = document.querySelector('input[type=file]') as HTMLElement;
    input?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave() {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.setFile(files[0]);
    }
  }

  setFile(file: File) {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowed.includes(file.type)) {
      this.errorMsg = 'Only PDF or PNG/JPG files are allowed.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorMsg = 'File size must be under 5MB.';
      return;
    }
    this.errorMsg = '';
    this.uploadedFile = file;
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.uploadedFile = null;
    this.errorMsg = '';
  }

  confirmAndContinue() {
    if (!this.uploadedFile) {
      this.errorMsg = 'Please upload your payment slip.';
      return;
    }

    if (!this.ticketId) {
      this.errorMsg = 'Ticket not found. Please refresh the page.';
      return;
    }

    this.isSubmitting = true;
    this.errorMsg = '';

    // Convert file to base64 and send to backend
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;

      this.ticketService.uploadSlip(this.ticketId, base64).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.slipSubmitted = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Upload failed:', err);
          this.isSubmitting = false;
          this.errorMsg = 'Failed to upload slip. Please try again.';
        }
      });
    };
    reader.readAsDataURL(this.uploadedFile);
  }
}