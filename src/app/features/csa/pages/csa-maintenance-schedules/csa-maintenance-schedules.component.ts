import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

interface ServiceItem {
  serviceName: string;
  date: string | null;
  underWarranty?: boolean;
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
  status: 'Sent to CSA' | 'Sent to Customer';
  services: ServiceItem[];
  sentToCsaAt?: string;
  sentToCustomerAt?: string;
  csaNotes?: string;
  customerNotes?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-csa-maintenance-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './csa-maintenance-schedules.component.html',
  styleUrl: './csa-maintenance-schedules.component.css'
})
export class CsaMaintenanceSchedulesComponent implements OnInit {
  searchQuery = '';
  statusFilter: 'All' | 'Sent to CSA' | 'Sent to Customer' = 'All';
  schedules: MaintenanceSchedule[] = [];
  filteredSchedules: MaintenanceSchedule[] = [];
  selectedSchedule: MaintenanceSchedule | null = null;

  isLoading = false;
  isSendingToCustomer = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Modal controls
  showDetailModal = false;
  showConfirmDialog = false;
  customerNotes = '';

  // Counts
  countAll = 0;
  countSentToCSA = 0;
  countSentToCustomer = 0;

  private readonly apiUrl = `${environment.apiBaseUrl}/maintenance/schedules`;

  constructor(
    private http: HttpClient,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  loadSchedules(): void {
    this.isLoading = true;
    this.error = null;

    this.http
      .get<{ success: boolean; data: any[] }>(this.apiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.schedules = response.data.filter((s: any) =>
              s.status === 'Sent to CSA' || s.status === 'Sent to Customer'
            );
            this.calculateCounts();
            this.applyFilters();

            // Refresh selectedSchedule if modal is open
            if (this.selectedSchedule && this.showDetailModal) {
              const found = this.schedules.find(s => s._id === this.selectedSchedule!._id);
              if (found) {
                this.selectedSchedule = JSON.parse(JSON.stringify(found));
              }
            }
          } else {
            this.error = 'Failed to load schedules';
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.error = `Failed to load schedules: ${err.message || 'Unknown error'}`;
          this.isLoading = false;
        }
      });
  }

  calculateCounts(): void {
    this.countAll = this.schedules.length;
    this.countSentToCSA = this.schedules.filter(s => s.status === 'Sent to CSA').length;
    this.countSentToCustomer = this.schedules.filter(s => s.status === 'Sent to Customer').length;
  }

  setStatusFilter(filter: 'All' | 'Sent to CSA' | 'Sent to Customer'): void {
    this.statusFilter = filter;
    this.applyFilters();
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredSchedules = this.schedules.filter(s => {
      // Status filter
      if (this.statusFilter !== 'All' && s.status !== this.statusFilter) {
        return false;
      }

      // Search query
      if (q) {
        const matchesTicket = s.ticketId.toLowerCase().includes(q);
        const matchesCustomer = s.customerName.toLowerCase().includes(q);
        const matchesLocation = (s.location || '').toLowerCase().includes(q);
        const matchesProduct = (s.productType || '').toLowerCase().includes(q);
        if (!matchesTicket && !matchesCustomer && !matchesLocation && !matchesProduct) {
          return false;
        }
      }

      return true;
    });
  }

  onSearchInput(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  openDetailModal(schedule: MaintenanceSchedule): void {
    this.selectedSchedule = JSON.parse(JSON.stringify(schedule));
    this.showDetailModal = true;
    this.showConfirmDialog = false;
    this.customerNotes = '';
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.showConfirmDialog = false;
    this.customerNotes = '';
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  getDisplayStatus(status: string): string {
    if (status === 'Sent to CSA') return 'Received';
    return status;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  canSendToCustomer(): boolean {
    return this.selectedSchedule?.status === 'Sent to CSA';
  }

  openConfirmDialog(): void {
    if (!this.canSendToCustomer()) return;
    this.showConfirmDialog = true;
    this.customerNotes = '';
  }

  closeConfirmDialog(): void {
    this.showConfirmDialog = false;
    this.customerNotes = '';
  }

  confirmSendToCustomer(): void {
    if (!this.selectedSchedule || !this.canSendToCustomer()) return;

    this.isSendingToCustomer = true;
    this.error = null;
    this.successMessage = null;
    this.showConfirmDialog = false;

    this.http
      .post<{ success: boolean; data: MaintenanceSchedule; message: string }>(
        `${this.apiUrl}/${this.selectedSchedule._id}/send-to-customer`,
        { customerNotes: this.customerNotes }
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = `Schedule ${this.selectedSchedule!.ticketId} has been successfully sent to the customer.`;
            this.closeDetailModal();
            this.loadSchedules();
          } else {
            this.error = 'Failed to send schedule to customer.';
          }
          this.isSendingToCustomer = false;
        },
        error: (err) => {
          const msg = err.error?.message || err.message || 'Unknown error';
          this.error = `Failed to send to customer: ${msg}`;
          this.isSendingToCustomer = false;
        }
      });
  }
}
