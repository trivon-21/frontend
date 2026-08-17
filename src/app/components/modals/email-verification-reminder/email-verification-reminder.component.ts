import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerProfileService } from '../../../features/customer/services/customer-profile.service';

@Component({
  selector: 'app-email-verification-reminder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './email-verification-reminder.component.html',
  styleUrl: './email-verification-reminder.component.css'
})
export class EmailVerificationReminderComponent implements OnInit {
  @Input() userEmail: string = '';
  @Output() closed = new EventEmitter<void>();
  @Output() verified = new EventEmitter<void>();

  step: 'reminder' | 'otp' = 'reminder';
  otpForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  resendCountdown = 0;

  constructor(
    private fb: FormBuilder,
    private profileService: CustomerProfileService
  ) {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit(): void {
    // Request OTP to be sent
    this.requestOtp();
  }

  requestOtp(): void {
    this.profileService.resendOtp().subscribe({
      next: () => {
        this.successMessage = 'Verification code sent to your email';
        this.startResendCountdown();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to send verification code';
      }
    });
  }

  startResendCountdown(): void {
    this.resendCountdown = 60;
    const interval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  }

  submitOtp(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { otp } = this.otpForm.value;

    this.profileService.verifyEmail(otp).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Email verified successfully!';
        setTimeout(() => {
          this.verified.emit();
          this.closeModal();
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Invalid or expired OTP. Please try again.';
      }
    });
  }

  verifyLater(): void {
    this.closed.emit();
  }

  closeModal(): void {
    this.closed.emit();
  }

  proceedToVerification(): void {
    this.step = 'otp';
    this.errorMessage = '';
  }

  backToReminder(): void {
    this.step = 'reminder';
  }
}
