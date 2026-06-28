import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';

interface MaintenanceDetail {
  _id: string;
  ticketId: string;
  customerName: string;
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
  materialList?: { item: string; quantity: string }[];
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

  // Mocks for UI based on image since it isn't in backend currently
  mockDescription = 'Water has been leaking from the outside unit and cooling process is not properly happening.';
  mockTeamLead = 'Anil Fernando (Technician)';
  mockHelper = 'Rajesh Kumar ( Helper)';
  mockStartDate = '10 March 2026 10:00 AM';
  mockEstimatedDate = '10 March 2026 12:00 AM';

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

  goBack(): void {
    this.location.back();
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
