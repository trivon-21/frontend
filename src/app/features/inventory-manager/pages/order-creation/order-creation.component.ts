import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { InventoryItem, supplierNameOf } from '../../services/inventory-domain';
import { PurchaseRequest, PurchaseStatus, purchaseStatusLabel, canonicalPurchaseStatus } from '../../services/purchase-workflow';
import { OrderCreationService } from '../../services/order-creation.service';
import { forkJoin } from 'rxjs';

import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';

export type OrderTab = 'all' | 'draft' | 'pending-manager' | 'pending-finance' | 'approved' | 'receiving' | 'received' | 'rejected';

@Component({
  selector: 'app-order-creation',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconsModule],
  templateUrl: './order-creation.component.html',
  styleUrls: ['./order-creation.component.css']
})
export class OrderCreationComponent implements OnInit {
  // Tab state
  activeTab: OrderTab = 'all';
  searchQuery = '';

  // Orders data
  allOrders: PurchaseRequest[] = [];
  draftOrders: PurchaseRequest[] = [];
  pendingManagerOrders: PurchaseRequest[] = [];
  pendingFinanceOrders: PurchaseRequest[] = [];
  approvedOrders: PurchaseRequest[] = [];
  receivingOrders: PurchaseRequest[] = [];
  receivedOrders: PurchaseRequest[] = [];
  rejectedOrders: PurchaseRequest[] = [];

  suggestedItems: InventoryItem[] = [];

  successMessage = '';
  errorMessage = '';
  loading = true;
  loadError = '';
  issuing = false;
  submittingDraftId = '';
  private dialogTrigger: HTMLElement | null = null;

  // Detail modal
  showDetailModal = false;
  selectedOrder: PurchaseRequest | null = null;

  constructor(
    private apiService: ApiService,
    private orderService: OrderCreationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadData();

    // Check for success message from new order page
    this.route.queryParams.subscribe(params => {
      if (params['success']) {
        this.successMessage = params['success'];
        setTimeout(() => this.successMessage = '', 5000);
      }
      const requestedStatus = params['status'];
      if (requestedStatus === 'all' || requestedStatus === 'draft'
        || requestedStatus === 'pending-manager' || requestedStatus === 'pending-finance'
        || requestedStatus === 'approved' || requestedStatus === 'received'
        || requestedStatus === 'rejected') {
        this.activeTab = requestedStatus;
      } else if (requestedStatus === 'ordered' || requestedStatus === 'partially-received') {
        this.activeTab = 'receiving';
      }
    });
  }

  loadData(): void {
    this.loading = true;
    this.loadError = '';
    forkJoin({
      orders: this.apiService.get<PurchaseRequest[]>('/inventory/order-requests'),
      suggestedItems: this.apiService.get<InventoryItem[]>('/inventory/suggested-orders'),
    }).subscribe({
      next: ({ orders, suggestedItems }) => {
        this.applyOrders(orders);
        this.suggestedItems = suggestedItems;
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Orders and reorder suggestions could not be loaded. No partial data has been shown.';
        this.loading = false;
      },
    });
  }

  addSuggestedItem(item: InventoryItem): void {
    this.router.navigate(['/inventory-manager/order-creation/new'], {
      state: { suggestedItem: item }
    });
  }

  supplierName(item: InventoryItem): string {
    return supplierNameOf(item) || 'No preferred supplier';
  }

  createNewOrder(): void {
    this.router.navigate(['/inventory-manager/order-creation/new']);
  }

  setActiveTab(tab: OrderTab): void {
    this.activeTab = tab;
  }

  get currentOrders(): PurchaseRequest[] {
    let list: PurchaseRequest[];
    switch (this.activeTab) {
      case 'all':
        list = this.allOrders;
        break;
      case 'draft':
        list = this.draftOrders;
        break;
      case 'pending-manager':
        list = this.pendingManagerOrders;
        break;
      case 'pending-finance':
        list = this.pendingFinanceOrders;
        break;
      case 'approved':
        list = this.approvedOrders;
        break;
      case 'receiving':
        list = this.receivingOrders;
        break;
      case 'received':
        list = this.receivedOrders;
        break;
      case 'rejected':
        list = this.rejectedOrders;
        break;
      default:
        list = this.allOrders;
    }

    const query = (this.searchQuery || '').toLowerCase().trim();
    if (query) {
      list = list.filter(o => o && (
        (o.requestId?.toLowerCase() || '').includes(query) ||
        (o.supplierName?.toLowerCase() || '').includes(query) ||
        (o.requestedBy?.toLowerCase() || '').includes(query) ||
        (o.status?.toLowerCase() || '').includes(query) ||
        (this.getStatusLabel(o.status)?.toLowerCase() || '').includes(query)
      ));
    }
    return list;
  }

  // ── Detail Modal ──

  openDetail(order: PurchaseRequest): void {
    this.dialogTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.selectedOrder = order;
    this.showDetailModal = true;
  }

  editDraft(order: PurchaseRequest): void {
    this.router.navigate(['/inventory-manager/order-creation/edit', order.requestId]);
  }

  submitDraft(order: PurchaseRequest, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.submittingDraftId) return;
    this.submittingDraftId = order.requestId;
    this.errorMessage = '';

    this.orderService.submitForManager(order).subscribe({
      next: () => {
        this.submittingDraftId = '';
        this.successMessage = `Order ${order.requestId} submitted for manager review!`;
        setTimeout(() => this.successMessage = '', 5000);
        this.loadData();
        if (this.selectedOrder?.requestId === order.requestId) {
          this.closeDetail();
        }
      },
      error: (err) => {
        this.submittingDraftId = '';
        this.errorMessage = err.error?.message || 'Failed to submit draft order.';
      }
    });
  }

  closeDetail(): void {
    if (this.issuing) return;
    this.showDetailModal = false;
    this.selectedOrder = null;
    const trigger = this.dialogTrigger;
    this.dialogTrigger = null;
    setTimeout(() => trigger?.focus());
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeDetail(); }

  issuePurchaseOrder(order: PurchaseRequest): void {
    if (this.issuing) return;
    this.issuing = true;
    this.errorMessage = '';
    this.orderService.issuePurchaseOrder(order).subscribe({
      next: () => {
        this.issuing = false;
        this.loadData();
        this.selectedOrder = null;
        this.showDetailModal = false;
      },
      error: (err) => {
        this.issuing = false;
        this.errorMessage = err.error?.message || 'Failed to issue purchase order';
      },
    });
  }

  // ── Helpers ──

  getStatusLabel(status: PurchaseStatus | OrderTab | string): string {
    if (status === 'all') return 'All';
    if (status === 'draft') return 'Draft';
    if (status === 'pending-manager') return 'Awaiting Manager';
    if (status === 'pending-finance') return 'Awaiting Finance Approval';
    if (status === 'receiving') return 'Ordered / Receiving';
    return purchaseStatusLabel(status as PurchaseStatus);
  }

  formatDate(dateStr?: string | Date): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  formatCurrency(val: number): string {
    return `LKR ${(val || 0).toLocaleString()}`;
  }

  private applyOrders(data: PurchaseRequest[]): void {
    const normalized = (data || []).map(o => ({
      ...o,
      status: canonicalPurchaseStatus(o.status)
    }));
    this.allOrders = normalized;
    this.draftOrders = normalized.filter(o => o.status === 'draft');
    this.pendingManagerOrders = normalized.filter(o => o.status === 'pending-manager');
    this.pendingFinanceOrders = normalized.filter(o => o.status === 'pending-finance');
    this.approvedOrders = normalized.filter(o => o.status === 'approved');
    this.receivingOrders = normalized.filter(o => ['ordered', 'partially-received'].includes(o.status));
    this.receivedOrders = normalized.filter(o => o.status === 'received');
    this.rejectedOrders = normalized.filter(o => o.status === 'rejected');
  }
}
