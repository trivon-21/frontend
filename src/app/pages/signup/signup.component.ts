import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

function strongPassword(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value || '';
  const errors: ValidationErrors = {};
  if (v.length < 8) errors['minLength'] = true;
  if (!/[A-Z]/.test(v)) errors['uppercase'] = true;
  if (!/[a-z]/.test(v)) errors['lowercase'] = true;
  if (!/[0-9]/.test(v)) errors['number'] = true;
  if (!/[^A-Za-z0-9]/.test(v)) errors['specialChar'] = true;
  return Object.keys(errors).length ? errors : null;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  form!: FormGroup;

  step: 'form' | 'otp' = 'form';
  signupEmail = '';
  otpValue = '';
  otpError = '';
  verifyingOtp = false;
  resendingOtp = false;
  resendSuccess = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, strongPassword]],
        confirmPassword: ['', [Validators.required]],
        agreeTerms: [false, [Validators.requiredTrue]],
      },
      { validators: passwordsMatch }
    );
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  get pw() {
    return this.form.get('password')?.value as string || '';
  }

  get pwErrors() {
    return this.form.get('password')?.errors || {};
  }

  get passwordTouched() {
    return this.form.get('password')?.touched ?? false;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, password } = this.form.value;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.signup({ fullName, email, password }).subscribe({
      next: () => {
        this.isLoading = false;
        this.signupEmail = email;
        this.step = 'otp';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message ?? 'Signup failed. Please try again.';
      },
    });
  }

  verifyOtp() {
    if (!this.otpValue || this.otpValue.length !== 6) {
      this.otpError = 'Please enter the 6-digit OTP sent to your email.';
      return;
    }
    this.verifyingOtp = true;
    this.otpError = '';
    this.authService.verifyEmail(this.otpValue).subscribe({
      next: () => {
        this.verifyingOtp = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.verifyingOtp = false;
        this.otpError = err.error?.message ?? 'Verification failed. Please try again.';
      },
    });
  }

  verifyLater() {
    this.router.navigate(['/dashboard']);
  }

  resendOtp() {
    this.resendingOtp = true;
    this.resendSuccess = '';
    this.otpError = '';
    this.authService.resendOtp().subscribe({
      next: () => {
        this.resendingOtp = false;
        this.resendSuccess = 'A new OTP has been sent to your email.';
      },
      error: (err) => {
        this.resendingOtp = false;
        this.otpError = err.error?.message ?? 'Failed to resend OTP. Please try again.';
      },
    });
  }
}
