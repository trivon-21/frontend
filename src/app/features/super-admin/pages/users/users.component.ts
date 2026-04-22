import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperAdminService, User, ReactivationRequest } from '../../services/super-admin.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  // Tab management
  activeTab: 'active' | 'deactivated' | 'reactivation' = 'active';

  // Users Management
  users: User[] = [];
  deactivatedUsers: User[] = [];
  reactivationRequests: ReactivationRequest[] = [];
  loading = false;
  error: string | null = null;
  currentPage = 1;
  pageSize = 10;
  totalUsers = 0;
  totalPages = 0;

  // Reactivation requests pagination
  reactivationPage = 1;
  reactivationTotalPages = 0;
  reactivationTotalRequests = 0;

  // Filters
  roleFilter = '';
  emailVerifiedFilter = '';
  phoneVerifiedFilter = '';
  searchQuery = '';

  // Modals
  showCreateModal = false;
  showEditModal = false;
  showDeactivationModal = false;
  selectedUser: User | null = null;

  // Form data
  formData = {
    fullName: '',
    email: '',
    phoneNumber: '',
    role: '',
    password: '',
  };

  // Deactivation form
  deactivationForm = {
    reason: '',
  };

  deactivationReasons = [
    'Violation of Terms',
    'Suspicious Activity',
    'Account Compromise',
    'User Request',
    'Inactivity',
    'Other',
  ];

  roles = [
    'CUSTOMER',
    'CSA',
    'INSPECTION',
    'MAIN_TECH',
    'SERVICE_TEAM',
    'FINANCE',
    'INVENTORY',
    'MANAGER',
  ];

  constructor(private superAdminService: SuperAdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  switchTab(tab: 'active' | 'deactivated' | 'reactivation'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.reactivationPage = 1;

    if (tab === 'active') {
      this.loadUsers();
    } else if (tab === 'deactivated') {
      this.loadDeactivatedUsers();
    } else if (tab === 'reactivation') {
      this.loadReactivationRequests();
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    const filters: any = {};
    if (this.roleFilter) filters.role = this.roleFilter;
    if (this.emailVerifiedFilter) filters.emailVerified = this.emailVerifiedFilter === 'true';
    if (this.phoneVerifiedFilter) filters.phoneVerified = this.phoneVerifiedFilter === 'true';
    if (this.searchQuery) filters.search = this.searchQuery;

    this.superAdminService.listUsers(this.currentPage, this.pageSize, filters).subscribe({
      next: (response) => {
        this.users = response.data.filter((u) => u.isActive !== false);
        this.totalUsers = this.users.length;
        this.totalPages = response.pagination.pages;
        this.currentPage = response.pagination.page;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load users';
        this.loading = false;
      },
    });
  }

  loadDeactivatedUsers(): void {
    this.loading = true;
    this.error = null;

    this.superAdminService.listUsers(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.deactivatedUsers = response.data.filter((u) => u.isActive === false);
        this.totalUsers = this.deactivatedUsers.length;
        this.totalPages = Math.ceil(this.totalUsers / this.pageSize);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load deactivated users';
        this.loading = false;
      },
    });
  }

  loadReactivationRequests(): void {
    this.loading = true;
    this.error = null;

    this.superAdminService.getReactivationRequests(this.reactivationPage, this.pageSize).subscribe({
      next: (response) => {
        this.reactivationRequests = response.data;
        this.reactivationTotalRequests = response.pagination.total;
        this.reactivationTotalPages = response.pagination.pages;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load reactivation requests';
        this.loading = false;
      },
    });
  }

  openCreateModal(): void {
    this.resetForm();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetForm();
  }

  openEditModal(user: User): void {
    this.selectedUser = user;
    this.formData = {
      fullName: user.fullName,
      email: user.email || '',
      phoneNumber: this.formatPhoneNumberForDisplay(user.phoneNumber || ''),
      role: user.role,
      password: '',
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedUser = null;
    this.resetForm();
  }

  openDeactivationModal(user: User): void {
    this.selectedUser = user;
    this.deactivationForm.reason = '';
    this.showDeactivationModal = true;
  }

  closeDeactivationModal(): void {
    this.showDeactivationModal = false;
    this.selectedUser = null;
    this.deactivationForm.reason = '';
  }

  resetForm(): void {
    this.formData = {
      fullName: '',
      email: '',
      phoneNumber: '',
      role: '',
      password: '',
    };
  }

  createUser(): void {
    if (!this.formData.fullName || !this.formData.role || !this.formData.password) {
      alert('Please fill in all required fields');
      return;
    }

    if (!this.formData.email && !this.formData.phoneNumber) {
      alert('Please provide either email or phone number');
      return;
    }

    const payload = {
      fullName: this.formData.fullName,
      email: this.formData.email || undefined,
      phoneNumber: this.formData.phoneNumber || undefined,
      role: this.formData.role,
      password: this.formData.password,
    };

    this.superAdminService.createUser(payload).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadUsers();
        alert('User created successfully');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to create user');
      },
    });
  }

  updateUser(): void {
    if (!this.selectedUser) return;

    if (!this.formData.fullName || !this.formData.role) {
      alert('Please fill in required fields');
      return;
    }

    const payload: any = {
      fullName: this.formData.fullName,
      role: this.formData.role,
    };

    if (this.formData.email) payload.email = this.formData.email;
    if (this.formData.phoneNumber) payload.phoneNumber = this.formData.phoneNumber;

    this.superAdminService.updateUser(this.selectedUser._id, payload).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadUsers();
        alert('User updated successfully');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update user');
      },
    });
  }

  deactivateUser(): void {
    if (!this.selectedUser || !this.deactivationForm.reason) {
      alert('Please select a deactivation reason');
      return;
    }

    this.superAdminService.deactivateUser(this.selectedUser._id, this.deactivationForm.reason).subscribe({
      next: () => {
        this.closeDeactivationModal();
        this.loadUsers();
        alert('User deactivated successfully. Email sent to user.');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to deactivate user');
      },
    });
  }

  deleteUser(user: User, hardDelete: boolean = false): void {
    const confirmMsg = hardDelete
      ? 'Permanently delete this user? This cannot be undone.'
      : 'Deactivate this user?';

    if (!confirm(confirmMsg)) return;

    this.superAdminService.deleteUser(user._id, hardDelete).subscribe({
      next: () => {
        if (this.activeTab === 'active') {
          this.loadUsers();
        } else if (this.activeTab === 'deactivated') {
          this.loadDeactivatedUsers();
        }
        alert(hardDelete ? 'User permanently deleted' : 'User deactivated');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete user');
      },
    });
  }

  reactivateUserDirectly(user: User): void {
    if (!confirm('Reactivate this user?')) return;

    this.superAdminService.handleReactivationRequest(user._id, true, 'Reactivated by admin').subscribe({
      next: () => {
        this.loadDeactivatedUsers();
        alert('User reactivated successfully');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to reactivate user');
      },
    });
  }

  approveReactivationRequest(request: ReactivationRequest): void {
    if (!confirm('Approve this reactivation request?')) return;

    this.superAdminService.handleReactivationRequest(request._id, true, '').subscribe({
      next: () => {
        this.loadReactivationRequests();
        alert('Reactivation request approved');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to approve request');
      },
    });
  }

  rejectReactivationRequest(request: ReactivationRequest): void {
    const reason = prompt('Enter reason for rejection:');
    if (reason === null) return;

    this.superAdminService.handleReactivationRequest(request._id, false, reason).subscribe({
      next: () => {
        this.loadReactivationRequests();
        alert('Reactivation request rejected');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to reject request');
      },
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  clearFilters(): void {
    this.roleFilter = '';
    this.emailVerifiedFilter = '';
    this.phoneVerifiedFilter = '';
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadUsers();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  previousReactivationPage(): void {
    if (this.reactivationPage > 1) {
      this.reactivationPage--;
      this.loadReactivationRequests();
    }
  }

  nextReactivationPage(): void {
    if (this.reactivationPage < this.reactivationTotalPages) {
      this.reactivationPage++;
      this.loadReactivationRequests();
    }
  }

  getStatusText(user: User): string {
    if (user.emailVerified && user.phoneVerified) return 'Fully Verified';
    if (user.emailVerified || user.phoneVerified) return 'Partially Verified';
    return 'Unverified';
  }

  getStatusBadgeClass(user: User): string {
    if (user.emailVerified && user.phoneVerified) return 'status-badge--verified';
    if (user.emailVerified || user.phoneVerified) return 'status-badge--partial';
    return 'status-badge--unverified';
  }

  formatPhoneNumberForDisplay(phoneNumber: string): string {
    if (!phoneNumber) return '';
    if (phoneNumber.startsWith('+94')) {
      return '0' + phoneNumber.slice(3);
    }
    return phoneNumber;
  }
}
