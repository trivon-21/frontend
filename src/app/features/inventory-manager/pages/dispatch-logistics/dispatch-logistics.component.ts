import { Component, DestroyRef, HostListener, OnInit, Optional } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { TtlCacheService } from '../../../../core/services/ttl-cache.service';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import { ConfirmService } from '../../../../services/confirm.service';
import { confirmDiscard } from '../../../../core/services/unsaved-changes';

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

  constructor(
    private apiService: ApiService,
    private confirmService: ConfirmService,
    @Optional() private ttlCache?: TtlCacheService,
    @Optional() private destroyRef?: DestroyRef,
  ) {}

  ngOnInit() {
    this.fetchOrders();
  }

  fetchOrders(options: { force?: boolean } = {}) {
    if (!this.ordersToPack.length && !this.ordersReady.length && !this.ordersInTransit.length && !this.ordersCompleted.length) {
      this.loading = true;
    }
    this.loadError = '';
    const fetch = () => this.apiService.get<any[]>('/inventory/orders');
    const request$ = this.ttlCache
      ? (options.force ? this.ttlCache.force('inventory:orders', 30_000, fetch) : this.ttlCache.observe('inventory:orders', 30_000, fetch))
      : fetch();

    const sub$ = this.destroyRef ? request$.pipe(takeUntilDestroyed(this.destroyRef)) : request$;
    sub$.subscribe({
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
        this.fetchOrders({ force: true });
        this.resetModalState();
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
        this.fetchOrders({ force: true });
      });
    }
  }

  printGatePass(): void {
    const order = this.selectedOrder;
    if (!order) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const itemRows = (order.items || [])
      .map(
        (item) => `
          <tr>
            <td>${this.escapeHtml(item.name)}</td>
            <td>${this.escapeHtml(item.sku)}</td>
            <td class="num">${item.qty}</td>
          </tr>`,
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Gate Pass - ${this.escapeHtml(order.id)}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111; }
            h1 { font-size: 20px; margin: 0 0 4px; }
            .subtitle { font-size: 12px; color: #555; margin-bottom: 20px; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 20px; font-size: 13px; }
            .meta div strong { display: inline-block; min-width: 110px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 13px; text-align: left; }
            th { background: #f2f2f2; }
            td.num, th.num { text-align: right; }
            .sign { margin-top: 56px; display: flex; justify-content: space-between; font-size: 13px; }
            .sign div { width: 45%; border-top: 1px solid #333; padding-top: 4px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Gate Pass</h1>
          <div class="subtitle">Airlux Inventory &amp; Logistics</div>
          <div class="meta">
            <div><strong>Order ID:</strong> ${this.escapeHtml(order.id)}</div>
            <div><strong>Customer:</strong> ${this.escapeHtml(order.customer)}</div>
            <div><strong>Courier:</strong> ${this.escapeHtml(order.courier || 'N/A')}</div>
            <div><strong>Tracking / Ref ID:</strong> ${this.escapeHtml(order.trackId || 'N/A')}</div>
            <div><strong>Date Printed:</strong> ${this.escapeHtml(new Date().toLocaleString())}</div>
          </div>
          <table>
            <thead>
              <tr><th>Item Name</th><th>SKU</th><th class="num">Qty</th></tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div class="sign">
            <div>Dispatched By</div>
            <div>Security / Gate Signature</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private escapeHtml(value: string | undefined | null): string {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
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
        this.fetchOrders({ force: true });
        this.resetModalState();
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
        this.fetchOrders({ force: true });
        this.resetModalState();
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
      this.fetchOrders({ force: true });
      this.resetModalState();
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
        this.fetchOrders({ force: true });
        this.resetModalState();
      });
    }
  }

  get isDialogDirty(): boolean {
    if (this.showAssignModal) {
      return !!(this.courierService.trim() || this.trackingId.trim());
    }
    if (this.showPackModal) {
      if (this.isEditMode) {
        const order = this.selectedOrder;
        return this.editCourier !== (order?.courier || '') || this.editTrackId !== (order?.trackId || '');
      }
      const original = [...this.ordersToPack, ...this.ordersReady, ...this.ordersInTransit, ...this.ordersCompleted]
        .find((order) => order.id === this.selectedOrderId);
      return !!this.dialogOrder && !!original
        && this.dialogOrder.items.some((item, i) => item.confirmed !== original.items[i]?.confirmed);
    }
    return false;
  }

  async closeModals(): Promise<void> {
    if (this.saving) return;
    if (this.isDialogDirty && !(await confirmDiscard(this.confirmService, 'dispatch changes'))) {
      return;
    }
    this.resetModalState();
  }

  /** Resets the modal without confirming — used after a successful save, where
   *  there is nothing left to discard. */
  private resetModalState(): void {
    this.showPackModal = false;
    this.showAssignModal = false;
    this.isEditMode = false;
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
        this.ttlCache?.invalidate('inventory:');
        onSuccess();
      },
      error: (error) => {
        this.saving = false;
        this.mutationError = error.error?.message || 'The dispatch change could not be saved.';
      },
    });
  }
}
