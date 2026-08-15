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
import { AuthService, AuthResponse } from '../../core/services/auth.service';
import { FirebaseGoogleAuthService } from '../../core/services/firebase-google-auth.service';
import { FirebasePhoneAuthService, PhoneVerificationSession } from '../../core/services/firebase-phone-auth.service';
import { MaintenanceService } from '../../core/services/maintenance.service';
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
  googleLoading = false;
  form!: FormGroup;

  step: 'form' | 'otp' = 'form';
  signupIdentifier = '';
  detectedAuthType: 'email' | 'phone' | 'invalid' | null = null;
  sessionId = '';
  phoneVerificationSession: PhoneVerificationSession | null = null;
  otpValue = '';
  otpError = '';
  verifyingOtp = false;
  resendingOtp = false;
  resendSuccess = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private googleAuthService: FirebaseGoogleAuthService,
    private firebasePhoneAuth: FirebasePhoneAuthService,
    public maintenanceService: MaintenanceService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        identifier: ['', [Validators.required]], // Email or phone number
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

  onIdentifierChange(identifier: string) {
    const authType = this.authService.identifyAuthType(identifier);
    this.detectedAuthType = authType;
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

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, identifier, password } = this.form.value;
    const authType = this.authService.identifyAuthType(identifier);

    if (authType === 'invalid') {
      this.errorMessage = 'Please enter a valid email or Sri Lankan phone number (0XXXXXXXXX)';
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    this.isLoading = true;
    this.errorMessage = '';

    // Block signup if maintenance is active
    if (this.maintenanceService.getMaintenanceActiveSync()) {
      this.isLoading = false;
      this.errorMessage = 'System is currently under maintenance. New signups are temporarily disabled.';
      return;
    }

    if (authType === 'phone') {
      try {
        this.signupIdentifier = identifier;
        this.detectedAuthType = authType;
        this.resendSuccess = '';
        this.phoneVerificationSession = await this.firebasePhoneAuth.sendVerificationCode(identifier);
        this.step = 'otp';
        this.isLoading = false;
        this.otpError = '';
        this.otpValue = '';
        return;
      } catch (err: any) {
        this.isLoading = false;
        this.errorMessage = this.normalizeFirebaseError(err);
        return;
      }
    }

    const payload = authType === 'email'
      ? { fullName, email: identifier, password }
      : { fullName, phoneNumber: identifier, password };

    this.authService.signup(payload).subscribe({
      next: (response: AuthResponse) => {
        this.isLoading = false;
        this.signupIdentifier = identifier;
        this.detectedAuthType = authType;
        this.sessionId = response.sessionId || '';
        this.step = 'otp';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message ?? 'Signup failed. Please try again.';
      },
    });
  }

  async continueWithGoogle() {
    if (this.maintenanceService.getMaintenanceActiveSync()) {
      this.errorMessage = 'System is currently under maintenance. New signups are temporarily disabled.';
      return;
    }

    this.googleLoading = true;
    this.isLoading = false;
    this.errorMessage = '';

    try {
      const session = await this.googleAuthService.signInWithGoogle();

      this.authService.googleAuth({
        idToken: session.idToken,
        rememberMe: true,
      }).subscribe({
        next: () => {
          this.googleLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.googleLoading = false;
          this.errorMessage = err.error?.message ?? 'Google sign-up failed. Please try again.';
        },
      });
    } catch (err: any) {
      this.googleLoading = false;
      this.errorMessage = err?.message ?? 'Google sign-up failed. Please try again.';
    }
  }

  async verifyOtp() {
    if (!this.otpValue || this.otpValue.length !== 6) {
      this.otpError = 'Please enter the 6-digit OTP.';
      return;
    }

    if (this.detectedAuthType === 'phone') {
      if (!this.phoneVerificationSession) {
        this.otpError = 'Please request a new verification code.';
        return;
      }

      this.verifyingOtp = true;
      this.otpError = '';

      try {
        const credential = await this.firebasePhoneAuth.confirmVerificationCode(this.phoneVerificationSession, this.otpValue);
        const firebaseIdToken = await credential.user.getIdToken();
        const { firstName, lastName, identifier, password } = this.form.value;
        const fullName = `${firstName.trim()} ${lastName.trim()}`;

        this.authService.signup({
          fullName,
          phoneNumber: identifier,
          password,
          firebaseIdToken,
          firebasePhoneNumber: credential.user.phoneNumber || this.phoneVerificationSession.phoneNumber,
        }).subscribe({
          next: () => {
            this.verifyingOtp = false;
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            this.verifyingOtp = false;
            this.otpError = err.error?.message ?? 'Verification failed. Please try again.';
          },
        });
      } catch (err: any) {
        this.verifyingOtp = false;
        this.otpError = this.normalizeFirebaseError(err);
      }

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
    if (this.detectedAuthType === 'phone') {
      this.backToSignupForm();
      return;
    }
    this.router.navigate(['/dashboard']);
  }

  async resendOtp() {
    this.resendingOtp = true;
    this.resendSuccess = '';
    this.otpError = '';

    if (this.detectedAuthType === 'phone') {
      try {
        this.phoneVerificationSession = await this.firebasePhoneAuth.sendVerificationCode(this.signupIdentifier);
        this.resendingOtp = false;
        this.resendSuccess = 'A new verification code has been sent to your phone.';
      } catch (err: any) {
        this.resendingOtp = false;
        this.otpError = this.normalizeFirebaseError(err);
      }
      return;
    }

    const resendMethod = this.authService.resendOtp();

    resendMethod.subscribe({
      next: () => {
        this.resendingOtp = false;
        this.resendSuccess = `A new OTP has been sent to your ${this.detectedAuthType}.`;
      },
      error: (err) => {
        this.resendingOtp = false;
        this.otpError = err.error?.message ?? 'Failed to resend OTP. Please try again.';
      },
    });
  }

  backToSignupForm() {
    this.step = 'form';
    this.otpValue = '';
    this.otpError = '';
    this.resendSuccess = '';
    this.verifyingOtp = false;
    this.resendingOtp = false;
    this.phoneVerificationSession = null;
    this.firebasePhoneAuth.resetVerifier();
  }

  private normalizeFirebaseError(err: any): string {
    const code = err?.code as string | undefined;

    if (code === 'auth/invalid-phone-number') {
      return 'Please enter a valid phone number in international format.';
    }

    if (code === 'auth/too-many-requests') {
      return 'Too many attempts. Please wait and try again.';
    }

    if (code === 'auth/code-expired') {
      return 'The verification code has expired. Please request a new one.';
    }

    if (code === 'auth/invalid-verification-code') {
      return 'The verification code is incorrect.';
    }

    if (code === 'auth/operation-not-allowed') {
      return 'Phone sign-in is not enabled for this Firebase project or your SMS region is blocked. Enable Phone provider and allow your target region in Firebase Authentication settings.';
    }

    if (code === 'auth/billing-not-enabled') {
      return 'SMS verification requires billing on this Firebase project. Upgrade to the Blaze plan and enable billing in Google Cloud, then try again.';
    }

    if (code === 'auth/invalid-app-credential') {
      return 'Firebase credentials are invalid or mismatched. Verify your apiKey, authDomain, and projectId in firebase.config.ts match your Firebase Console project.';
    }

    return err?.message ?? 'Verification failed. Please try again.';
  }
}
