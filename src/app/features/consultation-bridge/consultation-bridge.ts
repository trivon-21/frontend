import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, AuthUser } from '../../core/services/auth.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-consultation-bridge',
  standalone: true,
  imports: [CommonModule, RouterModule, ClickOutsideDirective, FooterComponent],
  templateUrl: './consultation-bridge.html',
  styleUrl: './consultation-bridge.css'
})
export class ConsultationBridge implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  
  productId: string | null = null;
  productName: string = '';
  username: string = 'Customer';
  currentUser: AuthUser | null = null;
  showDropdown = false;

  // Login required modal
  showLoginPromptModal = false;
  loginModalMessage = 'You need to be logged into your account before adding items to your cart.';
  modalReturnUrl = '';

  constructor() {
    const user = this.authService.getCurrentUser();
    this.currentUser = user;
    this.username = user ? user.fullName.split(' ')[0] : 'Customer';
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.username = user ? user.fullName.split(' ')[0] : 'Customer';
    });

    const state = history.state;
    if (state && state.productId) {
      this.productId = state.productId;
      this.productName = state.productName || 'the selected AC';
    }
  }

  onCartNavClick(event?: Event) {
    if (event) event.preventDefault();
    if (!this.authService.isLoggedIn()) {
      this.loginModalMessage = 'You need to be logged into your account to view your shopping cart.';
      this.modalReturnUrl = '/cart';
      this.showLoginPromptModal = true;
    } else {
      this.router.navigate(['/cart']);
    }
  }

  closeLoginPromptModal() {
    this.showLoginPromptModal = false;
  }

  goToLoginFromModal() {
    this.showLoginPromptModal = false;
    const returnUrl = this.modalReturnUrl || this.router.url;
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
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

  onNowIKnow() {
    if (this.productId) {
      localStorage.setItem('consultationCompleted', 'true');
      this.router.navigate(['/product-detail'], { 
        queryParams: { id: this.productId },
        state: { autoKnow: true }
      });
    } else {
      this.router.navigate(['/']);
    }
  }

  onBackToCatalog() {
    localStorage.removeItem('consultationCompleted');
    this.router.navigate(['/catalog']);
  }
}
