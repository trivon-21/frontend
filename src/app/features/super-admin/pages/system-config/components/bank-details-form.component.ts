import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SystemConfig, BankDetails } from '../../../models/system-config.model';

@Component({
  selector: 'app-bank-details-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bank-details-section">
      <div class="section-header">
        <div>
          <h2>Bank Account Details</h2>
          <p class="section-description">
            Manage company bank account information displayed to customers for offline bank transfers and invoice settlements
          </p>
        </div>
        <div *ngIf="config?.bankDetails?.updatedAt" class="audit-badge">
          <span class="badge-dot"></span>
          <span>Last modified: {{ config?.bankDetails?.updatedAt | date:'mediumDate' }}</span>
        </div>
      </div>

      <div *ngIf="config" class="form-container">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-grid">
            <!-- Bank Name -->
            <div class="form-group">
              <label for="bankName">
                Bank Name
                <span class="required">*</span>
              </label>
              <input
                id="bankName"
                type="text"
                formControlName="bankName"
                placeholder="e.g., Commercial Bank"
                class="form-input"
                [class.invalid]="isFieldInvalid('bankName')"
              />
              <p *ngIf="isFieldInvalid('bankName')" class="field-error">
                Bank name is required
              </p>
              <p *ngIf="!isFieldInvalid('bankName')" class="help-text">
                Financial institution name
              </p>
            </div>

            <!-- Branch Name -->
            <div class="form-group">
              <label for="branch">
                Branch
                <span class="required">*</span>
              </label>
              <input
                id="branch"
                type="text"
                formControlName="branch"
                placeholder="e.g., Negombo or Colombo 03"
                class="form-input"
                [class.invalid]="isFieldInvalid('branch')"
              />
              <p *ngIf="isFieldInvalid('branch')" class="field-error">
                Branch name is required
              </p>
              <p *ngIf="!isFieldInvalid('branch')" class="help-text">
                Issuing branch location
              </p>
            </div>

            <!-- Account Holder Name -->
            <div class="form-group">
              <label for="accountName">
                Account Holder Name
                <span class="required">*</span>
              </label>
              <input
                id="accountName"
                type="text"
                formControlName="accountName"
                placeholder="e.g., Airlux Engineering (Pvt) Ltd"
                class="form-input"
                [class.invalid]="isFieldInvalid('accountName')"
              />
              <p *ngIf="isFieldInvalid('accountName')" class="field-error">
                Account holder name is required
              </p>
              <p *ngIf="!isFieldInvalid('accountName')" class="help-text">
                Registered corporate business account name
              </p>
            </div>

            <!-- Account Number -->
            <div class="form-group">
              <label for="accountNumber">
                Account Number
                <span class="required">*</span>
              </label>
              <input
                id="accountNumber"
                type="text"
                formControlName="accountNumber"
                placeholder="e.g., 8001234567"
                class="form-input mono"
                [class.invalid]="isFieldInvalid('accountNumber')"
              />
              <p *ngIf="isFieldInvalid('accountNumber')" class="field-error">
                Valid numeric account number (min 6 digits) is required
              </p>
              <p *ngIf="!isFieldInvalid('accountNumber')" class="help-text">
                Primary numeric account identifier
              </p>
            </div>

            <!-- Account Type -->
            <div class="form-group">
              <label for="type">
                Account Type
                <span class="required">*</span>
              </label>
              <select id="type" formControlName="type" class="form-input form-select">
                <option value="Current">Current Account</option>
                <option value="Savings">Savings Account</option>
                <option value="Corporate">Corporate Account</option>
              </select>
              <p class="help-text">Deposit account classification</p>
            </div>

            <!-- Currency -->
            <div class="form-group">
              <label for="currency">Currency</label>
              <input
                id="currency"
                type="text"
                formControlName="currency"
                class="form-input disabled-input"
                readonly
              />
              <p class="help-text">Company operates strictly in Sri Lankan Rupees (LKR)</p>
            </div>
          </div>

          <!-- Reason for Change -->
          <div class="form-group reason-group">
            <label for="reason">Reason for Update (Audit Trail)</label>
            <input
              id="reason"
              type="text"
              formControlName="reason"
              placeholder="e.g., Changed default operational account to Commercial Bank Negombo"
              class="form-input"
            />
            <p class="help-text">Optional description recorded in platform audit logs</p>
          </div>

          <!-- Customer Transfer Live Preview -->
          <div class="preview-section">
            <div class="preview-header">
              <span class="preview-badge">Customer View Preview</span>
              <h3>How Customers See Bank Transfer Details</h3>
            </div>
            <p class="preview-text">
              This card reflects exactly how banking instructions appear on customer checkout and invoice payment screens:
            </p>

            <div class="preview-card">
              <div class="preview-card-header">
                <div class="bank-avatar">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
                    <line x1="2" y1="10" x2="22" y2="10"/>
                  </svg>
                </div>
                <div class="bank-title-block">
                  <h4 class="preview-bank-name">{{ form.get('bankName')?.value || 'Bank Name' }}</h4>
                  <span class="preview-bank-branch">{{ form.get('branch')?.value || 'Branch Location' }}</span>
                </div>
                <span class="preview-currency-tag">{{ form.get('currency')?.value || 'LKR' }}</span>
              </div>

              <div class="preview-card-body">
                <div class="preview-item">
                  <span class="item-label">Account Holder</span>
                  <span class="item-value bold">{{ form.get('accountName')?.value || 'Airlux Engineering (Pvt) Ltd' }}</span>
                </div>
                <div class="preview-item">
                  <span class="item-label">Account Number</span>
                  <span class="item-value mono highlight">{{ form.get('accountNumber')?.value || '0000000000' }}</span>
                </div>
                <div class="preview-item">
                  <span class="item-label">Account Type</span>
                  <span class="item-value">{{ form.get('type')?.value || 'Current' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button
              type="submit"
              [disabled]="!form.valid || !form.dirty || isSaving"
              class="btn btn-primary"
            >
              <span *ngIf="!isSaving">Save Changes</span>
              <span *ngIf="isSaving" class="btn-loading">
                <span class="spinner-small"></span>
                Saving...
              </span>
            </button>
            <button
              type="button"
              (click)="resetForm()"
              class="btn btn-secondary"
              [disabled]="isSaving || !form.dirty"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .bank-details-section {
        background: #fff;
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        border: 1px solid #eef0ee;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 24px;
        border-bottom: 1px solid #f0f2f0;
        padding-bottom: 16px;
      }

      h2 {
        margin: 0 0 6px 0;
        font-size: 20px;
        font-weight: 700;
        color: #1b2f27;
      }

      .section-description {
        margin: 0;
        font-size: 14px;
        color: #63736c;
        line-height: 1.5;
      }

      .audit-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 20px;
        background: #f0f7f4;
        color: #1f5b45;
        font-size: 12px;
        font-weight: 500;
      }

      .badge-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #2a8361;
      }

      .form-container {
        max-width: 780px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-bottom: 20px;
      }

      @media (max-width: 640px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .reason-group {
        margin-bottom: 28px;
      }

      label {
        margin-bottom: 8px;
        font-weight: 600;
        font-size: 13.5px;
        color: #2b3a33;
      }

      .required {
        color: #d32f2f;
      }

      .form-input {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid #d4ded8;
        border-radius: 8px;
        font-size: 14px;
        color: #1b2f27;
        background: #ffffff;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }

      .form-select {
        cursor: pointer;
      }

      .form-input.mono {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        letter-spacing: 0.05em;
      }

      .form-input:focus {
        outline: none;
        border-color: #1f5b45;
        box-shadow: 0 0 0 3px rgba(31, 91, 69, 0.12);
      }

      .form-input.invalid {
        border-color: #e53935;
        background: #fffafa;
      }

      .disabled-input {
        background-color: #f7f9f8;
        color: #7d8e87;
        cursor: not-allowed;
      }

      .help-text {
        margin: 6px 0 0 0;
        font-size: 12.5px;
        color: #83948c;
      }

      .field-error {
        margin: 6px 0 0 0;
        font-size: 12px;
        color: #e53935;
        font-weight: 500;
      }

      /* Preview Card Section */
      .preview-section {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid #eef0ee;
      }

      .preview-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 6px;
      }

      .preview-badge {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        background: #e6f4ea;
        color: #137333;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .preview-header h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #2b3a33;
      }

      .preview-text {
        font-size: 13px;
        color: #72847c;
        margin: 0 0 16px 0;
      }

      .preview-card {
        background: linear-gradient(135deg, #f8faf9 0%, #f0f6f3 100%);
        border: 1px solid #d9e5df;
        border-radius: 12px;
        padding: 20px;
        max-width: 540px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
      }

      .preview-card-header {
        display: flex;
        align-items: center;
        gap: 14px;
        padding-bottom: 14px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        margin-bottom: 16px;
      }

      .bank-avatar {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        background: #1f5b45;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .bank-title-block {
        flex: 1;
      }

      .preview-bank-name {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #1b2f27;
      }

      .preview-bank-branch {
        font-size: 12.5px;
        color: #63736c;
      }

      .preview-currency-tag {
        font-size: 12px;
        font-weight: 700;
        padding: 3px 8px;
        background: #ffffff;
        border: 1px solid #d4ded8;
        border-radius: 6px;
        color: #1f5b45;
      }

      .preview-card-body {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .preview-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13.5px;
      }

      .item-label {
        color: #63736c;
      }

      .item-value {
        color: #1b2f27;
      }

      .item-value.bold {
        font-weight: 600;
      }

      .item-value.mono {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        letter-spacing: 0.06em;
      }

      .item-value.highlight {
        color: #1f5b45;
        font-weight: 700;
      }

      /* Form Actions */
      .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 30px;
      }

      .btn {
        padding: 10px 22px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-primary {
        background-color: #1f5b45;
        color: #fff;
      }

      .btn-primary:hover:not(:disabled) {
        background-color: #164634;
      }

      .btn-primary:disabled {
        background-color: #c5d4cd;
        cursor: not-allowed;
      }

      .btn-secondary {
        background-color: #ffffff;
        color: #4c5d56;
        border: 1px solid #d4ded8;
      }

      .btn-secondary:hover:not(:disabled) {
        background-color: #f5f8f6;
        color: #1b2f27;
      }

      .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-loading {
        display: flex;
        align-items: center;
        gap: 8px;
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
export class BankDetailsFormComponent implements OnChanges {
  @Input() config: SystemConfig | null = null;
  @Input() isSaving = false;
  @Output() save = new EventEmitter<{ bankDetails: Partial<BankDetails>; reason?: string }>();
  @Output() error = new EventEmitter<string>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      bankName: ['', [Validators.required, Validators.maxLength(100)]],
      branch: ['', [Validators.required, Validators.maxLength(100)]],
      accountName: ['', [Validators.required, Validators.maxLength(150)]],
      accountNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$'), Validators.minLength(6), Validators.maxLength(25)]],
      type: ['Current', [Validators.required]],
      currency: ['LKR'],
      reason: [''],
    });
  }

  ngOnChanges(): void {
    if (this.config?.bankDetails) {
      this.populateForm(this.config.bankDetails);
    }
  }

  populateForm(details: BankDetails): void {
    this.form.patchValue({
      bankName: details.bankName || '',
      branch: details.branch || '',
      accountName: details.accountName || '',
      accountNumber: details.accountNumber || '',
      type: details.type || 'Current',
      currency: details.currency || 'LKR',
      reason: '',
    });
    this.form.markAsPristine();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.emit('Please check the form for invalid inputs.');
      return;
    }

    const changes = this.getChangedValues();
    if (Object.keys(changes).length === 0) {
      this.error.emit('No changes detected to save.');
      return;
    }

    const reason = this.form.get('reason')?.value?.trim();
    this.save.emit({
      bankDetails: changes,
      reason: reason || undefined,
    });
  }

  private getChangedValues(): Partial<BankDetails> {
    const changes: any = {};
    const formValue = this.form.value;

    const current = this.config?.bankDetails as any || {};
    const fields = ['bankName', 'branch', 'accountName', 'accountNumber', 'type', 'currency'];

    for (const key of fields) {
      if (formValue[key] !== undefined && formValue[key] !== current[key]) {
        changes[key] = formValue[key];
      }
    }

    return changes;
  }

  resetForm(): void {
    if (this.config?.bankDetails) {
      this.populateForm(this.config.bankDetails);
    } else {
      this.form.reset({
        type: 'Current',
        currency: 'LKR',
      });
    }
  }
}
