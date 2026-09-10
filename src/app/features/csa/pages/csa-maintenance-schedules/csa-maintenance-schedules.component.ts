import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

interface ServiceItem {
  serviceName: string;
  date: string | null;
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
  selector: 'app-csa-maintenance-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './csa-maintenance-schedules.component.html',
  styleUrl: './csa-maintenance-schedules.component.css'
})
export class CsaMaintenanceSchedulesComponent implements OnInit {
  searchQuery = '';
  schedules: MaintenanceSchedule[] = [];
  filteredSchedules: MaintenanceSchedule[] = [];
  selectedSchedule: MaintenanceSchedule | null = null;

  isLoading = false;
  isSendingToCustomer = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Counts
  countSentToCSA = 0;
  countSentToCustomer = 0;

  // Confirmation dialog
  showConfirmDialog = false;
  customerNotes = '';

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

    // Fetch all schedules — filter to only 'Sent to CSA' and 'Sent to Customer' on front-end
    this.http
      .get<{ success: boolean; data: MaintenanceSchedule[] }>(this.apiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // CSA sees only schedules that are relevant to them
            this.schedules = response.data.filter(s =>
              s.status === 'Sent to CSA' || s.status === 'Sent to Customer'
            );
            this.calculateCounts();
            this.applyFilters();

            // Preserve selection
            if (this.selectedSchedule) {
              const found = this.schedules.find(s => s._id === this.selectedSchedule!._id);
              if (found) {
                this.selectSchedule(found);
              } else {
                this.selectedSchedule = this.filteredSchedules.length > 0 ? { ...this.filteredSchedules[0] } : null;
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
          this.error = `Failed to load schedules: ${err.message || 'Unknown error'}`;
          this.isLoading = false;
        }
      });
  }

  calculateCounts(): void {
    this.countSentToCSA = this.schedules.filter(s => s.status === 'Sent to CSA').length;
    this.countSentToCustomer = this.schedules.filter(s => s.status === 'Sent to Customer').length;
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredSchedules = this.schedules.filter(s =>
      !q ||
      s.ticketId.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      (s.location || '').toLowerCase().includes(q)
    );

    if (this.selectedSchedule && !this.filteredSchedules.some(s => s._id === this.selectedSchedule!._id)) {
      this.selectedSchedule = this.filteredSchedules.length > 0 ? { ...this.filteredSchedules[0] } : null;
    }
  }

  onSearchInput(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  selectSchedule(schedule: MaintenanceSchedule): void {
    this.selectedSchedule = JSON.parse(JSON.stringify(schedule));
    this.error = null;
    this.successMessage = null;
    this.showConfirmDialog = false;
    this.customerNotes = '';
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
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
            this.successMessage = `Schedule ${this.selectedSchedule!.ticketId} has been sent to the customer.`;
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
