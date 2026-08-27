import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';

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
  serviceTeam?: string;
  completedAt?: string;
  lastMovedAt?: string;
}

import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';

@Component({
  selector: 'app-material-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconsModule],
  templateUrl: './material-requests.component.html',
  styleUrls: ['./material-requests.component.css'],
})
export class MaterialRequestsDashboardComponent implements OnInit {
  activeTab: 'pending' | 'reserved' | 'completed' = 'pending';
  searchQuery: string = '';

  showModal = false;
  selectedRequestId: string | null = null;
  dialogRequest: MaterialRequest | null = null;
  loading = true;
  loadError = '';
  saving = false;
  mutationError = '';
  private dialogTrigger: HTMLElement | null = null;

  sortField: 'name' | 'time' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  isEditingTeam = false;
  editServiceTeam = '';
  validationMessage = '';

  pendingRequests: MaterialRequest[] = [];
  reservedRequests: MaterialRequest[] = [];
  completedRequests: MaterialRequest[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchRequests();
  }

  fetchRequests() {
    this.loading = true;
    this.loadError = '';
    this.apiService.get<any[]>('/inventory/material-requests').subscribe({
      next: (data: any[]) => {
      // Map backend model to frontend model
      const requests: MaterialRequest[] = data.map((r: any) => ({
        id: r.requestId,
        requester: r.requester,
        date: r.date,
        location: r.location,
        status: r.status,
        items: r.items,
        serviceTeam: r.serviceTeam,
        completedAt: r.completedAt,
        lastMovedAt: r.lastMovedAt,
      }));

      this.pendingRequests = requests.filter((r: MaterialRequest) => r.status === 'pending');
      this.reservedRequests = requests.filter((r: MaterialRequest) => r.status === 'reserved');
      this.completedRequests = requests.filter((r: MaterialRequest) => r.status === 'completed');
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Material reservations could not be loaded.';
        this.loading = false;
      },
    });
  }

  setActiveTab(tab: 'pending' | 'reserved' | 'completed') {
    this.activeTab = tab;
  }

  get currentRequests() {
    let list =
      this.activeTab === 'pending'
        ? this.pendingRequests
        : this.activeTab === 'reserved'
          ? this.reservedRequests
          : this.completedRequests;

    const query = (this.searchQuery || '').toLowerCase().trim();
    if (query) {
      list = list.filter(
        (r) =>
          r.id?.toLowerCase().includes(query) ||
          r.requester?.toLowerCase().includes(query) ||
          r.location?.toLowerCase().includes(query),
      );
    }

    return list.sort((a, b) => {
      if (this.sortField === 'name') {
        return this.sortDirection === 'asc'
          ? a.requester.localeCompare(b.requester)
          : b.requester.localeCompare(a.requester);
      } else {
        return this.sortDirection === 'asc'
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date);
      }
    });
  }

  get selectedRequest() {
    if (this.dialogRequest) return this.dialogRequest;
    const allReqs = [...this.pendingRequests, ...this.reservedRequests, ...this.completedRequests];
    return allReqs.find((r) => r.id === this.selectedRequestId);
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
    this.dialogTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.selectedRequestId = id;
    this.isEditingTeam = false;
    this.editServiceTeam = '';
    const source = [...this.pendingRequests, ...this.reservedRequests, ...this.completedRequests].find((r) => r.id === id);
    this.dialogRequest = source ? structuredClone(source) : null;
    const req = this.dialogRequest;
    if (req && req.serviceTeam) {
      this.editServiceTeam = req.serviceTeam;
    }
    this.showModal = true;
    this.mutationError = '';
  }

  closeModal() {
    if (this.saving) return;
    this.showModal = false;
    this.selectedRequestId = null;
    this.dialogRequest = null;
    const trigger = this.dialogTrigger;
    this.dialogTrigger = null;
    setTimeout(() => trigger?.focus());
  }

  confirmItem(item: MaterialItem) {
    item.confirmed = !item.confirmed;
  }

  saveStatus() {
    if (!this.selectedRequestId || this.saving) return;
    const req = this.selectedRequest;
    if (req) {
      this.saving = true;
      this.mutationError = '';
      this.apiService.patch(`/inventory/material-requests/${req.id}`, { items: req.items }).subscribe({
        next: () => { this.saving = false; this.fetchRequests(); this.closeModal(); },
        error: (error) => { this.saving = false; this.mutationError = error.error?.message || 'The reservation changes could not be saved.'; },
      });
    }
  }

  enableEditTeam() {
    const req = this.selectedRequest;
    if (req) {
      this.isEditingTeam = true;
      this.editServiceTeam = req.serviceTeam || '';
    }
  }

  cancelEditTeam() {
    this.isEditingTeam = false;
  }

  saveServiceTeam() {
    if (!this.selectedRequestId || this.saving) return;
    const req = this.selectedRequest;
    if (req) {
      this.saving = true;
      this.mutationError = '';
      this.apiService
        .patch(`/inventory/material-requests/${req.id}`, { serviceTeam: this.editServiceTeam })
        .subscribe({
          next: () => {
            this.saving = false;
            req.serviceTeam = this.editServiceTeam;
            this.fetchRequests();
            this.isEditingTeam = false;
          },
          error: (error) => {
            this.saving = false;
            this.mutationError = error.error?.message || 'The service team could not be saved.';
          },
        });
    }
  }

  markKitted() {
    if (!this.selectedRequestId || this.saving) return;
    const req = this.selectedRequest;
    if (req && req.items.every((i) => i.confirmed)) {
      const updateData = {
        status: 'reserved',
        lastMovedAt: new Date().toISOString(),
      };
      this.saving = true;
      this.mutationError = '';
      this.apiService.patch(`/inventory/material-requests/${req.id}`, updateData).subscribe({
        next: () => {
          this.saving = false;
          this.setActiveTab('reserved');
          this.fetchRequests();
          this.closeModal();
        },
        error: (error) => {
          this.saving = false;
          this.mutationError = error.error?.message || 'The request could not be marked as reserved.';
        },
      });
    } else {
      this.validationMessage = 'Please reserve all items before marking as kitted.';
      setTimeout(() => this.validationMessage = '', 4000);
    }
  }

  markHandedOver() {
    if (!this.selectedRequestId || this.saving) return;
    const req = this.selectedRequest;
    if (req) {
      if (!req.serviceTeam) {
        this.validationMessage = 'Please assign a service team first.';
        setTimeout(() => this.validationMessage = '', 4000);
        return;
      }
      const updateData = {
        status: 'completed',
        completedAt: new Date().toISOString().split('T')[0],
        lastMovedAt: new Date().toISOString(),
      };
      this.saving = true;
      this.mutationError = '';
      this.apiService.patch(`/inventory/material-requests/${req.id}`, updateData).subscribe({
        next: () => {
          this.saving = false;
          this.setActiveTab('completed');
          this.fetchRequests();
          this.closeModal();
        },
        error: (error) => {
          this.saving = false;
          this.mutationError = error.error?.message || 'The request could not be completed.';
        },
      });
    }
  }

  canUndo(req: MaterialRequest | undefined): boolean {
    if (!req || !req.lastMovedAt) return false;
    const movedTime = new Date(req.lastMovedAt).getTime();
    const currentTime = new Date().getTime();
    return currentTime - movedTime <= 3600000;
  }

  undoAction() {
    if (!this.selectedRequestId || this.saving) return;
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

    this.saving = true;
    this.mutationError = '';
    this.apiService.patch(`/inventory/material-requests/${req.id}`, updateData).subscribe({
      next: () => {
        this.saving = false;
        this.setActiveTab(targetTab);
        this.fetchRequests();
        this.closeModal();
      },
      error: (error) => {
        this.saving = false;
        this.mutationError = error.error?.message || 'The transition could not be undone.';
      },
    });
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeModal();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeModal(); }
}
