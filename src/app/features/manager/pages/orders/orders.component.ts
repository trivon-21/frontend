import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  OrdersService,
  PurchaseRequest,
  OrderSummary,
  OrderStatus,
  ReceiptAuthorization,
} from '../../services/orders.service';
import { purchaseStatusLabel } from '../../../inventory-manager/services/purchase-workflow';

interface FilterChip {
  key: string;
  label: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
  authorizationExpandedId: string | null = null;
  authorizations: ReceiptAuthorization[] = [];
  activeType: 'purchase' | 'non-po' = 'purchase';

  filters: FilterChip[] = [
    { key: 'all', label: 'All' },
    { key: 'pending-manager', label: 'Awaiting Manager' },
    { key: 'pending-finance', label: 'Awaiting Finance' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];
  activeFilter = 'all';

  constructor(private ordersService: OrdersService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const status = params.get('status');
      if (params.get('type') === 'non-po') this.activeType = 'non-po';
      if (status && this.filters.some((filter) => filter.key === status)) this.activeFilter = status;
      this.load();
      this.loadAuthorizations();
    });
  }

  loadAuthorizations(): void {
    this.ordersService.getReceiptAuthorizations().subscribe({
      next: (items) => this.authorizations = items,
      error: () => this.authorizations = [],
    });
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
    const comment = window.prompt(`Operational approval comment for ${order.requestId}:`, 'Operational need verified.');
    if (!comment?.trim()) return;
    this.decide(order, 'approved', comment.trim());
  }

  reject(order: PurchaseRequest): void {
    const reason = window.prompt(`Reason for rejecting ${order.requestId}:`, '');
    if (!reason?.trim()) return;
    this.decide(order, 'rejected', reason.trim());
  }

  private decide(order: PurchaseRequest, decision: OrderStatus & ('approved' | 'rejected'), reason = ''): void {
    this.updatingId = order._id;

    this.ordersService.decide(order, decision, reason).subscribe({
      next: (updated) => {
        this.updatingId = null;
        if (updated) this.load();
      },
      error: () => {
        this.updatingId = null;
      },
    });
  }

  statusLabel(status: OrderStatus): string {
    return purchaseStatusLabel(status);
  }

  decideAuthorization(authorization: ReceiptAuthorization, decision: 'approved' | 'rejected'): void {
    const comment = window.prompt(
      `${decision === 'approved' ? 'Approval' : 'Rejection'} comment for ${authorization.authorizationNumber}:`,
      decision === 'approved' ? 'Operational exception verified.' : '',
    );
    if (!comment?.trim()) return;
    this.updatingId = authorization._id;
    this.ordersService.decideReceiptAuthorization(authorization, decision, comment.trim()).subscribe({
      next: () => { this.updatingId = null; this.loadAuthorizations(); },
      error: () => this.updatingId = null,
    });
  }

  authorizationItem(authorization: ReceiptAuthorization): string {
    return authorization.inventoryId?.name || authorization.newItemSnapshot?.name || 'New catalog item';
  }

  formatCurrency(value: number): string {
    return 'LKR ' + (value || 0).toLocaleString('en-US');
  }
}
