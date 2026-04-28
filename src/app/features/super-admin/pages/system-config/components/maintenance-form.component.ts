import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SystemConfigService } from '../../../services/system-config.service';
import { SystemConfig, MaintenanceMode } from '../../../models/system-config.model';

@Component({
  selector: 'app-maintenance-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="maintenance-section">
      <h2>Maintenance Mode</h2>
      <p class="section-description">Configure system maintenance windows and settings</p>

      <div *ngIf="config" class="form-container">
        <form [formGroup]="maintenanceForm" (ngSubmit)="onSubmit()">
          <!-- Maintenance Status Toggle -->
          <div class="form-group">
            <label class="toggle-label">Activate Maintenance Mode</label>
            <button
              type="button"
              (click)="toggleMaintenance()"
              [class.active]="maintenanceForm.get('isActive')?.value"
              class="toggle-button"
            >
              <span class="toggle-track">
                <span class="toggle-circle"></span>
              </span>
              <span class="toggle-text">
                {{ maintenanceForm.get('isActive')?.value ? 'ON' : 'OFF' }}
              </span>
            </button>
            <p class="help-text">When enabled, regular users will see a maintenance page</p>
          </div>

          <!-- Maintenance Message -->
          <div class="form-group">
            <label for="message">
              Maintenance Message
              <span class="required">*</span>
            </label>
            <textarea
              id="message"
              formControlName="message"
              placeholder="System is under maintenance. Please try again later."
              class="form-input textarea"
              rows="3"
            ></textarea>
            <p class="help-text">Message displayed to users during maintenance</p>
          </div>

          <!-- Maintenance Reason -->
          <div class="form-group">
            <label for="reason">
              Reason for Maintenance
              <span class="required">*</span>
            </label>
            <textarea
              id="reason"
              formControlName="reason"
              placeholder="e.g., Database migration, security patches"
              class="form-input textarea"
              rows="2"
            ></textarea>
            <p class="help-text">Internal reason for audit logging</p>
          </div>

          <!-- Mode Selection -->
          <div class="form-group">
            <label>Maintenance Type</label>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  type="radio"
                  value="instant"
                  formControlName="mode"
                  class="radio-input"
                />
                <span class="radio-text">Instant</span>
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  value="scheduled"
                  formControlName="mode"
                  class="radio-input"
                />
                <span class="radio-text">Scheduled</span>
              </label>
            </div>
          </div>

          <!-- Scheduled Maintenance Times -->
          <ng-container *ngIf="isScheduledMaintenance">
            <div class="form-row">
              <div class="form-group">
                <label for="startTime">
                  Start Time
                  <span class="required">*</span>
                </label>
                <input
                  id="startTime"
                  type="datetime-local"
                  formControlName="scheduledStartTime"
                  class="form-input"
                />
                <p class="help-text">When maintenance should start</p>
              </div>

              <div class="form-group">
                <label for="endTime">
                  End Time
                  <span class="required">*</span>
                </label>
                <input
                  id="endTime"
                  type="datetime-local"
                  formControlName="scheduledEndTime"
                  class="form-input"
                />
                <p class="help-text">When maintenance should end</p>
              </div>
            </div>
          </ng-container>

          <!-- Current Status -->
          <div *ngIf="currentMaintenance" class="status-card">
            <div class="status-row">
              <span class="status-label">Current Status:</span>
              <span class="status-badge" [class.active]="currentMaintenance.isActive">
                {{ currentMaintenance.isActive ? 'ACTIVE' : 'INACTIVE' }}
              </span>
            </div>
            <div *ngIf="countdownDisplay" class="status-row">
              <span class="status-label">{{ countdownLabel }}:</span>
              <span class="status-value">{{ countdownDisplay }}</span>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button
              type="submit"
              [disabled]="maintenanceForm.invalid || isSaving || maintenanceForm.pristine"
              class="btn btn-primary"
            >
              <span *ngIf="!isSaving">Save Changes</span>
              <span *ngIf="isSaving">
                <span class="spinner-small"></span>
                Saving...
              </span>
            </button>
            <button type="button" (click)="resetForm()" class="btn btn-secondary" [disabled]="isSaving">
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .maintenance-section {
        background: #fff;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      h2 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: #1a1a1a;
      }

      .section-description {
        margin: 0 0 30px 0;
        font-size: 14px;
        color: #666;
      }

      .form-container {
        max-width: 600px;
      }

      .form-group {
        margin-bottom: 25px;
      }

      label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        font-size: 14px;
        color: #333;
      }

      .required {
        color: #d32f2f;
      }

      .form-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.3s ease;
        box-sizing: border-box;
        font-family: inherit;
      }

      .form-input.textarea {
        resize: vertical;
        font-family: inherit;
      }

      .form-input:focus {
        outline: none;
        border-color: var(--primary-main);
        box-shadow: 0 0 0 3px rgba(0, 132, 61, 0.1);
      }

      .form-input:disabled {
        background-color: #f5f5f5;
        color: #999;
      }

      .help-text {
        margin: 6px 0 0 0;
        font-size: 13px;
        color: #999;
      }

      /* Toggle Button */
      .toggle-label {
        display: block;
        margin-bottom: 12px;
        font-weight: 500;
        font-size: 14px;
        color: #333;
      }

      .toggle-button {
        display: flex;
        align-items: center;
        gap: 12px;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .toggle-track {
        position: relative;
        width: 50px;
        height: 28px;
        background-color: #e0e0e0;
        border-radius: 14px;
        display: flex;
        align-items: center;
        padding: 2px;
        transition: background-color 0.3s ease;
      }

      .toggle-button.active .toggle-track {
        background-color: var(--primary-main);
      }

      .toggle-circle {
        width: 24px;
        height: 24px;
        background-color: #fff;
        border-radius: 50%;
        transition: transform 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .toggle-button.active .toggle-circle {
        transform: translateX(22px);
      }

      .toggle-text {
        font-weight: 600;
        font-size: 13px;
        color: #666;
        min-width: 30px;
      }

      .toggle-button.active .toggle-text {
        color: var(--primary-main);
      }

      /* Radio Group */
      .radio-group {
        display: flex;
        gap: 15px;
      }

      .radio-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-weight: 500;
      }

      .radio-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .radio-text {
        font-size: 14px;
        color: #333;
      }

      /* Form Row */
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      @media (max-width: 768px) {
        .form-row {
          grid-template-columns: 1fr;
        }
      }

      /* Status Card */
      .status-card {
        background: #f5f7fa;
        border: 1px solid #e0e5eb;
        border-radius: 6px;
        padding: 16px;
        margin-bottom: 25px;
      }

      .status-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
      }

      .status-row:not(:last-child) {
        border-bottom: 1px solid #e0e5eb;
        margin-bottom: 8px;
        padding-bottom: 8px;
      }

      .status-label {
        font-weight: 600;
        color: #666;
        font-size: 14px;
      }

      .status-badge {
        font-weight: 700;
        font-size: 12px;
        padding: 4px 12px;
        border-radius: 4px;
        background-color: #e0e0e0;
        color: #666;
      }

      .status-badge.active {
        background-color: #ffebee;
        color: var(--error);
      }

      .status-value {
        font-weight: 600;
        font-size: 13px;
        color: #ff9800;
        font-family: 'Courier New', monospace;
      }

      /* Form Actions */
      .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 30px;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-primary {
        background-color: var(--primary-main);
        color: #fff;
      }

      .btn-primary:hover:not(:disabled) {
        background-color: var(--primary-hover);
      }

      .btn-primary:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }

      .btn-secondary {
        background-color: #f5f5f5;
        color: #666;
        border: 1px solid #ddd;
      }

      .btn-secondary:hover:not(:disabled) {
        background-color: #e8e8e8;
      }

      .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .spinner-small {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class MaintenanceFormComponent implements OnInit, OnDestroy, OnChanges {
  @Input() config: SystemConfig | null = null;
  @Input() isSaving = false;
  @Output() save = new EventEmitter<Partial<MaintenanceMode>>();
  @Output() error = new EventEmitter<string>();

  maintenanceForm!: FormGroup;
  currentMaintenance: MaintenanceMode | null = null;
  countdownDisplay = '';
  countdownLabel = 'Time Remaining';
  private countdownInterval: any;

  constructor(private fb: FormBuilder, private systemConfigService: SystemConfigService) {
    this.createForm();
  }

  ngOnInit(): void {
    this.loadCurrentMaintenance();
    this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && !changes['config'].firstChange) {
      this.loadCurrentMaintenance();
      this.maintenanceForm.markAsPristine();
    }
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private createForm(): void {
    this.maintenanceForm = this.fb.group({
      isActive: [false],
      message: ['System is under maintenance. Please try again later.', [Validators.required, Validators.minLength(5)]],
      reason: ['', Validators.required],
      mode: ['instant'],
      scheduledStartTime: [''],
      scheduledEndTime: [''],
    });

    this.maintenanceForm.get('mode')?.valueChanges.subscribe((value) => {
      const startControl = this.maintenanceForm.get('scheduledStartTime');
      const endControl = this.maintenanceForm.get('scheduledEndTime');

      if (value === 'scheduled') {
        startControl?.setValidators([Validators.required]);
        endControl?.setValidators([Validators.required]);
      } else {
        startControl?.clearValidators();
        endControl?.clearValidators();
      }

      startControl?.updateValueAndValidity();
      endControl?.updateValueAndValidity();
    });
  }

  private loadCurrentMaintenance(): void {
    if (this.config?.maintenance) {
      this.currentMaintenance = this.config.maintenance;
      this.populateForm(this.config.maintenance);
      this.updateCountdown();
    }
  }

  private populateForm(maintenance: MaintenanceMode): void {
    const hasScheduledTimes = maintenance.scheduledStartTime || maintenance.scheduledEndTime;

    this.maintenanceForm.patchValue({
      isActive: maintenance.isActive,
      message: maintenance.message,
      reason: maintenance.reason || '',
      mode: hasScheduledTimes ? 'scheduled' : 'instant',
      scheduledStartTime: maintenance.scheduledStartTime ? this.formatDateTimeForInput(new Date(maintenance.scheduledStartTime)) : '',
      scheduledEndTime: maintenance.scheduledEndTime ? this.formatDateTimeForInput(new Date(maintenance.scheduledEndTime)) : '',
    });
  }

  private formatDateTimeForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  toggleMaintenance(): void {
    const isActiveControl = this.maintenanceForm.get('isActive');
    if (isActiveControl) {
      isActiveControl.setValue(!isActiveControl.value);
      isActiveControl.markAsDirty();
    }
  }

  onSubmit(): void {
    if (this.maintenanceForm.invalid) {
      this.error.emit('Please fill in all required fields correctly');
      return;
    }

    const formValue = this.maintenanceForm.value;
    const maintenance: Partial<MaintenanceMode> = {
      isActive: formValue.isActive,
      message: formValue.message,
      reason: formValue.reason,
    };

    if (formValue.mode === 'scheduled') {
      maintenance.scheduledStartTime = new Date(formValue.scheduledStartTime);
      maintenance.scheduledEndTime = new Date(formValue.scheduledEndTime);

      if (maintenance.scheduledStartTime! >= maintenance.scheduledEndTime!) {
        this.error.emit('Scheduled start time must be before end time');
        return;
      }
    } else {
      maintenance.scheduledStartTime = null;
      maintenance.scheduledEndTime = null;
    }

    this.save.emit(maintenance);
  }

  resetForm(): void {
    if (this.config?.maintenance) {
      const currentMessage = this.maintenanceForm.get('message')?.value;
      this.populateForm(this.config.maintenance);
      this.maintenanceForm.get('message')?.setValue(currentMessage);
    }
  }

  private updateCountdown(): void {
    if (!this.currentMaintenance) {
      this.countdownDisplay = '';
      return;
    }

    const now = new Date().getTime();
    const maintenance = this.currentMaintenance;
    // Only apply auto-toggle/auto-save logic if form mode is "scheduled"
    const isFormModeScheduled = this.maintenanceForm.get('mode')?.value === 'scheduled';
    const hasScheduled = isFormModeScheduled && maintenance.scheduledStartTime && maintenance.scheduledEndTime;

    // 1. Automatic Activation Logic (from previous task) - Only for scheduled mode
    if (hasScheduled) {
      const startTime = new Date(maintenance.scheduledStartTime!).getTime();
      const endTime = new Date(maintenance.scheduledEndTime!).getTime();
      const isActiveInForm = this.maintenanceForm.get('isActive')?.value;

      if (now >= startTime && now < endTime) {
        if (!isActiveInForm) {
          this.maintenanceForm.get('isActive')?.setValue(true);
          this.maintenanceForm.markAsDirty();
          this.currentMaintenance.isActive = true;
          // Trigger automatic save
          if (!this.isSaving) {
            this.onSubmit();
          }
        }
      } else if (now >= endTime) {
        if (isActiveInForm) {
          this.maintenanceForm.get('isActive')?.setValue(false);
          this.maintenanceForm.markAsDirty();
          this.currentMaintenance.isActive = false;
          // Trigger automatic save
          if (!this.isSaving) {
            this.onSubmit();
          }
        }
      }
    }

    // 2. Display Logic
    if (maintenance.isActive) {
      // DOWNTIME
      this.countdownLabel = 'Downtime';
      if (maintenance.scheduledEndTime && now < new Date(maintenance.scheduledEndTime).getTime()) {
        // Scheduled Remaining
        const endTime = new Date(maintenance.scheduledEndTime).getTime();
        this.countdownDisplay = this.formatDuration(endTime - now);
      } else if (maintenance.startTime) {
        // Instant Elapsed
        const startTime = new Date(maintenance.startTime).getTime();
        this.countdownDisplay = this.formatDuration(now - startTime, true);
      } else {
        this.countdownDisplay = 'System is currently down';
      }
    } else {
      // INACTIVE
      if (maintenance.scheduledStartTime && now < new Date(maintenance.scheduledStartTime).getTime()) {
        // Time Remaining to Start
        this.countdownLabel = 'Time Remaining to Start';
        const startTime = new Date(maintenance.scheduledStartTime).getTime();
        this.countdownDisplay = this.formatDuration(startTime - now);
      } else if (maintenance.scheduledEndTime && now >= new Date(maintenance.scheduledEndTime).getTime()) {
        // Maintenance Period Ended
        this.countdownLabel = 'Status';
        this.countdownDisplay = 'Maintenance period has ended';
      } else {
        this.countdownDisplay = '';
      }
    }
  }

  private formatDuration(ms: number, elapsed = false): string {
    if (ms < 0) return '';
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ') + (elapsed ? ' elapsed' : ' remaining');
  }

  get isScheduledMaintenance(): boolean {
    return this.maintenanceForm.get('mode')?.value === 'scheduled';
  }
}

