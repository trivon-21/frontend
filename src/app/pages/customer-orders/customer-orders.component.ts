import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, TrackedOrder } from '../../services/order.service';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-orders.component.html',
  styleUrl: './customer-orders.component.css'
})
export class CustomerOrdersComponent implements OnInit {
  orders: TrackedOrder[] = [];
  loading = true;
  error = '';

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
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
      'Payment Confirmed': '#32CD32',
      'Inventory Approved': '#32CD32',
      'Shipped': '#4169E1',
      'Delivered': '#228B22',
      'Installation Scheduled': '#FF6347',
      'Installation Completed': '#006400'
    };
    return colors[status] || '#666';
  }

  getPaymentStatusColor(status: string): string {
    if (status === 'Confirmed') return '#228B22';
    if (status === 'Pending Payment') return '#FFA500';
    if (status === 'Under Review') return '#1E90FF';
    if (status === 'Rejected') return '#DC143C';
    return '#666';
  }
}
