import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService, AuthUser } from './auth.service';

export interface ProfileUpdatePayload {
  fullName?: string;
  lastName?: string;
  gender?: string;
  address?: string;
  phoneNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private apiUrl = 'http://localhost:5000/api/user/profile';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(this.apiUrl, { headers: this.headers() });
  }

  updateProfile(payload: ProfileUpdatePayload): Observable<{ message: string; user: AuthUser }> {
    return this.http.put<{ message: string; user: AuthUser }>(this.apiUrl, payload, {
      headers: this.headers()
    });
  }

  addEmail(email: string): Observable<{ message: string; additionalEmails: any[] }> {
    return this.http.post<{ message: string; additionalEmails: any[] }>(
      `${this.apiUrl}/emails`,
      { email },
      { headers: this.headers() }
    );
  }

  removeEmail(emailId: string): Observable<{ message: string; additionalEmails: any[] }> {
    return this.http.delete<{ message: string; additionalEmails: any[] }>(
      `${this.apiUrl}/emails/${emailId}`,
      { headers: this.headers() }
    );
  }

  deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/account`, {
      headers: this.headers()
    });
  }
}
