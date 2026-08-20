import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';

interface NotificationItem {
  message: string;
  count: number;
  type: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  searchQuery = '';
  showSettings = false;
  showNotifications = false;
  showProfileModal = false;
  currentUser: any = null;

  notifications: NotificationItem[] = [];
  totalPending = 0;

  private api = 'http://127.0.0.1:3000/api';

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadNotifications();
    this.currentUser = this.authService.getCurrentUser();
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
  toggleSettings() { this.showSettings = !this.showSettings; this.showNotifications = false; }
  toggleNotifications() { this.showNotifications = !this.showNotifications; this.showSettings = false; }
  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
  manageProfile() {
    this.showProfileModal = true;
    this.showSettings = false;
  }
  closeProfileModal() {
    this.showProfileModal = false;
  }
}