// service-team-service-history.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { TeamSessionService } from '../../services/team-session.service';

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
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './service-team-service-history.component.html',
  styleUrl: './service-team-service-history.component.css'
})
export class ServiceTeamServiceHistoryComponent implements OnInit {
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
    private readonly teamSessionService: TeamSessionService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
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
      error: (err) => console.error('Error loading task summary:', err)
    });
  }

  fetchServiceHistory(id: string): void {
    this.http.get<any>(`${environment.apiBaseUrl}/service-history/${id}${this.teamSessionService.buildTeamQuery()}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.summary = {
            ...res.data.summary,
            customerName: res.data.summary?.customerName || this.summary.customerName,
            location: res.data.summary?.location || this.summary.location,
          };
          this.historyItems = [...(res.data.history || [])].sort((a, b) => {
            const aTime = a.date ? new Date(a.date).getTime() : Number.POSITIVE_INFINITY;
            const bTime = b.date ? new Date(b.date).getTime() : Number.POSITIVE_INFINITY;
            return aTime - bTime;
          });
        }
      },
      error: (err) => console.error('Error fetching history:', err)
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
