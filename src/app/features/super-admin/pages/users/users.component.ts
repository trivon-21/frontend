import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperAdminService, User } from '../../services/super-admin.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  // Users Management
  users: User[] = [];
  loading = false;
  error: string | null = null;
  currentPage = 1;
  pageSize = 10;
  totalUsers = 0;
  totalPages = 0;

  // Filters
  roleFilter = '';
  emailVerifiedFilter = '';
  phoneVerifiedFilter = '';
  searchQuery = '';

  // Modals
  showCreateModal = false;
  showEditModal = false;
  selectedUser: User | null = null;

  // Form data
  formData = {
    fullName: '',
    email: '',
    phoneNumber: '',
    role: '',
    password: '',
  };

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
        this.users = response.data;
        this.totalUsers = response.pagination.total;
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
      phoneNumber: user.phoneNumber || '',
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

  deleteUser(user: User, hardDelete: boolean = false): void {
    const confirmMsg = hardDelete
      ? 'Permanently delete this user? This cannot be undone.'
      : 'Deactivate this user?';

    if (!confirm(confirmMsg)) return;

    this.superAdminService.deleteUser(user._id, hardDelete).subscribe({
      next: () => {
        this.loadUsers();
        alert(hardDelete ? 'User permanently deleted' : 'User deactivated');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete user');
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
}
