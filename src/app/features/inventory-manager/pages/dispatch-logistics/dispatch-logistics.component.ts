import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
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
  type: string;
  items: DispatchItem[];
  time?: string;
  date?: string;
  courier?: string;
  trackId?: string;
  completedAt?: string;
  lastMovedAt?: string;
}

import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-dispatch-logistics',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
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
    this.apiService.get<any[]>('/inventory/orders').subscribe((data: any[]) => {
      // Map backend model to frontend model
      const orders: DispatchOrder[] = data.map((o: any) => ({
        id: o.orderId,
        customer: o.customer,
        status: o.status,
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
    this.selectedOrderId = id;
    this.isViewingDetailsFromAssign = false;
    this.isEditMode = false;
    this.showPackModal = true;
  }

  openAssignModal(id: string) {
    this.selectedOrderId = id;
    this.courierService = '';
    this.trackingId = '';
    this.showAssignModal = true;
  }

  isOrderFullyReserved(order: DispatchOrder): boolean {
    return order.items && order.items.length > 0 && order.items.every((item) => item.confirmed);
  }

  get isDeliveryFormValid(): boolean {
    return this.courierService.trim().length > 0 && this.trackingId.trim().length > 0;
  }

  completeAssignment() {
    if (!this.selectedOrderId) return;

    const index = this.ordersToPack.findIndex((o) => o.id === this.selectedOrderId);
    if (index !== -1) {
      const order = this.ordersToPack[index];
      const updateData = {
        status: 'ready',
        courier: this.courierService,
        trackId: this.trackingId,
        lastMovedAt: new Date().toISOString(),
      };

      this.apiService.patch(`/inventory/orders/${order.id}`, updateData).subscribe(() => {
        this.fetchOrders();
        this.setActiveTab('ready');
      });
    }

    this.closeModals();
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
      };
      this.apiService.patch(`/inventory/orders/${order.id}`, updateData).subscribe(() => {
        order.courier = this.editCourier;
        order.trackId = this.editTrackId;
        this.isEditMode = false;
      });
    }
  }

  markHandedOver() {
    if (!this.selectedOrderId) return;
    const order = this.selectedOrder;
    if (order) {
      const updateData = {
        status: 'in-transit',
        lastMovedAt: new Date().toISOString(),
      };
      this.apiService.patch(`/inventory/orders/${order.id}`, updateData).subscribe(() => {
        this.fetchOrders();
        this.setActiveTab('in-transit');
      });
    }
    this.closeModals();
  }

  markComplete() {
    if (!this.selectedOrderId) return;
    const order = this.selectedOrder;
    if (order) {
      const updateData = {
        status: 'completed',
        completedAt: new Date().toISOString().split('T')[0],
        lastMovedAt: new Date().toISOString(),
      };
      this.apiService.patch(`/inventory/orders/${order.id}`, updateData).subscribe(() => {
        this.fetchOrders();
        this.setActiveTab('completed');
      });
    }
    this.closeModals();
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
    if (!this.selectedOrderId) return;
    const order = this.selectedOrder;
    if (!order) return;

    let updateData: any = {};
    let targetTab: 'to-pack' | 'ready' | 'in-transit' = 'to-pack';

    if (order.status === 'completed') {
      updateData = { status: 'in-transit', completedAt: null, lastMovedAt: null };
      targetTab = 'in-transit';
    } else if (order.status === 'in-transit') {
      updateData = { status: 'ready', lastMovedAt: null };
      targetTab = 'ready';
    } else if (order.status === 'ready') {
      updateData = { status: 'to-pack', lastMovedAt: null };
      targetTab = 'to-pack';
    }

    this.apiService.patch(`/inventory/orders/${order.id}`, updateData).subscribe(() => {
      this.fetchOrders();
      this.setActiveTab(targetTab);
    });

    this.closeModals();
  }

  confirmItem(item: DispatchItem) {
    item.confirmed = !item.confirmed;
  }

  saveStatus() {
    if (!this.selectedOrderId) return;
    const order = this.selectedOrder;
    if (order) {
      this.apiService
        .patch(`/inventory/orders/${order.id}`, { items: order.items })
        .subscribe(() => {
          console.log('Status saved for', this.selectedOrderId);
        });
    }
    this.closeModals();
  }

  closeModals() {
    this.showPackModal = false;
    this.showAssignModal = false;
  }
}
