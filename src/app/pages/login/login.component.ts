import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, AuthResponse } from '../../services/auth.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  form!: FormGroup;
  showOtpStep = false;
  otpForm!: FormGroup;
  sessionId = '';
  detectedAuthType: 'email' | 'phone' | 'invalid' | null = null;
  private returnUrl: string;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    this.form = this.fb.group({
      identifier: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [true],
    });
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  onIdentifierChange(identifier: string) {
    const authType = this.authService.identifyAuthType(identifier);
    this.detectedAuthType = authType;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { identifier, password, rememberMe } = this.form.value;
    const authType = this.authService.identifyAuthType(identifier);

    if (authType === 'invalid') {
      this.errorMessage = 'Please enter a valid email or Sri Lankan phone number (0XXXXXXXXX)';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload = authType === 'email'
      ? { email: identifier, password, rememberMe }
      : { phoneNumber: identifier, password, rememberMe };

    this.authService.login(payload).subscribe({
      next: (response: AuthResponse) => {
        this.isLoading = false;
        // Direct login successful (no OTP required for phone login)
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message ?? 'Login failed. Please try again.';
      },
    });
  }

  submitOtp() {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    const { otp } = this.otpForm.value;
    this.isLoading = true;
    this.errorMessage = '';

    const verifyMethod = this.detectedAuthType === 'phone'
      ? this.authService.verifyPhone(otp, this.sessionId)
      : this.authService.verifyEmail(otp);

    verifyMethod.subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message ?? 'OTP verification failed. Please try again.';
      },
    });
  }

  resendOtp() {
    this.isLoading = true;
    this.errorMessage = '';

    const resendMethod = this.detectedAuthType === 'phone'
      ? this.authService.resendOtpPhone(this.sessionId)
      : this.authService.resendOtp();

    resendMethod.subscribe({
      next: (res) => {
        this.isLoading = false;
        this.errorMessage = res.message;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message ?? 'Failed to resend OTP.';
      },
    });
  }

  backToLogin() {
    this.showOtpStep = false;
    this.otpForm.reset();
    this.errorMessage = '';
  }
}
