import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

interface TeamMember {
  name: string;
  role: string;
}

interface Team {
  id: string;
  name: string;
  type: 'Service' | 'Inspection';
  membersCount: number;
  activeJobs: number;
  status: 'Busy' | 'Available';
  members: TeamMember[];
  availableSlots: number;
  availableDates: { day: string; date: string; timeSlot?: string }[];
  activeJobsList: ActiveJob[];
}

interface ActiveJob {
  id: string;
  ticketId: string;
  customerName: string;
  location: string;
  type: 'Installation' | 'Service' | 'Inspection';
  date?: string | null;
}

interface PendingJob {
  id: string;
  _id: string;
  customer: string;
  location: string;
  type: 'Installation' | 'Service' | 'Maintenance';
  productType: string;
  warehouseStatusVersion?: number;
}

type RawTeamMember = {
  name?: string;
  role?: string;
};

type RawTechTeam = {
  _id?: string;
  teamName?: string;
  teamType?: string;
  activeJobsCount?: number;
  status?: Team['status'];
  availableSlots?: any[];
  members?: RawTeamMember[];
  activeJobs?: Array<{
    id?: string;
    ticketId?: string;
    customerName?: string;
    location?: string;
    type?: 'Installation' | 'Service' | 'Inspection';
    date?: string | null;
  }>;
};

type RawPendingJob = {
  _id?: string;
  ticketId?: string | number;
  customerName?: string;
  location?: string;
  requestType?: 'Installation' | 'Service' | 'Maintenance';
  productType?: string;
  warehouseStatusVersion?: number;
};

@Component({
  selector: 'app-main-technician-team-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './main-technician-team-management.component.html',
  styleUrl: './main-technician-team-management.component.css'})
export class MainTechnicianTeamManagementComponent implements OnInit {
  searchQuery: string = '';
  statusFilter: 'All' | Team['status'] = 'All';
  showAssignModal: boolean = false;
  showViewModal: boolean = false;
  selectedPendingJobId: string | null = null;
  pendingAssignmentCount = 0;
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;

  pendingJobs: PendingJob[] = [];
  teams: Team[] = [];

  filteredTeams: Team[] = [...this.teams];
  selectedTeam: Team | null = this.filteredTeams[0] ?? null;
  private readonly teamsApiUrl = `${environment.apiBaseUrl}/tech-teams`;

  constructor(
    private http: HttpClient,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.loadTeams();
    this.loadPendingAssignments();
  }

  private normalizeTicketId(ticketId?: string | number): string {
    const normalized = String(ticketId ?? '').trim();
    if (!normalized) {
      return '#N/A';
    }

    return normalized.startsWith('#') ? normalized : `#${normalized}`;
  }

  private mapDate(value: string): { day: string; date: string } {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return { day: '-', date: value };
    }

    const day = parsed.toLocaleDateString('en-GB', { weekday: 'short' });
    const date = parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    return { day, date };
  }

  private mapRawTeam(team: RawTechTeam): Team {
    const availableSlotValues = (team.availableSlots || []).filter((item) => !!item);
    const members = (team.members || []).map((member) => ({
      name: member.name || 'Unknown Member',
      role: member.role || 'Technician'
    }));
    const activeJobsList = (team.activeJobs || []).map((job) => ({
      id: job.id || '',
      ticketId: job.ticketId || '#N/A',
      customerName: job.customerName || 'Unknown',
      location: job.location || '-',
      type: (job.type === 'Inspection'
        ? 'Inspection'
        : job.type === 'Installation'
          ? 'Installation'
          : 'Service') as 'Installation' | 'Service' | 'Inspection',
      date: job.date || null
    }));

    return {
      id: team._id || '',
      name: team.teamName || 'Unnamed Team',
      type: team.teamType === 'Inspection Team' ? 'Inspection' : 'Service',
      membersCount: members.length,
      activeJobs: team.activeJobsCount || 0,
      status: team.status === 'Busy' ? 'Busy' : 'Available',
      members,
      availableSlots: availableSlotValues.length,
      availableDates: availableSlotValues.map((item) => {
        if (typeof item === 'string') {
          return this.mapDate(item);
        } else if (item && item.date) {
          const mapped: { day: string; date: string; timeSlot?: string } = this.mapDate(item.date);
          if (item.timeSlot) {
            mapped.timeSlot = item.timeSlot;
          }
          return mapped;
        }
        return { day: '-', date: 'Unknown' };
      }),
      activeJobsList
    };
  }

  private mapRawPendingJob(job: RawPendingJob): PendingJob {
    return {
      id: this.normalizeTicketId(job.ticketId || job._id),
      _id: job._id || '',
      customer: job.customerName || 'Unknown Customer',
      location: job.location || '-',
      type: job.requestType || 'Service',
      productType: job.productType || '-',
      warehouseStatusVersion: job.warehouseStatusVersion,
    };
  }

  private loadTeams(): void {
    this.isLoading = true;
    this.error = null;

    this.http
      .get<{ success: boolean; data: RawTechTeam[] }>(this.teamsApiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && Array.isArray(response.data)) {
            this.teams = response.data.map((item) => this.mapRawTeam(item));
            this.applyFilters();
          } else {
            this.error = 'Failed to load teams';
            this.teams = [];
            this.filteredTeams = [];
            this.selectedTeam = null;
          }

          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading teams:', err);
          this.error = `Failed to load teams: ${err.message || 'Unknown error'}`;
          this.teams = [];
          this.filteredTeams = [];
          this.selectedTeam = null;
          this.isLoading = false;
        }
      });
  }

  private loadPendingAssignments(): void {
    this.http
      .get<{ success: boolean; count: number; data: RawPendingJob[] }>(`${this.teamsApiUrl}/pending-count`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.pendingAssignmentCount = Number(response.count || 0);
          this.pendingJobs = (response.data || []).map((job) => this.mapRawPendingJob(job));
        },
        error: (err) => {
          console.error('Error loading pending assignments:', err);
          this.pendingAssignmentCount = 0;
          this.pendingJobs = [];
        }
      });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.applyFilters();
  }

  clearFilters(): void {
    this.statusFilter = 'All';
    this.searchQuery = '';
    this.applyFilters();
  }

  applyFilters(): void {
    const normalized = this.searchQuery.toLowerCase();

    this.filteredTeams = this.teams.filter((team) => {
      const memberNames = team.members.map((member) => member.name.toLowerCase()).join(' ');
      const matchesSearch = !normalized || (
        team.name.toLowerCase().includes(normalized) ||
        team.type.toLowerCase().includes(normalized) ||
        team.status.toLowerCase().includes(normalized) ||
        memberNames.includes(normalized)
      );

      const matchesStatus = this.statusFilter === 'All' || team.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });

    if (this.selectedTeam && !this.filteredTeams.some((team) => team.id === this.selectedTeam?.id)) {
      this.selectedTeam = null;
      this.showViewModal = false;
    }
  }

  selectTeam(team: Team) {
    this.selectedTeam = team;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedTeam = null;
  }

  openAssignModal(): void {
    this.selectedPendingJobId = null;
    this.loadPendingAssignments();
    this.showAssignModal = true;
  }

  assignSelectedJob(): void {
    if (!this.selectedPendingJobId || !this.selectedTeam?.id) {
      return;
    }

    const selectedPendingJob = this.pendingJobs.find((job) => job.id === this.selectedPendingJobId);
    if (!selectedPendingJob || !selectedPendingJob._id) {
      return;
    }

    const serviceRequestId = selectedPendingJob._id;
    const teamId = this.selectedTeam.id;

    this.http
      .post<{ success: boolean; message?: string; error?: string }>(`${this.teamsApiUrl}/assign-service`, {
        serviceRequestId,
        teamId,
        requestType: selectedPendingJob.type,
        warehouseStatusVersion: selectedPendingJob.warehouseStatusVersion,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        if (!response.success) {
          this.error = response.error || response.message || 'Failed to assign service request.';
          return;
        }

        this.showAssignModal = false;
        this.selectedPendingJobId = null;
        this.loadPendingAssignments();
        this.loadTeams();

        this.successMessage = 'Team Assigned & Dates Sent to CSA';
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (err) => {
        console.error('Error assigning service request to team:', err);
        this.error = err.error?.error || err.error?.message || `Failed to assign service request: ${err.message || 'Unknown error'}`;
      }
    });
}
  }

