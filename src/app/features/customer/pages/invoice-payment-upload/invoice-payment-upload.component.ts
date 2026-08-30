import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InvoiceService } from '../../../finance/services/invoice.service';
import { NavbarComponent } from '../../../../components/navbar/navbar.component';
import { FooterComponent } from '../../../../components/footer/footer.component';

@Component({
  selector: 'app-invoice-payment-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './invoice-payment-upload.component.html',
  styleUrls: ['./invoice-payment-upload.component.css']
})
export class InvoicePaymentUploadComponent implements OnInit {

  invoiceId = '';
  invoiceNumber = '';
  customerName = '';
  items: any[] = [];
  grandTotal = 0;
  bankDetails = { bankName: '', branchName: '', accountName: '', accountNo: '' };
  status = '';
  rejectionReason = '';

  uploadedFile: File | null = null;
  isDragOver = false;
  isSubmitting = false;
  errorMsg = '';
  slipSubmitted = false;
  isLoading = true;
  loadError = '';

  constructor(
    private invoiceService: InvoiceService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const invoiceId = params['invoiceId'];
      if (invoiceId) {
        this.invoiceId = invoiceId;
        this.loadInvoiceData(invoiceId);
      } else {
        this.isLoading = false;
        this.loadError = 'No invoice ID provided.';
      }
    });
  }

  loadInvoiceData(invoiceId: string): void {
    this.isLoading = true;
    this.invoiceService.getInvoiceForPaymentUpload(invoiceId).subscribe({
      next: (data: any) => {
        const inv = data.invoice || data;
        this.invoiceNumber = inv.invoiceNumber;
        this.customerName = inv.customerName;
        this.items = inv.items || [];
        this.grandTotal = inv.grandTotal;
        this.status = inv.status;
        this.rejectionReason = inv.paymentRejectionReason || '';

        if (inv.status === 'PAYMENT_UNDER_REVIEW' || inv.status === 'PAID') {
          this.slipSubmitted = true;
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load invoice:', err);
        this.loadError = 'Failed to load invoice details. Please try again.';
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
    if (input.files && input.files.length > 0) this.setFile(input.files[0]);
  }

  onDragOver(event: DragEvent) { event.preventDefault(); this.isDragOver = true; }
  onDragLeave() { this.isDragOver = false; }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) this.setFile(files[0]);
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
    if (!this.invoiceId) {
      this.errorMsg = 'Invoice not found. Please refresh the page.';
      return;
    }

    this.isSubmitting = true;
    this.errorMsg = '';

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.invoiceService.uploadPaymentSlip(this.invoiceId, base64).subscribe({
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