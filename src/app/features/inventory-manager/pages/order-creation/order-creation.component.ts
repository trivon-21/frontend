import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

interface OrderItem {
  inventoryId: string;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
  estimatedTotal: number;
  available?: number;
  reserved?: number;
}

interface OrderRequest {
  requestId: string;
  items: OrderItem[];
  supplierName: string;
  totalEstimate: number;
  status: 'draft' | 'pending-approval' | 'approved' | 'rejected';
  requestedBy: string;
  priority: 'normal' | 'urgent';
  notes: string;
  rejectionReason: string;
  approvedBy: string;
  approvedAt: string;
  rejectedAt: string;
  source: string;
  createdAt: string;
}

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  available: number;
  reserved: number;
  unitCost: number;
  unit: string;
  status: string;
  category: string;
  brand: string;
  reorderLevel: number;
}



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
  activeTab: 'pending-approval' | 'approved' | 'rejected' = 'pending-approval';
  searchQuery = '';

  // Orders data
  pendingOrders: OrderRequest[] = [];
  approvedOrders: OrderRequest[] = [];
  rejectedOrders: OrderRequest[] = [];
  draftOrders: OrderRequest[] = [];

  suggestedItems: InventoryItem[] = [];

  successMessage = '';
  errorMessage = '';

  // Detail modal
  showDetailModal = false;
  selectedOrder: OrderRequest | null = null;

  // Rejection modal
  showRejectModal = false;
  rejectionReason = '';

  constructor(
    private apiService: ApiService,
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
    this.apiService.get<OrderRequest[]>('/inventory/order-requests').subscribe({
      next: (data) => {
        this.draftOrders = data.filter(o => o.status === 'draft');
        this.pendingOrders = data.filter(o => o.status === 'pending-approval');
        this.approvedOrders = data.filter(o => o.status === 'approved');
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

  createNewOrder(): void {
    this.router.navigate(['/inventory-manager/order-creation/new']);
  }

  setActiveTab(tab: 'pending-approval' | 'approved' | 'rejected'): void {
    this.activeTab = tab;
  }

  get currentOrders(): OrderRequest[] {
    let list = this.activeTab === 'pending-approval' ? this.pendingOrders :
               this.activeTab === 'approved' ? this.approvedOrders :
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

  openDetail(order: OrderRequest): void {
    if (order.status === 'draft') {
      this.editDraft(order);
      return;
    }
    this.selectedOrder = order;
    this.showDetailModal = true;
  }

  editDraft(order: OrderRequest): void {
    this.router.navigate(['/inventory-manager/order-creation/edit', order.requestId]);
  }

  closeDetail(): void {
    this.showDetailModal = false;
    this.selectedOrder = null;
  }

  // ── Approval / Rejection (for demonstration - will be used by Finance) ──

  approveOrder(order: OrderRequest): void {
    this.apiService.patch(`/inventory/order-requests/${order.requestId}/approve`, {}).subscribe({
      next: () => {
        this.fetchOrders();
        this.loadSuggestedOrders();
        this.closeDetail();
      },
      error: (err) => console.error('Approval failed:', err)
    });
  }

  openRejectModal(order: OrderRequest): void {
    this.selectedOrder = order;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  confirmReject(): void {
    if (!this.selectedOrder || !this.rejectionReason.trim()) return;
    this.apiService.patch(`/inventory/order-requests/${this.selectedOrder.requestId}/reject`, {
      reason: this.rejectionReason
    }).subscribe({
      next: () => {
        this.fetchOrders();
        this.showRejectModal = false;
        this.closeDetail();
      },
      error: (err) => console.error('Rejection failed:', err)
    });
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectionReason = '';
  }

  // ── Helpers ──

  getStatusLabel(status: string): string {
    switch (status) {
      case 'draft': return 'Draft';
      case 'pending-approval': return 'Pending Approval';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  formatCurrency(val: number): string {
    return `LKR ${(val || 0).toLocaleString()}`;
  }
}
