import { Component, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-main-technician-inspection-details',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './main-technician-inspection-details.component.html',
  styleUrl: './main-technician-inspection-details.component.css'})
export class MainTechnicianInspectionDetailsComponent implements OnInit {
  jobId: string | null = null;
  isLoading = false;
  error: string | null = null;
  
  inspectionData: any = null;
  inspectionDate: string | Date | null = null;
  assignedTeamMembers: Array<{ name?: string; role?: string }> = [];
  resolvedInspectionTeamName = 'Inspection Team A';

  private readonly apiUrl = `${environment.apiBaseUrl}/inspections`;
  private readonly teamsApiUrl = `${environment.apiBaseUrl}/tech-teams`;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.jobId = params['id'] || null;
      if (this.jobId) {
        this.loadInspection();
      }
    });
  }

  loadInspection(): void {
    if (!this.jobId) return;
    
    this.isLoading = true;
    this.error = null;

    this.http
      .get<{ success: boolean; data: any }>(`${this.apiUrl}/${encodeURIComponent(this.jobId)}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.inspectionData = response.data;
            this.inspectionDate = this.extractInspectionDate(response.data);
            this.loadInspectionTeamADetails();
          } else {
            this.error = 'Failed to load inspection details';
            this.inspectionDate = null;
            this.assignedTeamMembers = [];
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading inspection:', err);
          this.error = `Failed to load inspection: ${err.message || 'Unknown error'}`;
          this.inspectionDate = null;
          this.assignedTeamMembers = [];
          this.isLoading = false;
        },
      });
  }

  get assignedTeamName(): string {
    return 'Inspection Team A';
  }

  get teamLeadLabel(): string {
    const lead = this.assignedTeamMembers.find((member) => member.role === 'Team Leader');
    if (!lead?.name) {
      return 'Team Lead - -';
    }
    return `Team Lead - ${lead.name}`;
  }

  get nonLeadTeamMembers(): string[] {
    return this.assignedTeamMembers
      .filter((member) => member.role !== 'Team Leader' && Boolean(member.name))
      .map((member) => `${member.name}${member.role ? ` (${member.role})` : ''}`);
  }

  private loadInspectionTeamADetails(): void {
    this.http
      .get<{ success: boolean; data: Array<{ _id?: string; teamName?: string; teamType?: string; members?: Array<{ name?: string; role?: string }> }> }>(this.teamsApiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (!response.success || !Array.isArray(response.data)) {
            this.assignedTeamMembers = [];
            this.resolvedInspectionTeamName = 'Inspection Team A';
            return;
          }

          const matchedTeam = response.data.find((team) => {
            const teamName = String(team.teamName || '').toLowerCase();
            const teamType = String(team.teamType || '').toLowerCase();
            return teamType === 'inspection team' && teamName.includes('team a');
          }) || response.data.find((team) => String(team.teamType || '').toLowerCase() === 'inspection team');

          this.assignedTeamMembers = matchedTeam?.members || [];
          this.resolvedInspectionTeamName = 'Inspection Team A';
        },
        error: () => {
          this.assignedTeamMembers = [];
          this.resolvedInspectionTeamName = 'Inspection Team A';
        }
      });
  }

  private extractInspectionDate(data: any): string | Date | null {
    if (!data) {
      return null;
    }

    return data.date || data.serviceDate || data.inspectionDate || data.inspectionMeta?.date || null;
  }
}
