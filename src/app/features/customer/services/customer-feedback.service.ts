import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';

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
export class CustomerFeedbackService {
  private apiUrl = `${environment.apiUrl}/customer/feedback`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  getFeedback(): Observable<Feedback[]> {
    // Interceptor automatically adds Bearer token
    return this.http.get<Feedback[]>(this.apiUrl);
  }

  createFeedback(payload: CreateFeedbackPayload): Observable<{ message: string; feedback: Feedback }> {
    // Interceptor automatically adds Bearer token
    return this.http.post<{ message: string; feedback: Feedback }>(this.apiUrl, payload).pipe(
      tap(() => {
        this.notificationService.notifyFeedback('Thank you! Your feedback has been received and helps us improve our services.');
      })
    );
  }
}
