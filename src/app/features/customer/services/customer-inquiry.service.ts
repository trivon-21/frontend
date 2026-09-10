import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';

export interface ThreadMessage {
  sender: 'Customer' | 'Support';
  message: string;
  createdAt: string;
}

export interface Inquiry {
  _id: string;
  inquiryRef: string;
  name: string;
  email: string;
  phone: string;
  inquiryType: 'Product' | 'Pricing' | 'Installation' | 'Warranty' | 'AMC' | 'Other';
  subject: string;
  message: string;
  attachmentUrl: string;
  thread: ThreadMessage[];
  status: 'Ongoing' | 'Addressed' | 'Closed';
  createdAt: string;
}

export interface CreateInquiryPayload {
  name?: string;
  email?: string;
  phone?: string;
  inquiryType?: string;
  message: string;
  attachmentUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerInquiryService {
  private apiUrl = `${environment.apiUrl}/customer/inquiries`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  getInquiries(): Observable<Inquiry[]> {
    // Interceptor automatically adds Bearer token
    return this.http.get<Inquiry[]>(this.apiUrl);
  }

  getInquiry(id: string): Observable<Inquiry> {
    // Interceptor automatically adds Bearer token
    return this.http.get<Inquiry>(`${this.apiUrl}/${id}`);
  }

  createInquiry(payload: CreateInquiryPayload): Observable<{ message: string; inquiry: Inquiry }> {
    // Interceptor automatically adds Bearer token
    return this.http.post<{ message: string; inquiry: Inquiry }>(this.apiUrl, payload).pipe(
      tap((res) => {
        this.notificationService.notifyGeneral(
          'Inquiry Submitted',
          `Your inquiry has been submitted with reference ${res.inquiry.inquiryRef}`
        );
      })
    );
  }

  replyToInquiry(id: string, message: string): Observable<{ message: string; inquiry: Inquiry }> {
    // Interceptor automatically adds Bearer token
    return this.http.post<{ message: string; inquiry: Inquiry }>(
      `${this.apiUrl}/${id}/reply`,
      { message }
    ).pipe(
      tap((res) => {
        this.notificationService.notifyGeneral(
          'Reply Sent',
          'Your reply has been sent to support'
        );
      })
    );
  }
}
