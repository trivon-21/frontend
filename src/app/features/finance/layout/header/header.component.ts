import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../../services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ClickOutsideDirective } from '../../../../directives/click-outside.directive';

interface NotificationItem {
  message: string;
  count: number;
  type: string;
}

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
  showSettings = false;
  showNotifications = false;
  showUserMenu = false;
  showProfileModal = false;
  currentUser: any = null;

  notifications: NotificationItem[] = [];
  totalPending = 0;

  private api = 'http://127.0.0.1:5000/api';
  private clockInterval: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadNotifications();
    this.currentUser = this.authService.getCurrentUser();
    this.clockInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  loadNotifications(): void {
    forkJoin({
      buyOnly: this.http.get<any[]>(`${this.api}/payments/pending`).pipe(catchError(() => of([]))),
      inspection: this.http.get<any[]>(`${this.api}/inspection-tickets/pending`).pipe(catchError(() => of([]))),
      invoiceQ: this.http.get<any[]>(`${this.api}/invoices/queue`).pipe(catchError(() => of([]))),
      invPayment: this.http.get<any[]>(`${this.api}/invoices/pending`).pipe(catchError(() => of([]))),
      repair: this.http.get<any[]>(`${this.api}/service-payments/pending/REPAIR`).pipe(catchError(() => of([]))),
      maintenance: this.http.get<any[]>(`${this.api}/service-payments/pending/MAINTENANCE`).pipe(catchError(() => of([]))),
      repairInvoiceQ: this.http.get<any[]>(`${this.api}/invoices/repair/queue`).pipe(catchError(() => of([]))),
      repairInvPayment: this.http.get<any[]>(`${this.api}/invoices/repair/pending`).pipe(catchError(() => of([]))),
    }).subscribe({
      next: (data) => {
        this.notifications = [];

        if (data.buyOnly.length > 0)
          this.notifications.push({
            type: 'buyonly', count: data.buyOnly.length,
            message: `${data.buyOnly.length} pending Buy Only payment(s) for approval`
          });

        if (data.inspection.length > 0)
          this.notifications.push({
            type: 'inspection', count: data.inspection.length,
            message: `${data.inspection.length} pending Inspection payment(s) for approval`
          });

        if (data.invoiceQ.length > 0)
          this.notifications.push({
            type: 'invoiceq', count: data.invoiceQ.length,
            message: `${data.invoiceQ.length} invoice(s) ready to generate`
          });

        if (data.invPayment.length > 0)
          this.notifications.push({
            type: 'invpay', count: data.invPayment.length,
            message: `${data.invPayment.length} invoice(s) pending to send to customer`
          });

        if (data.repair.length > 0)
          this.notifications.push({
            type: 'repair', count: data.repair.length,
            message: `${data.repair.length} pending Repair payment(s) for approval`
          });

        if (data.maintenance.length > 0)
          this.notifications.push({
            type: 'maintenance', count: data.maintenance.length,
            message: `${data.maintenance.length} pending Maintenance payment(s) for approval`
          });

        if (data.repairInvoiceQ.length > 0)
          this.notifications.push({
            type: 'repairinvoiceq', count: data.repairInvoiceQ.length,
            message: `${data.repairInvoiceQ.length} repair invoice(s) ready to generate`
          });

        if (data.repairInvPayment.length > 0)
          this.notifications.push({
            type: 'repairinvpay', count: data.repairInvPayment.length,
            message: `${data.repairInvPayment.length} repair invoice(s) pending to send to customer`
          });

        this.totalPending = this.notifications.reduce((s, n) => s + n.count, 0);
      },
      error: (err) => console.error(err)
    });
  }

  onSearch() { console.log('Searching:', this.searchQuery); }

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
    this.showProfileModal = true;
    this.showUserMenu = false;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}