import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardData, DashboardOrder } from '../../services/dashboard.service';
import { TrackOrderModalComponent } from '../../components/track-order-modal/track-order-modal.component';
import { RequestServiceModalComponent } from '../../components/request-service-modal/request-service-modal.component';
import { InquiryModalComponent } from '../../components/inquiry-modal/inquiry-modal.component';
import { FeedbackModalComponent } from '../../components/feedback-modal/feedback-modal.component';
import { ServiceRequestsListModalComponent } from '../../components/service-requests-list-modal/service-requests-list-modal.component';

@Component({
  selector: 'app-customer-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    TrackOrderModalComponent,
    RequestServiceModalComponent,
    InquiryModalComponent,
    FeedbackModalComponent,
    ServiceRequestsListModalComponent,
  ],
  templateUrl: './customer-dashboard-home.component.html',
  styleUrl: './customer-dashboard-home.component.css',
})
export class CustomerDashboardHomeComponent implements OnInit {
  data: DashboardData | null = null;
  loading = true;
  error: string | null = null;

  // Modals
  showTrackOrder = false;
  showRequestService = false;
  showInquiry = false;
  showInquiryList = false;
  showFeedback = false;
  showServiceRequestsList = false;

  // Which panel dropdown is open: 'sr' | 'iq' | null
  openDropdown: 'sr' | 'iq' | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (data) => { this.data = data; this.loading = false; },
      error: (err) => { this.error = err.error?.message || 'Failed to load dashboard data'; this.loading = false; }
    });
  }

  toggleDropdown(panel: 'sr' | 'iq', event: MouseEvent): void {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === panel ? null : panel;
  }

  @HostListener('document:click')
  closeDropdowns(): void {
    this.openDropdown = null;
  }

  get orders(): DashboardOrder[] {
    return this.data?.orders ?? [];
  }

  formatAmount(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  pad(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
