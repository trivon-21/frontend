import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SuperAdminService,
  InquiryItem,
  ServiceRequestItem,
  OrderItem
} from '../../services/super-admin.service';

@Component({
  selector: 'app-core-operations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './core-operations.component.html',
  styleUrls: ['./core-operations.component.css']
})
export class CoreOperationsComponent implements OnInit {
  // Tab navigation: 'orders' | 'service' | 'inquiries'
  activeTab: 'orders' | 'service' | 'inquiries' = 'orders';

  // Loading & notification states
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Operational Counts
  ordersCount = 0;
  serviceRequestsCount = 0;
  inquiriesCount = 0;

  pageSize = 10;

  // --- Orders State ---
  orders: OrderItem[] = [];
  orderPage = 1;
  orderTotalPages = 1;
  orderTotal = 0;
  orderSearch = '';
  orderTypeFilter = '';
  orderStatusFilter = '';
  orderPaymentStatusFilter = '';
  selectedOrder: OrderItem | null = null;
  showOrderModal = false;
  isUpdatingOrderStatus = false;
  orderEditStatus = '';
  orderEditPaymentStatus = '';

  // --- Service Requests State ---
  serviceRequests: ServiceRequestItem[] = [];
  servicePage = 1;
  serviceTotalPages = 1;
  serviceTotal = 0;
  serviceSearch = '';
  serviceTypeFilter = '';
  serviceStatusFilter = '';
  selectedServiceRequest: ServiceRequestItem | null = null;
  showServiceModal = false;
  isUpdatingServiceStatus = false;

  // --- Inquiries State ---
  inquiries: InquiryItem[] = [];
  inquiryPage = 1;
  inquiryTotalPages = 1;
  inquiryTotal = 0;
  inquirySearch = '';
  inquiryTypeFilter = '';
  inquiryStatusFilter = '';
  selectedInquiry: InquiryItem | null = null;
  showInquiryModal = false;
  replyMessage = '';
  isSendingReply = false;
  isUpdatingInquiryStatus = false;

  constructor(private superAdminService: SuperAdminService) {}

  ngOnInit(): void {
    this.loadCounts();
    this.loadCurrentTabData();
  }

  loadCounts(): void {
    this.superAdminService.getDashboardSummary().subscribe({
      next: (response) => {
        if (response?.data?.operations) {
          this.ordersCount = response.data.operations.totalOrders || 0;
          this.serviceRequestsCount = response.data.operations.totalServiceRequests || 0;
          this.inquiriesCount = response.data.operations.totalInquiries || 0;
        }
      },
      error: (err) => console.error('Failed to load summary counts', err)
    });
  }

  switchTab(tab: 'orders' | 'service' | 'inquiries'): void {
    this.activeTab = tab;
    this.error = null;
    this.successMessage = null;
    this.loadCurrentTabData();
  }

  refreshCurrentTab(): void {
    this.loadCounts();
    this.loadCurrentTabData();
  }

  loadCurrentTabData(): void {
    if (this.activeTab === 'orders') {
      this.loadOrders();
    } else if (this.activeTab === 'service') {
      this.loadServiceRequests();
    } else if (this.activeTab === 'inquiries') {
      this.loadInquiries();
    }
  }

  // ----------------------------------------------------
  // ORDERS
  // ----------------------------------------------------
  loadOrders(): void {
    this.loading = true;
    this.error = null;
    const filters: any = {};
    if (this.orderTypeFilter) filters.orderType = this.orderTypeFilter;
    if (this.orderStatusFilter) filters.status = this.orderStatusFilter;
    if (this.orderPaymentStatusFilter) filters.paymentStatus = this.orderPaymentStatusFilter;
    if (this.orderSearch) filters.search = this.orderSearch;

    this.superAdminService.listOrders(this.orderPage, this.pageSize, filters).subscribe({
      next: (res) => {
        this.orders = res.data || [];
        this.orderTotal = res.pagination?.total || 0;
        this.orderTotalPages = res.pagination?.pages || 1;
        this.ordersCount = res.pagination?.total || 0;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load orders';
        this.loading = false;
      }
    });
  }

  applyOrderFilters(): void {
    this.orderPage = 1;
    this.loadOrders();
  }

  clearOrderFilters(): void {
    this.orderSearch = '';
    this.orderTypeFilter = '';
    this.orderStatusFilter = '';
    this.orderPaymentStatusFilter = '';
    this.orderPage = 1;
    this.loadOrders();
  }

  openOrderModal(order: OrderItem): void {
    this.selectedOrder = order;
    this.orderEditStatus = order.status;
    this.orderEditPaymentStatus = order.paymentStatus;
    this.showOrderModal = true;
  }

  closeOrderModal(): void {
    this.selectedOrder = null;
    this.showOrderModal = false;
  }

  saveOrderStatus(): void {
    if (!this.selectedOrder) return;
    this.isUpdatingOrderStatus = true;
    this.superAdminService
      .updateOrderStatus(this.selectedOrder._id, {
        status: this.orderEditStatus,
        paymentStatus: this.orderEditPaymentStatus
      })
      .subscribe({
        next: (res) => {
          this.isUpdatingOrderStatus = false;
          if (this.selectedOrder) {
            this.selectedOrder.status = res.data.status;
            this.selectedOrder.paymentStatus = res.data.paymentStatus;
          }
          this.showSuccess('Order updated successfully');
          this.loadOrders();
        },
        error: (err) => {
          this.isUpdatingOrderStatus = false;
          this.error = err.error?.message || 'Failed to update order status';
        }
      });
  }

  // ----------------------------------------------------
  // SERVICE REQUESTS
  // ----------------------------------------------------
  loadServiceRequests(): void {
    this.loading = true;
    this.error = null;
    const filters: any = {};
    if (this.serviceTypeFilter) filters.serviceType = this.serviceTypeFilter;
    if (this.serviceStatusFilter) filters.status = this.serviceStatusFilter;
    if (this.serviceSearch) filters.search = this.serviceSearch;

    this.superAdminService.listServiceRequests(this.servicePage, this.pageSize, filters).subscribe({
      next: (res) => {
        this.serviceRequests = res.data || [];
        this.serviceTotal = res.pagination?.total || 0;
        this.serviceTotalPages = res.pagination?.pages || 1;
        this.serviceRequestsCount = res.pagination?.total || 0;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load service requests';
        this.loading = false;
      }
    });
  }

  applyServiceFilters(): void {
    this.servicePage = 1;
    this.loadServiceRequests();
  }

  clearServiceFilters(): void {
    this.serviceSearch = '';
    this.serviceTypeFilter = '';
    this.serviceStatusFilter = '';
    this.servicePage = 1;
    this.loadServiceRequests();
  }

  openServiceModal(req: ServiceRequestItem): void {
    this.selectedServiceRequest = req;
    this.showServiceModal = true;
  }

  closeServiceModal(): void {
    this.selectedServiceRequest = null;
    this.showServiceModal = false;
  }

  changeServiceStatus(req: ServiceRequestItem, newStatus: string): void {
    this.isUpdatingServiceStatus = true;
    this.superAdminService.updateServiceRequestStatus(req._id, newStatus).subscribe({
      next: (res) => {
        this.isUpdatingServiceStatus = false;
        req.status = res.data.status;
        if (this.selectedServiceRequest && this.selectedServiceRequest._id === req._id) {
          this.selectedServiceRequest.status = res.data.status;
        }
        this.showSuccess('Service request status updated');
      },
      error: (err) => {
        this.isUpdatingServiceStatus = false;
        this.error = err.error?.message || 'Failed to update service request status';
      }
    });
  }

  // ----------------------------------------------------
  // INQUIRIES
  // ----------------------------------------------------
  loadInquiries(): void {
    this.loading = true;
    this.error = null;
    const filters: any = {};
    if (this.inquiryTypeFilter) filters.inquiryType = this.inquiryTypeFilter;
    if (this.inquiryStatusFilter) filters.status = this.inquiryStatusFilter;
    if (this.inquirySearch) filters.search = this.inquirySearch;

    this.superAdminService.listInquiries(this.inquiryPage, this.pageSize, filters).subscribe({
      next: (res) => {
        this.inquiries = res.data || [];
        this.inquiryTotal = res.pagination?.total || 0;
        this.inquiryTotalPages = res.pagination?.pages || 1;
        this.inquiriesCount = res.pagination?.total || 0;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load inquiries';
        this.loading = false;
      }
    });
  }

  applyInquiryFilters(): void {
    this.inquiryPage = 1;
    this.loadInquiries();
  }

  clearInquiryFilters(): void {
    this.inquirySearch = '';
    this.inquiryTypeFilter = '';
    this.inquiryStatusFilter = '';
    this.inquiryPage = 1;
    this.loadInquiries();
  }

  openInquiryModal(inq: InquiryItem): void {
    this.selectedInquiry = inq;
    this.replyMessage = '';
    this.showInquiryModal = true;
  }

  closeInquiryModal(): void {
    this.selectedInquiry = null;
    this.replyMessage = '';
    this.showInquiryModal = false;
  }

  sendInquiryReply(): void {
    if (!this.selectedInquiry || !this.replyMessage.trim()) return;
    this.isSendingReply = true;
    this.superAdminService.replyInquiry(this.selectedInquiry._id, this.replyMessage.trim()).subscribe({
      next: (res) => {
        this.isSendingReply = false;
        this.selectedInquiry = res.data;
        this.replyMessage = '';
        this.showSuccess('Reply sent successfully');
        this.loadInquiries();
      },
      error: (err) => {
        this.isSendingReply = false;
        this.error = err.error?.message || 'Failed to send reply';
      }
    });
  }

  changeInquiryStatus(inquiry: InquiryItem, newStatus: string): void {
    this.isUpdatingInquiryStatus = true;
    this.superAdminService.updateInquiryStatus(inquiry._id, newStatus).subscribe({
      next: (res) => {
        this.isUpdatingInquiryStatus = false;
        inquiry.status = res.data.status;
        if (this.selectedInquiry && this.selectedInquiry._id === inquiry._id) {
          this.selectedInquiry.status = res.data.status;
        }
        this.showSuccess('Inquiry status updated');
      },
      error: (err) => {
        this.isUpdatingInquiryStatus = false;
        this.error = err.error?.message || 'Failed to update status';
      }
    });
  }

  // ----------------------------------------------------
  // Helpers
  // ----------------------------------------------------
  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      if (this.successMessage === msg) {
        this.successMessage = null;
      }
    }, 4000);
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'pending payment':
      case 'pending review':
        return 'status-pending';
      case 'ongoing':
      case 'assigned':
      case 'in progress':
      case 'under review':
      case 'under review (finance)':
      case 'order placed':
      case 'shipped':
        return 'status-inprogress';
      case 'addressed':
      case 'completed':
      case 'approved':
      case 'active':
      case 'confirmed':
      case 'delivered':
        return 'status-active';
      case 'closed':
      case 'rejected':
      case 'cancelled':
      case 'returned':
        return 'status-inactive';
      default:
        return 'status-default';
    }
  }

  getOrderTotal(order: OrderItem): number {
    return order.total || order.amount || 0;
  }
}
