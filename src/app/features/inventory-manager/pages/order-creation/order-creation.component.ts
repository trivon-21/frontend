import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { InventoryItem, supplierNameOf } from '../../services/inventory-domain';
import { PurchaseRequest, PurchaseStatus, purchaseStatusLabel } from '../../services/purchase-workflow';
import { OrderCreationService } from '../../services/order-creation.service';
import { forkJoin } from 'rxjs';

import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';

@Component({
  selector: 'app-order-creation',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconsModule],
  templateUrl: './order-creation.component.html',
  styleUrls: ['./order-creation.component.css']
})
export class OrderCreationComponent implements OnInit {
  // Tab state
  activeTab: 'pending-manager' | 'pending-finance' | 'approved' | 'receiving' | 'received' | 'rejected' = 'pending-manager';
  searchQuery = '';

  // Orders data
  pendingManagerOrders: PurchaseRequest[] = [];
  pendingFinanceOrders: PurchaseRequest[] = [];
  approvedOrders: PurchaseRequest[] = [];
  rejectedOrders: PurchaseRequest[] = [];
  draftOrders: PurchaseRequest[] = [];
  receivingOrders: PurchaseRequest[] = [];
  receivedOrders: PurchaseRequest[] = [];

  suggestedItems: InventoryItem[] = [];

  successMessage = '';
  errorMessage = '';
  loading = true;
  loadError = '';
  issuing = false;
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
      if (requestedStatus === 'pending-manager' || requestedStatus === 'pending-finance'
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

  setActiveTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
  }

  get currentOrders(): PurchaseRequest[] {
    let list = this.activeTab === 'pending-manager' ? this.pendingManagerOrders :
               this.activeTab === 'pending-finance' ? this.pendingFinanceOrders :
               this.activeTab === 'approved' ? this.approvedOrders :
               this.activeTab === 'receiving' ? this.receivingOrders :
               this.activeTab === 'received' ? this.receivedOrders :
               this.rejectedOrders;

    const query = (this.searchQuery || '').toLowerCase().trim();
    if (query) {
      list = list.filter(o => o && (
        (o.requestId?.toLowerCase() || '').includes(query) ||
        (o.supplierName?.toLowerCase() || '').includes(query) ||
        (o.requestedBy?.toLowerCase() || '').includes(query)
      ));
    }
    return list;
  }

  // ── Detail Modal ──

  openDetail(order: PurchaseRequest): void {
    if (order.status === 'draft') {
      this.editDraft(order);
      return;
    }
    this.dialogTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.selectedOrder = order;
    this.showDetailModal = true;
  }

  editDraft(order: PurchaseRequest): void {
    this.router.navigate(['/inventory-manager/order-creation/edit', order.requestId]);
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

  getStatusLabel(status: PurchaseStatus | typeof this.activeTab): string {
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
    this.draftOrders = data.filter(o => o.status === 'draft');
    this.pendingManagerOrders = data.filter(o => o.status === 'pending-manager');
    this.pendingFinanceOrders = data.filter(o => o.status === 'pending-finance');
    this.approvedOrders = data.filter(o => o.status === 'approved');
    this.receivingOrders = data.filter(o => ['ordered', 'partially-received'].includes(o.status));
    this.receivedOrders = data.filter(o => o.status === 'received');
    this.rejectedOrders = data.filter(o => o.status === 'rejected');
  }
}
