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
  serviceType: 'Repair' | 'General Service' | 'Gas Refill' | 'Installation Issue' | 'AMC Service' | 'Other';
  serviceTypeOther: string;
  problemDescription: string;
  problemImageUrl: string;
  preferredDate: string | null;
  preferredTimeSlot: string;
  estimatedCharges: number;
  paymentRequired: boolean;
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
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
}

@Injectable({ providedIn: 'root' })
export class CustomerServiceRequestService {
  private apiUrl = `${environment.apiUrl}/customer/service-requests`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

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
