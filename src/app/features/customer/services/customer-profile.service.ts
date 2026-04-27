import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService, AuthUser } from '../../../core/services/auth.service';

export interface ProfileUpdatePayload {
  fullName?: string;
  lastName?: string;
  gender?: string;
  address?: string;
  phoneNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerProfileService {
  private apiUrl = 'http://localhost:5000/api/customer/profile';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getProfile(): Observable<AuthUser> {
    // Interceptor automatically adds Bearer token
    return this.http.get<AuthUser>(this.apiUrl);
  }

  updateProfile(payload: ProfileUpdatePayload): Observable<{ message: string; user: AuthUser }> {
    // Interceptor automatically adds Bearer token
    return this.http.put<{ message: string; user: AuthUser }>(this.apiUrl, payload);
  }

  addEmail(email: string): Observable<{ message: string; additionalEmails: any[]; newEmailId: string }> {
    // Interceptor automatically adds Bearer token
    return this.http.post<{ message: string; additionalEmails: any[]; newEmailId: string }>(
      `${this.apiUrl}/emails`,
      { email }
    );
  }

  removeEmail(emailId: string): Observable<{ message: string; additionalEmails: any[] }> {
    // Interceptor automatically adds Bearer token
    return this.http.delete<{ message: string; additionalEmails: any[] }>(
      `${this.apiUrl}/emails/${emailId}`
    );
  }

  verifyAdditionalEmail(emailId: string, otp: string): Observable<{ message: string; additionalEmails: any[] }> {
    // Interceptor automatically adds Bearer token
    return this.http.post<{ message: string; additionalEmails: any[] }>(
      `${this.apiUrl}/emails/${emailId}/verify`,
      { otp }
    );
  }

  resendAdditionalEmailOtp(emailId: string): Observable<{ message: string }> {
    // Interceptor automatically adds Bearer token
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/emails/${emailId}/resend-otp`,
      {}
    );
  }

  deleteAccount(): Observable<{ message: string }> {
    // Interceptor automatically adds Bearer token
    return this.http.delete<{ message: string }>(`${this.apiUrl}/account`);
  }

  verifyEmail(otp: string): Observable<{ message: string }> {
    return this.authService.verifyEmail(otp);
  }

  resendOtp(): Observable<{ message: string }> {
    return this.authService.resendOtp();
  }

  uploadProfilePhoto(photoData: string): Observable<{ message: string; profilePhoto: string }> {
    // Interceptor automatically adds Bearer token
    return this.http.put<{ message: string; profilePhoto: string }>(
      `${this.apiUrl}/photo`,
      { profilePhoto: photoData }
    );
  }

  removeProfilePhoto(): Observable<{ message: string; profilePhoto: null }> {
    // Interceptor automatically adds Bearer token
    return this.http.delete<{ message: string; profilePhoto: null }>(
      `${this.apiUrl}/photo`
    );
  }
}
