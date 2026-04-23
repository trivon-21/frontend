import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

interface InstallationTicket {
  id: string;
  customerName: string;
  productType: string;
  location: string;
  date: string;
  year: string;
  status: 'Assigned' | 'In Progress' | 'Scheduled' | 'Completed' | 'On Hold';
  assignedTeam: string;
}

type RawInstallation = {
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
  assignedTeamName?: string;
};

@Component({
  selector: 'app-main-technician-installations',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './main-technician-installations.component.html',
  styleUrl: './main-technician-installations.component.css'})
export class MainTechnicianInstallationsComponent implements OnInit {
  searchQuery = '';
  statusFilter: 'All' | InstallationTicket['status'] = 'All';
  tickets: InstallationTicket[] = [];

  filteredTickets: InstallationTicket[] = [...this.tickets];
  isLoading = false;
  error: string | null = null;
  private readonly apiUrl = `${environment.apiBaseUrl}/installations`;

  constructor(
    private router: Router,
    private http: HttpClient,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.loadInstallations();
  }

  private formatDisplayDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    }

    return value;
  }

  private formatDisplayYear(value?: string): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-GB', { year: 'numeric' });
    }

    return '';
  }

  private mapApiInstallation(item: RawInstallation): InstallationTicket {
    const ticketId = String(item.ticketId ?? item._id ?? '');
    const normalizedId = ticketId.startsWith('#') ? ticketId : `#${ticketId}`;
    const populatedCustomerName = typeof item.customerId === 'object' ? item.customerId?.name : undefined;
    const populatedCustomerAddress = typeof item.customerId === 'object' ? item.customerId?.address : undefined;

    const isScheduledOrLater = ['Scheduled', 'In Progress', 'Completed', 'On Hold'].includes(item.status || '');
    const scheduledDate = isScheduledOrLater ? (item.date || item.serviceDate) : undefined;

    return {
      id: normalizedId,
      customerName: item.customerName || populatedCustomerName || 'Unknown Customer',
      productType: item.productType || 'N/A',
      location: populatedCustomerAddress || (item.location && !/logistic area/i.test(item.location) ? item.location : '-'),
      date: this.formatDisplayDate(scheduledDate),
      year: this.formatDisplayYear(scheduledDate),
      status: (item.status as InstallationTicket['status']) || 'Scheduled',
      assignedTeam: item.assignedTeamName || (typeof item.assignedTeam === 'string'
        ? item.assignedTeam
        : (item.assignedTeam && typeof item.assignedTeam === 'object' && 'teamName' in item.assignedTeam
            ? (item.assignedTeam.teamName || 'Unassigned')
        : 'Unassigned')),
    };
  }

  loadInstallations(): void {
    this.isLoading = true;
    this.error = null;

    this.http
      .get<{ success: boolean; data: RawInstallation[] }>(this.apiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const apiTickets = response.data.map((item) => this.mapApiInstallation(item));
            this.tickets = apiTickets;
            this.applyFilters();
          } else {
            this.error = 'Failed to load installations';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading installations:', err);
          this.error = `Failed to load installations: ${err.message || 'Unknown error'}`;
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
    this.router.navigate(['/main-technician-installation-details', id]);
  }
}

