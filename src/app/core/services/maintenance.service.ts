import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { switchMap, catchError, tap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from './auth.service';

export interface Maintenance {
  isActive: boolean;
  message: string;
  reason: string;
  type?: 'instant' | 'scheduled';
  startTime: Date | null;
  endTime: Date | null;
  scheduledStartTime: Date | null;
  scheduledEndTime: Date | null;
}

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService implements OnDestroy {
  private maintenanceSubject = new BehaviorSubject<Maintenance>({
    isActive: false,
    message: 'System is under maintenance. Please try again later.',
    reason: '',
    startTime: null,
    endTime: null,
    scheduledStartTime: null,
    scheduledEndTime: null,
  });

  maintenance$: Observable<Maintenance> = this.maintenanceSubject.asObservable();

  private isMaintenanceActiveSubject = new BehaviorSubject<boolean>(false);
  isMaintenanceActive$: Observable<boolean> = this.isMaintenanceActiveSubject.asObservable();

  message$: Observable<string> = this.maintenanceSubject.pipe(
    map((m) => m.message)
  );

  private scheduledStartSubject = new BehaviorSubject<Date | null>(null);
  scheduledStart$: Observable<Date | null> = this.scheduledStartSubject.asObservable();

  private pollSubscription: Subscription | null = null;
  private previousMaintenanceActive = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {
    // Fetch immediately on init, then poll
    this.fetchMaintenanceStatus();
    this.startPolling();
  }

  /**
   * Fetch maintenance status immediately
   */
  private fetchMaintenanceStatus(): void {
    this.http
      .get<{ success: boolean; data: { maintenance: Maintenance } }>(
        '/api/auth/maintenance'
      )
      .pipe(
        catchError((err) => {
          console.error('Failed to fetch maintenance status:', err);
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response?.data?.maintenance) {
          const maintenance = response.data.maintenance;
          this.maintenanceSubject.next(maintenance);

          const isActive = this.calculateIsActive(maintenance);
          this.isMaintenanceActiveSubject.next(isActive);

          this.scheduledStartSubject.next(
            maintenance.scheduledStartTime
              ? new Date(maintenance.scheduledStartTime)
              : null
          );

          this.handleMaintenanceStatusChange(isActive);
        }
      });
  }

  /**
   * Start polling maintenance status from backend
   * Polls every 5 seconds (or more frequently as needed)
   */
  private startPolling(): void {
    this.pollSubscription = interval(5000)
      .pipe(
        switchMap(() =>
          this.http
            .get<{ success: boolean; data: { maintenance: Maintenance } }>(
              '/api/auth/maintenance'
            )
            .pipe(
              catchError((err) => {
                console.error('Failed to fetch maintenance status:', err);
                return of(null);
              })
            )
        ),
        tap((response) => {
          if (response?.data?.maintenance) {
            const maintenance = response.data.maintenance;
            this.maintenanceSubject.next(maintenance);

            // Determine if under maintenance right now
            const isActive = this.calculateIsActive(maintenance);
            this.isMaintenanceActiveSubject.next(isActive);

            // Update scheduled start
            this.scheduledStartSubject.next(
              maintenance.scheduledStartTime
                ? new Date(maintenance.scheduledStartTime)
                : null
            );

            this.handleMaintenanceStatusChange(isActive);
          }
        })
      )
      .subscribe();
  }

  /**
   * Handle maintenance status changes and logout non-super-admin users
   */
  private handleMaintenanceStatusChange(isActive: boolean): void {
    if (isActive && !this.previousMaintenanceActive) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && currentUser.role !== 'SUPER_ADMIN') {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    }
    this.previousMaintenanceActive = isActive;
  }

  /**
   * Calculate if system is currently under maintenance
   */
  private calculateIsActive(maintenance: Maintenance): boolean {
    // Check instant maintenance
    if (maintenance.isActive) {
      return true;
    }

    // Check scheduled maintenance window
    if (maintenance.scheduledStartTime && maintenance.scheduledEndTime) {
      const now = new Date();
      const start = new Date(maintenance.scheduledStartTime);
      const end = new Date(maintenance.scheduledEndTime);
      return now >= start && now <= end;
    }

    return false;
  }

  /**
   * Get current maintenance state synchronously
   */
  getMaintenanceSync(): Maintenance {
    return this.maintenanceSubject.value;
  }

  /**
   * Get if system is currently under maintenance (sync)
   */
  isMaintenanceActiveSyncGetter(): boolean {
    return this.isMaintenanceActiveSubject.value;
  }

  /**
   * Get if system is currently under maintenance (sync) - alias for compatibility
   */
  getMaintenanceActiveSync(): boolean {
    return this.isMaintenanceActiveSubject.value;
  }

  /**
   * Get scheduled start time (sync)
   */
  getScheduledStartSync(): Date | null {
    return this.scheduledStartSubject.value;
  }

  /**
   * Manually refresh maintenance status by triggering an immediate poll
   */
  refreshStatus(): void {
    // Trigger immediate poll by emitting through the polling observable
    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
  }
}
