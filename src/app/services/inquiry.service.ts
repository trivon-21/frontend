import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

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
export class InquiryService {
  private apiUrl = 'http://localhost:5000/api/inquiries';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getInquiries(): Observable<Inquiry[]> {
    return this.http.get<Inquiry[]>(this.apiUrl, { headers: this.headers() });
  }

  getInquiry(id: string): Observable<Inquiry> {
    return this.http.get<Inquiry>(`${this.apiUrl}/${id}`, { headers: this.headers() });
  }

  createInquiry(payload: CreateInquiryPayload): Observable<{ message: string; inquiry: Inquiry }> {
    return this.http.post<{ message: string; inquiry: Inquiry }>(this.apiUrl, payload, { headers: this.headers() });
  }

  replyToInquiry(id: string, message: string): Observable<{ message: string; inquiry: Inquiry }> {
    return this.http.post<{ message: string; inquiry: Inquiry }>(
      `${this.apiUrl}/${id}/reply`,
      { message },
      { headers: this.headers() }
    );
  }
}
