import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

export type TeamKey = 'A' | 'B';

export interface TeamSessionState {
  teamKey: TeamKey;
  teamName: string;
  email: string;
}

const TEAM_SESSION_STORAGE_KEY = 'airlux.team-session';
const DEFAULT_TEAM_NAME = 'Service Team B';
const DEFAULT_TEAM_KEY: TeamKey = 'B';

@Injectable({
  providedIn: 'root'
})
/**
 * Manages persisted team session state across guarded routes.
 * A dedicated service prevents session rules from being duplicated in components.
 */
export class TeamSessionService {
  private readonly sessionSubject = new BehaviorSubject<TeamSessionState | null>(this.readSession());
  readonly session$ = this.sessionSubject.asObservable();

  constructor(private authService: AuthService) {}

  /**
   * Persists and broadcasts a team session state.
   */
  setSession(session: TeamSessionState): void {
    sessionStorage.setItem(TEAM_SESSION_STORAGE_KEY, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  /**
   * Clears team session data from storage and memory.
   */
  clearSession(): void {
    sessionStorage.removeItem(TEAM_SESSION_STORAGE_KEY);
    this.sessionSubject.next(null);
  }

  /**
   * Returns the current in-memory team session.
   */
  getSession(): TeamSessionState | null {
    return this.sessionSubject.value;
  }

  /**
   * Indicates whether a valid team session is active.
   */
  hasSession(): boolean {
    return Boolean(this.sessionSubject.value);
  }

  /**
   * Returns the active team name with a safe default.
   */
  getTeamName(): string {
    const url = window.location.pathname;
    if (url.includes('/service-team-a')) {
      return 'Colombo Installation Team A';
    }
    if (url.includes('/service-team-b')) {
      return 'Service Team B';
    }

    const sessionName = this.sessionSubject.value?.teamName;
    if (sessionName) return sessionName;

    const user = this.authService.getCurrentUser();
    if (user && user.fullName) {
      return user.fullName;
    }

    return DEFAULT_TEAM_NAME;
  }

  /**
   * Returns the active team key with a safe default.
   */
  getTeamKey(): TeamKey {
    return this.sessionSubject.value?.teamKey || DEFAULT_TEAM_KEY;
  }

  /**
   * Builds a teamName query segment for API requests.
   */
  buildTeamQuery(): string {
    const teamName = this.getTeamName();
    return teamName ? `?teamName=${encodeURIComponent(teamName)}` : '';
  }

  /**
   * Reads and validates the persisted session payload.
   */
  private readSession(): TeamSessionState | null {
    const raw = sessionStorage.getItem(TEAM_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as TeamSessionState;
      if (!parsed?.teamKey || !parsed?.teamName) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
