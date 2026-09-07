import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerServiceRequestService } from '../../../features/customer/services/customer-service-request.service';
import { PaymentService, BankDetails } from '../../../core/services/payment.service';
import { PortalIconsModule } from '../../../shared/components/portal-icons/portal-icons.module';

@Component({
  selector: 'app-request-service-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconsModule],
  templateUrl: './request-service-modal.component.html',
  styleUrl: './request-service-modal.component.css',
})
export class RequestServiceModalComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  // 1 = AC Unit, 2 = Service Details, 3 = Payment (Maintenance only), 4 = Summary (or 3 for Repair)
  step = 1;
  submitting = false;
  submitted = false;
  error: string | null = null;
  submittedRef = '';

  // Step 1: AC Unit
  acUnitModel = '';
  acUnitSerial = '';
  acWarrantyStatus: 'Active' | 'Expired' | 'Unknown' = 'Unknown';
  acAmcStatus: 'Active' | 'Not Active' = 'Not Active';

  // Step 2: Service Details - only Repair and Maintenance allowed
  serviceType: 'Repair' | 'Maintenance' | '' = '';
  problemDescription = '';
  preferredDate = '';
  preferredTimeSlot = '';

  readonly timeSlots = [
    '9:00 AM – 11:00 AM',
    '11:00 AM – 1:00 PM',
    '1:00 PM – 3:00 PM',
    '3:00 PM – 5:00 PM',
  ];

  readonly serviceTypes: ('Repair' | 'Maintenance')[] = [
    'Repair',
    'Maintenance',
  ];

  // Dynamic charges from database
  maintenanceFee = 6000;
  repairFee = 7500;
  loadingCharges = false;

  // Bank details for payment gateway
  bankDetails: BankDetails = {
    bankName: 'Commercial Bank of Ceylon',
    accountNumber: '1000234567',
    accountName: 'AirLux Technologies Pvt Ltd',
    branch: 'Colombo 03',
    currency: 'LKR'
  };

  // Payment Slip Upload State
  uploadedFile: File | null = null;
  filePreviewUrl: string | null = null;
  isDragOver = false;
  base64Slip = '';

  constructor(
    private srService: CustomerServiceRequestService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.loadCharges();
    this.loadBankDetails();
  }

  loadCharges(): void {
    this.loadingCharges = true;
    this.srService.getCharges().subscribe({
      next: (res) => {
        if (res && res.maintenanceFee) {
          this.maintenanceFee = res.maintenanceFee;
        }
        if (res && res.repairFee) {
          this.repairFee = res.repairFee;
        }
        this.loadingCharges = false;
      },
      error: () => {
        this.loadingCharges = false;
      }
    });
  }

  loadBankDetails(): void {
    this.paymentService.getBankDetails().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.bankDetails = res.data;
        }
      },
      error: (err) => {
        console.warn('Using default bank details:', err.message);
      }
    });
  }

  close() { this.closed.emit(); }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close();
  }

  get isFreeService(): boolean {
    return this.acWarrantyStatus === 'Active' || this.acAmcStatus === 'Active';
  }

  get estimatedCharges(): number {
    if (this.serviceType === 'Maintenance') {
      return this.maintenanceFee;
    }
    if (this.serviceType === 'Repair') {
      return this.isFreeService ? 0 : this.repairFee;
    }
    return 0;
  }

  get minDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  get totalSteps(): number {
    return this.serviceType === 'Maintenance' ? 4 : 3;
  }

  get isSummaryStep(): boolean {
    return (this.serviceType === 'Maintenance' && this.step === 4) ||
           (this.serviceType !== 'Maintenance' && this.step === 3);
  }

  get isPaymentStep(): boolean {
    return this.serviceType === 'Maintenance' && this.step === 3;
  }

  nextStep() {
    this.error = null;

    if (this.step === 1) {
      this.step = 2;
      return;
    }

    if (this.step === 2) {
      if (!this.serviceType) {
        this.error = 'Please select a service type (Repair or Maintenance).';
        return;
      }
      this.step = 3;
      return;
    }

    if (this.step === 3 && this.serviceType === 'Maintenance') {
      if (!this.base64Slip) {
        this.error = 'Please upload your bank payment slip to proceed.';
        return;
      }
      this.step = 4;
      return;
    }
  }

  prevStep() {
    if (this.step > 1) {
      this.step--;
      this.error = null;
    }
  }

  // ── Payment Slip Upload Handlers ──
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
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.error = 'Only PDF, JPG, PNG, or WEBP files are allowed.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error = 'File size must be under 5MB.';
      return;
    }

    this.error = null;
    this.uploadedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.base64Slip = reader.result as string;
      if (file.type.startsWith('image/')) {
        this.filePreviewUrl = this.base64Slip;
      } else {
        this.filePreviewUrl = null;
      }
    };
    reader.readAsDataURL(file);
  }

  removeFile(event?: Event) {
    if (event) event.stopPropagation();
    this.uploadedFile = null;
    this.base64Slip = '';
    this.filePreviewUrl = null;
    this.error = null;
  }

  submit() {
    this.submitting = true;
    this.error = null;

    if (this.serviceType === 'Maintenance' && !this.base64Slip) {
      this.error = 'Payment slip is required for Maintenance service requests.';
      this.submitting = false;
      return;
    }

    this.srService.createServiceRequest({
      acUnitModel: this.acUnitModel,
      acUnitSerial: this.acUnitSerial,
      acWarrantyStatus: this.acWarrantyStatus,
      acAmcStatus: this.acAmcStatus,
      serviceType: this.serviceType,
      problemDescription: this.problemDescription,
      preferredDate: this.preferredDate || undefined,
      preferredTimeSlot: this.preferredTimeSlot,
      estimatedCharges: this.estimatedCharges,
      paymentRequired: this.serviceType === 'Maintenance',
      paymentAmount: this.serviceType === 'Maintenance' ? this.maintenanceFee : 0,
      paymentSlipUrl: this.serviceType === 'Maintenance' ? this.base64Slip : undefined,
    }).subscribe({
      next: (res) => {
        this.submittedRef = res.serviceRequest.serviceRequestRef;
        this.submitted = true;
        this.submitting = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to submit service request. Please try again.';
        this.submitting = false;
      },
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

