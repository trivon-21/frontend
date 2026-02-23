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
  confirmDelete = false;
  sendingResetLink = false;
  resetLinkSent = false;
  resetLinkError = '';

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
      },
      error: () => {
        this.addEmailError = 'Failed to add email. Please try again.';
        this.addingEmail = false;
      }
    });
  }

  removeEmail(emailId: string): void {
    this.profileService.removeEmail(emailId).subscribe({
      next: (res) => {
        if (this.profile) this.profile.additionalEmails = res.additionalEmails;
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
    if (!this.profile) return;
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
