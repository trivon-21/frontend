import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { AuthUser } from '../../services/auth.service';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './customer-profile.component.html',
  styleUrl: './customer-profile.component.css'
})
export class CustomerProfileComponent implements OnInit {
  profile: AuthUser | null = null;
  profileForm!: FormGroup;
  isEditing = false;
  loading = true;
  saving = false;
  error = '';
  success = '';
  showAddEmailInput = false;
  newEmail = '';
  addEmailError = '';
  addingEmail = false;

  // Additional email verification
  pendingAdditionalEmailId: string | null = null;
  additionalEmailOtpValue = '';
  additionalEmailOtpVerifying = false;
  additionalEmailOtpResending = false;
  additionalEmailOtpError = '';
  additionalEmailOtpSuccess = '';
  confirmDelete = false;
  sendingResetLink = false;
  resetLinkSent = false;
  resetLinkError = '';

  // Email verification
  emailVerified = false;
  phoneVerified = false;
  authMethods: string[] = [];
  showOtpInput = false;
  profileOtpValue = '';
  otpVerifying = false;
  otpResending = false;
  otpError = '';
  otpSuccess = '';

  // Profile photo upload
  uploadingPhoto = false;
  photoUploadError = '';

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: [''],
      gender: [''],
      address: [''],
      phoneNumber: ['']
    });
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.emailVerified = data.emailVerified || false;
        this.phoneVerified = data.phoneVerified || false;
        this.authMethods = data.authMethods || ['email'];
        this.profileForm.setValue({
          fullName: data.fullName || '',
          lastName: data.lastName || '',
          gender: data.gender || '',
          address: data.address || '',
          phoneNumber: data.phoneNumber || ''
        });
        this.profileForm.disable();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load profile. Please try again.';
        this.loading = false;
      }
    });
  }

  // Helper method to check if account is verified based on auth methods
  isAccountVerified(): boolean {
    // If user has only email auth, check emailVerified
    if (this.authMethods.includes('email') && !this.authMethods.includes('phone')) {
      return this.emailVerified;
    }
    // If user has only phone auth, check phoneVerified
    if (this.authMethods.includes('phone') && !this.authMethods.includes('email')) {
      return this.phoneVerified;
    }
    // If user has both, either one verified means account is verified
    if (this.authMethods.includes('email') && this.authMethods.includes('phone')) {
      return this.emailVerified || this.phoneVerified;
    }
    // Default: check emailVerified
    return this.emailVerified;
  }

  startEditing(): void {
    this.isEditing = true;
    this.profileForm.enable();
    this.success = '';
    this.error = '';
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.profileForm.disable();
    if (this.profile) {
      this.profileForm.setValue({
        fullName: this.profile.fullName || '',
        lastName: this.profile.lastName || '',
        gender: this.profile.gender || '',
        address: this.profile.address || '',
        phoneNumber: this.profile.phoneNumber || ''
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.saving = true;
    this.error = '';
    this.success = '';
    this.profileService.updateProfile(this.profileForm.value).subscribe({
      next: (res) => {
        this.profile = res.user;
        this.isEditing = false;
        this.profileForm.disable();
        this.success = 'Profile updated successfully.';
        this.saving = false;
      },
      error: () => {
        this.error = 'Failed to save profile. Please try again.';
        this.saving = false;
      }
    });
  }

  toggleAddEmail(): void {
    this.showAddEmailInput = !this.showAddEmailInput;
    this.newEmail = '';
    this.addEmailError = '';
  }

  submitAddEmail(): void {
    if (!this.newEmail || !this.newEmail.includes('@')) {
      this.addEmailError = 'Please enter a valid email address.';
      return;
    }
    this.addingEmail = true;
    this.addEmailError = '';
    this.profileService.addEmail(this.newEmail).subscribe({
      next: (res) => {
        if (this.profile) this.profile.additionalEmails = res.additionalEmails;
        this.newEmail = '';
        this.showAddEmailInput = false;
        this.addingEmail = false;
        // Start OTP verification for the newly added email
        this.pendingAdditionalEmailId = res.newEmailId;
        this.additionalEmailOtpValue = '';
        this.additionalEmailOtpError = '';
        this.additionalEmailOtpSuccess = 'A verification code has been sent to the new email address.';
      },
      error: (err) => {
        this.addEmailError = err.error?.message ?? 'Failed to add email. Please try again.';
        this.addingEmail = false;
      }
    });
  }

  removeEmail(emailId: string): void {
    this.profileService.removeEmail(emailId).subscribe({
      next: (res) => {
        if (this.profile) this.profile.additionalEmails = res.additionalEmails;
        if (this.pendingAdditionalEmailId === emailId) {
          this.pendingAdditionalEmailId = null;
          this.additionalEmailOtpValue = '';
          this.additionalEmailOtpError = '';
          this.additionalEmailOtpSuccess = '';
        }
      }
    });
  }

  startAdditionalEmailVerification(emailId: string): void {
    this.pendingAdditionalEmailId = emailId;
    this.additionalEmailOtpValue = '';
    this.additionalEmailOtpError = '';
    this.additionalEmailOtpSuccess = '';
    this.profileService.resendAdditionalEmailOtp(emailId).subscribe({
      next: () => {
        this.additionalEmailOtpSuccess = 'A verification code has been sent to the email address.';
      },
      error: (err) => {
        this.additionalEmailOtpError = err.error?.message ?? 'Failed to send verification code.';
      }
    });
  }

  cancelAdditionalEmailVerification(): void {
    this.pendingAdditionalEmailId = null;
    this.additionalEmailOtpValue = '';
    this.additionalEmailOtpError = '';
    this.additionalEmailOtpSuccess = '';
  }

  submitAdditionalEmailOtp(): void {
    if (!this.additionalEmailOtpValue || this.additionalEmailOtpValue.length !== 6) {
      this.additionalEmailOtpError = 'Please enter the 6-digit code.';
      return;
    }
    if (!this.pendingAdditionalEmailId) return;
    this.additionalEmailOtpVerifying = true;
    this.additionalEmailOtpError = '';
    this.profileService.verifyAdditionalEmail(this.pendingAdditionalEmailId, this.additionalEmailOtpValue).subscribe({
      next: (res) => {
        if (this.profile) this.profile.additionalEmails = res.additionalEmails;
        this.pendingAdditionalEmailId = null;
        this.additionalEmailOtpValue = '';
        this.additionalEmailOtpVerifying = false;
        this.additionalEmailOtpSuccess = '';
        this.success = 'Email address verified successfully.';
      },
      error: (err) => {
        this.additionalEmailOtpVerifying = false;
        this.additionalEmailOtpError = err.error?.message ?? 'Verification failed. Please try again.';
      }
    });
  }

  resendAdditionalOtp(): void {
    if (!this.pendingAdditionalEmailId) return;
    this.additionalEmailOtpResending = true;
    this.additionalEmailOtpError = '';
    this.additionalEmailOtpSuccess = '';
    this.profileService.resendAdditionalEmailOtp(this.pendingAdditionalEmailId).subscribe({
      next: () => {
        this.additionalEmailOtpResending = false;
        this.additionalEmailOtpSuccess = 'A new code has been sent to the email address.';
      },
      error: (err) => {
        this.additionalEmailOtpResending = false;
        this.additionalEmailOtpError = err.error?.message ?? 'Failed to resend code. Please try again.';
      }
    });
  }

  deleteAccount(): void {
    if (!this.confirmDelete) {
      this.confirmDelete = true;
      return;
    }
    this.profileService.deleteAccount().subscribe({
      next: () => {
        this.authService.logout();
        this.router.navigate(['/']);
      },
      error: () => {
        this.error = 'Failed to delete account.';
        this.confirmDelete = false;
      }
    });
  }

  cancelDelete(): void {
    this.confirmDelete = false;
  }

  sendPasswordResetLink(): void {
    if (!this.profile || !this.profile.email) {
      this.resetLinkError = 'Email not found. Please update your profile.';
      return;
    }
    this.sendingResetLink = true;
    this.resetLinkSent = false;
    this.resetLinkError = '';
    this.authService.forgotPassword(this.profile.email).subscribe({
      next: () => {
        this.resetLinkSent = true;
        this.sendingResetLink = false;
      },
      error: () => {
        this.resetLinkError = 'Failed to send reset link. Please try again.';
        this.sendingResetLink = false;
      }
    });
  }

  startEmailVerification(): void {
    this.showOtpInput = true;
    this.profileOtpValue = '';
    this.otpError = '';
    this.otpSuccess = '';
    this.profileService.resendOtp().subscribe({
      next: () => {
        this.otpSuccess = 'A verification code has been sent to your email.';
      },
      error: (err) => {
        this.otpError = err.error?.message ?? 'Failed to send OTP. Please try again.';
      }
    });
  }

  cancelEmailVerification(): void {
    this.showOtpInput = false;
    this.profileOtpValue = '';
    this.otpError = '';
    this.otpSuccess = '';
  }

  submitEmailOtp(): void {
    if (!this.profileOtpValue || this.profileOtpValue.length !== 6) {
      this.otpError = 'Please enter the 6-digit code sent to your email.';
      return;
    }
    this.otpVerifying = true;
    this.otpError = '';
    this.profileService.verifyEmail(this.profileOtpValue).subscribe({
      next: () => {
        this.emailVerified = true;
        this.showOtpInput = false;
        this.otpVerifying = false;
        this.otpSuccess = '';
        if (this.profile) this.profile.emailVerified = true;
        this.success = 'Your email has been verified successfully.';
      },
      error: (err) => {
        this.otpVerifying = false;
        this.otpError = err.error?.message ?? 'Verification failed. Please try again.';
      }
    });
  }

  resendProfileOtp(): void {
    this.otpResending = true;
    this.otpError = '';
    this.otpSuccess = '';
    this.profileService.resendOtp().subscribe({
      next: () => {
        this.otpResending = false;
        this.otpSuccess = 'A new code has been sent to your email.';
      },
      error: (err) => {
        this.otpResending = false;
        this.otpError = err.error?.message ?? 'Failed to resend code. Please try again.';
      }
    });
  }

  timeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return '1 month ago';
    if (diffMonths < 12) return `${diffMonths} months ago`;
    const diffYears = Math.floor(diffMonths / 12);
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  }

  onProfilePhotoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.photoUploadError = 'Please select a valid image file.';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.photoUploadError = 'Image size should be less than 5MB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const photoData = e.target?.result as string;
      this.uploadPhoto(photoData);
    };
    reader.readAsDataURL(file);
  }

  uploadPhoto(photoData: string): void {
    this.uploadingPhoto = true;
    this.photoUploadError = '';
    this.profileService.uploadProfilePhoto(photoData).subscribe({
      next: (res) => {
        if (this.profile) this.profile.profilePhoto = res.profilePhoto;
        this.uploadingPhoto = false;
        this.success = 'Profile photo updated successfully.';
      },
      error: () => {
        this.photoUploadError = 'Failed to upload photo. Please try again.';
        this.uploadingPhoto = false;
      }
    });
  }

  get displayName(): string {
    if (!this.profile) return '';
    const parts = [this.profile.fullName, this.profile.lastName].filter(Boolean);
    return parts.join(' ');
  }

  get avatarInitials(): string {
    if (!this.profile) return 'U';
    const full = this.profile.fullName || '';
    const last = this.profile.lastName || '';
    if (full && last) return (full[0] + last[0]).toUpperCase();
    if (full) return full.slice(0, 2).toUpperCase();
    return 'U';
  }
}
