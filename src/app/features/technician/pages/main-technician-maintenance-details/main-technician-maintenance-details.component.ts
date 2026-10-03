import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';

interface TeamMember {
  name: string;
  position?: string;
  contactNumber?: string;
}

interface MaintenanceDetail {
  _id: string;
  ticketId: string;
  fullName?: string;
  customerName: string;
  customerId?: {
    name?: string;
    fullName?: string;
    contactNo?: string;
    contactNumber?: string;
    phone?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
  };
  customerEmail: string;
  customerPhone: string;
  location: string;
  date: string;
  productType: string;
  description?: string;
  acUnitModel?: string;
  status: string;
  assignedTeam: string;
  assignedTeamId?: {
    _id: string;
    teamName: string;
    specialization?: string;
    status?: string;
  };
  assignedTeamData?: {
    teamLead?: TeamMember | null;
    helpers?: TeamMember[];
  };
  materialList?: { item?: string; name?: string; itemName?: string; quantity: string | number }[];
}

@Component({
  selector: 'app-main-technician-maintenance-details',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './main-technician-maintenance-details.component.html',
  styleUrls: ['./main-technician-maintenance-details.component.css']
})
export class MainTechnicianMaintenanceDetailsComponent implements OnInit {
  ticketId: string | null = null;
  ticket: MaintenanceDetail | null = null;
  isLoading = true;
  error: string | null = null;
  private readonly apiUrl = `${environment.apiBaseUrl}/maintenance`;

  get description(): string {
    return this.ticket?.description || (this.ticket as any)?.serviceDescription || 'No description provided.';
  }

  get teamLead(): string {
    const lead = this.ticket?.assignedTeamData?.teamLead;
    return lead ? lead.name : '-';
  }

  get helpers(): TeamMember[] {
    return this.ticket?.assignedTeamData?.helpers || [];
  }

  get productType(): string {
    return this.ticket?.productType || this.ticket?.acUnitModel || 'N/A';
  }

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.ticketId = this.route.snapshot.paramMap.get('id');
    if (this.ticketId) {
      this.loadTicketDetails(this.ticketId);
    } else {
      this.error = 'No ticket ID provided in the URL.';
      this.isLoading = false;
    }
  }

  loadTicketDetails(id: string): void {
    this.isLoading = true;
    this.error = null;
    this.http.get<{ success: boolean; data: MaintenanceDetail }>(`${this.apiUrl}/${id}`)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.ticket = response.data;
            // Backend now returns assignedTeamData directly.
            // If it's missing but assignedTeamId is populated, use fallback.
            if (!this.ticket.assignedTeamData && this.ticket.assignedTeamId) {
              this.loadAssignedTeamMembersFallback(this.ticket.assignedTeamId._id);
            }
          } else {
            this.error = 'Failed to load maintenance details.';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching ticket details:', err);
          this.error = 'Failed to fetch details. Server error.';
          this.isLoading = false;
        }
      });
  }

  /** Fallback: fetch team list and locate members if backend didn't include assignedTeamData */
  loadAssignedTeamMembersFallback(teamId: string): void {
    this.http.get<{ success: boolean; data: any[] }>(`${environment.apiBaseUrl}/tech-teams`)
      .subscribe({
        next: (res) => {
          if (!res.success || !Array.isArray(res.data)) return;
          const team = res.data.find(t => String(t._id) === String(teamId));
          if (team && this.ticket) {
            const members: any[] = team.members || [];
            const lead = members.find(m => m.role === 'Lead');
            const helpers = members.filter(m => m.role !== 'Lead');
            this.ticket.assignedTeamData = {
              teamLead: lead ? { name: lead.name, position: lead.role } : null,
              helpers: helpers.map(h => ({ name: h.name, position: h.role }))
            };
          }
        },
        error: (err) => console.error('Error loading team members (fallback)', err)
      });
  }

  goBack(): void {
    this.location.back();
  }

  viewServiceHistory(): void {
    if (this.ticketId) {
      this.router.navigate(['/main-technician-service-history', 'maintenance', this.ticketId]);
    }
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'in-progress';
    const s = status.toLowerCase();
    if (s.includes('completed')) return 'completed';
    if (s.includes('progress')) return 'in-progress';
    if (s.includes('schedule')) return 'scheduled';
    if (s.includes('hold')) return 'on-hold';
    return 'assigned';
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
