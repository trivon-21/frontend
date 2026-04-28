import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface MaterialItem {
  name: string;
  qty: number;
  confirmed: boolean;
  sku: string;
}

interface MaterialRequest {
  id: string;
  requester: string;
  date: string;
  location: string;
  status: 'pending' | 'reserved' | 'completed';
  items: MaterialItem[];
  completedAt?: string;
  lastMovedAt?: string;
}

@Component({
  selector: 'app-material-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './material-requests.component.html',
  styleUrls: ['./material-requests.component.css']
})
export class MaterialRequestsDashboardComponent {
  activeTab: 'pending' | 'reserved' | 'completed' = 'pending';
  
  showModal = false;
  selectedRequestId: string | null = null;
  
  sortField: 'name' | 'time' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  pendingRequests: MaterialRequest[] = [
    {
      id: '#REQ-2025-402',
      requester: 'Saman Perera',
      date: '2025-02-18',
      location: 'Colombo 03',
      status: 'pending',
      items: [
        { name: 'LG Inverter 12k - Outdoor Unit', qty: 1, confirmed: false, sku: 'LG-OUT-12K' },
        { name: 'LG Inverter 12k - Indoor Unit', qty: 1, confirmed: false, sku: 'LG-IN-12K' },
        { name: 'Copper Pipe 1/4"', qty: 3, confirmed: false, sku: 'COP-14-1M' }
      ]
    },
    {
      id: '#REQ-2025-403',
      requester: 'Kamal Silva',
      date: '2025-02-18',
      location: 'Kandy',
      status: 'pending',
      items: [
        { name: 'Daikin 18k Split Unit', qty: 1, confirmed: false, sku: 'DK-SPL-18K' },
        { name: 'Thermostat Digital', qty: 2, confirmed: false, sku: 'TH-DIG-01' }
      ]
    }
  ];

  reservedRequests: MaterialRequest[] = [
    {
      id: '#REQ-2025-400',
      requester: 'Nimal Fernando',
      date: '2025-02-17',
      location: 'Galle',
      status: 'reserved',
      items: [
        { name: 'Compressor 2HP', qty: 1, confirmed: true, sku: 'COMP-2HP' }
      ]
    }
  ];

  completedRequests: MaterialRequest[] = [
    {
      id: '#REQ-2025-399',
      requester: 'Ruwan Kumara',
      date: '2025-02-16',
      location: 'Negombo',
      status: 'completed',
      completedAt: '2025-02-16',
      items: [
        { name: 'Capacitor 45uF', qty: 5, confirmed: true, sku: 'CAP-45UF' }
      ]
    }
  ];

  setActiveTab(tab: 'pending' | 'reserved' | 'completed') {
    this.activeTab = tab;
  }

  get currentRequests() {
    let list = this.activeTab === 'pending' ? this.pendingRequests :
               this.activeTab === 'reserved' ? this.reservedRequests :
               this.completedRequests;
               
    return list.sort((a, b) => {
      if (this.sortField === 'name') {
        return this.sortDirection === 'asc' ? a.requester.localeCompare(b.requester) : b.requester.localeCompare(a.requester);
      } else {
        return this.sortDirection === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      }
    });
  }

  get selectedRequest() {
    const allReqs = [...this.pendingRequests, ...this.reservedRequests, ...this.completedRequests];
    return allReqs.find(r => r.id === this.selectedRequestId);
  }

  toggleSort(field: 'name' | 'time') {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
  }

  openModal(id: string) {
    this.selectedRequestId = id;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedRequestId = null;
  }

  confirmItem(item: MaterialItem) {
    item.confirmed = !item.confirmed;
  }

  saveStatus() {
    this.closeModal();
  }

  markKitted() {
    if (!this.selectedRequestId) return;
    const req = this.selectedRequest;
    if (req && req.items.every(i => i.confirmed)) {
      const index = this.pendingRequests.findIndex(r => r.id === this.selectedRequestId);
      if (index !== -1) {
        const removed = this.pendingRequests.splice(index, 1)[0];
        removed.status = 'reserved';
        removed.lastMovedAt = new Date().toISOString();
        this.reservedRequests.unshift(removed);
        this.setActiveTab('reserved');
        this.closeModal();
      }
    } else {
      alert("Please reserve all items before marking as kitted.");
    }
  }

  markHandedOver() {
    if (!this.selectedRequestId) return;
    const index = this.reservedRequests.findIndex(r => r.id === this.selectedRequestId);
    if (index !== -1) {
      const removed = this.reservedRequests.splice(index, 1)[0];
      removed.status = 'completed';
      removed.completedAt = new Date().toISOString().split('T')[0];
      removed.lastMovedAt = new Date().toISOString();
      this.completedRequests.unshift(removed);
      this.setActiveTab('completed');
      this.closeModal();
    }
  }

  canUndo(req: MaterialRequest | undefined): boolean {
    if (!req || !req.lastMovedAt) return false;
    const movedTime = new Date(req.lastMovedAt).getTime();
    const currentTime = new Date().getTime();
    return (currentTime - movedTime) <= 3600000;
  }

  undoAction() {
    if (!this.selectedRequestId) return;
    const req = this.selectedRequest;
    if (!req) return;

    if (req.status === 'completed') {
      const index = this.completedRequests.findIndex(r => r.id === this.selectedRequestId);
      if (index !== -1) {
        const undone = this.completedRequests.splice(index, 1)[0];
        undone.status = 'reserved';
        delete undone.completedAt;
        delete undone.lastMovedAt;
        this.reservedRequests.unshift(undone);
        this.setActiveTab('reserved');
      }
    } else if (req.status === 'reserved') {
      const index = this.reservedRequests.findIndex(r => r.id === this.selectedRequestId);
      if (index !== -1) {
        const undone = this.reservedRequests.splice(index, 1)[0];
        undone.status = 'pending';
        delete undone.lastMovedAt;
        this.pendingRequests.unshift(undone);
        this.setActiveTab('pending');
      }
    }
    this.closeModal();
  }
}

