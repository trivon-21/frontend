import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { AuthService } from '../../core/services/auth.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.css',
})
export class MaintenanceComponent implements OnInit, OnDestroy {
  maintenanceMessage = 'System is under maintenance. Please try again later.';
  maintenanceReason = '';
  countdownDisplay = '';
  scheduledEndTime: Date | null = null;
  isInstantMaintenance = false;
  private countdownInterval: any;
  private redirectCheckSubscription: Subscription | null = null;

  constructor(
    private maintenanceService: MaintenanceService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current maintenance status
    const maintenance = this.maintenanceService.getMaintenanceSync();
    this.maintenanceMessage = maintenance.message;
    this.maintenanceReason = maintenance.reason;

    // Check if it's instant or scheduled
    if (maintenance.scheduledEndTime) {
      this.scheduledEndTime = new Date(maintenance.scheduledEndTime);
      this.isInstantMaintenance = false;
      this.updateCountdown();
      this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
    } else {
      this.isInstantMaintenance = true;
    }

    // Check every 30 seconds if maintenance has ended
    this.redirectCheckSubscription = interval(30000)
      .pipe(
        switchMap(() => this.maintenanceService.maintenance$)
      )
      .subscribe((maintenance) => {
        const isActive = this.calculateIsActive(maintenance);
        if (!isActive) {
          // Maintenance has ended - redirect to dashboard
          const user = this.authService.getCurrentUser();
          if (user?.role === 'SUPER_ADMIN') {
            this.router.navigate(['/super-admin']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        }
      });
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.redirectCheckSubscription) {
      this.redirectCheckSubscription.unsubscribe();
    }
  }

  private updateCountdown(): void {
    if (!this.scheduledEndTime) {
      return;
    }

    const now = new Date().getTime();
    const distance = this.scheduledEndTime.getTime() - now;

    if (distance < 0) {
      this.countdownDisplay = 'Ending soon...';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (days > 0) {
      this.countdownDisplay = `${days}d ${hours}h ${minutes}m remaining`;
    } else if (hours > 0) {
      this.countdownDisplay = `${hours}h ${minutes}m ${seconds}s remaining`;
    } else if (minutes > 0) {
      this.countdownDisplay = `${minutes}m ${seconds}s remaining`;
    } else {
      this.countdownDisplay = `${seconds}s remaining`;
    }
  }

  private calculateIsActive(maintenance: any): boolean {
    if (maintenance.isActive) {
      return true;
    }
    if (maintenance.scheduledStartTime && maintenance.scheduledEndTime) {
      const now = new Date();
      const start = new Date(maintenance.scheduledStartTime);
      const end = new Date(maintenance.scheduledEndTime);
      return now >= start && now <= end;
    }
    return false;
  }
}
