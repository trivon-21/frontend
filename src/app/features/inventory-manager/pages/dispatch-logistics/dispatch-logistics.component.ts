import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DispatchOrder {
  id: string;
  customer: string;
  status: 'to-pack' | 'ready' | 'in-transit' | 'completed';
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
  selectedOrderId: string | null = null;

  ordersToPack: any[] = [
    { id: '#ORD-2025-099', customer: 'Saman Perera', status: 'to-pack' },
    { id: '#ORD-2025-098', customer: 'Nimal Fernando', status: 'to-pack' },
    { id: '#ORD-2025-097', customer: 'Ayesha Rashid', status: 'to-pack' },
    { id: '#ORD-2025-096', customer: 'Pradeep Silva', status: 'to-pack' },
    { id: '#ORD-2025-095', customer: 'Lakshmi Rajapaksa', status: 'to-pack' }
  ];

  ordersReady: any[] = [
    { id: '#ORD-2025-099', customer: 'Saman Perera', type: 'Saman Perera' },
    { id: '#ORD-2025-098', customer: 'Nimal Fernando', type: 'Nimal Fernando' },
    { id: '#ORD-2025-097', customer: 'Ayesha Rashid', type: 'Ayesha Rashid' },
    { id: '#ORD-2025-096', customer: 'Pradeep Silva', type: 'Pradeep Silva' },
    { id: '#ORD-2025-095', customer: 'Lakshmi Rajapaksa', type: 'Lakshmi Rajapaksa' }
  ];

  ordersInTransit: any[] = [
    { id: '#ORD-2025-099', customer: 'Saman Perera', trackId: 'Saman Perera' },
    { id: '#ORD-2025-098', customer: 'Nimal Fernando', trackId: 'Nimal Fernando' },
    { id: '#ORD-2025-097', customer: 'Ayesha Rashid', trackId: 'Ayesha Rashid' },
    { id: '#ORD-2025-096', customer: 'Pradeep Silva', trackId: 'Pradeep Silva' },
    { id: '#ORD-2025-095', customer: 'Lakshmi Rajapaksa', trackId: 'Lakshmi Rajapaksa' }
  ];

  ordersCompleted: any[] = [
    { id: '#ORD-2025-099', customer: 'Saman Perera' },
    { id: '#ORD-2025-098', customer: 'Nimal Fernando' },
    { id: '#ORD-2025-097', customer: 'Ayesha Rashid' },
    { id: '#ORD-2025-096', customer: 'Pradeep Silva' },
    { id: '#ORD-2025-095', customer: 'Lakshmi Rajapaksa' }
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
    if (this.activeTab === 'to-pack') return this.ordersToPack;
    if (this.activeTab === 'ready') return this.ordersReady;
    if (this.activeTab === 'in-transit') return this.ordersInTransit;
    return this.ordersCompleted;
  }

  openPackModal(id: string) {
    this.selectedOrderId = id;
    this.showPackModal = true;
  }

  openAssignModal(id: string) {
    this.selectedOrderId = id;
    this.showAssignModal = true;
  }

  closeModals() {
    this.showPackModal = false;
    this.showAssignModal = false;
  }
}
