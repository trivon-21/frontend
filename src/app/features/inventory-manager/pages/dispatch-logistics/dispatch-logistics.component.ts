import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DispatchItem {
  name: string;
  qty: number;
  confirmed: boolean;
  sku: string;
}

interface DispatchOrder {
  id: string;
  customer: string;
  status: 'to-pack' | 'ready' | 'in-transit' | 'completed';
  type: string;
  items: DispatchItem[];
  time?: string;
  courier?: string;
  trackId?: string;
  completedAt?: string;
  lastMovedAt?: string;
}

@Component({
  selector: 'app-dispatch-logistics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dispatch-logistics.component.html',
  styleUrls: ['./dispatch-logistics.component.css']
})
export class DispatchLogisticsDashboardComponent implements OnInit {
  activeTab: 'to-pack' | 'ready' | 'in-transit' | 'completed' = 'to-pack';
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

  ordersToPack: DispatchOrder[] = [
    { 
      id: '#ORD-2025-099', customer: 'Saman Perera', status: 'to-pack', type: 'Installation',
      time: '08:30 AM',
      items: [
        { name: 'LG Inverter 12k - Outdoor Unit', qty: 1, confirmed: false, sku: 'LG-OUT-12' },
        { name: 'LG Inverter 12k - Indoor Unit', qty: 1, confirmed: false, sku: 'LG-IND-12' },
        { name: 'Copper Pipe 1/4"', qty: 3, confirmed: true, sku: 'CP-14' }
      ]
    },
    { 
      id: '#ORD-2025-098', customer: 'Nimal Fernando', status: 'to-pack', type: 'Repair',
      time: '09:15 AM',
      items: [
        { name: 'Compressor 1.5hp', qty: 1, confirmed: false, sku: 'COMP-15' },
        { name: 'R410a Refrigerant', qty: 2, confirmed: false, sku: 'REF-R410' }
      ]
    }
  ];

  ordersReady: DispatchOrder[] = [
    { 
      id: '#ORD-2025-097', customer: 'Ayesha Rashid', type: 'Installation', time: '10:00 AM', status: 'ready',
      courier: 'DMX Logistics', trackId: 'DMX97001',
      items: [{ name: 'Samsung WindFree 18k', qty: 1, confirmed: true, sku: 'SAM-WF-18' }]
    }
  ];

  ordersInTransit: DispatchOrder[] = [
    { 
      id: '#ORD-2025-096', customer: 'Pradeep Silva', trackId: 'DMX96001', time: '11:30 AM', status: 'in-transit',
      type: 'Repair', courier: 'Prompt Express',
      items: [{ name: 'LG Compressor 2hp', qty: 1, confirmed: true, sku: 'LG-COMP-20' }]
    }
  ];

  ordersCompleted: DispatchOrder[] = [
    { 
      id: '#ORD-2025-095', customer: 'Lakshmi Rajapaksa', completedAt: '2025-02-15', time: '12:45 PM', status: 'completed',
      type: 'Installation', courier: 'DMX Logistics', trackId: 'DMX95001',
      items: [{ name: 'Standard Wall Bracket', qty: 2, confirmed: true, sku: 'BRK-STD' }]
    }
  ];

  ngOnInit() {
    this.selectFirstOrder();
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

    return orders.sort((a, b) => {
      const valA = this.sortField === 'name' ? a.customer : a.time;
      const valB = this.sortField === 'name' ? b.customer : b.time;
      
      if (this.sortDirection === 'asc') {
        return valA.localeCompare(valB);
      } else {
        return valB.localeCompare(valA);
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
    return order.items && order.items.length > 0 && order.items.every(item => item.confirmed);
  }

  get isDeliveryFormValid(): boolean {
    return this.courierService.trim().length > 0 && this.trackingId.trim().length > 0;
  }

  completeAssignment() {
    if (!this.selectedOrderId) return;
    
    // Move order from To Pack to Ready
    const index = this.ordersToPack.findIndex(o => o.id === this.selectedOrderId);
    if (index !== -1) {
      const order = this.ordersToPack.splice(index, 1)[0];
      this.ordersReady.unshift({
        ...order,
        status: 'ready',
        courier: this.courierService,
        trackId: this.trackingId,
        lastMovedAt: new Date().toISOString()
      });
      
      // Auto switch to Ready tab
      this.setActiveTab('ready');
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
    const allOrders = [...this.ordersToPack, ...this.ordersReady, ...this.ordersInTransit, ...this.ordersCompleted];
    return allOrders.find(o => o.id === this.selectedOrderId);
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
      order.courier = this.editCourier;
      order.trackId = this.editTrackId;
      this.isEditMode = false;
    }
  }

  markHandedOver() {
    if (!this.selectedOrderId) return;
    const index = this.ordersReady.findIndex(o => o.id === this.selectedOrderId);
    if (index !== -1) {
      const order = this.ordersReady.splice(index, 1)[0];
      this.ordersInTransit.unshift({
        ...order,
        status: 'in-transit',
        lastMovedAt: new Date().toISOString()
      });
      this.setActiveTab('in-transit');
    }
    this.closeModals();
  }

  markComplete() {
    if (!this.selectedOrderId) return;
    const index = this.ordersInTransit.findIndex(o => o.id === this.selectedOrderId);
    if (index !== -1) {
      const order = this.ordersInTransit.splice(index, 1)[0];
      this.ordersCompleted.unshift({
        ...order,
        status: 'completed',
        completedAt: new Date().toISOString().split('T')[0],
        lastMovedAt: new Date().toISOString()
      });
      this.setActiveTab('completed');
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
    return (currentTime - movedTime) <= 3600000;
  }

  undoAction() {
    if (!this.selectedOrderId) return;
    const order = this.selectedOrder;
    if (!order) return;

    if (order.status === 'completed') {
      const index = this.ordersCompleted.findIndex(o => o.id === this.selectedOrderId);
      if (index !== -1) {
        const undoneOrder = this.ordersCompleted.splice(index, 1)[0];
        undoneOrder.status = 'in-transit';
        delete undoneOrder.completedAt;
        delete undoneOrder.lastMovedAt;
        this.ordersInTransit.unshift(undoneOrder);
        this.setActiveTab('in-transit');
      }
    } else if (order.status === 'in-transit') {
      const index = this.ordersInTransit.findIndex(o => o.id === this.selectedOrderId);
      if (index !== -1) {
        const undoneOrder = this.ordersInTransit.splice(index, 1)[0];
        undoneOrder.status = 'ready';
        delete undoneOrder.lastMovedAt;
        this.ordersReady.unshift(undoneOrder);
        this.setActiveTab('ready');
      }
    } else if (order.status === 'ready') {
      const index = this.ordersReady.findIndex(o => o.id === this.selectedOrderId);
      if (index !== -1) {
        const undoneOrder = this.ordersReady.splice(index, 1)[0];
        undoneOrder.status = 'to-pack';
        delete undoneOrder.lastMovedAt;
        this.ordersToPack.unshift(undoneOrder);
        this.setActiveTab('to-pack');
      }
    }
    this.closeModals();
  }

  confirmItem(item: DispatchItem) {
    item.confirmed = !item.confirmed;
  }

  saveStatus() {
    console.log('Status saved for', this.selectedOrderId);
    this.closeModals();
  }

  closeModals() {
    this.showPackModal = false;
    this.showAssignModal = false;
  }
}
