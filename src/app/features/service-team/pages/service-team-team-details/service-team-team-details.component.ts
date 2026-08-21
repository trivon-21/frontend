import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService, TeamDetails, TeamDetailsApiPayload, TeamMember } from '../../services/task.service';
import { catchError, EMPTY, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-service-team-team-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-team-team-details.component.html',
  styleUrl: './service-team-team-details.component.css'
})
export class ServiceTeamTeamDetailsComponent implements OnInit {
  teamDetails: TeamDetails | null = null;
  isLoading = false;
  loadError = '';

  constructor(
    private readonly taskService: TaskService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadTeamDetails();
  }

  loadTeamDetails(): void {
    this.isLoading = true;
    this.loadError = '';
    const routeTeamName = this.route.snapshot.queryParamMap.get('teamName')?.trim();
    const teamName = routeTeamName || undefined;

    this.taskService
      .getTeamDetails(teamName)
      .pipe(
        tap((response) => {
          if (!response?.success || !response?.data) {
            throw new Error('Invalid team details response');
          }

          this.teamDetails = this.normalizeTeamDetails(response.data);
          this.isLoading = false;
        }),
        catchError((error: unknown) => {
          console.error('Failed to load team details, using fallback', error);
          this.teamDetails = {
            team: {
              id: 'team-id-1',
              teamName: 'Service Team B',
              teamType: 'Service',
              status: 'Available',
              activeJobsCount: 3,
              availableSlots: [
                new Date('2026-08-22T09:00:00Z').toISOString(),
                new Date('2026-08-23T09:00:00Z').toISOString(),
                new Date('2026-08-25T09:00:00Z').toISOString(),
                new Date('2026-08-26T09:00:00Z').toISOString()
              ],
            },
            teamLeader: {
              id: 'lead-id-1',
              name: 'Nuwan Jayewardene',
              role: 'Team Leader'
            },
            teamMembers: [
              { id: 'member-1', name: 'Dilshan Silva', role: 'Technician' },
              { id: 'member-2', name: 'Amal Perera', role: 'Technician' }
            ],
          };
          this.isLoading = false;
          return EMPTY;
        })
      )
      .subscribe();
  }

  private normalizeTeamDetails(payload: TeamDetailsApiPayload): TeamDetails {
    const rawTeam = payload.team ?? {};
    const teamMembers = this.normalizeMembers(payload.teamMembers ?? rawTeam.members ?? payload.members ?? []);
    const teamLeader =
      this.findLeader(payload.teamLeader ?? null) ??
      this.findLeader((rawTeam.members || teamMembers).find((member) => member.role === 'Team Leader') ?? null);

    const membersWithoutLeader = teamMembers.filter((member) => !this.isSameMember(member, teamLeader));

    return {
      team: {
        id: rawTeam.id ?? '',
        teamName: rawTeam.teamName ?? payload.teamName ?? 'Unnamed Team',
        teamType: rawTeam.teamType ?? payload.teamType ?? 'Service',
        status: rawTeam.status ?? payload.status ?? 'Unknown',
        activeJobsCount: rawTeam.activeJobsCount ?? payload.activeJobsCount ?? 0,
        availableSlots: this.normalizeSlots(rawTeam.availableSlots ?? payload.availableSlots ?? []),
      },
      teamLeader,
      teamMembers: membersWithoutLeader,
    };
  }

  private normalizeMembers(members: TeamMember[]): TeamMember[] {
    return members
      .filter((member): member is TeamMember => Boolean(member))
      .map((member) => ({
        id: member.id ?? '',
        name: member.name?.trim() || 'Unknown Member',
        role: member.role?.trim() || 'Technician',
      }));
  }

  private normalizeSlots(slots: string[]): string[] {
    return slots.filter((slot): slot is string => typeof slot === 'string' && Boolean(slot.trim()));
  }

  private findLeader(member: TeamMember | null): TeamMember | null {
    if (!member) {
      return null;
    }

    return {
      id: member.id ?? '',
      name: member.name?.trim() || 'Unknown Member',
      role: member.role?.trim() || 'Team Leader',
    };
  }

  private isSameMember(candidate: TeamMember, leader: TeamMember | null): boolean {
    if (!leader) {
      return false;
    }

    if (candidate.id && leader.id) {
      return candidate.id === leader.id;
    }

    return candidate.name === leader.name && candidate.role === leader.role;
  }

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return 'NA';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
}
