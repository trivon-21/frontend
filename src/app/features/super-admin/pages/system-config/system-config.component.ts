import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemConfigService } from '../../services/system-config.service';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import {
  SystemConfig,
  BusinessRules,
  FeatureFlags,
  MaintenanceMode,
  SystemInfo,
} from '../../models/system-config.model';
import { BusinessRulesFormComponent } from './components/business-rules-form.component';
import { FeatureFlagsFormComponent } from './components/feature-flags-form.component';
import { MaintenanceFormComponent } from './components/maintenance-form.component';
import { SystemInfoFormComponent } from './components/system-info-form.component';

type Tab = 'business-rules' | 'feature-flags' | 'maintenance' | 'system-info';

@Component({
  selector: 'app-system-config',
  standalone: true,
  imports: [
    CommonModule,
    BusinessRulesFormComponent,
    FeatureFlagsFormComponent,
    MaintenanceFormComponent,
    SystemInfoFormComponent,
  ],
  template: `
    <div class="system-config-container">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">System Configuration</h1>
        </div>
      </div>

      <div class="config-content">
        <!-- Tabs Navigation -->
        <div class="tabs-navigation">
          <button
            *ngFor="let tab of tabs"
            [class.active]="activeTab === tab.id"
            (click)="switchTab(tab.id)"
            class="tab-button"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Error Message -->
        <div *ngIf="error" class="alert-banner">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{{ error }}</span>
          </div>
          <button (click)="error = null" class="close-btn">&times;</button>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Fetching platform settings...</p>
        </div>

        <!-- Tabs Content -->
        <div *ngIf="!loading" class="tabs-content">
          <!-- Business Rules Tab -->
          <section *ngIf="activeTab === 'business-rules'" class="tab-section">
            <app-business-rules-form
              [config]="config"
              [isSaving]="isSaving['business-rules']"
              (save)="saveBusinessRules($event)"
              (error)="handleError($event)"
            ></app-business-rules-form>
          </section>

          <!-- Feature Flags Tab -->
          <section *ngIf="activeTab === 'feature-flags'" class="tab-section">
            <app-feature-flags-form
              [config]="config"
              [isSaving]="isSaving['feature-flags']"
              (save)="saveFeatureFlags($event)"
              (error)="handleError($event)"
            ></app-feature-flags-form>
          </section>

          <!-- Maintenance Tab -->
          <section *ngIf="activeTab === 'maintenance'" class="tab-section">
            <app-maintenance-form
              [config]="config"
              [isSaving]="isSaving['maintenance']"
              (save)="saveMaintenanceMode($event)"
              (error)="handleError($event)"
            ></app-maintenance-form>
          </section>

          <!-- System Info Tab -->
          <section *ngIf="activeTab === 'system-info'" class="tab-section">
            <app-system-info-form
              [config]="config"
              [isSaving]="isSaving['system-info']"
              (save)="saveSystemInfo($event)"
              (error)="handleError($event)"
            ></app-system-info-form>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .system-config-container {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      /* ── Page Header ── */
      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .page-header-left {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .page-title {
        font-family: 'Inter', sans-serif;
        font-size: 26px;
        font-weight: 700;
        color: #1b2f27;
        margin: 0;
      }

      .eyebrow {
        margin: 0;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #8a9e96;
      }

      .config-content {
        display: flex;
        flex-direction: column;
      }

      .tabs-navigation {
        display: flex;
        gap: 8px;
        margin-bottom: 24px;
        border-bottom: 2px solid #f0f0ee;
        overflow-x: auto;
      }

      .tab-button {
        padding: 12px 16px;
        background: none;
        border: none;
        font-family: 'Inter', sans-serif;
        font-size: 13.5px;
        font-weight: 600;
        color: #8a9e96;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        margin-bottom: -2px;
        white-space: nowrap;
        transition: all 0.2s ease;
      }

      .tab-button:hover {
        color: #1b2f27;
      }

      .tab-button.active {
        color: var(--primary-main);
        border-bottom-color: var(--primary-main);
      }

      .alert-banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 12px 18px;
        border-radius: 12px;
        background: #fde8e8;
        color: var(--error);
        border: 1px solid rgba(214, 64, 64, 0.2);
        font-size: 13.5px;
        font-family: 'Inter', sans-serif;
        margin-bottom: 24px;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 20px;
        color: inherit;
        cursor: pointer;
        padding: 0 4px;
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: #8a9e96;
        font-family: 'Inter', sans-serif;
      }

      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(31, 91, 69, 0.15);
        border-top-color: var(--primary-main);
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
        margin-bottom: 12px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .tabs-content {
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .tab-section {
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class SystemConfigComponent implements OnInit {
  config: SystemConfig | null = null;
  loading = false;
  error: string | null = null;
  activeTab: Tab = 'business-rules';
  isSaving: { [key: string]: boolean } = {};

  tabs = [
    { id: 'business-rules' as Tab, label: 'Business Rules' },
    { id: 'feature-flags' as Tab, label: 'Feature Flags' },
    { id: 'maintenance' as Tab, label: 'Maintenance Mode' },
    { id: 'system-info' as Tab, label: 'System Info' },
  ];

  constructor(private systemConfigService: SystemConfigService, private maintenanceService: MaintenanceService) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  switchTab(tab: Tab): void {
    this.activeTab = tab;
  }

  loadConfig(): void {
    this.loading = true;
    this.error = null;

    this.systemConfigService.getSystemConfig().subscribe({
      next: (response: any) => {
        this.config = response.data;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading config:', error);
        this.error = error.error?.message || 'Failed to load configuration';
        this.loading = false;
      },
    });
  }

  saveBusinessRules(rules: Partial<BusinessRules>): void {
    this.isSaving['business-rules'] = true;
    this.error = null;

    this.systemConfigService.updateBusinessRules(rules).subscribe({
      next: (response: any) => {
        this.config = response.data;
        this.isSaving['business-rules'] = false;
      },
      error: (error: any) => {
        console.error('Error saving business rules:', error);
        this.error = error.error?.message || 'Failed to save business rules';
        this.isSaving['business-rules'] = false;
      },
    });
  }

  saveFeatureFlags(flags: Partial<FeatureFlags>): void {
    this.isSaving['feature-flags'] = true;
    this.error = null;

    this.systemConfigService.updateFeatureFlags(flags).subscribe({
      next: (response: any) => {
        this.config = response.data;
        this.isSaving['feature-flags'] = false;
      },
      error: (error: any) => {
        console.error('Error saving feature flags:', error);
        this.error = error.error?.message || 'Failed to save feature flags';
        this.isSaving['feature-flags'] = false;
      },
    });
  }

  saveMaintenanceMode(mode: Partial<MaintenanceMode>): void {
    this.isSaving['maintenance'] = true;
    this.error = null;

    // Extract reason from mode object to pass separately
    const reason = mode.reason;
    const { reason: _, ...maintenanceData } = mode; // Remove reason from maintenance object

    this.systemConfigService.updateMaintenanceMode(maintenanceData, reason).subscribe({
      next: (response: any) => {
        this.config = response.data;
        this.isSaving['maintenance'] = false;
        // Refresh maintenance service to update all subscribers
        this.maintenanceService.refreshStatus();
      },
      error: (error: any) => {
        console.error('Error saving maintenance mode:', error);
        this.error = error.error?.message || 'Failed to save maintenance mode';
        this.isSaving['maintenance'] = false;
      },
    });
  }

  saveSystemInfo(info: Partial<SystemInfo>): void {
    this.isSaving['system-info'] = true;
    this.error = null;

    this.systemConfigService.updateSystemInfo(info).subscribe({
      next: (response: any) => {
        this.config = response.data;
        this.isSaving['system-info'] = false;
      },
      error: (error: any) => {
        console.error('Error saving system info:', error);
        this.error = error.error?.message || 'Failed to save system info';
        this.isSaving['system-info'] = false;
      },
    });
  }

  handleError(error: string): void {
    this.error = error;
  }
}
