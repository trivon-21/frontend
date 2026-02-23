import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Feedback {
  _id: string;
  feedbackFor: 'Order' | 'Installation' | 'Service' | 'AMC Service Visit';
  referenceId: string | null;
  referenceLabel: string;
  productQuality: number | null;
  technicianBehavior: number | null;
  serviceQuality: number | null;
  deliveryExperience: number | null;
  comment: string;
  imageUrl: string;
  createdAt: string;
}

export interface CreateFeedbackPayload {
  feedbackFor: string;
  referenceId?: string;
  referenceLabel?: string;
  productQuality?: number | null;
  technicianBehavior?: number | null;
  serviceQuality?: number | null;
  deliveryExperience?: number | null;
  comment?: string;
  imageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private apiUrl = 'http://localhost:5000/api/feedback';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getFeedback(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(this.apiUrl, { headers: this.headers() });
  }

  createFeedback(payload: CreateFeedbackPayload): Observable<{ message: string; feedback: Feedback }> {
    return this.http.post<{ message: string; feedback: Feedback }>(this.apiUrl, payload, { headers: this.headers() });
  }
}
