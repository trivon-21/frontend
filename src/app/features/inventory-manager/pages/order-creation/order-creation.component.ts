import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { InventoryItem, supplierNameOf } from '../../services/inventory-domain';
import { PurchaseRequest, PurchaseStatus, purchaseStatusLabel } from '../../services/purchase-workflow';
import { OrderCreationService } from '../../services/order-creation.service';

import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-order-creation',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './order-creation.component.html',
  styleUrls: ['./order-creation.component.css']
})
export class OrderCreationComponent implements OnInit {
  // Tab state
  activeTab: 'pending' | 'approved' | 'receiving' | 'received' | 'rejected' = 'pending';
  searchQuery = '';

  // Orders data
  pendingOrders: PurchaseRequest[] = [];
  approvedOrders: PurchaseRequest[] = [];
  rejectedOrders: PurchaseRequest[] = [];
  draftOrders: PurchaseRequest[] = [];
  receivingOrders: PurchaseRequest[] = [];
  receivedOrders: PurchaseRequest[] = [];

  suggestedItems: InventoryItem[] = [];

  successMessage = '';
  errorMessage = '';

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
    this.fetchOrders();
    this.loadSuggestedOrders();

    // Check for success message from new order page
    this.route.queryParams.subscribe(params => {
      if (params['success']) {
        this.successMessage = params['success'];
        setTimeout(() => this.successMessage = '', 5000);
      }
    });
  }

  fetchOrders(): void {
    this.apiService.get<PurchaseRequest[]>('/inventory/purchase-requests').subscribe({
      next: (data) => {
        this.draftOrders = data.filter(o => o.status === 'draft');
        this.pendingOrders = data.filter(o => ['pending-manager', 'pending-finance'].includes(o.status));
        this.approvedOrders = data.filter(o => o.status === 'approved');
        this.receivingOrders = data.filter(o => ['ordered', 'partially-received'].includes(o.status));
        this.receivedOrders = data.filter(o => o.status === 'received');
        this.rejectedOrders = data.filter(o => o.status === 'rejected');
      },
      error: (err) => console.error('Failed to load order requests:', err)
    });
  }

  loadSuggestedOrders(): void {
    this.apiService.get<InventoryItem[]>('/inventory/suggested-orders').subscribe({
      next: (data) => this.suggestedItems = data,
      error: (err) => console.error('Failed to load suggested orders:', err)
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

  setActiveTab(tab: 'pending' | 'approved' | 'receiving' | 'received' | 'rejected'): void {
    this.activeTab = tab;
  }

  get currentOrders(): PurchaseRequest[] {
    let list = this.activeTab === 'pending' ? this.pendingOrders :
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
    this.selectedOrder = order;
    this.showDetailModal = true;
  }

  editDraft(order: PurchaseRequest): void {
    this.router.navigate(['/inventory-manager/order-creation/edit', order.requestId]);
  }

  closeDetail(): void {
    this.showDetailModal = false;
    this.selectedOrder = null;
  }

  issuePurchaseOrder(order: PurchaseRequest): void {
    this.orderService.issuePurchaseOrder(order).subscribe({
      next: () => {
        this.fetchOrders();
        this.loadSuggestedOrders();
        this.selectedOrder = null;
        this.showDetailModal = false;
      },
      error: (err) => this.errorMessage = err.error?.message || 'Failed to issue purchase order',
    });
  }

  // ── Helpers ──

  getStatusLabel(status: PurchaseStatus | typeof this.activeTab): string {
    if (status === 'pending') return 'Awaiting Approval';
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
}
