import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, AuthUser } from '../../core/services/auth.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { SystemInfoService, SystemInfo } from '../../core/services/system-info.service';
import { roleHomeUrl } from '../../core/routing/role-home';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ClickOutsideDirective],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  currentUser: AuthUser | null = null;
  systemInfo: SystemInfo | null = null;
  showDropdown = false;
  isMobileMenuOpen = false;
  isSticky = false;
  private isTicking = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (typeof window === 'undefined') return;
    if (!this.isTicking) {
      window.requestAnimationFrame(() => {
        this.isSticky = window.scrollY > 50;
        this.isTicking = false;
      });
      this.isTicking = true;
    }
  }

  constructor(
    private authService: AuthService,
    public router: Router,
    private systemInfoService: SystemInfoService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.systemInfoService.systemInfo$.subscribe((info) => {
      this.systemInfo = info;
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  getInitials(name: string): string {
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
    return roleHomeUrl(this.currentUser?.role);
  }
}
