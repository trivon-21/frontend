import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { EmailVerificationReminderComponent } from '../email-verification-reminder/email-verification-reminder.component';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmailVerificationReminderComponent],
  templateUrl: './change-password-modal.component.html',
  styleUrl: './change-password-modal.component.css'
})
export class ChangePasswordModalComponent {
  @Output() passwordChanged = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  passwordForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  showEmailVerification = false;
  userEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.passwordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/[A-Z]/),
        Validators.pattern(/[a-z]/),
        Validators.pattern(/[0-9]/),
        Validators.pattern(/[^A-Za-z0-9]/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  hasUppercase(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /[A-Z]/.test(password);
  }

  hasLowercase(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /[a-z]/.test(password);
  }

  hasNumber(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /[0-9]/.test(password);
  }

  hasSpecialChar(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /[^A-Za-z0-9]/.test(password);
  }

  hasMinLength(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return password.length >= 8;
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.passwordForm.get('newPassword');
    if (!passwordControl || !passwordControl.touched) return '';

    if (passwordControl.hasError('required')) return 'Password is required';
    if (passwordControl.hasError('minlength')) return 'Password must be at least 8 characters';
    if (!this.hasUppercase()) return 'Password must contain uppercase letter';
    if (!this.hasLowercase()) return 'Password must contain lowercase letter';
    if (!this.hasNumber()) return 'Password must contain number';
    if (!this.hasSpecialChar()) return 'Password must contain special character';
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    const confirmControl = this.passwordForm.get('confirmPassword');
    if (!confirmControl || !confirmControl.touched) return '';

    if (confirmControl.hasError('required')) return 'Please confirm your password';
    if (this.passwordForm.hasError('passwordMismatch')) return 'Passwords do not match';
    return '';
  }

  submit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { newPassword } = this.passwordForm.value;

    this.authService.changePasswordFirstLogin(newPassword).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.successMessage = 'Password changed successfully!';

        // If email verification is required, show the reminder modal
        if (response.requiresEmailVerification && response.userEmail) {
          this.userEmail = response.userEmail;
          setTimeout(() => {
            this.showEmailVerification = true;
          }, 1500);
        } else {
          setTimeout(() => {
            this.passwordChanged.emit();
          }, 1000);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to change password. Please try again.';
      }
    });
  }

  closeModal(): void {
    this.closed.emit();
  }

  onEmailVerificationClosed(): void {
    this.showEmailVerification = false;
    this.passwordChanged.emit();
  }

  onEmailVerified(): void {
    this.showEmailVerification = false;
    this.passwordChanged.emit();
  }
}

