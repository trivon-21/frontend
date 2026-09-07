import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SuperAdminService,
  GlobalNotificationItem,
  CreateGlobalNotificationPayload
} from '../../services/super-admin.service';

@Component({
  selector: 'app-global-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-notifications.component.html',
  styleUrls: ['./global-notifications.component.css']
})
export class GlobalNotificationsComponent implements OnInit {
  // Notification history list
  notifications: GlobalNotificationItem[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Pagination & Filters
  currentPage = 1;
  pageSize = 10;
  totalNotifications = 0;
  totalPages = 1;

  statusFilter = '';
  typeFilter = '';
  searchQuery = '';

  // Stats
  totalSent = 0;
  totalScheduled = 0;
  totalRecipients = 0;

  // Composer Modal
  showComposerModal = false;
  isSubmitting = false;

  // Form Model
  formTitle = '';
  formMessage = '';
  formType = 'general';
  formPriority = 'normal';
  formActionUrl = '';
  isAllRoles = true;
  selectedRoles: { [key: string]: boolean } = {
    CUSTOMER: true,
    CSA: true,
    INSPECTION: true,
    MAIN_TECH: true,
    SERVICE_TEAM: true,
    FINANCE: true,
    INVENTORY: true,
    MANAGER: true,
    SUPER_ADMIN: true
  };

  availableRoles = [
    { key: 'CUSTOMER', label: 'Customer' },
    { key: 'CSA', label: 'Customer Service (CSA)' },
    { key: 'INSPECTION', label: 'Inspection Officer' },
    { key: 'MAIN_TECH', label: 'Main Technician' },
    { key: 'SERVICE_TEAM', label: 'Service Team' },
    { key: 'FINANCE', label: 'Finance Team' },
    { key: 'INVENTORY', label: 'Inventory Manager' },
    { key: 'MANAGER', label: 'Operations Manager' },
    { key: 'SUPER_ADMIN', label: 'Super Admin' }
  ];

  deliveryMode: 'instant' | 'scheduled' = 'instant';
  scheduledDate = '';
  scheduledTime = '';
  minDateTime = '';

  // Details Modal
  showDetailModal = false;
  selectedNotification: GlobalNotificationItem | null = null;

  // Action states
  cancellingId: string | null = null;
  deletingId: string | null = null;

  constructor(private superAdminService: SuperAdminService) {}

  ngOnInit(): void {
    this.updateMinDateTime();
    this.loadNotifications();
  }

  updateMinDateTime(): void {
    const now = new Date();
    // Default scheduled time to 1 hour from now
    now.setHours(now.getHours() + 1);
    this.scheduledDate = now.toISOString().split('T')[0];
    this.scheduledTime = now.toTimeString().slice(0, 5);
  }

  loadNotifications(): void {
    this.loading = true;
    this.error = null;

    const filters: any = {};
    if (this.statusFilter) filters.status = this.statusFilter;
    if (this.typeFilter) filters.type = this.typeFilter;
    if (this.searchQuery) filters.search = this.searchQuery;

    this.superAdminService.listGlobalNotifications(this.currentPage, this.pageSize, filters).subscribe({
      next: (res) => {
        this.notifications = res.data || [];
        this.totalNotifications = res.pagination?.total || 0;
        this.totalPages = res.pagination?.pages || 1;
        this.loading = false;
        this.calculateStats();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load notifications';
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.totalSent = this.notifications.filter((n) => n.status === 'Sent').length;
    this.totalScheduled = this.notifications.filter((n) => n.status === 'Scheduled').length;
    this.totalRecipients = this.notifications.reduce((acc, n) => acc + (n.recipientCount || 0), 0);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadNotifications();
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.typeFilter = '';
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadNotifications();
  }

  openComposer(): void {
    this.formTitle = '';
    this.formMessage = '';
    this.formType = 'general';
    this.formPriority = 'normal';
    this.formActionUrl = '';
    this.isAllRoles = true;
    this.deliveryMode = 'instant';
    this.updateMinDateTime();
    this.showComposerModal = true;
  }

  closeComposer(): void {
    this.showComposerModal = false;
  }

  toggleAllRoles(): void {
    if (this.isAllRoles) {
      this.availableRoles.forEach((r) => (this.selectedRoles[r.key] = true));
    }
  }

  onRoleCheckboxChange(): void {
    const allSelected = this.availableRoles.every((r) => this.selectedRoles[r.key]);
    this.isAllRoles = allSelected;
  }

  submitNotification(): void {
    if (!this.formTitle.trim() || !this.formMessage.trim()) {
      this.error = 'Title and Message are required.';
      return;
    }

    let targetRoles: string[] = [];
    if (this.isAllRoles) {
      targetRoles = ['ALL'];
    } else {
      targetRoles = this.availableRoles
        .filter((r) => this.selectedRoles[r.key])
        .map((r) => r.key);
      if (targetRoles.length === 0) {
        this.error = 'Please select at least one recipient role.';
        return;
      }
    }

    let scheduledForIso: string | null = null;
    const isScheduled = this.deliveryMode === 'scheduled';
    if (isScheduled) {
      if (!this.scheduledDate || !this.scheduledTime) {
        this.error = 'Please select a valid scheduled date and time.';
        return;
      }
      const combined = new Date(`${this.scheduledDate}T${this.scheduledTime}:00`);
      if (isNaN(combined.getTime()) || combined <= new Date()) {
        this.error = 'Scheduled time must be in the future.';
        return;
      }
      scheduledForIso = combined.toISOString();
    }

    const payload: CreateGlobalNotificationPayload = {
      title: this.formTitle.trim(),
      message: this.formMessage.trim(),
      type: this.formType,
      priority: this.formPriority,
      actionUrl: this.formActionUrl.trim(),
      targetRoles,
      isScheduled,
      scheduledFor: scheduledForIso
    };

    this.isSubmitting = true;
    this.superAdminService.createGlobalNotification(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.showComposerModal = false;
        this.showSuccess(res.message || 'Notification processed successfully');
        this.loadNotifications();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error?.message || 'Failed to dispatch notification';
      }
    });
  }

  openDetail(n: GlobalNotificationItem): void {
    this.selectedNotification = n;
    this.showDetailModal = true;
  }

  closeDetail(): void {
    this.selectedNotification = null;
    this.showDetailModal = false;
  }

  cancelNotification(n: GlobalNotificationItem): void {
    if (!confirm(`Are you sure you want to cancel the scheduled notification "${n.title}"?`)) {
      return;
    }
    this.cancellingId = n._id;
    this.superAdminService.cancelGlobalNotification(n._id).subscribe({
      next: () => {
        this.cancellingId = null;
        n.status = 'Cancelled';
        this.showSuccess('Scheduled notification cancelled');
        this.loadNotifications();
      },
      error: (err) => {
        this.cancellingId = null;
        this.error = err.error?.message || 'Failed to cancel scheduled notification';
      }
    });
  }

  deleteNotification(n: GlobalNotificationItem): void {
    if (!confirm(`Delete notification record "${n.title}"?`)) {
      return;
    }
    this.deletingId = n._id;
    this.superAdminService.deleteGlobalNotification(n._id).subscribe({
      next: () => {
        this.deletingId = null;
        this.showSuccess('Notification record deleted');
        this.loadNotifications();
      },
      error: (err) => {
        this.deletingId = null;
        this.error = err.error?.message || 'Failed to delete notification';
      }
    });
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      if (this.successMessage === msg) {
        this.successMessage = null;
      }
    }, 4000);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Sent':
        return 'status-active';
      case 'Scheduled':
        return 'status-pending';
      case 'Cancelled':
        return 'status-inactive';
      default:
        return 'status-default';
    }
  }
}

