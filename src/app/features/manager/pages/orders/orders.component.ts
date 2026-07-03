import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  OrdersService,
  PurchaseRequest,
  OrderSummary,
  OrderStatus,
} from '../../services/orders.service';

interface FilterChip {
  key: string;
  label: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent implements OnInit {
  orders: PurchaseRequest[] = [];
  summary: OrderSummary = { pending: 0, approved: 0, rejected: 0, pendingValue: 0 };
  status = 'Syncing…';
  loading = false;
  updatingId: string | null = null;
  expandedId: string | null = null;

  filters: FilterChip[] = [
    { key: 'all', label: 'All' },
    { key: 'pending-approval', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];
  activeFilter = 'all';

  constructor(private ordersService: OrdersService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.ordersService.getOrders(this.activeFilter).subscribe({
      next: (res) => {
        this.orders = res.orders;
        this.summary = res.summary;
        this.status = res.status;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  setFilter(key: string): void {
    this.activeFilter = key;
    this.load();
  }

  toggleExpand(order: PurchaseRequest): void {
    this.expandedId = this.expandedId === order._id ? null : order._id;
  }

  approve(order: PurchaseRequest): void {
    this.decide(order, 'approved');
  }

  reject(order: PurchaseRequest): void {
    const reason = window.prompt(`Reason for rejecting ${order.requestId}:`, '');
    if (reason === null) return;
    this.decide(order, 'rejected', reason.trim());
  }

  private decide(order: PurchaseRequest, decision: OrderStatus & ('approved' | 'rejected'), reason = ''): void {
    const previous = { ...order };
    order.status = decision;
    if (decision === 'rejected') order.rejectionReason = reason;
    if (decision === 'approved') order.approvedBy = 'Manager';
    this.recompute();
    this.updatingId = order._id;

    this.ordersService.decide(order._id, decision, reason).subscribe({
      next: (updated) => {
        this.updatingId = null;
        if (!updated && this.status !== 'Offline') {
          Object.assign(order, previous);
          this.recompute();
        }
      },
      error: () => {
        this.updatingId = null;
        Object.assign(order, previous);
        this.recompute();
      },
    });
  }

  private recompute(): void {
    const pending = this.orders.filter((o) => o.status === 'pending-approval');
    this.summary = {
      pending: pending.length,
      approved: this.orders.filter((o) => o.status === 'approved').length,
      rejected: this.orders.filter((o) => o.status === 'rejected').length,
      pendingValue: pending.reduce((s, o) => s + o.totalEstimate, 0),
    };
  }

  statusLabel(status: OrderStatus): string {
    if (status === 'pending-approval') return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatCurrency(value: number): string {
    return 'LKR ' + (value || 0).toLocaleString('en-US');
  }
}
