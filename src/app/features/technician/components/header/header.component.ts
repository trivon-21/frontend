import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { GlobalSearchService } from '../../services/global-search.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ClickOutsideDirective } from '../../../../directives/click-outside.directive';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ClickOutsideDirective],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  searchQuery = '';
  currentTime = new Date();
  showUserMenu = false;
  private clockInterval: any;

  constructor(
    private globalSearchService: GlobalSearchService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Update clock every second
    this.clockInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.globalSearchService.setQuery(this.searchQuery);
  }

  get userInitials(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return 'U';
    const parts = user.fullName.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  get userName(): string {
    const user = this.authService.getCurrentUser();
    return user?.fullName || 'User';
  }

  get userEmail(): string {
    const user = this.authService.getCurrentUser();
    return user?.email || '';
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }


  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
