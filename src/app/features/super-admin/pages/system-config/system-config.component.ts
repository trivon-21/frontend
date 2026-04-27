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
  AuditLogResponse,
} from '../../models/system-config.model';
import { BusinessRulesFormComponent } from './components/business-rules-form.component';
import { FeatureFlagsFormComponent } from './components/feature-flags-form.component';
import { MaintenanceFormComponent } from './components/maintenance-form.component';
import { SystemInfoFormComponent } from './components/system-info-form.component';
import { AuditTrailTableComponent } from './components/audit-trail-table.component';

type Tab = 'business-rules' | 'feature-flags' | 'maintenance' | 'system-info' | 'audit-logs';

@Component({
  selector: 'app-system-config',
  standalone: true,
  imports: [
    CommonModule,
    BusinessRulesFormComponent,
    FeatureFlagsFormComponent,
    MaintenanceFormComponent,
    SystemInfoFormComponent,
    AuditTrailTableComponent,
  ],
  template: `
    <div class="system-config-container">
      <div class="config-header">
        <h1>System Configuration</h1>
        <p class="subtitle">Manage platform settings, features, and maintenance mode</p>
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
        <div *ngIf="error" class="alert alert-error">
          <span>{{ error }}</span>
          <button (click)="error = null" class="close-btn">&times;</button>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading configuration...</p>
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

          <!-- Audit Trail Tab -->
          <section *ngIf="activeTab === 'audit-logs'" class="tab-section">
            <app-audit-trail-table
              [auditLogs]="auditLogs"
              [totalPages]="auditPages"
              [currentPage]="auditCurrentPage"
              [loading]="auditLoading"
              (pageChange)="onAuditPageChange($event)"
            ></app-audit-trail-table>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .system-config-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 30px 20px;
      }

      .config-header {
        margin-bottom: 30px;
      }

      .config-header h1 {
        font-size: 28px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 8px 0;
      }

      .subtitle {
        font-size: 14px;
        color: #666;
        margin: 0;
      }

      .tabs-navigation {
        display: flex;
        gap: 10px;
        margin-bottom: 30px;
        border-bottom: 2px solid #e0e0e0;
        overflow-x: auto;
      }

      .tab-button {
        padding: 12px 20px;
        background: none;
        border: none;
        font-size: 14px;
        font-weight: 500;
        color: #666;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        margin-bottom: -2px;
        white-space: nowrap;
        transition: all 0.3s ease;
      }

      .tab-button:hover {
        color: #1a1a1a;
      }

      .tab-button.active {
        color: #0066cc;
        border-bottom-color: #0066cc;
      }

      .alert {
        padding: 15px 20px;
        margin-bottom: 20px;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .alert-error {
        background-color: #fee;
        color: #c00;
        border: 1px solid #fcc;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 20px;
        color: inherit;
        cursor: pointer;
        padding: 0;
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: #666;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e0e0e0;
        border-top-color: #0066cc;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-bottom: 20px;
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
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
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

  auditLogs: any[] = [];
  auditPages = 1;
  auditCurrentPage = 1;
  auditLoading = false;

  tabs = [
    { id: 'business-rules' as Tab, label: 'Business Rules' },
    { id: 'feature-flags' as Tab, label: 'Feature Flags' },
    { id: 'maintenance' as Tab, label: 'Maintenance Mode' },
    { id: 'system-info' as Tab, label: 'System Info' },
    { id: 'audit-logs' as Tab, label: 'Audit Trail' },
  ];

  constructor(private systemConfigService: SystemConfigService, private maintenanceService: MaintenanceService) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  switchTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab === 'audit-logs' && this.auditLogs.length === 0) {
      this.loadAuditLogs();
    }
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
        this.auditLogs = []; // Clear audit logs to force reload
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
        this.auditLogs = []; // Clear audit logs to force reload
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
        this.auditLogs = []; // Clear audit logs to force reload
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
        this.auditLogs = []; // Clear audit logs to force reload
      },
      error: (error: any) => {
        console.error('Error saving system info:', error);
        this.error = error.error?.message || 'Failed to save system info';
        this.isSaving['system-info'] = false;
      },
    });
  }

  loadAuditLogs(): void {
    this.auditLoading = true;

    this.systemConfigService.getAuditLogs(this.auditCurrentPage).subscribe({
      next: (response: any) => {
        this.auditLogs = response.data.logs;
        this.auditPages = response.data.pages;
        this.auditLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading audit logs:', error);
        this.error = error.error?.message || 'Failed to load audit logs';
        this.auditLoading = false;
      },
    });
  }

  onAuditPageChange(page: number): void {
    this.auditCurrentPage = page;
    this.loadAuditLogs();
  }

  handleError(error: string): void {
    this.error = error;
  }
}
