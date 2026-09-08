// service-team-service-history.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { TeamSessionService } from '../../services/team-session.service';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';

interface ServiceHistoryItem {
  ticketId: string;
  serviceType: string;
  productType: string;
  date: string | null;
  status: 'Assigned' | 'Completed' | 'In Progress' | 'Scheduled' | 'On Hold';
  assignedTeam: string;
  warrantyStatus: string;
}

interface ServiceHistorySummary {
  customerName: string;
  location: string;
  productType: string;
  installationDate: string | null;
}

@Component({
  selector: 'app-service-team-service-history',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, PortalIconsModule],
  templateUrl: './service-team-service-history.component.html',
  styleUrl: './service-team-service-history.component.css'
})
export class ServiceTeamServiceHistoryComponent implements OnInit {
  id: string | null = null;
  historyItems: ServiceHistoryItem[] = [];
  summary: ServiceHistorySummary = {
    customerName: '-',
    location: '-',
    productType: '-',
    installationDate: null,
  };

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private readonly teamSessionService: TeamSessionService,
    private router: Router
  ) {}

  get baseRoute(): string {
    const url = decodeURIComponent(this.router.url);
    if (url.includes('/service-team-a') || url.includes('/service team a')) return '/service-team-a';
    if (url.includes('/service-team-b') || url.includes('/service team b')) return '/service-team-b';
    return '/service-team';
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id = id;
      this.loadTaskSummary(id);
      this.fetchServiceHistory(id);
    }
  }

  loadTaskSummary(id: string): void {
    this.http.get<any>(`${environment.apiBaseUrl}/tasks/${id}${this.teamSessionService.buildTeamQuery()}`).subscribe({
      next: (res) => {
        if (res?.customer) {
          this.summary = {
            ...this.summary,
            customerName: res.customer.name || this.summary.customerName,
            location: res.customer.address || res.location || this.summary.location,
          };
        }
      },
      error: (err) => {
        console.error('Error loading task summary:', err);
      }
    });
  }

  fetchServiceHistory(id: string): void {
    const source = this.route.snapshot.queryParamMap.get('source') || 'service';
    const query = this.teamSessionService.buildTeamQuery();
    const url = `${environment.apiBaseUrl}/service-requests/${encodeURIComponent(id)}/history?source=${encodeURIComponent(source)}${query ? '&' + query.substring(1) : ''}`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (res.success) {
          this.summary = {
            ...res.data.summary,
            customerName: res.data.summary?.customerName || this.summary.customerName,
            location: res.data.summary?.location || this.summary.location,
          };
          this.historyItems = [...(res.data.history || [])].sort((a, b) => {
            const aTime = a.date && !Number.isNaN(new Date(a.date).getTime()) ? new Date(a.date).getTime() : null;
            const bTime = b.date && !Number.isNaN(new Date(b.date).getTime()) ? new Date(b.date).getTime() : null;
            if (aTime === null && bTime === null) return 0;
            if (aTime === null) return 1;
            if (bTime === null) return -1;
            return bTime - aTime;
          });
        }
      },
      error: (err) => {
        console.error('Error fetching history:', err);
        this.historyItems = [];
      }
    });
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

  getDisplayWarrantyStatus(item: ServiceHistoryItem): string {
    const type = item.serviceType.toLowerCase();
    if (type === 'inspection') return 'Warranty Period not started yet';
    if (type === 'installation') return 'Warranty Activated';
    return item.warrantyStatus;
  }

  getDateWithoutYear(item: ServiceHistoryItem): string {
    if (item.status === 'Assigned' || !item.date) {
      return '-';
    }

    const parsed = new Date(item.date);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short'
      });
    }

    const parts = item.date.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : item.date;
  }

  getDateYear(item: ServiceHistoryItem): string {
    if (item.status === 'Assigned' || !item.date) {
      return '';
    }

    const parsed = new Date(item.date);
    if (!Number.isNaN(parsed.getTime())) {
      return String(parsed.getFullYear());
    }

    const parts = item.date.split(' ');
    return parts.length >= 3 ? parts[2] : '';
  }
}
