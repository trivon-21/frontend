import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, AuthUser } from '../../../core/services/auth.service';
import { ClickOutsideDirective } from '../../../directives/click-outside.directive';

@Component({
  selector: 'app-order-success',
  standalone: true,
<<<<<<< HEAD
  imports: [CommonModule],
=======
  imports: [CommonModule, RouterModule, ClickOutsideDirective],
>>>>>>> origin/dev-new
  templateUrl: './order-success.html',
  styleUrl: './order-success.css'
})
export class OrderSuccess implements OnInit {
  orderId: string = '';
  username: string = '';
  currentUser: AuthUser | null = null;
  showDropdown: boolean = false;
  isBuyAndInstall: boolean = false;
  public router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.username = this.currentUser ? this.currentUser.fullName.split(' ')[0] : 'Customer';

    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.username = user ? user.fullName.split(' ')[0] : 'Customer';
    });

    const state = history.state;
    if (state) {
      if (state.orderId) this.orderId = state.orderId;
      if (state.isBuyAndInstall) this.isBuyAndInstall = state.isBuyAndInstall;
    }
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  logout(): void {
    this.authService.logout();
    this.showDropdown = false;
    this.router.navigate(['/']);
  }

  getDashboardUrl(): string {
    if (this.currentUser?.role === 'SUPER_ADMIN') {
      return '/super-admin';
    }
    return '/dashboard';
  }

  goToCatalog() {
    this.router.navigate(['/catalog']);
  }
}
