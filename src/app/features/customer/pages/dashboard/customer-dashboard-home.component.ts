import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerDashboardService, DashboardData, DashboardOrder } from '../../services/customer-dashboard.service';
import { TrackOrderModalComponent } from '../../../../components/modals/track-order-modal/track-order-modal.component';
import { RequestServiceModalComponent } from '../../../../components/modals/request-service-modal/request-service-modal.component';
import { InquiryModalComponent } from '../../../../components/modals/inquiry-modal/inquiry-modal.component';
import { FeedbackModalComponent } from '../../../../components/modals/feedback-modal/feedback-modal.component';
import { ServiceRequestsListModalComponent } from '../../../../components/modals/service-requests-list-modal/service-requests-list-modal.component';

@Component({
  selector: 'app-customer-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    TrackOrderModalComponent,
    RequestServiceModalComponent,
    InquiryModalComponent,
    FeedbackModalComponent,
    ServiceRequestsListModalComponent
  ],
  templateUrl: './customer-dashboard-home.component.html',
  styleUrl: './customer-dashboard-home.component.css'
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

  // Which panel dropdown is open: 'sr' | 'iq' | 'tp' | 'ro' | 'pp' | 'rp' | 'comp' | null
  openDropdown: 'sr' | 'iq' | 'tp' | 'ro' | 'pp' | 'rp' | 'comp' | null = null;

  // Filter mode for orders
  filterMode: 'all' | 'completed' | 'pending' | 'returned' | 'rejected' | null = null;
  showFilteredOrders = false;

  constructor(private dashboardService: CustomerDashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (data) => { this.data = data; this.loading = false; },
      error: (err) => { this.error = err.error?.message || 'Failed to load dashboard data'; this.loading = false; }
    });
  }

  toggleDropdown(panel: 'sr' | 'iq' | 'tp' | 'ro' | 'pp' | 'rp' | 'comp', event: MouseEvent): void {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === panel ? null : panel;
  }

  @HostListener('document:click')
  closeDropdowns(): void {
    this.openDropdown = null;
  }

  onMenuItemClick(action: string, category: string): void {
    this.openDropdown = null;

    // Route based on specific action and category
    switch(category) {
      case 'tp': // Total Purchases
        if (action === 'view-details') {
          this.filterMode = 'all';
          this.showFilteredOrders = true;
        } else if (action === 'export') {
          console.log('Export all orders');
          // TODO: Implement export functionality
        }
        break;

      case 'ro': // Return Orders
        if (action === 'view-details') {
          this.filterMode = 'returned';
          this.showFilteredOrders = true;
        } else if (action === 'contact-support') {
          this.showInquiry = true;
        }
        break;

      case 'pp': // Pending Payment
        if (action === 'pay-now') {
          this.filterMode = 'pending';
          this.showFilteredOrders = true;
        }
        break;

      case 'rp': // Rejected Payment
        if (action === 'retry-payment') {
          this.filterMode = 'rejected';
          this.showFilteredOrders = true;
        } else if (action === 'contact-support') {
          this.showInquiry = true;
        }
        break;

      case 'comp': // Completed
        if (action === 'view-orders') {
          this.filterMode = 'completed';
          this.showFilteredOrders = true;
        } else if (action === 'leave-review') {
          console.log('Leave review');
          // TODO: Open review form
        }
        break;
    }
  }

  closeFilteredOrders(): void {
    this.showFilteredOrders = false;
    this.filterMode = null;
  }

  get orders(): DashboardOrder[] {
    return this.data?.orders ?? [];
  }

  getFilteredOrders(): DashboardOrder[] {
    if (!this.filterMode || this.filterMode === 'all') {
      return this.orders;
    }

    // Handle special cases
    if (this.filterMode === 'rejected') {
      return this.orders.filter(order => order.status === 'Rejected');
    }

    return this.orders.filter(order =>
      order.status.toLowerCase() === this.filterMode?.toLowerCase()
    );
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
