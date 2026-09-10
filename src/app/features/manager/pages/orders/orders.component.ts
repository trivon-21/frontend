import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
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

interface DecisionTarget {
  kind: 'purchase' | 'authorization';
  record: PurchaseRequest | ReceiptAuthorization;
  decision: 'approved' | 'rejected';
  reference: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent implements OnInit {
  @ViewChild('decisionCommentInput') decisionCommentInput?: ElementRef<HTMLTextAreaElement>;
  orders: PurchaseRequest[] = [];
  summary: OrderSummary = { pending: 0, approved: 0, rejected: 0, pendingValue: 0 };
  status = 'Syncing…';
  loading = false;
  updatingId: string | null = null;
  expandedId: string | null = null;
  authorizationExpandedId: string | null = null;
  authorizations: ReceiptAuthorization[] = [];
  activeType: 'purchase' | 'non-po' = 'purchase';
  loadError = '';
  authorizationLoadError = '';
  authorizationLoading = false;
  decisionTarget: DecisionTarget | null = null;
  decisionComment = '';
  decisionError = '';
  decisionPending = false;
  private decisionTrigger: HTMLElement | null = null;

  filters: FilterChip[] = [
    { key: 'all', label: 'All' },
    { key: 'pending-manager', label: 'Awaiting Manager' },
    { key: 'pending-finance', label: 'Awaiting Finance' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];
  activeFilter = 'all';

  constructor(private ordersService: OrdersService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const type = params.get('type') === 'non-po' ? 'non-po' : 'purchase';
      const requestedStatus = params.get('status');
      const status = requestedStatus && this.filters.some((filter) => filter.key === requestedStatus)
        ? requestedStatus
        : 'all';
      if (params.get('type') !== type || requestedStatus !== status) {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { type, status },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
        return;
      }
      this.activeType = type;
      this.activeFilter = status;
      this.load();
      this.loadAuthorizations();
    });
  }

  loadAuthorizations(): void {
    this.authorizationLoading = true;
    this.authorizationLoadError = '';
    this.ordersService.getReceiptAuthorizations().subscribe({
      next: (items) => {
        this.authorizations = items;
        this.authorizationLoading = false;
      },
      error: () => {
        this.authorizationLoadError = 'Non-PO authorizations could not be loaded.';
        this.authorizationLoading = false;
      },
    });
  }

  load(): void {
    this.loading = true;
    this.loadError = '';
    this.ordersService.getOrders(this.activeFilter).subscribe({
      next: (res) => {
        this.orders = res.orders;
        this.summary = res.summary;
        this.status = res.status;
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Purchase approvals could not be loaded. Check your connection and try again.';
        this.status = 'Offline';
        this.loading = false;
      },
    });
  }

  setFilter(key: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { type: this.activeType, status: key },
      queryParamsHandling: 'merge',
    });
  }

  setType(type: 'purchase' | 'non-po'): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { type, status: this.activeFilter },
      queryParamsHandling: 'merge',
    });
  }

  toggleExpand(order: PurchaseRequest): void {
    this.expandedId = this.expandedId === order._id ? null : order._id;
  }

  approve(order: PurchaseRequest): void {
    this.openDecision('purchase', order, 'approved', order.requestId, 'Operational need verified.');
  }

  reject(order: PurchaseRequest): void {
    this.openDecision('purchase', order, 'rejected', order.requestId);
  }

  statusLabel(status: OrderStatus): string {
    return purchaseStatusLabel(status);
  }

  decideAuthorization(authorization: ReceiptAuthorization, decision: 'approved' | 'rejected'): void {
    this.openDecision(
      'authorization', authorization, decision, authorization.authorizationNumber,
      decision === 'approved' ? 'Operational exception verified.' : '',
    );
  }

  openDecision(
    kind: DecisionTarget['kind'],
    record: PurchaseRequest | ReceiptAuthorization,
    decision: DecisionTarget['decision'],
    reference: string,
    initialComment = '',
  ): void {
    this.decisionTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.decisionTarget = { kind, record, decision, reference };
    this.decisionComment = initialComment;
    this.decisionError = '';
    setTimeout(() => this.decisionCommentInput?.nativeElement.focus());
  }

  submitDecision(): void {
    const target = this.decisionTarget;
    const comment = this.decisionComment.trim();
    if (!target || this.decisionPending) return;
    if (!comment) {
      this.decisionError = 'A comment is required before submitting this decision.';
      this.decisionCommentInput?.nativeElement.focus();
      return;
    }
    this.decisionPending = true;
    this.decisionError = '';
    this.updatingId = target.record._id;
    const request = target.kind === 'purchase'
      ? this.ordersService.decide(target.record as PurchaseRequest, target.decision, comment)
      : this.ordersService.decideReceiptAuthorization(target.record as ReceiptAuthorization, target.decision, comment);
    (request as Observable<PurchaseRequest | ReceiptAuthorization>).subscribe({
      next: () => {
        this.decisionPending = false;
        this.updatingId = null;
        const kind = target.kind;
        this.closeDecision();
        if (kind === 'purchase') this.load(); else this.loadAuthorizations();
      },
      error: (error: HttpErrorResponse) => {
        this.decisionError = error?.error?.message ||
          (error?.status === 409 ? 'This record changed while you were reviewing it. Refresh and try again.' :
            'The decision could not be saved. Your comment has been retained.');
        this.decisionPending = false;
        this.updatingId = null;
      },
    });
  }

  closeDecision(): void {
    if (this.decisionPending) return;
    this.decisionTarget = null;
    this.decisionError = '';
    const trigger = this.decisionTrigger;
    this.decisionTrigger = null;
    setTimeout(() => trigger?.focus());
  }

  onDecisionBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeDecision();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeDecision(); }

  authorizationItem(authorization: ReceiptAuthorization): string {
    return authorization.inventoryId?.name || authorization.newItemSnapshot?.name || 'New catalog item';
  }

  formatCurrency(value: number): string {
    return 'LKR ' + (value || 0).toLocaleString('en-US');
  }
}
