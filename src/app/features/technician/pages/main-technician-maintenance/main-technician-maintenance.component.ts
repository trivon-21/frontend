import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';
import { GlobalSearchService } from '../../services/global-search.service';

interface MaintenanceTicket {
  _id: string;
  ticketId: string;
  customerName: string;
  productType: string;
  location: string;
  date: string;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'On Hold' | 'Assigned';
  assignedTeam: string;
  isCustomerInitiated?: boolean;
}

import { Router } from '@angular/router';

@Component({
  selector: 'app-main-technician-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './main-technician-maintenance.component.html',
  styleUrl: './main-technician-maintenance.component.css'
})
export class MainTechnicianMaintenanceComponent implements OnInit {
  searchQuery = '';
  statusFilter: 'All' | MaintenanceTicket['status'] = 'All';
  tickets: MaintenanceTicket[] = [];
  filteredTickets: MaintenanceTicket[] = [];
  isLoading = false;
  error: string | null = null;
  private readonly apiUrl = `${environment.apiBaseUrl}/maintenance`;

  constructor(
    private http: HttpClient,
    private destroyRef: DestroyRef,
    private globalSearchService: GlobalSearchService,
    private router: Router
  ) {}

  viewDetails(id: string): void {
    this.router.navigate(['/main-technician-maintenance-details', id]);
  }

  ngOnInit(): void {
    this.globalSearchService.searchQuery$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        this.searchQuery = query;
        this.applyFilters();
      });
    this.loadMaintenanceTickets();
  }

  loadMaintenanceTickets(): void {
    this.isLoading = true;
    this.error = null;

    this.http
      .get<{ success: boolean; data: MaintenanceTicket[] }>(this.apiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.tickets = response.data;
            this.applyFilters();
          } else {
            this.error = 'Failed to load maintenance records';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading maintenance tickets:', err);
          this.error = `Failed to load maintenance records: ${err.message || 'Unknown error'}`;
          this.isLoading = false;
        }
      });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.applyFilters();
  }

  currentPage = 1;
  pageSize = 10;

  get totalPages(): number {
    return Math.ceil(this.filteredTickets.length / this.pageSize);
  }

  get paginatedTickets(): MaintenanceTicket[] {
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
    const queryNormalized = this.searchQuery.toLowerCase().trim();
    this.filteredTickets = this.tickets.filter((ticket) => {
      const matchesSearch = !queryNormalized || (
        ticket.ticketId.toLowerCase().includes(queryNormalized) ||
        ticket.customerName.toLowerCase().includes(queryNormalized) ||
        ticket.productType.toLowerCase().includes(queryNormalized) ||
        ticket.location.toLowerCase().includes(queryNormalized)
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

  formatDisplayDate(dateStr: string): { date: string, year: string } {
    const parsed = new Date(dateStr);
    if (!Number.isNaN(parsed.getTime())) {
      const date = parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
      const year = parsed.toLocaleDateString('en-GB', { year: 'numeric' });
      return { date, year };
    }
    return { date: dateStr, year: '' };
  }
}
