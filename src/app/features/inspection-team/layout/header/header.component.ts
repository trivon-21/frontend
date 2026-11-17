import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InspectionOfficerService } from '../../services/inspection-officer.service';
import { NotificationService } from '../../../../services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ClickOutsideDirective } from '../../../../directives/click-outside.directive';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ClickOutsideDirective],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  searchQuery = '';
  currentTime = new Date();
  pendingCount = 0;

  showSettings = false;
  showNotifications = false;
  showUserMenu = false;

  private clockInterval: any;

  constructor(
    private inspectionOfficerService: InspectionOfficerService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadScheduledInspections();
    this.clockInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  loadScheduledInspections(): void {
    this.inspectionOfficerService.getScheduledInspections().subscribe({
      next: (data) => {
        this.pendingCount = data.length;
      },
      error: (err) => console.error(err)
    });
  }

  onSearch(): void {
    console.log('Searching for:', this.searchQuery);
  }

  toggleSettings(): void {
    this.showSettings = !this.showSettings;
    this.showNotifications = false;
    this.showUserMenu = false;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showSettings = false;
    this.showUserMenu = false;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showSettings = false;
    this.showNotifications = false;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
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

  manageProfile(): void {
    this.notificationService.show('Manage Profile clicked (Demo)', 'info');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}