import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SignupPayload {
  fullName: string;
  email?: string;
  identifier?: string;
  phoneNumber?: string;
  firebaseIdToken?: string;
  firebasePhoneNumber?: string;
  password: string;
}

export interface LoginPayload {
  email?: string;
  identifier?: string;
  phoneNumber?: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthUser {
  id: string;
  fullName: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  gender?: string;
  address?: string;
  profilePhoto?: string;
  googleUid?: string;
  additionalEmails?: { _id: string; email: string; addedAt: string; verified: boolean }[];
  emailVerified?: boolean;
  phoneVerified?: boolean;
  authMethods?: string[];
  authType?: 'email' | 'phone';
  createdAt?: string;
  needsPasswordChange?: boolean;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
  sessionId?: string;
  requiringPhoneVerification?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getCurrentUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  private authOptions(): { headers: HttpHeaders } {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token || ''}`,
      }),
    };
  }

  identifyAuthType(identifier: string): 'email' | 'phone' | 'invalid' {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^0\d{9}$/;

    if (emailRegex.test(identifier)) {
      return 'email';
    }

    if (phoneRegex.test(identifier)) {
      return 'phone';
    }

    return 'invalid';
  }

  signup(payload: SignupPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, payload).pipe(
      tap((res) => this.saveSession(res.token, res.user, true))
    );
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap((res) => {
        if (!res.requiringPhoneVerification) {
          this.saveSession(res.token, res.user, payload.rememberMe !== false);
        }
      })
    );
  }

  googleAuth(payload: { idToken: string; rememberMe?: boolean }): Observable<AuthResponse> {
    const rememberMe = payload.rememberMe !== false;

    return this.http.post<AuthResponse>(`${this.apiUrl}/google`, payload).pipe(
      tap((res) => this.saveSession(res.token, res.user, rememberMe))
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password/${token}`, {
      password,
    });
  }

  verifyEmail(otp: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/verify-email`,
      { otp },
      this.authOptions()
    );
  }

  verifyPhone(otp: string, sessionId?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/verify-phone`,
      { otp, sessionId },
      this.authOptions()
    );
  }

  resendOtp(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/resend-otp`,
      {},
      this.authOptions()
    );
  }

  resendOtpPhone(sessionId?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/resend-otp-phone`,
      { sessionId },
      this.authOptions()
    );
  }

  changePasswordFirstLogin(newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/customer/profile/change-password-first-login`,
      { newPassword },
      this.authOptions()
    );
  }

  saveSession(token: string, user: AuthUser, rememberMe = true): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }
}
