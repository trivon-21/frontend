import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';

export interface ServiceRequest {
  _id: string;
  serviceRequestRef: string;
  acUnitModel: string;
  acUnitSerial: string;
  acWarrantyStatus: 'Active' | 'Expired' | 'Unknown';
  acAmcStatus: 'Active' | 'Not Active';
  serviceType: 'Repair' | 'Maintenance' | string;
  serviceTypeOther?: string;
  problemDescription: string;
  problemImageUrl: string;
  preferredDate: string | null;
  preferredTimeSlot: string;
  estimatedCharges: number;
  paymentRequired: boolean;
  paymentSlipUrl?: string;
  paymentAmount?: number;
  paymentStatus?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED' | string;
  status: 'Pending' | 'Finance Approved' | 'Finance Rejected' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface CreateServiceRequestPayload {
  acUnitModel?: string;
  acUnitSerial?: string;
  acWarrantyStatus?: string;
  acAmcStatus?: string;
  serviceType: string;
  serviceTypeOther?: string;
  problemDescription?: string;
  problemImageUrl?: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  estimatedCharges?: number;
  paymentRequired?: boolean;
  paymentSlipUrl?: string;
  paymentAmount?: number;
}

export interface ServiceChargesResponse {
  success: boolean;
  maintenanceFee: number;
  repairFee: number;
  charges: any[];
}

@Injectable({ providedIn: 'root' })
export class CustomerServiceRequestService {
  private apiUrl = `${environment.apiUrl}/customer/service-requests`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  getCharges(): Observable<ServiceChargesResponse> {
    return this.http.get<ServiceChargesResponse>(`${this.apiUrl}/charges`);
  }

  getServiceRequests(): Observable<ServiceRequest[]> {
    // Interceptor automatically adds Bearer token
    return this.http.get<ServiceRequest[]>(this.apiUrl);
  }

  getServiceRequest(id: string): Observable<ServiceRequest> {
    // Interceptor automatically adds Bearer token
    return this.http.get<ServiceRequest>(`${this.apiUrl}/${id}`);
  }

  createServiceRequest(payload: CreateServiceRequestPayload): Observable<{ message: string; serviceRequest: ServiceRequest }> {
    // Interceptor automatically adds Bearer token
    return this.http.post<{ message: string; serviceRequest: ServiceRequest }>(
      this.apiUrl,
      payload
    ).pipe(
      tap((res) => {
        this.notificationService.notifyServiceRequest(res.serviceRequest._id, 'Pending');
      })
    );
  }

  cancelServiceRequest(id: string): Observable<{ message: string }> {
    // Interceptor automatically adds Bearer token
    return this.http.post<{ message: string }>(`${this.apiUrl}/${id}/cancel`, {}).pipe(
      tap(() => {
        this.notificationService.notifyGeneral('Service Request Cancelled', 'Your service request has been cancelled');
      })
    );
  }
}
