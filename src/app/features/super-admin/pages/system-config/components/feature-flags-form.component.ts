import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemConfig, FeatureFlags } from '../../../models/system-config.model';

interface FlagOption {
  key: keyof FeatureFlags;
  label: string;
  description: string;
}

@Component({
  selector: 'app-feature-flags-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="feature-flags-section">
      <h2>Feature Flags</h2>
      <p class="section-description">Enable or disable system modules without redeployment</p>

      <div *ngIf="config" class="flags-container">
        <div *ngFor="let flag of flags" class="flag-item">
          <div class="flag-header">
            <label class="flag-label">
              <input
                type="checkbox"
                [checked]="config.featureFlags[flag.key]"
                (change)="onFlagChange(flag.key, $event)"
                [disabled]="isSaving"
              />
              <span class="flag-name">{{ flag.label }}</span>
            </label>
            <span class="flag-status" [class.enabled]="config.featureFlags[flag.key]">
              {{ config.featureFlags[flag.key] ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
          <p class="flag-description">{{ flag.description }}</p>
        </div>

        <!-- Save Button -->
        <div class="form-actions">
          <button (click)="onSave()" [disabled]="!hasChanges || isSaving" class="btn btn-primary">
            <span *ngIf="!isSaving">Save Changes</span>
            <span *ngIf="isSaving">
              <span class="spinner-small"></span>
              Saving...
            </span>
          </button>
          <button (click)="resetFlags()" class="btn btn-secondary" [disabled]="isSaving">
            Reset
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .feature-flags-section {
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

      .flags-container {
        max-width: 600px;
      }

      .flag-item {
        padding: 20px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        margin-bottom: 15px;
        transition: all 0.3s ease;
      }

      .flag-item:hover {
        border-color: var(--primary-main);
        box-shadow: 0 2px 8px rgba(0, 132, 61, 0.1);
      }

      .flag-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .flag-label {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        user-select: none;
        font-weight: 500;
      }

      .flag-label input {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .flag-label input:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .flag-name {
        font-size: 14px;
        color: #333;
      }

      .flag-status {
        font-size: 12px;
        padding: 4px 12px;
        border-radius: 4px;
        background-color: #f5f5f5;
        color: #666;
        font-weight: 500;
      }

      .flag-status.enabled {
        background-color: var(--primary-lighter);
        color: var(--primary-main);
      }

      .flag-description {
        margin: 0;
        font-size: 13px;
        color: #999;
        margin-left: 30px;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
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
export class FeatureFlagsFormComponent {
  @Input() config: SystemConfig | null = null;
  @Input() isSaving = false;
  @Output() save = new EventEmitter<Partial<FeatureFlags>>();
  @Output() error = new EventEmitter<string>();

  localFlags: FeatureFlags | null = null;
  hasChanges = false;

  flags: FlagOption[] = [
    {
      key: 'amcModuleEnabled',
      label: 'AMC Module',
      description: 'Enable/disable Annual Maintenance Contract functionality',
    },
    {
      key: 'warrantyModuleEnabled',
      label: 'Warranty Module',
      description: 'Enable/disable warranty management and tracking',
    },
    {
      key: 'preventiveMaintenanceEnabled',
      label: 'Preventive Maintenance Reminders',
      description: 'Enable/disable automatic preventive maintenance notifications',
    },
    {
      key: 'customerFeedbackEnabled',
      label: 'Customer Feedback Form',
      description: 'Enable/disable customer feedback collection',
    },
    {
      key: 'deliveryTrackingEnabled',
      label: 'Delivery Tracking',
      description: 'Enable/disable real-time delivery tracking for orders',
    },
  ];

  ngOnChanges(): void {
    if (this.config) {
      this.localFlags = { ...this.config.featureFlags };
      this.hasChanges = false;
    }
  }

  onFlagChange(key: keyof FeatureFlags, event: any): void {
    if (this.localFlags) {
      this.localFlags[key] = event.target.checked;
      this.hasChanges = !this.areEqual(this.localFlags, this.config!.featureFlags);
    }
  }

  onSave(): void {
    if (!this.hasChanges || !this.localFlags) {
      return;
    }

    const changes = this.getChangedFlags();
    if (Object.keys(changes).length === 0) {
      this.error.emit('No changes to save');
      return;
    }

    this.save.emit(changes);
  }

  private getChangedFlags(): Partial<FeatureFlags> {
    const changes: any = {};
    if (!this.localFlags || !this.config) return changes;

    for (const key of this.flags.map((f) => f.key)) {
      if (this.config.featureFlags[key] !== this.localFlags[key]) {
        changes[key] = this.localFlags[key];
      }
    }

    return changes;
  }

  private areEqual(obj1: FeatureFlags, obj2: FeatureFlags): boolean {
    return Object.keys(obj1).every((key) => obj1[key as keyof FeatureFlags] === obj2[key as keyof FeatureFlags]);
  }

  resetFlags(): void {
    if (this.config) {
      this.localFlags = { ...this.config.featureFlags };
      this.hasChanges = false;
    }
  }
}
