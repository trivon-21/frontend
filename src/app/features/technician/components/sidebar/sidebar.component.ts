import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'})
export class SidebarComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  isInspectionsRoute(): boolean {
    return (
      this.router.url.includes('/main-technician-inspections') ||
      this.router.url.includes('/main-technician-inspection-details') ||
      this.router.url.includes('/main-technician-inspection-review')
    );
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
