import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

interface InspectionReportTicket {
  id: string; // Now stores the 24-character MongoDB _id
  customerName: string;
  productType: string;
  location: string;
  date: string;
  status: 'Pending' | 'Reviewed' | 'Approved' | 'Rejected';
}

type RawInspectionReport = {
  _id: string;
  reportId?: string;
  customerId?: { name?: string; address?: string } | string;
  customerName?: string | null;
  customerAddress?: string | null;
  siteAddress?: string | null;
  inspectionMeta?: { date?: string | Date; recommendedProducts?: string[] };
  status?: InspectionReportTicket['status'];
  updatedAt?: string;
  fullName?: string | null;
};

@Component({
  selector: 'app-main-technician-inspection-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './main-technician-inspection-report.component.html',
  styleUrl: './main-technician-inspection-report.component.css'
})
export class MainTechnicianInspectionReportsComponent implements OnInit {
  searchQuery = '';
  statusFilter: 'All' | InspectionReportTicket['status'] = 'All';
  tickets: InspectionReportTicket[] = [];
  filteredTickets: InspectionReportTicket[] = [];
  isLoading = false;
  error: string | null = null;
  private readonly apiUrl = `${environment.apiBaseUrl}/inspections-reports`;

  constructor(private router: Router, private http: HttpClient, private destroyRef: DestroyRef) {}

  ngOnInit(): void { this.loadInspectionReports(); }

  private formatInspectionDate(value?: string | Date): string {
    if (!value) {
      return 'N/A';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return String(value);
    }

    return parsedDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  private mapApiInspectionReport(item: RawInspectionReport): InspectionReportTicket {
    const inspectionDate = item.inspectionMeta?.date || item.updatedAt;
    const populatedCustomer = item.customerId && typeof item.customerId === 'object' ? item.customerId : undefined;

    return {
      id: item.reportId || item._id, // Critical: Use reportId for API consistency
      customerName: item.fullName || populatedCustomer?.name || item.customerName || 'Unknown Customer',
      productType: item.inspectionMeta?.recommendedProducts?.[0] || 'N/A',
      location: item.siteAddress || populatedCustomer?.address || item.customerAddress || 'N/A',
      date: this.formatInspectionDate(inspectionDate),
      status: (item.status as InspectionReportTicket['status']) || 'Pending',
    };
  }

  loadInspectionReports(): void {
    this.isLoading = true;
    this.http.get<{ success: boolean; data: RawInspectionReport[] }>(this.apiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.tickets = (res.data || []).map(item => this.mapApiInspectionReport(item));
          this.applyFilters();
          this.isLoading = false;
        },
        error: (err) => { this.error = 'Failed to load reports'; this.isLoading = false; }
      });
  }

  currentPage = 1;
  pageSize = 10;

  get totalPages(): number {
    return Math.ceil(this.filteredTickets.length / this.pageSize);
  }

  get paginatedTickets(): InspectionReportTicket[] {
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
    const query = this.searchQuery.toLowerCase();
    this.filteredTickets = this.tickets.filter(t => 
      (this.statusFilter === 'All' || t.status === this.statusFilter) &&
      (t.customerName.toLowerCase().includes(query) || t.id.toLowerCase().includes(query))
    );
    this.currentPage = 1;
  }

  clearFilters(): void { this.statusFilter = 'All'; this.searchQuery = ''; this.applyFilters(); }

  reviewInspectionReport(id: string) {
    this.router.navigate(['/main-technician-inspection-report-review', id.replace('#', '')]);
  }
}

