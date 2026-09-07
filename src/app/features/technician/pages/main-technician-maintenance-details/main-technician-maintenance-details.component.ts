import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';

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
  status: string;
  assignedTeam: string;
  assignedTeamData?: {
    teamLead?: { name: string; position?: string };
    helpers?: { name: string; position?: string }[];
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

  // We use getters to safely access ticket data with fallbacks
  get description(): string {
    return (this.ticket as any)?.description || (this.ticket as any)?.serviceDescription || 'No description provided.';
  }

  get teamLead(): string {
    const lead = this.ticket?.assignedTeamData?.teamLead;
    return lead ? lead.name : '-';
  }

  get helpers(): any[] {
    return this.ticket?.assignedTeamData?.helpers || [];
  }

  get startDate(): string {
    return this.formatDate(this.ticket?.date);
  }

  get estimatedDate(): string {
    return this.formatDate(this.ticket?.date); // Simplified fallback
  }

  get productType(): string {
    return this.ticket?.productType || (this.ticket as any)?.acUnitModel || 'N/A';
  }

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private location: Location
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
            this.loadAssignedTeamDetails(response.data);
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

  loadAssignedTeamDetails(item: any): void {
    let matchedTeam = item.assignedTeamId && typeof item.assignedTeamId === 'object' ? item.assignedTeamId : null;
    
    if (matchedTeam) {
      this.setTeamData(matchedTeam);
      return;
    }

    const teamKey = String(item.assignedTeamName || item.assignedTeam || item.assignedTeamId || '').trim();
    if (!teamKey || teamKey === 'undefined' || teamKey === 'null') return;

    this.http.get<{ success: boolean; data: any[] }>(`${environment.apiBaseUrl}/tech-teams`)
      .subscribe({
        next: (res) => {
          if (!res.success || !Array.isArray(res.data)) return;

          matchedTeam = res.data.find(team => {
            const teamId = String(team._id || '').trim();
            const teamName = String(team.teamName || '').trim();
            return teamId === teamKey || teamName === teamKey || teamName.toLowerCase() === teamKey.toLowerCase();
          });

          if (matchedTeam) {
            this.setTeamData(matchedTeam);
          }
        },
        error: (err) => console.error('Error loading team details', err)
      });
  }

  private setTeamData(matchedTeam: any): void {
      const members = matchedTeam.members || [];
      const lead = members.find((m: any) => m.role === 'Team Leader' || m.role === 'Lead');
      const helpersList = members.filter((m: any) => m.role !== 'Team Leader' && m.role !== 'Lead');

      if (this.ticket) {
        this.ticket.assignedTeam = matchedTeam.teamName;
        this.ticket.assignedTeamData = {
          teamLead: lead ? { name: lead.name, position: lead.role } : undefined,
          helpers: helpersList.map((h: any) => ({ name: h.name, position: h.role }))
        };
      }
  }

  goBack(): void {
    this.location.back();
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
