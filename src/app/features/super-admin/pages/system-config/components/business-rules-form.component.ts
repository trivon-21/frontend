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
          <!-- Quotation Approval Threshold -->
          <div class="form-group">
            <label for="quotationThreshold">
              Quotation Approval Threshold (LKR)
              <span class="required">*</span>
            </label>
            <input
              id="quotationThreshold"
              type="number"
              formControlName="quotationApprovalThreshold"
              min="0"
              max="10000000"
              placeholder="e.g., 1,000,000"
              class="form-input"
            />
            <p class="help-text">Orders above this amount require approval before proceeding</p>
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
      quotationApprovalThreshold: [0, [Validators.required, Validators.min(0), Validators.max(10000000)]],
      paymentAutoCancelDays: [14, [Validators.required, Validators.min(1), Validators.max(365)]],
      defaultWarrantyMonths: [24, [Validators.required, Validators.min(1), Validators.max(60)]],
      amcContractMonths: [12, [Validators.required, Validators.min(1), Validators.max(60)]],
      maxRescheduleAttempts: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
    });
  }

  ngOnChanges(): void {
    if (this.config) {
      this.form.patchValue(this.config.businessRules);
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
      if (currentRules[key] !== formValue[key]) {
        changes[key] = formValue[key];
      }
    }

    return changes;
  }

  resetForm(): void {
    if (this.config) {
      this.form.patchValue(this.config.businessRules);
      this.form.markAsPristine();
    }
  }
}
