import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

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
export class ServiceRequestService {
  private apiUrl = 'http://localhost:5000/api/service-requests';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getServiceRequests(): Observable<ServiceRequest[]> {
    return this.http.get<ServiceRequest[]>(this.apiUrl, { headers: this.headers() });
  }

  getServiceRequest(id: string): Observable<ServiceRequest> {
    return this.http.get<ServiceRequest>(`${this.apiUrl}/${id}`, { headers: this.headers() });
  }

  createServiceRequest(payload: CreateServiceRequestPayload): Observable<{ message: string; serviceRequest: ServiceRequest }> {
    return this.http.post<{ message: string; serviceRequest: ServiceRequest }>(
      this.apiUrl,
      payload,
      { headers: this.headers() }
    );
  }

  cancelServiceRequest(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${id}/cancel`, {}, { headers: this.headers() });
  }
}
