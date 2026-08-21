import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ClickOutsideDirective } from '../../../../directives/click-outside.directive';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentTime: string = '';
  currentDate: string = '';
  showBackButton: boolean = false;
  isDropdownOpen: boolean = false;
  userInitials: string = 'ST';
  userName: string = 'Service Team';
  userEmail: string = '';

  private clockInterval: any;
  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private location: Location,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);

    this.checkRoute(this.router.url);
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.checkRoute(event.url));

    this.loadUserInfo();
  }

  ngOnDestroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.routerSubscription) this.routerSubscription.unsubscribe();
  }

  private loadUserInfo(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.fullName || 'Service Team';
      this.userEmail = user.email || '';
      
      const nameParts = this.userName.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        this.userInitials = `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      } else if (nameParts.length === 1 && nameParts[0]) {
        this.userInitials = nameParts[0].slice(0, 2).toUpperCase();
      }
    }
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    this.currentDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  private checkRoute(url: string): void {
    // Show back button on details and history views
    this.showBackButton = url.includes('/service-details/') || url.includes('/service-history/');
  }

  goBack(): void {
    this.location.back();
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
