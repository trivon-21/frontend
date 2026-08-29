import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ThreadMessage {
  _id?: string;
  sender: 'Customer' | 'Support';
  message: string;
  createdAt?: string;
}

export interface CustomerInquiry {
  _id: string;
  inquiryRef: string;
  customer?: {
    _id: string;
    fullName: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
  name?: string;
  email?: string;
  phone?: string;
  inquiryType: string;
  subject: string;
  message: string;
  attachmentUrl?: string;
  thread: ThreadMessage[];
  status: 'Ongoing' | 'Addressed' | 'Closed';
  createdAt: string;
  updatedAt: string;
}

export interface InquiryListResponse {
  success: boolean;
  inquiries: CustomerInquiry[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class CsaInquiryService {
  private apiUrl = `${environment.apiUrl}/csa/inquiries`;

  constructor(private http: HttpClient) {}

  getInquiries(filters: { search?: string; status?: string; page?: number; limit?: number } = {}): Observable<InquiryListResponse> {
    let params = new HttpParams();

    if (filters.search && filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.status && filters.status !== 'ALL') {
      params = params.set('status', filters.status);
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<InquiryListResponse>(this.apiUrl, { params });
  }

  replyToInquiry(inquiryId: string, replyData: { message: string; newStatus?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${inquiryId}/reply`, replyData);
  }

  updateInquiryStatus(inquiryId: string, status: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${inquiryId}/status`, { status });
  }
}
