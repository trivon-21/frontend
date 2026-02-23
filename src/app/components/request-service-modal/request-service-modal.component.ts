import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceRequestService } from '../../services/service-request.service';

@Component({
  selector: 'app-request-service-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request-service-modal.component.html',
  styleUrl: './request-service-modal.component.css',
})
export class RequestServiceModalComponent {
  @Output() closed = new EventEmitter<void>();

  step = 1; // 1 = AC Unit, 2 = Service Details, 3 = Summary
  submitting = false;
  submitted = false;
  error: string | null = null;
  submittedRef = '';

  // Step 1: AC Unit
  acUnitModel = '';
  acUnitSerial = '';
  acWarrantyStatus: 'Active' | 'Expired' | 'Unknown' = 'Unknown';
  acAmcStatus: 'Active' | 'Not Active' = 'Not Active';

  // Step 2: Service Details
  serviceType = '';
  serviceTypeOther = '';
  problemDescription = '';
  preferredDate = '';
  preferredTimeSlot = '';

  readonly timeSlots = [
    '9:00 AM – 11:00 AM',
    '11:00 AM – 1:00 PM',
    '1:00 PM – 3:00 PM',
    '3:00 PM – 5:00 PM',
  ];

  readonly serviceTypes = [
    'Repair',
    'General Service',
    'Gas Refill',
    'Installation Issue',
    'AMC Service',
    'Other',
  ];

  constructor(private srService: ServiceRequestService) {}

  close() { this.closed.emit(); }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close();
  }

  get isFreeService(): boolean {
    return this.acWarrantyStatus === 'Active' || this.acAmcStatus === 'Active';
  }

  get estimatedCharges(): number {
    if (this.isFreeService) return 0;
    const chargeMap: Record<string, number> = {
      'Repair': 80,
      'General Service': 50,
      'Gas Refill': 60,
      'Installation Issue': 70,
      'AMC Service': 0,
      'Other': 50,
    };
    return chargeMap[this.serviceType] || 50;
  }

  get minDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  nextStep() {
    if (this.step === 1) {
      this.step = 2;
    } else if (this.step === 2) {
      if (!this.serviceType) { this.error = 'Please select a service type.'; return; }
      this.error = null;
      this.step = 3;
    }
  }

  prevStep() {
    if (this.step > 1) { this.step--; this.error = null; }
  }

  submit() {
    this.submitting = true;
    this.error = null;

    this.srService.createServiceRequest({
      acUnitModel: this.acUnitModel,
      acUnitSerial: this.acUnitSerial,
      acWarrantyStatus: this.acWarrantyStatus,
      acAmcStatus: this.acAmcStatus,
      serviceType: this.serviceType,
      serviceTypeOther: this.serviceType === 'Other' ? this.serviceTypeOther : '',
      problemDescription: this.problemDescription,
      preferredDate: this.preferredDate || undefined,
      preferredTimeSlot: this.preferredTimeSlot,
      estimatedCharges: this.estimatedCharges,
      paymentRequired: !this.isFreeService && this.estimatedCharges > 0,
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
