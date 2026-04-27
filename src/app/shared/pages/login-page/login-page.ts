import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api.constants';
import { TeamSessionService, TeamSessionState } from '../../../features/service-team/services/team-session.service';

interface LoginResponse {
  success: boolean;
  data?: {
    route: string;
    teamSession: TeamSessionState | null;
  };
  error?: string;
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  email = '';
  password = '';
  showPassword = false;
  loginError = '';

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly teamSessionService: TeamSessionService
  ) {}

  login(): void {
    const normalizedEmail = this.email.trim().toLowerCase();
    const normalizedPassword = this.password.trim();
    const loginUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.AUTH_LOGIN}`;

    this.http.post<LoginResponse>(loginUrl, {
      email: normalizedEmail,
      password: normalizedPassword,
    }).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          this.loginError = response.error || 'Invalid email or password.';
          return;
        }

        if (response.data.teamSession) {
          this.teamSessionService.setSession(response.data.teamSession);
        } else {
          this.teamSessionService.clearSession();
        }

        this.loginError = '';
        this.router.navigate([response.data.route]);
      },
      error: (error) => {
        this.loginError = error?.error?.error || 'Invalid email or password.';
      }
    });
  }
}
