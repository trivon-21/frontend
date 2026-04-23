import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface ServiceHistoryItem {
  ticketId: string;
  serviceType: string;
  productType: string;
  date: string;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'On Hold';
  assignedTeam: string;
  warrantyStatus: 'Warranty Period not started yet' | 'Warranty Activated' | 'Warranty Claimed' | 'Warranty Not Claimed' | 'Warranty is Over';
}

interface ServiceHistorySummary {
  customerName: string;
  location: string;
  productType: string;
  installationDate: string | null;
}

interface ServiceHistoryResponse {
  success: boolean;
  data: {
    customerId: string;
    summary: ServiceHistorySummary;
    history: ServiceHistoryItem[];
  };
}

@Component({
  selector: 'app-main-technician-service-history',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './main-technician-service-history.component.html',
  styleUrl: './main-technician-service-history.component.css'})
export class MainTechnicianServiceHistoryComponent implements OnInit {
  historyItems: ServiceHistoryItem[] = [];
  summary: ServiceHistorySummary = {
    customerName: '-',
    location: '-',
    productType: '-',
    installationDate: null,
  };
  isLoading = false;
  error: string | null = null;
  source: 'service' | 'installation' | 'inspection' = 'service';
  private readonly apiUrl = `${environment.apiBaseUrl}/service-requests`;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const sourceParam = this.route.snapshot.paramMap.get('source');
    if (sourceParam === 'service' || sourceParam === 'installation' || sourceParam === 'inspection') {
      this.source = sourceParam;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Missing service identifier in URL.';
      return;
    }

    this.loadHistory(id);
  }

  loadHistory(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.http
      .get<ServiceHistoryResponse>(`${this.apiUrl}/${encodeURIComponent(id)}/history?source=${encodeURIComponent(this.source)}`)
      .subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.summary = {
            customerName: res.data.summary?.customerName || '-',
            location: res.data.summary?.location || '-',
            productType: res.data.summary?.productType || '-',
            installationDate: res.data.summary?.installationDate || null,
          };

          this.historyItems = (res.data.history || [])
            .slice()
            .sort((a, b) => this.sortByAscendingDate(a.date, b.date))
            .map((item) => ({
              ...item,
              date: this.formatDate(item.date),
            }));
        } else {
          this.error = 'Service history was not returned by the server.';
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to load service history.';
        this.isLoading = false;
      }
      });
  }

  private formatDate(value?: string | null): string {
    if (!value) {
      return '-';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  private sortByAscendingDate(leftValue?: string | null, rightValue?: string | null): number {
    const leftTime = this.parseDateValue(leftValue);
    const rightTime = this.parseDateValue(rightValue);

    if (leftTime === null && rightTime === null) {
      return 0;
    }

    if (leftTime === null) {
      return 1;
    }

    if (rightTime === null) {
      return -1;
    }

    return leftTime - rightTime;
  }

  private parseDateValue(value?: string | null): number | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }

  getDateWithoutYear(value: string): string {
    if (!value || value === '-') {
      return '-';
    }

    const parts = value.split(' ');
    return parts.length >= 3 ? `${parts[0]} ${parts[1]}` : value;
  }

  getDateYear(value: string): string {
    if (!value || value === '-') {
      return '';
    }

    const parts = value.split(' ');
    return parts.length >= 3 ? parts[2] : '';
  }

  getWarrantyClass(status: string): string {
    switch (status) {
      case 'Warranty Period not started yet': return 'w-not-started';
      case 'Warranty Activated': return 'w-activated';
      case 'Warranty Claimed': return 'w-claimed';
      case 'Warranty Not Claimed': return 'w-not-claimed';
      case 'Warranty is Over': return 'w-over';
      default: return '';
    }
  }

  /**
   * Enforces service-history warranty rules by service type:
   * - Inspection: always "Warranty Period not started yet"
   * - Installation: always "Warranty Activated"
   * - Service: only "Warranty Claimed", "Warranty Not Claimed", or "Warranty is Over"
   */
  getDisplayWarrantyStatus(item: ServiceHistoryItem): ServiceHistoryItem['warrantyStatus'] {
    const serviceType = item.serviceType.toLowerCase();

    if (serviceType === 'inspection') {
      return 'Warranty Period not started yet';
    }

    if (serviceType === 'installation') {
      return 'Warranty Activated';
    }

    if (serviceType === 'service') {
      if (item.warrantyStatus === 'Warranty Claimed' || item.warrantyStatus === 'Warranty is Over') {
        return item.warrantyStatus;
      }

      return 'Warranty Not Claimed';
    }

    return item.warrantyStatus;
  }
}

