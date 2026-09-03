import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';
import { TeamSessionService } from './team-session.service';
import { environment } from '../../../../environments/environment';

type GenericApiPayload = Record<string, unknown>;

export interface TaskSummary {
  scheduledTasks?: number;
  assignedTasks: number;
  inProgress: number;
  onHold: number;
  completed: number;
}

export interface Task {
  id: string;
  sourceId?: string;
  type: string;
  customer: string;
  location: string;
  serviceType: string;
  status: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface RawTeamMember {
  name?: string;
  role?: string;
}

interface RawTechTeam {
  _id?: string;
  teamName?: string;
  teamType?: string;
  status?: string;
  activeJobsCount?: number;
  availableSlots?: (string | { date?: string; timeSlot?: string })[];
  members?: RawTeamMember[];
}

export interface TimeSlot {
  date: string;
  timeSlot: string;
}

export interface TeamDetailsApiTeam {
  id?: string;
  teamName?: string;
  teamType?: string;
  status?: string;
  activeJobsCount?: number;
  availableSlots?: TimeSlot[];
  members?: TeamMember[];
}

export interface TeamDetailsApiPayload {
  team?: TeamDetailsApiTeam;
  teamName?: string;
  teamType?: string;
  status?: string;
  activeJobsCount?: number;
  availableSlots?: TimeSlot[];
  teamLeader?: TeamMember | null;
  teamMembers?: TeamMember[];
  members?: TeamMember[];
}

export interface TeamDetails {
  team: {
    id: string;
    teamName: string;
    teamType: string;
    status: string;
    activeJobsCount: number;
    availableSlots: TimeSlot[];
  };
  teamLeader: TeamMember | null;
  teamMembers: TeamMember[];
}

export interface TeamDetailsResponse {
  success: boolean;
  data: TeamDetailsApiPayload;
}

@Injectable({
  providedIn: 'root'
})
/**
 * Centralizes task-related HTTP calls behind a typed service boundary.
 * This keeps component classes focused on UI state instead of transport details.
 */
export class TaskService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private readonly teamSessionService: TeamSessionService
  ) {}

  /**
   * Appends the active team query string to a base endpoint path.
   */
  private withTeamQuery(path: string): string {
    return `${path}${this.teamSessionService.buildTeamQuery()}`;
  }

  /**
   * Retrieves dashboard-level summary counts for the active team.
   */
  getSummary(): Observable<TaskSummary> {
    return this.http.get<TaskSummary>(this.withTeamQuery(`${this.apiUrl}/tasks/summary`));
  }

  /**
   * Retrieves the task list visible to the active team.
   */
  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.withTeamQuery(`${this.apiUrl}/tasks`));
  }

  /**
   * Retrieves full details for a single task.
   */
  getTaskById(id: string): Observable<GenericApiPayload> {
    return this.http.get<GenericApiPayload>(this.withTeamQuery(`${this.apiUrl}/tasks/${id}`));
  }

  /**
   * Retrieves team details either by explicit team name or current session.
   */
  getTeamDetails(teamName?: string): Observable<TeamDetailsResponse> {
    const activeTeamName = teamName?.trim() || this.teamSessionService.getTeamName();
    const query = activeTeamName ? `?teamName=${encodeURIComponent(activeTeamName)}` : '';

    return this.http.get<TeamDetailsResponse>(`${this.apiUrl}/team-details${query}`);
  }

  /**
   * Updates task status and optional technician notes.
   */
  updateTaskStatus(id: string, status: string, notes?: string): Observable<GenericApiPayload> {
    return this.http.patch<GenericApiPayload>(this.withTeamQuery(`${this.apiUrl}/tasks/${id}/status`), {
      status,
      notesFromTechnician: notes
    });
  }

  /**
   * Submits a service report and tags it with the current team context.
   */
  submitReport(ticketData: GenericApiPayload): Observable<GenericApiPayload> {
    return this.http.post<GenericApiPayload>(this.withTeamQuery(`${this.apiUrl}/service-reports/submit`), {
      ...ticketData,
      teamName: this.teamSessionService.getTeamName()
    });
  }

  /**
   * Adds an additional service to a task.
   */
  addAdditionalService(id: string, description: string): Observable<GenericApiPayload> {
    return this.http.post<GenericApiPayload>(this.withTeamQuery(`${this.apiUrl}/tasks/${id}/additional-service`), {
      description
    });
  }
}
