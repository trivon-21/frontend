import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';
import { GlobalSearchService } from '../../services/global-search.service';

interface ServiceRequest {
  id: string;
  customerName: string;
  productType: string;
  location: string;
  date: string;
  year: string;
  status: string;
  assignedTeam: string;
}

interface ServiceRequestApiItem {
  _id?: string;
  ticketId?: string | number;
  customerName?: string;
  fullName?: string;
  customerId?: string | { name?: string; address?: string; fullName?: string };
  productType?: string;
  location?: string;
  serviceDate?: string;
  status?: string;
  assignedTeam?: string | { teamName?: string };
}

@Component({
  selector: 'app-main-technician-service-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './main-technician-service-requests.component.html',
  styleUrl: './main-technician-service-requests.component.css'
})
export class MainTechnicianServiceRequestsComponent implements OnInit {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private globalSearchService = inject(GlobalSearchService);

  searchQuery: string = '';
  statusFilter: string = 'All';
  isLoading = false;
  serviceRequests: ServiceRequest[] = [];
  filteredRequests: ServiceRequest[] = [];
  private readonly apiUrl = `${environment.apiBaseUrl}/service-requests`;

  constructor(private router: Router) {}

  /** Loads service requests on component initialization. */
  ngOnInit(): void {
    this.globalSearchService.searchQuery$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        this.searchQuery = query;
        this.filterRequests();
      });
    this.loadRequests();
  }

  /** Fetches requests from the backend and maps them into the view model. */
  loadRequests(): void {
    this.isLoading = true;
    this.http.get<{ success: boolean; data: ServiceRequestApiItem[] }>(this.apiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.serviceRequests = (res.data || []).map((item) => this.mapApiRequest(item));
          this.filterRequests();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.serviceRequests = [];
          this.filteredRequests = [];
        }
      });
  }

  /** Reapplies filters whenever the search input changes. */
  onSearchInput(): void {
    this.filterRequests();
  }

  /** Navigates to the service request detail page using a normalized id. */
  viewServiceDetails(id: string): void {
    const cleanId = id.startsWith('#') ? id.substring(1) : id;
    this.router.navigate(['/main-technician-service-request-details', cleanId]);
  }

  currentPage = 1;
  pageSize = 10;

  get totalPages(): number {
    return Math.ceil(this.filteredRequests.length / this.pageSize);
  }

  get paginatedRequests(): ServiceRequest[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRequests.slice(start, start + this.pageSize);
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

  /** Filters the loaded requests by the current search text and status. */
  filterRequests(): void {
    const query = this.searchQuery.trim().toLowerCase();

    this.filteredRequests = this.serviceRequests
      .filter((request) => {
        const matchesSearch = request.id.toLowerCase().includes(query) ||
          request.customerName.toLowerCase().includes(query);
        const matchesStatus = this.statusFilter === 'All' || request.status === this.statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        // Priority order: Assigned (top) -> other statuses (middle) -> Completed (bottom)
        const aStatusPriority = this.getStatusPriority(a.status);
        const bStatusPriority = this.getStatusPriority(b.status);

        return aStatusPriority - bStatusPriority;
      });
    this.currentPage = 1;
  }

  /** Returns priority order for status sorting: Assigned (0) -> Others (1) -> Completed (2) */
  private getStatusPriority(status: string): number {
    const normalizedStatus = status.trim().toLowerCase();
    if (normalizedStatus === 'assigned') {
      return 0; // Assigned at top
    }
    if (normalizedStatus === 'completed') {
      return 2; // Completed at bottom
    }
    return 1; // All other statuses in middle (Scheduled, etc.)
  }

  /** Resets the search and status filters back to their defaults. */
  clearFilters(): void {
    this.searchQuery = '';
    this.statusFilter = 'All';
    this.filterRequests();
  }

  /** Returns a concise summary for the current filtered result set. */
  get resultsSummary(): string {
    if (this.isLoading) {
      return 'Loading service requests...';
    }

    return this.filteredRequests.length === 0
      ? 'No service requests match the current filters.'
      : `Showing ${this.filteredRequests.length} service requests`;
  }

  /** Maps a backend service request record into the view model used by the table. */
  private mapApiRequest(item: ServiceRequestApiItem): ServiceRequest {
    const displayDate = this.formatDisplayDate(item.serviceDate);
    const populatedCustomerName = typeof item.customerId === 'object' ? item.customerId?.fullName || item.customerId?.name : undefined;
    const populatedCustomerAddress = typeof item.customerId === 'object' ? item.customerId?.address : undefined;
    const ticketId = String(item.ticketId || item._id || '');
    const normalizedId = ticketId.startsWith('#') ? ticketId : `#${ticketId}`;

    const assignedTeamName = typeof item.assignedTeam === 'object'
      ? (item.assignedTeam?.teamName || 'Unassigned')
      : (item.assignedTeam || 'Unassigned');

    return {
      id: normalizedId,
      customerName: item.fullName || item.customerName || populatedCustomerName || '-',
      productType: item.productType || '-',
      location: populatedCustomerAddress || item.location || '-',
      date: displayDate.date,
      year: displayDate.year,
      status: item.status || 'Unknown',
      assignedTeam: assignedTeamName
    };
  }

  /** Formats a service date for display while safely handling missing or invalid values. */
  private formatDisplayDate(value?: string): { date: string; year: string } {
    if (!value) {
      return { date: '-', year: '' };
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return { date: value, year: '' };
    }

    return {
      date: parsed.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long'
      }),
      year: parsed.toLocaleDateString('en-GB', {
        year: 'numeric'
      })
    };
  }
}

