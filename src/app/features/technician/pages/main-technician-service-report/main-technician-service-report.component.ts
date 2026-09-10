import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

interface ServiceReportTicket {
  id: string;
  customerName: string;
  productType: string;
  location: string;
  date: string;
  status: 'Pending' | 'Reviewed' | 'Approved' | 'Rejected';
}

type RawServiceReport = {
  _id?: string;
  ticketId?: string | number;
  serviceReportId?: string;
  customerName?: string;
  customer?: {
    name?: string;
  };
  productType?: string;
  productDetails?: {
    generalType?: string;
    detailedType?: string;
  };
  location?: string;
  date?: string;
  serviceDate?: string;
  scheduledDate?: string;
  submittedAt?: string;
  finalStatus?: string;
  status?: ServiceReportTicket['status'];
};

@Component({
  selector: 'app-main-technician-service-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './main-technician-service-report.component.html',
  styleUrl: './main-technician-service-report.component.css'})
export class MainTechnicianServiceReportsComponent implements OnInit {
  searchQuery = '';
  statusFilter: 'All' | ServiceReportTicket['status'] = 'All';
  tickets: ServiceReportTicket[] = [];

  filteredTickets: ServiceReportTicket[] = [];
  isLoading = false;
  error: string | null = null;
  private readonly apiUrl = `${environment.apiBaseUrl}/service-reports`;

  constructor(
    private router: Router,
    private http: HttpClient,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.loadServiceReports();
  }

  private formatDisplayDate(value?: string): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    }

    return value;
  }

  private mapApiServiceReport(item: RawServiceReport): ServiceReportTicket {
    const ticketId = String(item.serviceReportId || item.ticketId || item._id || '');
    const normalizedId = ticketId.startsWith('#') ? ticketId : `#${ticketId}`;

    const rawStatus = String(item.status || item.finalStatus || 'Pending').trim().toLowerCase();
    const normalizedStatus: ServiceReportTicket['status'] = rawStatus === 'approved'
      ? 'Approved'
      : rawStatus === 'rejected'
        ? 'Rejected'
        : rawStatus === 'reviewed'
          ? 'Reviewed'
          : 'Pending';

    return {
      id: normalizedId,
      customerName: item.customerName || item.customer?.name || 'Unknown Customer',
      productType: item.productType || item.productDetails?.detailedType || item.productDetails?.generalType || 'N/A',
      location: item.location || '',
      date: this.formatDisplayDate(item.date || item.serviceDate || item.scheduledDate || item.submittedAt || ''),
      status: normalizedStatus,
    };
  }

  loadServiceReports(): void {
    this.isLoading = true;
    this.error = null;

    this.http
      .get<{ success: boolean; data: RawServiceReport[] }>(this.apiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.tickets = response.data.map((item) => this.mapApiServiceReport(item));
            this.applyFilters();
          } else {
            this.error = 'Failed to load service reports';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading service reports:', err);
          this.error = `Failed to load service reports: ${err.message || 'Unknown error'}`;
          this.isLoading = false;
        },
      });
  }

  currentPage = 1;
  pageSize = 10;

  get totalPages(): number {
    return Math.ceil(this.filteredTickets.length / this.pageSize);
  }

  get paginatedTickets(): ServiceReportTicket[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTickets.slice(start, start + this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  applyFilters(): void {
    const normalized = this.searchQuery.toLowerCase();
    this.filteredTickets = this.tickets.filter((ticket) => {
      const matchesSearch = !normalized || (
        ticket.id.toLowerCase().includes(normalized) ||
        ticket.customerName.toLowerCase().includes(normalized) ||
        ticket.productType.toLowerCase().includes(normalized) ||
        ticket.location.toLowerCase().includes(normalized)
      );

      const matchesStatus = this.statusFilter === 'All' || ticket.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.statusFilter = 'All';
    this.searchQuery = '';
    this.applyFilters();
  }

  reviewServiceReport(id: string) {
    this.router.navigate(['/main-technician-service-report-review', id.replace('#', '')]);
  }
}

