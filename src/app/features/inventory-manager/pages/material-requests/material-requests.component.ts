import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface MaterialItem {
  name: string;
  qty: number;
  confirmed: boolean;
  sku: string;
}

interface MaterialRequest {
  id: string;
  requestId?: string; // from backend
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
export class MaterialRequestsDashboardComponent implements OnInit {
  activeTab: 'pending' | 'reserved' | 'completed' = 'pending';
  
  showModal = false;
  selectedRequestId: string | null = null;
  
  sortField: 'name' | 'time' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  pendingRequests: MaterialRequest[] = [];
  reservedRequests: MaterialRequest[] = [];
  completedRequests: MaterialRequest[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchRequests();
  }

  fetchRequests() {
    this.apiService.get<any[]>('/inventory-manager/material-requests').subscribe(data => {
      // Map backend model to frontend model
      const requests = data.map(r => ({
        id: r.requestId,
        requester: r.requester,
        date: r.date,
        location: r.location,
        status: r.status,
        items: r.items,
        completedAt: r.completedAt,
        lastMovedAt: r.lastMovedAt
      }));

      this.pendingRequests = requests.filter(r => r.status === 'pending');
      this.reservedRequests = requests.filter(r => r.status === 'reserved');
      this.completedRequests = requests.filter(r => r.status === 'completed');
    });
  }

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
    if (!this.selectedRequestId) return;
    const req = this.selectedRequest;
    if (req) {
      this.apiService.patch(`/inventory-manager/material-requests/${req.id}`, { items: req.items }).subscribe(() => {
        console.log('Status saved for', this.selectedRequestId);
      });
    }
    this.closeModal();
  }

  markKitted() {
    if (!this.selectedRequestId) return;
    const req = this.selectedRequest;
    if (req && req.items.every(i => i.confirmed)) {
      const updateData = {
        status: 'reserved',
        lastMovedAt: new Date().toISOString()
      };
      this.apiService.patch(`/inventory-manager/material-requests/${req.id}`, updateData).subscribe(() => {
        this.fetchRequests();
        this.setActiveTab('reserved');
        this.closeModal();
      });
    } else {
      alert("Please reserve all items before marking as kitted.");
    }
  }

  markHandedOver() {
    if (!this.selectedRequestId) return;
    const req = this.selectedRequest;
    if (req) {
      const updateData = {
        status: 'completed',
        completedAt: new Date().toISOString().split('T')[0],
        lastMovedAt: new Date().toISOString()
      };
      this.apiService.patch(`/inventory-manager/material-requests/${req.id}`, updateData).subscribe(() => {
        this.fetchRequests();
        this.setActiveTab('completed');
        this.closeModal();
      });
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

    let updateData: any = {};
    let targetTab: 'pending' | 'reserved' | 'completed' = 'pending';

    if (req.status === 'completed') {
      updateData = { status: 'reserved', completedAt: null, lastMovedAt: null };
      targetTab = 'reserved';
    } else if (req.status === 'reserved') {
      updateData = { status: 'pending', lastMovedAt: null };
      targetTab = 'pending';
    }

    this.apiService.patch(`/inventory-manager/material-requests/${req.id}`, updateData).subscribe(() => {
      this.fetchRequests();
      this.setActiveTab(targetTab);
    });
    
    this.closeModal();
  }
}
