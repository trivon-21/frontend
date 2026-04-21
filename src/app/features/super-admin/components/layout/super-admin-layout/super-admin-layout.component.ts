import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { ClickOutsideDirective } from '../../../../../directives/click-outside.directive';

@Component({
  selector: 'app-super-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ClickOutsideDirective],
  templateUrl: './super-admin-layout.component.html',
  styleUrls: ['./super-admin-layout.component.css'],
})
export class SuperAdminLayoutComponent implements OnInit {
  showUserMenu = false;
  userName = '';
  userEmail = '';
  userInitials = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.fullName || '';
      this.userEmail = user.email || '';
      this.userInitials = this.getInitials(user.fullName || '');
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
