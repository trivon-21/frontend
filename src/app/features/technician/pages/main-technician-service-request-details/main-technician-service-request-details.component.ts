import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

type ServiceRequestView = {
  ticketId?: number;
  status?: string;
  fullName?: string;
  customerName?: string;
  customerId?: {
    name?: string;
    fullName?: string;
    contactNo?: string;
    contactNumber?: string;
    phoneNumber?: string;
  };
  location?: string;
  serviceDate?: string;
  productType?: string;
  customerDetails?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  requestDetails?: {
    specificProduct?: string;
    description?: string;
    materials?: Array<{ item?: string; quantity?: string }>;
  };
  assignment?: {
    teamName?: string;
    teamLead?: string;
    members?: string[];
  };
};

type ServiceRequestApiDetails = {
  _id?: string;
  status?: string;
  customerName?: string;
  location?: string;
  serviceDate?: string;
  productType?: string;
  serviceDescription?: string;
  assignedTeamName?: string;
  assignedTeamId?: string | number;
  materials?: Array<{ item?: string; quantity?: string }>;
  customerId?: {
    name?: string;
    email?: string;
    contactNo?: string;
    address?: string;
  };
  assignedTeam?: {
    teamName?: string;
  };
};

type TechTeamApiItem = {
  _id?: string | number;
  teamName?: string;
  members?: Array<{
    name?: string;
    role?: string;
  }>;
};

@Component({
  selector: 'app-main-technician-service-request-details',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './main-technician-service-request-details.component.html',
  styleUrl: './main-technician-service-request-details.component.css'})
export class MainTechnicianServiceRequestDetailsComponent implements OnInit {
  id: string | null = null;
  serviceView: ServiceRequestView | null = null;
  isLoading = false;
  error: string | null = null;
  private readonly apiUrl = `${environment.apiBaseUrl}/service-requests`;
  private readonly teamsApiUrl = `${environment.apiBaseUrl}/tech-teams`;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private destroyRef: DestroyRef
  ) {}

  /** Loads the service request id from the route and fetches its details. */
  ngOnInit() {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.id = params['id'] || null;
      this.loadServiceDetails();
    });
  }

  /** Requests the service request details for the current route id. */
  loadServiceDetails(): void {
    if (!this.id) {
      this.error = 'Missing service request id in URL.';
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.http
      .get<{ success: boolean; data: ServiceRequestApiDetails }>(`${this.apiUrl}/${encodeURIComponent(this.id)}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.serviceView = this.mapApiDetailsToView(res.data);
            this.loadAssignedTeamDetails(res.data);
          } else {
            this.error = 'Service request details were not returned by the server.';
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || err?.message || 'Failed to load service request details.';
          this.isLoading = false;
        },
      });
  }

  /** Returns the CSS class that should be used for the current status pill. */
  get statusClass(): string {
    return this.normalizeStatusClass(this.serviceView?.status);
  }

  /** Formats an API date string for display, preserving invalid values as-is. */
  formatDate(value?: string, withTime = false): string {
    if (!value) {
      return '-';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    if (withTime) {
      return parsed.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  /** Normalizes a status string into the modifier class used by the template. */
  private normalizeStatusClass(status?: string): string {
    return status?.trim().toLowerCase().replace(/\s+/g, '-') || 'unknown';
  }

  /** Loads the actual team lead and members from the TechTeams collection for the assigned team. */
  private loadAssignedTeamDetails(item: ServiceRequestApiDetails): void {
    const teamKey = String(item.assignedTeamName || item.assignedTeamId || item.assignedTeam?.teamName || '').trim();

    if (!teamKey) {
      return;
    }

    this.http
      .get<{ success: boolean; data: TechTeamApiItem[] }>(this.teamsApiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res.success || !Array.isArray(res.data)) {
            return;
          }

          const matchedTeam = res.data.find((team) => {
            const teamId = String(team._id || '').trim();
            const teamName = String(team.teamName || '').trim();
            return teamId === teamKey || teamName === teamKey || teamName.toLowerCase() === teamKey.toLowerCase();
          });

          if (!matchedTeam) {
            return;
          }

          const teamMembers = matchedTeam.members || [];
          const teamLead = teamMembers.find((member) => member.role === 'Team Leader')?.name || '-';

          if (!this.serviceView) {
            return;
          }

          const memberNames = teamMembers
            .map((member) => member.name)
            .filter((name): name is string => Boolean(name));
          const membersWithoutLead = memberNames.filter((name) => name !== teamLead);

          this.serviceView = {
            ...this.serviceView,
            assignment: {
              teamName: matchedTeam.teamName || this.serviceView.assignment?.teamName || 'Assigned Team',
              teamLead,
              members: membersWithoutLead,
            }
          };
        },
        error: () => {
          // Keep the fallback assignment summary already mapped from the service request.
        }
      });
  }

  /** Maps ServiceRequests API shape into the UI view model used by this page. */
  private mapApiDetailsToView(item: ServiceRequestApiDetails): ServiceRequestView {
    const customerName = item.customerName || item.customerId?.name || '-';
    const customerAddress = item.customerId?.address || item.location || '-';
    const teamName = item.assignedTeam?.teamName || item.assignedTeamName || 'Assigned Team';

    return {
      ticketId: Number.parseInt(this.id || '', 10) || undefined,
      status: item.status || 'Unknown',
      customerName,
      location: customerAddress,
      serviceDate: item.serviceDate,
      productType: item.productType || '-',
      customerDetails: {
        phone: item.customerId?.contactNo || '-',
        email: item.customerId?.email || '-',
        address: customerAddress,
      },
      requestDetails: {
        specificProduct: item.productType || '-',
        description: item.serviceDescription || '-',
        materials: item.materials || [],
      },
      assignment: {
        teamName,
        teamLead: '-',
        members: [],
      },
    };
  }
}

