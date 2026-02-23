import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardData, DashboardOrder } from '../../services/dashboard.service';
import { TrackOrderModalComponent } from '../../components/track-order-modal/track-order-modal.component';
import { RequestServiceModalComponent } from '../../components/request-service-modal/request-service-modal.component';
import { InquiryModalComponent } from '../../components/inquiry-modal/inquiry-modal.component';
import { FeedbackModalComponent } from '../../components/feedback-modal/feedback-modal.component';

@Component({
  selector: 'app-customer-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    TrackOrderModalComponent,
    RequestServiceModalComponent,
    InquiryModalComponent,
    FeedbackModalComponent,
  ],
  templateUrl: './customer-dashboard-home.component.html',
  styleUrl: './customer-dashboard-home.component.css',
})
export class CustomerDashboardHomeComponent implements OnInit {
  data: DashboardData | null = null;
  loading = true;
  error: string | null = null;

  showTrackOrder = false;
  showRequestService = false;
  showInquiry = false;
  showFeedback = false;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load dashboard data';
        this.loading = false;
      }
    });
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
