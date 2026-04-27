import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  BusinessRules,
  FeatureFlags,
  MaintenanceMode,
  SystemInfo,
  SystemConfig,
  AuditLogResponse,
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
   * Get audit logs for system configuration
   */
  getAuditLogs(
    page: number = 1,
    limit: number = 20
  ): Observable<{ success: boolean; data: AuditLogResponse }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.apiService.get<{ success: boolean; data: AuditLogResponse }>(
      `${this.baseUrl}/audit-logs`,
      params
    );
  }
}
