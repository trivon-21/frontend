import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';
import { GlobalSearchService } from '../../services/global-search.service';

interface InspectionTicket {
  id: string;
  customerName: string;
  productType: string;
  location: string;
  date: string;
  status: 'Assigned' | 'In Progress' | 'Scheduled' | 'Completed' | 'On Hold';
  assignedTeam: string;
}

type RawInspection = {
  _id?: string;
  ticketId?: string | number;
  customerName?: string;
  customerId?: string | { name?: string; address?: string };
  productType?: string;
  location?: string;
  date?: string;
  serviceDate?: string;
  status?: 'Assigned' | 'In Progress' | 'Scheduled' | 'Completed' | 'On Hold';
  assignedTeam?: string | { teamName?: string };
};

@Component({
  selector: 'app-main-technician-inspections',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './main-technician-inspections.component.html',
  styleUrl: './main-technician-inspections.component.css'})
export class MainTechnicianInspectionsComponent implements OnInit {
  searchQuery = '';
  statusFilter: 'All' | InspectionTicket['status'] = 'All';
  tickets: InspectionTicket[] = [];

  filteredTickets: InspectionTicket[] = [...this.tickets];
  isLoading = false;
  error: string | null = null;
  private readonly apiUrl = `${environment.apiBaseUrl}/inspections`;

  constructor(
    private router: Router,
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
    this.loadInspections();
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

  private mapApiInspection(item: RawInspection): InspectionTicket {
    const ticketId = String(item.ticketId || item._id || '');
    const normalizedId = ticketId.startsWith('#') ? ticketId : `#${ticketId}`;
    const populatedCustomerName = typeof item.customerId === 'object' ? item.customerId?.name : undefined;
    const populatedCustomerAddress = typeof item.customerId === 'object' ? item.customerId?.address : undefined;

    return {
      id: normalizedId,
      customerName: item.customerName || populatedCustomerName || 'Unknown Customer',
      productType: item.productType || 'N/A',
      location: populatedCustomerAddress || item.location || '-',
      date: this.formatDisplayDate(item.date || item.serviceDate || ''),
      status: (item.status as InspectionTicket['status']) || 'Scheduled',
      assignedTeam: 'Inspection Team A',
    };
  }

  loadInspections(): void {
    this.isLoading = true;
    this.error = null;

    this.http
      .get<{ success: boolean; data: RawInspection[] }>(this.apiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.tickets = response.data.map((item) => this.mapApiInspection(item));
            this.applyFilters();
          } else {
            this.error = 'Failed to load inspections';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading inspections:', err);
          this.error = `Failed to load inspections: ${err.message || 'Unknown error'}`;
          this.isLoading = false;
        },
      });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.applyFilters();
  }

  applyFilters(): void {
    const normalized = this.searchQuery.toLowerCase();
    this.filteredTickets = this.tickets.filter((ticket) => {
      const matchesSearch = !normalized || (
        ticket.id.toLowerCase().includes(normalized) ||
        ticket.customerName.toLowerCase().includes(normalized) ||
        ticket.productType.toLowerCase().includes(normalized) ||
        ticket.location.toLowerCase().includes(normalized) ||
        ticket.status.toLowerCase().includes(normalized)
      );

      const matchesStatus = this.statusFilter === 'All' || ticket.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  clearFilters(): void {
    this.statusFilter = 'All';
    this.searchQuery = '';
    this.applyFilters();
  }

  viewJobDetails(id: string) {
    this.router.navigate(['/main-technician-inspection-details', id]);
  }
}

