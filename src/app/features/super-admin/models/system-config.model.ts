export interface BusinessRules {
  quotationApprovalThreshold: number;
  logRetentionDays: number;
  paymentAutoCancelDays: number;
  defaultWarrantyMonths: number;
  amcContractMonths: number;
  maxRescheduleAttempts: number;
}

export interface FeatureFlags {
  amcModuleEnabled: boolean;
  warrantyModuleEnabled: boolean;
  preventiveMaintenanceEnabled: boolean;
  customerFeedbackEnabled: boolean;
  deliveryTrackingEnabled: boolean;
}

export interface MaintenanceMode {
  isActive: boolean;
  message: string;
  reason: string;
  startTime: Date | null;
  endTime: Date | null;
  scheduledStartTime: Date | null;
  scheduledEndTime: Date | null;
}

export interface SystemInfo {
  systemName: string;
  supportEmail: string;
  supportPhoneNumber: string;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
}

export interface SystemConfig {
  _id: string;
  businessRules: BusinessRules;
  featureFlags: FeatureFlags;
  maintenance: MaintenanceMode;
  systemInfo: SystemInfo;
  updatedBy: User | null;
  updatedAt: Date;
  createdAt: Date;
}

export interface AuditLogChange {
  fieldName: string;
  oldValue: any;
  newValue: any;
}

export interface AuditLog {
  _id: string;
  performedBy: User;
  action: string;
  entity: string;
  entityId: string;
  changes: { [key: string]: AuditLogChange };
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  pages: number;
}

export interface SystemConfigResponse {
  success: boolean;
  message?: string;
  data: SystemConfig;
}
