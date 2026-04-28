import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  status: 'pending-approval' | 'approved' | 'rejected';
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

interface Supplier {
  _id: string;
  name: string;
}

@Component({
  selector: 'app-order-creation',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Form data
  showForm = false;
  inventoryItems: InventoryItem[] = [];
  filteredInventory: InventoryItem[] = [];
  suppliers: Supplier[] = [];
  suggestedItems: InventoryItem[] = [];

  // Item search
  itemSearchQuery = '';
  showItemDropdown = false;
  selectedItem: InventoryItem | null = null;

  // Current line items
  orderItems: OrderItem[] = [];
  currentQuantity = 1;

  // Form fields
  selectedSupplier = '';
  orderPriority: 'normal' | 'urgent' = 'normal';
  orderNotes = '';
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  // Detail modal
  showDetailModal = false;
  selectedOrder: OrderRequest | null = null;

  // Rejection modal
  showRejectModal = false;
  rejectionReason = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetchOrders();
    this.loadInventory();
    this.loadSuppliers();
    this.loadSuggestedOrders();
  }

  fetchOrders(): void {
    this.apiService.get<OrderRequest[]>('/inventory/order-requests').subscribe({
      next: (data) => {
        this.pendingOrders = data.filter(o => o.status === 'pending-approval');
        this.approvedOrders = data.filter(o => o.status === 'approved');
        this.rejectedOrders = data.filter(o => o.status === 'rejected');
      },
      error: (err) => console.error('Failed to load order requests:', err)
    });
  }

  loadInventory(): void {
    this.apiService.get<InventoryItem[]>('/inventory/list').subscribe({
      next: (data) => {
        this.inventoryItems = data;
        this.filteredInventory = data;
      },
      error: (err) => console.error('Failed to load inventory:', err)
    });
  }

  loadSuppliers(): void {
    this.apiService.get<Supplier[]>('/inventory/suppliers').subscribe({
      next: (data) => this.suppliers = data,
      error: (err) => console.error('Failed to load suppliers:', err)
    });
  }

  loadSuggestedOrders(): void {
    this.apiService.get<InventoryItem[]>('/inventory/suggested-orders').subscribe({
      next: (data) => this.suggestedItems = data,
      error: (err) => console.error('Failed to load suggested orders:', err)
    });
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
      list = list.filter(o =>
        o.requestId?.toLowerCase().includes(query) ||
        o.supplierName?.toLowerCase().includes(query) ||
        o.requestedBy?.toLowerCase().includes(query)
      );
    }
    return list;
  }

  // ── Item Search & Selection ──

  filterItems(): void {
    const q = (this.itemSearchQuery || '').toLowerCase().trim();
    if (!q) {
      this.filteredInventory = this.inventoryItems;
    } else {
      this.filteredInventory = this.inventoryItems.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
      );
    }
    this.showItemDropdown = true;
  }

  selectInventoryItem(item: InventoryItem): void {
    this.selectedItem = item;
    this.itemSearchQuery = item.name;
    this.currentQuantity = 1;
    this.showItemDropdown = false;
  }

  onItemInputBlur(): void {
    setTimeout(() => { this.showItemDropdown = false; }, 200);
  }

  onItemInputFocus(): void {
    this.filterItems();
  }

  addLineItem(): void {
    if (!this.selectedItem || this.currentQuantity <= 0) return;

    // Check if item already exists in order
    const existingIndex = this.orderItems.findIndex(i => i.sku === this.selectedItem!.sku);
    if (existingIndex !== -1) {
      this.orderItems[existingIndex].quantity += this.currentQuantity;
      this.orderItems[existingIndex].estimatedTotal =
        this.orderItems[existingIndex].quantity * this.orderItems[existingIndex].unitCost;
    } else {
      this.orderItems.push({
        inventoryId: this.selectedItem._id,
        name: this.selectedItem.name,
        sku: this.selectedItem.sku,
        quantity: this.currentQuantity,
        unitCost: this.selectedItem.unitCost,
        estimatedTotal: this.currentQuantity * this.selectedItem.unitCost,
        available: this.selectedItem.available,
        reserved: this.selectedItem.reserved
      });
    }

    // Reset selection
    this.selectedItem = null;
    this.itemSearchQuery = '';
    this.currentQuantity = 1;
  }

  removeLineItem(index: number): void {
    this.orderItems.splice(index, 1);
  }

  get orderTotal(): number {
    return this.orderItems.reduce((sum, item) => sum + item.estimatedTotal, 0);
  }

  // ── Suggested Orders ──

  addSuggestedItem(item: InventoryItem): void {
    this.showForm = true;
    this.selectedItem = item;
    this.itemSearchQuery = item.name;
    this.currentQuantity = Math.max(1, item.reorderLevel - item.available);
  }

  // ── Form Submission ──

  get canSubmit(): boolean {
    return this.orderItems.length > 0 && this.selectedSupplier.length > 0;
  }

  submitOrder(): void {
    if (!this.canSubmit) return;
    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = {
      items: this.orderItems.map(i => ({
        inventoryId: i.inventoryId,
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        unitCost: i.unitCost
      })),
      supplierName: this.selectedSupplier,
      priority: this.orderPriority,
      notes: this.orderNotes,
      source: 'manual'
    };

    this.apiService.post('/inventory/order-requests', payload).subscribe({
      next: (data: any) => {
        this.isSubmitting = false;
        this.successMessage = `Order ${data.requestId} submitted for approval successfully!`;
        this.resetForm();
        this.fetchOrders();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to submit order request';
      }
    });
  }

  resetForm(): void {
    this.orderItems = [];
    this.selectedSupplier = '';
    this.orderPriority = 'normal';
    this.orderNotes = '';
    this.selectedItem = null;
    this.itemSearchQuery = '';
    this.currentQuantity = 1;
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.successMessage = '';
      this.errorMessage = '';
    }
  }

  // ── Detail Modal ──

  openDetail(order: OrderRequest): void {
    this.selectedOrder = order;
    this.showDetailModal = true;
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
