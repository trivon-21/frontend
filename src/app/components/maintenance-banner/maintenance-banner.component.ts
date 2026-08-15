import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaintenanceService } from '../../core/services/maintenance.service';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@Component({
  selector: 'app-maintenance-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="showBanner" class="maintenance-banner" [ngClass]="bannerType">
      <div class="banner-content">
        <div class="banner-header">
          <span class="banner-icon" [ngClass]="iconClass">
            {{ bannerType === 'active' ? '⚠️' : '📅' }}
          </span>
          <h3>{{ title }}</h3>
        </div>

        <div *ngIf="message" class="banner-message">
          {{ message }}
        </div>

        <div *ngIf="bannerType === 'scheduled' && timeRemaining" class="countdown-section">
          <p class="countdown-label">Time until maintenance:</p>
          <div class="countdown-timer">
            <div class="time-unit">
              <span class="time-value">{{ timeRemaining.days }}</span>
              <span class="time-label">Days</span>
            </div>
            <span class="separator">:</span>
            <div class="time-unit">
              <span class="time-value">{{ padZero(timeRemaining.hours) }}</span>
              <span class="time-label">Hours</span>
            </div>
            <span class="separator">:</span>
            <div class="time-unit">
              <span class="time-value">{{ padZero(timeRemaining.minutes) }}</span>
              <span class="time-label">Minutes</span>
            </div>
            <span class="separator">:</span>
            <div class="time-unit">
              <span class="time-value">{{ padZero(timeRemaining.seconds) }}</span>
              <span class="time-label">Seconds</span>
            </div>
          </div>
        </div>

        <div *ngIf="maintenanceDetails" class="details-section">
          <p>
            <strong>Scheduled:</strong>
            {{ maintenanceDetails.startTime | date: 'medium' }} to
            {{ maintenanceDetails.endTime | date: 'medium' }}
          </p>
          <p *ngIf="maintenanceDetails.reason">
            <strong>Reason:</strong> {{ maintenanceDetails.reason }}
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .maintenance-banner {
        padding: 16px 24px;
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
          Ubuntu, Cantarell, sans-serif;
        position: relative;
        z-index: 1000;
      }

      .maintenance-banner.active {
        background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
        border-bottom: 3px solid #c92a2a;
        color: white;
      }

      .maintenance-banner.scheduled {
        background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%);
        border-bottom: 3px solid #ff9800;
        color: #333;
      }

      .banner-content {
        max-width: 1400px;
        margin: 0 auto;
      }

      .banner-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .banner-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .banner-icon {
        font-size: 24px;
      }

      .banner-message {
        margin: 8px 0;
        font-size: 14px;
        line-height: 1.5;
      }

      .countdown-section {
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.3);
      }

      .countdown-label {
        margin: 0 0 8px 0;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        opacity: 0.9;
      }

      .countdown-timer {
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: 'Courier New', monospace;
        font-weight: 700;
      }

      .time-unit {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(255, 255, 255, 0.2);
        padding: 8px 12px;
        border-radius: 6px;
        min-width: 50px;
      }

      .time-value {
        font-size: 24px;
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }

      .time-label {
        font-size: 10px;
        margin-top: 4px;
        text-transform: uppercase;
        opacity: 0.8;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
      }

      .separator {
        font-size: 20px;
        opacity: 0.7;
      }

      .details-section {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        font-size: 13px;
      }

      .details-section p {
        margin: 4px 0;
        line-height: 1.4;
      }

      @media (max-width: 768px) {
        .maintenance-banner {
          padding: 12px 16px;
        }

        .countdown-timer {
          flex-wrap: wrap;
          gap: 4px;
        }

        .time-unit {
          min-width: 45px;
          padding: 6px 8px;
        }

        .time-value {
          font-size: 18px;
        }

        .time-label {
          font-size: 9px;
        }

        .separator {
          font-size: 16px;
        }
      }
    `,
  ],
})
export class MaintenanceBannerComponent implements OnInit, OnDestroy {
  showBanner = false;
  bannerType: 'active' | 'scheduled' = 'active';
  title = '';
  message = '';
  iconClass = '';
  timeRemaining: TimeRemaining | null = null;
  maintenanceDetails: any = null;

  private timerSubscription: Subscription | null = null;
  private destroy$ = new Subject<void>();

  constructor(private maintenanceService: MaintenanceService) {}

  ngOnInit(): void {
    this.maintenanceService.maintenance$
      .pipe(takeUntil(this.destroy$))
      .subscribe((maintenance) => {
        const isActive = this.maintenanceService.getMaintenanceActiveSync();

        if (isActive || maintenance.scheduledStartTime) {
          this.showBanner = true;

          if (isActive && maintenance.isActive) {
            this.bannerType = 'active';
            this.title = 'System Under Maintenance';
            this.message =
              maintenance.message || 'The system is currently under maintenance. We will be back online soon.';
            this.iconClass = 'icon-warning';
          } else if (maintenance.scheduledStartTime && maintenance.scheduledEndTime) {
            this.bannerType = 'scheduled';
            this.title = 'Scheduled Maintenance';
            this.message =
              maintenance.message ||
              'The system will be under maintenance at the scheduled time below. Please plan accordingly.';
            this.iconClass = 'icon-calendar';

            this.maintenanceDetails = {
              startTime: new Date(maintenance.scheduledStartTime),
              endTime: new Date(maintenance.scheduledEndTime),
              reason: maintenance.reason,
            };

            this.startCountdownTimer(new Date(maintenance.scheduledStartTime));
          }
        } else {
          this.showBanner = false;
          this.stopCountdownTimer();
        }
      });
  }

  private startCountdownTimer(startTime: Date): void {
    this.updateCountdown(startTime);

    // Clear existing subscription
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    // Update every second
    this.timerSubscription = interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateCountdown(startTime);
      });
  }

  private updateCountdown(startTime: Date): void {
    const now = new Date().getTime();
    const target = new Date(startTime).getTime();
    const diff = target - now;

    if (diff <= 0) {
      this.timeRemaining = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
      this.stopCountdownTimer();
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    this.timeRemaining = { days, hours, minutes, seconds };
  }

  private stopCountdownTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }

  padZero(value: number): string {
    return value.toString().padStart(2, '0');
  }

  ngOnDestroy(): void {
    this.stopCountdownTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
