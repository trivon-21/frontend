import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

interface InstallationDetail {
  _id?: string;
  ticketId?: string | number;
  customerId?: {
    name?: string;
    email?: string;
    contactNo?: string;
    address?: string;
  };
  productType?: string;
  location?: string;
  serviceDate?: string;
  date?: string;
  status?: string;
  siteDetails?: {
    buildingType?: string;
    floors?: number;
    rooms?: number;
    ceilingHeight?: string;
    wallType?: string;
    powerSupply?: string;
    outdoorAccess?: string;
  };
  materials?: Array<{ item?: string; quantity?: string }>;
  labour?: {
    technicians?: number;
    helpers?: number;
    duration?: string;
  };
  reviewNotes?: string;
}

@Component({
  selector: 'app-main-technician-installation-details',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './main-technician-installation-details.component.html',
  styleUrl: './main-technician-installation-details.component.css'})
export class MainTechnicianInstallationDetailsComponent implements OnInit {
  jobId: string | null = null;
  isLoading = false;
  error: string | null = null;
  installation: InstallationDetail | null = null;

  private readonly apiUrl = `${environment.apiBaseUrl}/installations`;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    this.jobId = this.route.snapshot.paramMap.get('id');
    if (this.jobId) {
      this.loadInstallation();
    }
  }

  private loadInstallation(): void {
    if (!this.jobId) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.http.get<{ success: boolean; data: InstallationDetail }>(`${this.apiUrl}/${encodeURIComponent(this.jobId)}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.installation = response.data;
          } else {
            this.error = 'Failed to load installation details';
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.error = `Failed to load installation: ${err.message || 'Unknown error'}`;
          this.isLoading = false;
        }
      });
  }
}

