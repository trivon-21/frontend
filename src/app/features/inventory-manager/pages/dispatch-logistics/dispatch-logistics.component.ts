import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';

interface DispatchItem {
  name: string;
  qty: number;
  confirmed: boolean;
  sku: string;
}

interface DispatchOrder {
  id: string;
  orderId?: string; // from backend
  customer: string;
  status: 'to-pack' | 'ready' | 'in-transit' | 'completed';
  statusVersion: number;
  type: string;
  items: DispatchItem[];
  time?: string;
  date?: string;
  courier?: string;
  trackId?: string;
  completedAt?: string;
  lastMovedAt?: string;
}

import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';

@Component({
  selector: 'app-dispatch-logistics',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconsModule],
  templateUrl: './dispatch-logistics.component.html',
  styleUrls: ['./dispatch-logistics.component.css'],
})
export class DispatchLogisticsDashboardComponent implements OnInit {
  activeTab: 'to-pack' | 'ready' | 'in-transit' | 'completed' = 'to-pack';
  searchQuery: string = '';
  showPackModal = false;
  showAssignModal = false;
  isViewingDetailsFromAssign = false;
  selectedOrderId: string | null = null;
  dialogOrder: DispatchOrder | null = null;
  loading = true;
  loadError = '';
  saving = false;
  mutationError = '';
  private dialogTrigger: HTMLElement | null = null;

  // Edit mode state
  isEditMode = false;
  editCourier = '';
  editTrackId = '';

  courierService: string = '';
  trackingId: string = '';

  sortField: 'name' | 'time' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  ordersToPack: DispatchOrder[] = [];
  ordersReady: DispatchOrder[] = [];
  ordersInTransit: DispatchOrder[] = [];
  ordersCompleted: DispatchOrder[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchOrders();
  }

  fetchOrders() {
    this.loading = true;
    this.loadError = '';
    this.apiService.get<any[]>('/inventory/orders').subscribe({
      next: (data: any[]) => {
      // Map backend model to frontend model
      const orders: DispatchOrder[] = data.map((o: any) => ({
        id: o.orderId,
        customer: o.customer,
        status: o.status,
        statusVersion: o.statusVersion ?? 0,
        type: o.type,
        items: o.items,
        time: o.date,
        courier: o.courier,
        trackId: o.trackId,
        completedAt: o.completedAt,
        lastMovedAt: o.lastMovedAt,
      }));

      this.ordersToPack = orders.filter((o: DispatchOrder) => o.status === 'to-pack');
      this.ordersReady = orders.filter((o: DispatchOrder) => o.status === 'ready');
      this.ordersInTransit = orders.filter((o: DispatchOrder) => o.status === 'in-transit');
      this.ordersCompleted = orders.filter((o: DispatchOrder) => o.status === 'completed');

      this.selectFirstOrder();
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Dispatch orders could not be loaded.';
        this.loading = false;
      },
    });
  }

  selectFirstOrder() {
    const orders = this.currentOrders;
    if (orders.length > 0) {
      this.selectedOrderId = orders[0].id;
    } else {
      this.selectedOrderId = null;
    }
  }

  selectOrder(id: string) {
    this.selectedOrderId = id;
  }

  setActiveTab(tab: 'to-pack' | 'ready' | 'in-transit' | 'completed') {
    this.activeTab = tab;
    this.selectFirstOrder();
  }

  get currentOrders() {
    let orders: any[] = [];
    if (this.activeTab === 'to-pack') orders = [...this.ordersToPack];
    else if (this.activeTab === 'ready') orders = [...this.ordersReady];
    else if (this.activeTab === 'in-transit') orders = [...this.ordersInTransit];
    else orders = [...this.ordersCompleted];

    const query = (this.searchQuery || '').toLowerCase().trim();
    if (query) {
      orders = orders.filter(
        (o) =>
          o.id?.toLowerCase().includes(query) ||
          o.customer?.toLowerCase().includes(query) ||
          o.trackId?.toLowerCase().includes(query) ||
          o.courier?.toLowerCase().includes(query),
      );
    }

    return orders.sort((a, b) => {
      const valA = this.sortField === 'name' ? a.customer : a.time;
      const valB = this.sortField === 'name' ? b.customer : b.time;

      if (this.sortDirection === 'asc') {
        return (valA || '').localeCompare(valB || '');
      } else {
        return (valB || '').localeCompare(valA || '');
      }
    });
  }

  openPackModal(id: string) {
    this.dialogTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.selectedOrderId = id;
    this.isViewingDetailsFromAssign = false;
    this.isEditMode = false;
    this.stageSelectedOrder(id);
    this.showPackModal = true;
    this.mutationError = '';
  }

  openAssignModal(id: string) {
    this.dialogTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.selectedOrderId = id;
    this.courierService = '';
    this.trackingId = '';
    this.stageSelectedOrder(id);
    this.showAssignModal = true;
    this.mutationError = '';
  }

  isOrderFullyReserved(order: DispatchOrder): boolean {
    return order.items && order.items.length > 0 && order.items.every((item) => item.confirmed);
  }

  get isDeliveryFormValid(): boolean {
    return this.courierService.trim().length > 0 && this.trackingId.trim().length > 0;
  }

  completeAssignment() {
    if (!this.selectedOrderId || this.saving) return;

    const index = this.ordersToPack.findIndex((o) => o.id === this.selectedOrderId);
    if (index !== -1) {
      const order = this.ordersToPack[index];
      const updateData = {
        status: 'ready',
        courier: this.courierService,
        trackId: this.trackingId,
        statusVersion: order.statusVersion,
      };

      this.runOrderUpdate(order, updateData, () => {
        this.setActiveTab('ready');
        this.fetchOrders();
        this.closeModals();
      });
    }
  }

  toggleSort(field: 'name' | 'time') {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
  }

  viewPackingDetails() {
    this.isViewingDetailsFromAssign = true;
    this.showAssignModal = false;
    this.showPackModal = true;
  }

  backToAssign() {
    this.isViewingDetailsFromAssign = false;
    this.showPackModal = false;
    this.showAssignModal = true;
  }

  get selectedOrder() {
    if (this.dialogOrder) return this.dialogOrder;
    const allOrders = [
      ...this.ordersToPack,
      ...this.ordersReady,
      ...this.ordersInTransit,
      ...this.ordersCompleted,
    ];
    return allOrders.find((o) => o.id === this.selectedOrderId);
  }

  enableEditMode() {
    const order = this.selectedOrder;
    if (order) {
      this.isEditMode = true;
      this.editCourier = order.courier || '';
      this.editTrackId = order.trackId || '';
    }
  }

  saveEdit() {
    const order = this.selectedOrder;
    if (order) {
      const updateData = {
        courier: this.editCourier,
        trackId: this.editTrackId,
        statusVersion: order.statusVersion,
      };
      this.runOrderUpdate(order, updateData, () => {
        order.courier = this.editCourier;
        order.trackId = this.editTrackId;
        this.isEditMode = false;
        this.fetchOrders();
      });
    }
  }

  markHandedOver() {
    if (!this.selectedOrderId || this.saving) return;
    const order = this.selectedOrder;
    if (order) {
      const updateData = {
        status: 'in-transit',
        statusVersion: order.statusVersion,
      };
      this.runOrderUpdate(order, updateData, () => {
        this.setActiveTab('in-transit');
        this.fetchOrders();
        this.closeModals();
      });
    }
  }

  markComplete() {
    if (!this.selectedOrderId || this.saving) return;
    const order = this.selectedOrder;
    if (order) {
      const updateData = {
        status: 'completed',
        statusVersion: order.statusVersion,
      };
      this.runOrderUpdate(order, updateData, () => {
        this.setActiveTab('completed');
        this.fetchOrders();
        this.closeModals();
      });
    }
  }

  cancelEdit() {
    this.isEditMode = false;
  }

  canUndo(order: DispatchOrder | undefined): boolean {
    if (!order || !order.lastMovedAt) return false;
    const movedTime = new Date(order.lastMovedAt).getTime();
    const currentTime = new Date().getTime();
    return currentTime - movedTime <= 3600000;
  }

  undoAction() {
    if (!this.selectedOrderId || this.saving) return;
    const order = this.selectedOrder;
    if (!order) return;

    let updateData: any = {};
    let targetTab: 'to-pack' | 'ready' | 'in-transit' = 'to-pack';

    if (order.status === 'completed') {
      updateData = { status: 'in-transit', undo: true, statusVersion: order.statusVersion };
      targetTab = 'in-transit';
    } else if (order.status === 'in-transit') {
      updateData = { status: 'ready', undo: true, statusVersion: order.statusVersion };
      targetTab = 'ready';
    } else if (order.status === 'ready') {
      updateData = { status: 'to-pack', undo: true, statusVersion: order.statusVersion };
      targetTab = 'to-pack';
    }

    this.runOrderUpdate(order, updateData, () => {
      this.setActiveTab(targetTab);
      this.fetchOrders();
      this.closeModals();
    });
  }

  confirmItem(item: DispatchItem) {
    item.confirmed = !item.confirmed;
  }

  saveStatus() {
    if (!this.selectedOrderId || this.saving) return;
    const order = this.selectedOrder;
    if (order) {
      this.runOrderUpdate(order, { items: order.items, statusVersion: order.statusVersion }, () => {
        this.fetchOrders();
        this.closeModals();
      });
    }
  }

  closeModals() {
    if (this.saving) return;
    this.showPackModal = false;
    this.showAssignModal = false;
    this.dialogOrder = null;
    const trigger = this.dialogTrigger;
    this.dialogTrigger = null;
    setTimeout(() => trigger?.focus());
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeModals();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeModals(); }

  private stageSelectedOrder(id: string): void {
    const source = [...this.ordersToPack, ...this.ordersReady, ...this.ordersInTransit, ...this.ordersCompleted]
      .find((order) => order.id === id);
    this.dialogOrder = source ? structuredClone(source) : null;
  }

  private runOrderUpdate(order: DispatchOrder, updateData: object, onSuccess: () => void): void {
    if (this.saving) return;
    this.saving = true;
    this.mutationError = '';
    this.apiService.patch(`/inventory/orders/${order.id}`, updateData).subscribe({
      next: (updated: any) => {
        order.statusVersion = updated.statusVersion ?? order.statusVersion;
        order.lastMovedAt = updated.lastMovedAt ?? order.lastMovedAt;
        order.completedAt = updated.completedAt ?? order.completedAt;
        this.saving = false;
        onSuccess();
      },
      error: (error) => {
        this.saving = false;
        this.mutationError = error.error?.message || 'The dispatch change could not be saved.';
      },
    });
  }
}
