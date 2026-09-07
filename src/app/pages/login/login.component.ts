import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, AuthResponse } from '../../core/services/auth.service';
import { FirebaseGoogleAuthService } from '../../core/services/firebase-google-auth.service';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ChangePasswordModalComponent } from '../../components/modals/change-password-modal/change-password-modal.component';
import { roleHomeUrl } from '../../core/routing/role-home';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent, FooterComponent, ChangePasswordModalComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  googleLoading = false;
  form!: FormGroup;
  showOtpStep = false;
  otpForm!: FormGroup;
  sessionId = '';
  detectedAuthType: 'email' | 'phone' | 'invalid' | null = null;
  deactivatedEmail: string | null = null;
  showDeactivationNotice = false;
  showChangePasswordModal = false;
  private returnUrl: string;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private googleAuthService: FirebaseGoogleAuthService,
    public maintenanceService: MaintenanceService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';
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

  private getRedirectUrl(): string {
    if (this.returnUrl) {
      return this.returnUrl;
    }

    const user = this.authService.getCurrentUser();
    return roleHomeUrl(user?.role, user);
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

    // Login with password for both email and phone
    const payload = authType === 'email'
      ? { email: identifier, password, rememberMe }
      : { phoneNumber: identifier, password, rememberMe };

    this.authService.login(payload).subscribe({
      next: (response: AuthResponse) => {
        this.isLoading = false;

        // If maintenance is active and user is not SUPER_ADMIN, logout and show error
        if (this.maintenanceService.getMaintenanceActiveSync() && response.user.role !== 'SUPER_ADMIN') {
          this.authService.logout();
          this.errorMessage = 'System is currently under maintenance. Only administrators can access the system.';
          return;
        }

        // Check if user needs to change password
        if (response.user.needsPasswordChange) {
          this.showChangePasswordModal = true;
        } else {
          // Direct login successful
          this.router.navigateByUrl(this.getRedirectUrl());
        }
      },
      error: (err: any) => {
        this.isLoading = false;

        // Check for account deactivation error
        if (err.error?.code === 'ACCOUNT_DEACTIVATED') {
          this.showDeactivationNotice = true;
          this.deactivatedEmail = identifier;
          this.errorMessage = err.error?.message || 'This account has been deactivated';
          return;
        }

        this.errorMessage = err.error?.message ?? 'Login failed. Please try again.';
      },
    });
  }

  async signInWithGoogle() {
    if (this.maintenanceService.getMaintenanceActiveSync()) {
      this.errorMessage = 'System is currently under maintenance. Only administrators can access the system.';
      return;
    }

    this.googleLoading = true;
    this.isLoading = false;
    this.errorMessage = '';

    try {
      const session = await this.googleAuthService.signInWithGoogle();

      this.authService.googleAuth({
        idToken: session.idToken,
        rememberMe: this.form.get('rememberMe')?.value !== false,
      }).subscribe({
        next: (response: AuthResponse) => {
          this.googleLoading = false;

          if (this.maintenanceService.getMaintenanceActiveSync() && response.user.role !== 'SUPER_ADMIN') {
            this.authService.logout();
            this.errorMessage = 'System is currently under maintenance. Only administrators can access the system.';
            return;
          }

          this.router.navigateByUrl(this.getRedirectUrl());
        },
        error: (err: any) => {
          this.googleLoading = false;
          this.errorMessage = err.error?.message ?? 'Google sign-in failed. Please try again.';
        },
      });
    } catch (err: any) {
      this.googleLoading = false;
      this.errorMessage = err?.message ?? 'Google sign-in failed. Please try again.';
    }
  }

  onPasswordChanged(): void {
    this.showChangePasswordModal = false;
    this.router.navigateByUrl(this.getRedirectUrl());
  }

  onPasswordModalClosed(): void {
    this.showChangePasswordModal = false;
  }

  requestReactivation(): void {
    if (this.deactivatedEmail) {
      this.router.navigate(['/reactivation-request'], {
        queryParams: { email: this.deactivatedEmail },
      });
    }
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
        this.router.navigateByUrl(this.getRedirectUrl());
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
