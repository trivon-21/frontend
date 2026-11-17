import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  BusinessRules,
  FeatureFlags,
  MaintenanceMode,
  SystemInfo,
  BankDetails,
  SystemConfig,
  SystemConfigResponse,
} from '../models/system-config.model';

@Injectable({
  providedIn: 'root',
})
export class SystemConfigService {
  private baseUrl = '/super-admin/system-config';

  constructor(private apiService: ApiService) {}

  /**
   * Get current system configuration
   */
  getSystemConfig(): Observable<SystemConfigResponse> {
    return this.apiService.get<SystemConfigResponse>(`${this.baseUrl}`);
  }

  /**
   * Update business rules
   */
  updateBusinessRules(
    businessRules: Partial<BusinessRules>,
    reason?: string
  ): Observable<SystemConfigResponse> {
    return this.apiService.put<SystemConfigResponse>(`${this.baseUrl}/business-rules`, {
      businessRules,
      reason,
    });
  }

  /**
   * Update feature flags
   */
  updateFeatureFlags(
    featureFlags: Partial<FeatureFlags>,
    reason?: string
  ): Observable<SystemConfigResponse> {
    return this.apiService.put<SystemConfigResponse>(`${this.baseUrl}/feature-flags`, {
      featureFlags,
      reason,
    });
  }

  /**
   * Update maintenance settings
   */
  updateMaintenanceMode(
    maintenance: Partial<MaintenanceMode>,
    reason?: string
  ): Observable<SystemConfigResponse> {
    return this.apiService.put<SystemConfigResponse>(`${this.baseUrl}/maintenance`, {
      maintenance,
      reason,
    });
  }

  /**
   * Update system info
   */
  updateSystemInfo(
    systemInfo: Partial<SystemInfo>,
    reason?: string
  ): Observable<SystemConfigResponse> {
    return this.apiService.put<SystemConfigResponse>(`${this.baseUrl}/system-info`, {
      systemInfo,
      reason,
    });
  }

  /**
   * Get bank details
   */
  getBankDetails(): Observable<{ success: boolean; data: BankDetails }> {
    return this.apiService.get<{ success: boolean; data: BankDetails }>(`${this.baseUrl}/bank-details`);
  }

  /**
   * Update bank details
   */
  updateBankDetails(
    bankDetails: Partial<BankDetails>,
    reason?: string
  ): Observable<SystemConfigResponse> {
    return this.apiService.put<SystemConfigResponse>(`${this.baseUrl}/bank-details`, {
      bankDetails,
      reason,
    });
  }
}
