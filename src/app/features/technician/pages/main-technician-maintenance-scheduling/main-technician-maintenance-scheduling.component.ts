import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';
import { GlobalSearchService } from '../../services/global-search.service';

interface ServiceItem {
  serviceName: string;
  date: string;
  underWarranty: boolean;
}

interface MaintenanceSchedule {
  _id: string;
  ticketId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  installationDate: string;
  location: string;
  productType?: string;
  status: 'New' | 'Draft Saved' | 'Sent to CSA' | 'Sent to Customer';
  services: ServiceItem[];
  sentToCsaAt?: string;
  sentToCustomerAt?: string;
  csaNotes?: string;
  customerNotes?: string;
}

@Component({
  selector: 'app-main-technician-maintenance-scheduling',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './main-technician-maintenance-scheduling.component.html',
  styleUrl: './main-technician-maintenance-scheduling.component.css'
})
export class MainTechnicianMaintenanceSchedulingComponent implements OnInit {
  searchQuery = '';
  statusFilter: 'All' | MaintenanceSchedule['status'] = 'All';
  schedules: MaintenanceSchedule[] = [];
  filteredSchedules: MaintenanceSchedule[] = [];
  selectedSchedule: MaintenanceSchedule | null = null;

  isLoading = false;
  isSaving = false;
  isSendingToCSA = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Counts for summary cards
  countNew = 0;
  countDrafts = 0;
  countCSA = 0;
  countCustomer = 0;

  private readonly apiUrl = `${environment.apiBaseUrl}/maintenance/schedules`;

  constructor(
    private http: HttpClient,
    private destroyRef: DestroyRef,
    private globalSearchService: GlobalSearchService
  ) {}

  ngOnInit(): void {
    this.globalSearchService.searchQuery$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        this.searchQuery = query;
        this.applyFilters();
      });
    this.loadSchedules();
  }

  loadSchedules(): void {
    this.isLoading = true;
    this.error = null;

    this.http
      .get<{ success: boolean; data: MaintenanceSchedule[] }>(this.apiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.schedules = response.data.map(item => {
              const enrichedServices = item.services.map(srv => ({
                serviceName: srv.serviceName,
                underWarranty: srv.underWarranty,
                date: this.toInputDateFormat(srv.date)
              }));
              return { ...item, services: enrichedServices };
            });
            this.calculateCounts();
            this.applyFilters();

            // Preserve selected schedule if still visible after reload
            if (this.selectedSchedule) {
              const found = this.schedules.find(s => s._id === this.selectedSchedule!._id);
              if (found) {
                this.selectSchedule(found);
              } else if (this.filteredSchedules.length > 0) {
                this.selectSchedule(this.filteredSchedules[0]);
              } else {
                this.selectedSchedule = null;
              }
            } else if (this.filteredSchedules.length > 0) {
              this.selectSchedule(this.filteredSchedules[0]);
            }
          } else {
            this.error = 'Failed to load schedules';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading schedules:', err);
          this.error = `Failed to load schedules: ${err.message || 'Unknown error'}`;
          this.isLoading = false;
        }
      });
  }

  calculateCounts(): void {
    this.countNew = this.schedules.filter(s => s.status === 'New').length;
    this.countDrafts = this.schedules.filter(s => s.status === 'Draft Saved').length;
    this.countCSA = this.schedules.filter(s => s.status === 'Sent to CSA').length;
    this.countCustomer = this.schedules.filter(s => s.status === 'Sent to Customer').length;
  }

  applyFilters(): void {
    const queryNormalized = this.searchQuery.toLowerCase().trim();
    this.filteredSchedules = this.schedules.filter((sched) => {
      const matchesSearch = !queryNormalized || (
        sched.ticketId.toLowerCase().includes(queryNormalized) ||
        sched.customerName.toLowerCase().includes(queryNormalized) ||
        (sched.location || '').toLowerCase().includes(queryNormalized)
      );
      const matchesStatus = this.statusFilter === 'All' || sched.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });

    // If the selected item falls outside the filtered list, reset or pick first
    if (this.selectedSchedule && !this.filteredSchedules.some(s => s._id === this.selectedSchedule!._id)) {
      this.selectedSchedule = this.filteredSchedules.length > 0 ? { ...this.filteredSchedules[0] } : null;
    }
  }

  clearFilters(): void {
    this.statusFilter = 'All';
    this.searchQuery = '';
    this.applyFilters();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.applyFilters();
  }

  selectSchedule(schedule: MaintenanceSchedule): void {
    // Deep clone to avoid mutating original until explicitly saved
    this.selectedSchedule = JSON.parse(JSON.stringify(schedule));
    this.error = null;
    this.successMessage = null;
  }

  toInputDateFormat(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return dateStr;
  }

  formatDisplayDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return dateStr;
  }

  /** Read-only lock: Sent to CSA or Sent to Customer */
  isLocked(): boolean {
    return (
      this.selectedSchedule?.status === 'Sent to CSA' ||
      this.selectedSchedule?.status === 'Sent to Customer'
    );
  }

  /** Can save draft from New or Draft Saved */
  canSaveDraft(): boolean {
    return (
      this.selectedSchedule?.status === 'New' ||
      this.selectedSchedule?.status === 'Draft Saved'
    );
  }

  /** Can send to CSA from New or Draft Saved */
  canSendToCSA(): boolean {
    return (
      this.selectedSchedule?.status === 'New' ||
      this.selectedSchedule?.status === 'Draft Saved'
    );
  }

  /**
   * Save schedule as Draft.
   * Works from 'New' (→ Draft Saved) and 'Draft Saved' (→ stays Draft Saved).
   */
  saveDraft(): void {
    if (!this.selectedSchedule || !this.canSaveDraft()) return;

    this.isSaving = true;
    this.successMessage = null;
    this.error = null;

    const payload = { services: this.selectedSchedule.services };

    this.http
      .post<{ success: boolean; data: MaintenanceSchedule; message: string }>(
        `${this.apiUrl}/${this.selectedSchedule._id}/draft`,
        payload
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = `Draft saved for ${this.selectedSchedule!.ticketId}.`;
            this.loadSchedules();
          } else {
            this.error = 'Failed to save draft';
          }
          this.isSaving = false;
        },
        error: (err) => {
          console.error('Error saving draft:', err);
          const serverMessage = err.error?.message || err.message || 'Unknown error';
          this.error = `Failed to save draft: ${serverMessage}`;
          this.isSaving = false;
        }
      });
  }

  /**
   * Send the schedule to CSA.
   * Allowed from 'New' and 'Draft Saved' status (backend accepts both).
   */
  sendToCSA(): void {
    if (!this.selectedSchedule || !this.canSendToCSA()) return;

    this.isSendingToCSA = true;
    this.successMessage = null;
    this.error = null;

    const payload = { services: this.selectedSchedule.services };

    this.http
      .post<{ success: boolean; data: MaintenanceSchedule; message: string }>(
        `${this.apiUrl}/${this.selectedSchedule._id}/send-to-csa`,
        payload
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = `Schedule ${this.selectedSchedule!.ticketId} sent to CSA successfully!`;
            this.loadSchedules();
          } else {
            this.error = 'Failed to send schedule to CSA';
          }
          this.isSendingToCSA = false;
        },
        error: (err) => {
          console.error('Error sending schedule to CSA:', err);
          const serverMessage = err.error?.message || err.message || 'Unknown error';
          this.error = `Failed to send to CSA: ${serverMessage}`;
          this.isSendingToCSA = false;
        }
      });
  }

  /** Badge CSS class helper — normalizes status string to a CSS-safe class name */
  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }
}
