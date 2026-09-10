import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SystemConfig, BusinessRules } from '../../../models/system-config.model';

@Component({
  selector: 'app-business-rules-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="business-rules-section">
      <h2>Business Rules</h2>
      <p class="section-description">Configure operational rules that drive core workflow logic</p>

      <div *ngIf="config" class="form-container">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Standard Service Fees Section -->
          <div class="sub-section-header">
            <h3 class="sub-section-title">Standard Service Charges (LKR)</h3>
            <p class="sub-section-subtitle">Manage baseline rates synchronized with the service charges database</p>
          </div>

          <!-- Standard Maintenance Service Fee -->
          <div class="form-group">
            <label for="standardMaintenanceFee">
              Standard Maintenance Service Fee (LKR)
              <span class="required">*</span>
            </label>
            <input
              id="standardMaintenanceFee"
              type="number"
              formControlName="standardMaintenanceFee"
              min="0"
              placeholder="e.g., 6,000"
              class="form-input"
            />
            <p class="help-text">Baseline service fee for scheduled or routine maintenance visits</p>
          </div>

          <!-- Standard Repair Service Fee -->
          <div class="form-group">
            <label for="standardRepairFee">
              Standard Repair Service Fee (LKR)
              <span class="required">*</span>
            </label>
            <input
              id="standardRepairFee"
              type="number"
              formControlName="standardRepairFee"
              min="0"
              placeholder="e.g., 7,500"
              class="form-input"
            />
            <p class="help-text">Baseline diagnostic and call-out fee for equipment repair services</p>
          </div>

          <!-- Standard Site Inspection Fee -->
          <div class="form-group">
            <label for="standardSiteInspectionFee">
              Standard Site Inspection Fee (LKR)
              <span class="required">*</span>
            </label>
            <input
              id="standardSiteInspectionFee"
              type="number"
              formControlName="standardSiteInspectionFee"
              min="0"
              placeholder="e.g., 5,000"
              class="form-input"
            />
            <p class="help-text">Baseline fee charged for pre-installation site inspections</p>
          </div>

          <!-- Inventory Profit Margin -->
          <div class="form-group">
            <label for="profitMargin">
              Inventory Profit Margin (%)
              <span class="required">*</span>
            </label>
            <input
              id="profitMargin"
              type="number"
              formControlName="profitMargin"
              min="0"
              max="100"
              step="0.01"
              placeholder="e.g., 25"
              class="form-input"
            />
            <p class="help-text">Updates every inventory item's margin and selling price from its unit cost</p>
          </div>

          <div class="sub-section-header" style="margin-top: 32px;">
            <h3 class="sub-section-title">Operational Policies & Durations</h3>
            <p class="sub-section-subtitle">Configure system SLAs, log retention, and lifecycle parameters</p>
          </div>

          <!-- Payment Auto-Cancel Window -->
          <div class="form-group">
            <label for="paymentCancel">
              Payment Auto-Cancel Window (Days)
              <span class="required">*</span>
            </label>
            <input
              id="paymentCancel"
              type="number"
              formControlName="paymentAutoCancelDays"
              min="1"
              max="365"
              placeholder="e.g., 14"
              class="form-input"
            />
            <p class="help-text">Orders automatically cancelled if payment not received within this period</p>
          </div>

          <!-- Log Retention Period -->
          <div class="form-group">
            <label for="logRetentionDays">
              Log Retention Period (Days)
              <span class="required">*</span>
            </label>
            <input
              id="logRetentionDays"
              type="number"
              formControlName="logRetentionDays"
              min="7"
              max="730"
              placeholder="e.g., 30"
              class="form-input"
            />
            <p class="help-text">Number of days to retain audit logs before automatic deletion</p>
          </div>

          <!-- Default Warranty Duration -->
          <div class="form-group">
            <label for="warrantyMonths">
              Default Warranty Duration (Months)
              <span class="required">*</span>
            </label>
            <input
              id="warrantyMonths"
              type="number"
              formControlName="defaultWarrantyMonths"
              min="1"
              max="60"
              placeholder="e.g., 24"
              class="form-input"
            />
            <p class="help-text">Default warranty period for new orders</p>
          </div>

          <!-- AMC Contract Duration -->
          <div class="form-group">
            <label for="amcMonths">
              AMC Contract Duration (Months)
              <span class="required">*</span>
            </label>
            <input
              id="amcMonths"
              type="number"
              formControlName="amcContractMonths"
              min="1"
              max="60"
              placeholder="e.g., 12"
              class="form-input"
            />
            <p class="help-text">Default AMC (Annual Maintenance Contract) duration</p>
          </div>

          <!-- Max Reschedule Attempts -->
          <div class="form-group">
            <label for="rescheduleAttempts">
              Max Reschedule Attempts per Customer
              <span class="required">*</span>
            </label>
            <input
              id="rescheduleAttempts"
              type="number"
              formControlName="maxRescheduleAttempts"
              min="1"
              max="10"
              placeholder="e.g., 3"
              class="form-input"
            />
            <p class="help-text">Maximum times a customer can reschedule a service request</p>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button
              type="submit"
              [disabled]="!form.valid || !form.dirty || isSaving"
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
      .business-rules-section {
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
        margin: 0 0 24px 0;
        font-size: 14px;
        color: #666;
      }

      .sub-section-header {
        margin: 0 0 16px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid #f0f0ee;
      }

      .sub-section-title {
        margin: 0 0 4px 0;
        font-size: 15px;
        font-weight: 600;
        color: #1b2f27;
      }

      .sub-section-subtitle {
        margin: 0;
        font-size: 12.5px;
        color: #8a9e96;
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
export class BusinessRulesFormComponent {
  @Input() config: SystemConfig | null = null;
  @Input() isSaving = false;
  @Output() save = new EventEmitter<Partial<BusinessRules>>();
  @Output() error = new EventEmitter<string>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      standardMaintenanceFee: [6000, [Validators.required, Validators.min(0)]],
      standardRepairFee: [7500, [Validators.required, Validators.min(0)]],
      standardSiteInspectionFee: [5000, [Validators.required, Validators.min(0)]],
      profitMargin: [25, [Validators.required, Validators.min(0), Validators.max(100)]],
      logRetentionDays: [30, [Validators.required, Validators.min(7), Validators.max(730)]],
      paymentAutoCancelDays: [14, [Validators.required, Validators.min(1), Validators.max(365)]],
      defaultWarrantyMonths: [24, [Validators.required, Validators.min(1), Validators.max(60)]],
      amcContractMonths: [12, [Validators.required, Validators.min(1), Validators.max(60)]],
      maxRescheduleAttempts: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
    });
  }

  ngOnChanges(): void {
    if (this.config) {
      this.form.patchValue({
        ...this.config.businessRules,
        profitMargin: (this.config.businessRules.profitMargin ?? 0.25) * 100,
      });
      this.form.markAsPristine();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.error.emit('Please fix validation errors');
      return;
    }

    const changes = this.getChangedValues();
    if (Object.keys(changes).length === 0) {
      this.error.emit('No changes to save');
      return;
    }

    this.save.emit(changes);
  }

  private getChangedValues(): Partial<BusinessRules> {
    const changes: any = {};
    const formValue = this.form.value;

    if (!this.config) return changes;

    const currentRules = this.config.businessRules as any;
    for (const key in formValue) {
      const value = key === 'profitMargin' ? formValue[key] / 100 : formValue[key];
      const currentValue = key === 'profitMargin' ? (currentRules[key] ?? 0.25) : currentRules[key];
      if (currentValue !== value) {
        changes[key] = value;
      }
    }

    return changes;
  }

  resetForm(): void {
    if (this.config) {
      this.form.patchValue({
        ...this.config.businessRules,
        profitMargin: (this.config.businessRules.profitMargin ?? 0.25) * 100,
      });
      this.form.markAsPristine();
    }
  }
}
