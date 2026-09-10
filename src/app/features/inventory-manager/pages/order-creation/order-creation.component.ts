import { Component, DestroyRef, HostListener, OnInit, Optional, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../../core/services/api.service';
import { TtlCacheService } from '../../../../core/services/ttl-cache.service';
import { InventoryItem, supplierNameOf } from '../../services/inventory-domain';
import { PurchaseRequest, PurchaseStatus, purchaseStatusLabel, canonicalPurchaseStatus } from '../../services/purchase-workflow';
import { OrderCreationService } from '../../services/order-creation.service';
import { forkJoin } from 'rxjs';

import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import { NewOrderFormComponent, NewOrderPrefill } from './new-order-form/new-order-form.component';
import { HasPendingChanges } from '../../../../core/guards/pending-changes.guard';

export type OrderTab = 'all' | 'draft' | 'pending-manager' | 'pending-finance' | 'approved' | 'receiving' | 'received' | 'rejected';

@Component({
  selector: 'app-order-creation',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconsModule, NewOrderFormComponent],
  templateUrl: './order-creation.component.html',
  styleUrls: ['./order-creation.component.css']
})
export class OrderCreationComponent implements OnInit, HasPendingChanges {
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
  refreshing = false;
  loadError = '';
  issuing = false;
  submittingDraftId = '';
  private dialogTrigger: HTMLElement | null = null;

  // Detail modal
  showDetailModal = false;
  selectedOrder: PurchaseRequest | null = null;

  // Order form modal
  showFormModal = false;
  formOrderId: string | null = null;
  formPrefill: NewOrderPrefill | null = null;

  @ViewChild(NewOrderFormComponent) orderForm?: NewOrderFormComponent;

  constructor(
    private apiService: ApiService,
    private orderService: OrderCreationService,
    private router: Router,
    private route: ActivatedRoute,
    @Optional() private ttlCache?: TtlCacheService,
    @Optional() private destroyRef?: DestroyRef
  ) {}

  ngOnInit(): void {
    this.loadData();

    // Other pages hand off order seeds through navigation state.
    const navState = history.state || {};
    if (navState.suggestedItem || Array.isArray(navState.shortageItems)) {
      this.openOrderForm({
        prefill: {
          suggestedItem: navState.suggestedItem,
          shortageItems: navState.shortageItems,
          sourceMaterialRequestId: navState.sourceMaterialRequestId,
        },
      });
    }

    // Check for success message from new order page
    let query$ = this.route.queryParams;
    if (this.destroyRef) {
      query$ = query$.pipe(takeUntilDestroyed(this.destroyRef));
    }
    query$.subscribe(params => {
      if (params['itemId'] && !this.showFormModal) {
        this.openOrderForm({ prefill: { itemId: params['itemId'] } });
      }
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

  loadData(options: { force?: boolean } = {}): void {
    const hasData = this.allOrders.length > 0 || this.suggestedItems.length > 0;
    if (!hasData) {
      this.loading = true;
    } else {
      this.refreshing = true;
    }
    this.loadError = '';

    const fetchOrders = () => this.apiService.get<PurchaseRequest[]>('/inventory/order-requests');
    const fetchSuggestions = () => this.apiService.get<InventoryItem[]>('/inventory/suggested-orders');

    const orders$ = this.ttlCache
      ? (options.force
          ? this.ttlCache.force('inventory:order-requests', 30000, fetchOrders)
          : this.ttlCache.observe('inventory:order-requests', 30000, fetchOrders))
      : fetchOrders();

    const suggested$ = this.ttlCache
      ? (options.force
          ? this.ttlCache.force('inventory:suggested-orders', 30000, fetchSuggestions)
          : this.ttlCache.observe('inventory:suggested-orders', 30000, fetchSuggestions))
      : fetchSuggestions();

    let stream$ = forkJoin({
      orders: orders$,
      suggestedItems: suggested$,
    });
    if (this.destroyRef) {
      stream$ = stream$.pipe(takeUntilDestroyed(this.destroyRef));
    }

    stream$.subscribe({
      next: ({ orders, suggestedItems }) => {
        this.applyOrders(orders);
        this.suggestedItems = suggestedItems;
        this.loading = false;
        this.refreshing = false;
      },
      error: () => {
        this.loadError = 'Orders and reorder suggestions could not be loaded. No partial data has been shown.';
        this.loading = false;
        this.refreshing = false;
      },
    });
  }

  addSuggestedItem(item: InventoryItem): void {
    this.openOrderForm({ prefill: { suggestedItem: item } });
  }

  supplierName(item: InventoryItem): string {
    return supplierNameOf(item) || 'No preferred supplier';
  }

  createNewOrder(): void {
    this.openOrderForm();
  }

  // ── Order Form Modal ──

  private openOrderForm(options: { orderId?: string; prefill?: NewOrderPrefill } = {}): void {
    this.dialogTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.showDetailModal = false;
    this.selectedOrder = null;
    this.formOrderId = options.orderId ?? null;
    this.formPrefill = options.prefill ?? null;
    this.showFormModal = true;
  }

  /** Routes the close through the form so unsaved work is confirmed first. */
  requestOrderFormClose(): void {
    if (this.orderForm) {
      this.orderForm.goBack();
    } else {
      this.onOrderFormClosed();
    }
  }

  onOrderFormClosed(): void {
    this.showFormModal = false;
    this.formOrderId = null;
    this.formPrefill = null;
    // The form can save a draft without submitting, so always re-read on close.
    this.ttlCache?.invalidate('inventory:');
    this.loadData({ force: true });
    const trigger = this.dialogTrigger;
    this.dialogTrigger = null;
    setTimeout(() => trigger?.focus());
  }

  onOrderFormSaved(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 5000);
    this.onOrderFormClosed();
  }

  onFormBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.requestOrderFormClose();
    }
  }

  /** Delegates to the open order-form modal so a router navigation (sidebar link,
   *  browser back) is confirmed the same way an explicit modal close is. */
  canDeactivate(): boolean | Promise<boolean> {
    if (!this.showFormModal || !this.orderForm) {
      return true;
    }
    return this.orderForm.canDeactivate();
  }

  setActiveTab(tab: OrderTab): void {
    this.activeTab = tab;
  }

  get currentOrders(): PurchaseRequest[] {
    let list: PurchaseRequest[];
    switch (this.activeTab) {
      case 'all':
        list = this.allOrders.filter(o => o.status !== 'draft');
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
    this.openOrderForm({ orderId: order.requestId });
  }

  submitDraft(order: PurchaseRequest, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.submittingDraftId) return;
    this.submittingDraftId = order.requestId;
    this.errorMessage = '';

    let submit$ = this.orderService.submitForManager(order);
    if (this.destroyRef) {
      submit$ = submit$.pipe(takeUntilDestroyed(this.destroyRef));
    }

    submit$.subscribe({
      next: () => {
        this.submittingDraftId = '';
        this.ttlCache?.invalidate('inventory:');
        this.successMessage = `Order ${order.requestId} submitted for manager review!`;
        setTimeout(() => this.successMessage = '', 5000);
        this.loadData({ force: true });
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
  onEscape(): void {
    if (this.showFormModal) {
      this.requestOrderFormClose();
      return;
    }
    this.closeDetail();
  }

  issuePurchaseOrder(order: PurchaseRequest): void {
    if (this.issuing) return;
    this.issuing = true;
    this.errorMessage = '';
    let issue$ = this.orderService.issuePurchaseOrder(order);
    if (this.destroyRef) {
      issue$ = issue$.pipe(takeUntilDestroyed(this.destroyRef));
    }
    issue$.subscribe({
      next: () => {
        this.issuing = false;
        this.ttlCache?.invalidate('inventory:');
        this.loadData({ force: true });
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
