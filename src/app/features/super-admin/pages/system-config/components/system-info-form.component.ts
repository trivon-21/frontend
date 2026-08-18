import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SystemConfig, SystemInfo } from '../../../models/system-config.model';

@Component({
  selector: 'app-system-info-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="system-info-section">
      <h2>System Information</h2>
      <p class="section-description">Edit platform details that appear across the system</p>

      <div *ngIf="config" class="form-container">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- System Name -->
          <div class="form-group">
            <label for="systemName">
              System Name
              <span class="required">*</span>
            </label>
            <input
              id="systemName"
              type="text"
              formControlName="systemName"
              maxlength="100"
              placeholder="e.g., AirLux"
              class="form-input"
            />
            <p class="help-text">Appears in UI headers and notifications</p>
          </div>

          <!-- Support Email -->
          <div class="form-group">
            <label for="supportEmail">
              Support Email
              <span class="required">*</span>
            </label>
            <input
              id="supportEmail"
              type="email"
              formControlName="supportEmail"
              placeholder="e.g., support@airlux.lk"
              class="form-input"
            />
            <p class="help-text">Customer support contact email</p>
          </div>

          <!-- Support Phone Number -->
          <div class="form-group">
            <label for="supportPhone">
              Support Phone Number
              <span class="required">*</span>
            </label>
            <input
              id="supportPhone"
              type="tel"
              formControlName="supportPhoneNumber"
              placeholder="e.g., +94 11 234 5678"
              class="form-input"
            />
            <p class="help-text">Customer support contact phone</p>
          </div>

          <!-- Address -->
          <div class="form-group">
            <label for="address">
              Office Address
              <span class="required">*</span>
            </label>
            <textarea
              id="address"
              formControlName="address"
              placeholder="e.g., 123 Galle Road, Colombo 03, Sri Lanka"
              class="form-input"
              rows="3"
            ></textarea>
            <p class="help-text">Physical business/support center address</p>
          </div>

          <!-- Preview -->
          <div class="preview-section">
            <h3>Preview</h3>
            <p class="preview-text">
              This is how the information will appear in footers and notifications:
            </p>
            <div class="preview-card">
              <p class="preview-line">
                <strong>{{ form.get('systemName')?.value || 'System Name' }}</strong>
              </p>
              <p class="preview-line">
                <strong>Support:</strong>
                <a href="mailto:{{ form.get('supportEmail')?.value }}">
                  {{ form.get('supportEmail')?.value || 'support@example.com' }}
                </a>
              </p>
              <p class="preview-line">
                <strong>Phone:</strong>
                <a href="tel:{{ form.get('supportPhoneNumber')?.value }}">
                  {{ form.get('supportPhoneNumber')?.value || '+94 11 000 0000' }}
                </a>
              </p>
              <p class="preview-line">
                <strong>Address:</strong>
                <span>{{ form.get('address')?.value || '123 Galle Road, Colombo 03, Sri Lanka' }}</span>
              </p>
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
      .system-info-section {
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

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin: 20px 0 12px 0;
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
        border-color: #0066cc;
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
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

      .preview-section {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
      }

      .preview-text {
        font-size: 13px;
        color: #666;
        margin: 0 0 12px 0;
      }

      .preview-card {
        padding: 20px;
        background-color: #f5f5f5;
        border-radius: 6px;
        border: 1px solid #e0e0e0;
      }

      .preview-line {
        margin: 8px 0;
        font-size: 14px;
        color: #333;
      }

      .preview-line:first-child {
        margin-top: 0;
      }

      .preview-line:last-child {
        margin-bottom: 0;
      }

      .preview-line a {
        color: #0066cc;
        text-decoration: none;
      }

      .preview-line a:hover {
        text-decoration: underline;
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
        background-color: #0066cc;
        color: #fff;
      }

      .btn-primary:hover:not(:disabled) {
        background-color: #0052a3;
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
export class SystemInfoFormComponent {
  @Input() config: SystemConfig | null = null;
  @Input() isSaving = false;
  @Output() save = new EventEmitter<Partial<SystemInfo>>();
  @Output() error = new EventEmitter<string>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      systemName: ['', [Validators.required, Validators.maxLength(100)]],
      supportEmail: ['', [Validators.required, Validators.email]],
      supportPhoneNumber: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.maxLength(300)]],
    });
  }

  ngOnChanges(): void {
    if (this.config) {
      this.form.patchValue(this.config.systemInfo);
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

  private getChangedValues(): Partial<SystemInfo> {
    const changes: any = {};
    const formValue = this.form.value;

    if (!this.config) return changes;

    const currentInfo = this.config.systemInfo as any;
    for (const key in formValue) {
      if (currentInfo[key] !== formValue[key]) {
        changes[key] = formValue[key];
      }
    }

    return changes;
  }

  resetForm(): void {
    if (this.config) {
      this.form.patchValue(this.config.systemInfo);
      this.form.markAsPristine();
    }
  }
}
