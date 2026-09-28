import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerOrderService, TrackedOrder } from '../../services/customer-order.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-orders.component.html',
  styleUrl: './customer-orders.component.css'
})
export class CustomerOrdersComponent implements OnInit {
  orders: TrackedOrder[] = [];
  searchTerm = '';
  selectedOrderStatus = 'All';
  selectedPaymentStatus = 'All';
  selectedOrderType = 'All';
  orderPage = 1;
  readonly orderPageSize = 15;
  loading = true;
  error = '';

  constructor(private orderService: CustomerOrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  get filteredOrders(): TrackedOrder[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.orders.filter((order) => {
      const matchesSearch = !search
        || order.orderRef.toLowerCase().includes(search)
        || order.itemName.toLowerCase().includes(search);
      const matchesOrderStatus = this.selectedOrderStatus === 'All'
        || order.orderStatus === this.selectedOrderStatus;
      const matchesPaymentStatus = this.selectedPaymentStatus === 'All'
        || order.paymentStatus === this.selectedPaymentStatus;
      const matchesOrderType = this.selectedOrderType === 'All'
        || order.orderType === this.selectedOrderType;

      return matchesSearch && matchesOrderStatus && matchesPaymentStatus && matchesOrderType;
    });
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim()
      || this.selectedOrderStatus !== 'All'
      || this.selectedPaymentStatus !== 'All'
      || this.selectedOrderType !== 'All';
  }

  get orderPageCount(): number {
    return Math.max(1, Math.ceil(this.filteredOrders.length / this.orderPageSize));
  }

  get pagedOrders(): TrackedOrder[] {
    const page = this.activeOrderPage;
    const start = (page - 1) * this.orderPageSize;
    return this.filteredOrders.slice(start, start + this.orderPageSize);
  }

  get activeOrderPage(): number {
    return Math.min(this.orderPage, this.orderPageCount);
  }

  get orderPageEnd(): number {
    return Math.min(this.activeOrderPage * this.orderPageSize, this.filteredOrders.length);
  }

  goToOrderPage(page: number): void {
    this.orderPage = Math.min(Math.max(page, 1), this.orderPageCount);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedOrderStatus = 'All';
    this.selectedPaymentStatus = 'All';
    this.selectedOrderType = 'All';
    this.orderPage = 1;
  }

  loadOrders(): void {
    this.loading = true;
    this.error = '';
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load orders. Please try again.';
        this.loading = false;
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Order Placed': '#FFA500',
      'Payment Uploaded': '#1E90FF',
      'Payment Confirmed': 'var(--primary-main)',
      'Inventory Approved': 'var(--primary-main)',
      'Shipped': '#4169E1',
      'Delivered': 'var(--primary-hover)',
      'Installation Scheduled': '#FF6347',
      'Installation Completed': 'var(--primary-active)'
    };
    return colors[status] || '#666';
  }

  getPaymentStatusColor(status: string): string {
    if (status === 'Confirmed') return 'var(--primary-main)';
    if (status === 'Pending Payment') return '#FFA500';
    if (status === 'Under Review') return '#1E90FF';
    if (status === 'Rejected') return 'var(--error)';
    return '#666';
  }
}
