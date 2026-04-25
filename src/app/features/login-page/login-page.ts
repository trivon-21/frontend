import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TeamSessionService } from '../service-team/services/team-session.service';

type TeamKey = 'A' | 'B';

interface LoginCredential {
  email: string;
  password: string;
  route: string;
  teamSession?: {
    teamKey: TeamKey;
    teamName: string;
    email: string;
  };
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

  private readonly loginCredentials: LoginCredential[] = [
    {
      email: 'maintech@gmail.com',
      password: '1289',
      route: '/main-technician-dashboard',
    },
    {
      email: 'servicea@gmail.com',
      password: '1234',
      route: '/service-team-dashboard',
      teamSession: {
        teamKey: 'A',
        teamName: 'Service Team A',
        email: 'servicea@gmail.com',
      },
    },
    {
      email: 'serviceb@gmail.com',
      password: '5678',
      route: '/service-team-dashboard',
      teamSession: {
        teamKey: 'B',
        teamName: 'Service Team B',
        email: 'serviceb@gmail.com',
      },
    },
  ];

  constructor(
    private readonly router: Router,
    private readonly teamSessionService: TeamSessionService
  ) {}

  login(): void {
    const normalizedEmail = this.email.trim().toLowerCase();
    const normalizedPassword = this.password.trim();
    const matchedCredential = this.loginCredentials.find((credential) => {
      return credential.email === normalizedEmail && credential.password === normalizedPassword;
    });

    if (matchedCredential) {
      if (matchedCredential.teamSession) {
        this.teamSessionService.setSession(matchedCredential.teamSession);
      } else {
        this.teamSessionService.clearSession();
      }

      this.loginError = '';
      this.router.navigate([matchedCredential.route]);
      return;
    }

    this.loginError = 'Invalid email or password.';
  }

}
