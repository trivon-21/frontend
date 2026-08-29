import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { Router } from '@angular/router';

interface MaterialItem {
  lineId: string;
  inventoryId: string;
  name: string;
  qty: number;
  confirmed: boolean;
  sku: string;
  available: number;
  shortage: number;
  unit: string;
  unitCost?: number;
  itemClass?: string;
  subcategory?: string;
  manufacturerPartNumber?: string;
  supplierId?: string;
  supplierName?: string;
}

interface MaterialRequest {
  id: string;
  requestId?: string; // from backend
  sourceMaterialRequestId: string;
  requester: string;
  date: string;
  location: string;
  status: 'pending' | 'reserved' | 'completed';
  items: MaterialItem[];
  assignedTeamId?: string;
  assignedTeamName?: string;
  hasShortage?: boolean;
  statusVersion: number;
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

  validationMessage = '';

  pendingRequests: MaterialRequest[] = [];
  reservedRequests: MaterialRequest[] = [];
  completedRequests: MaterialRequest[] = [];

  constructor(private apiService: ApiService, private router?: Router) {}

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
        sourceMaterialRequestId: r.sourceMaterialRequestId,
        requester: r.requester,
        date: r.date,
        location: r.location,
        status: r.status,
        items: r.items,
        assignedTeamId: r.assignedTeamId,
        assignedTeamName: r.assignedTeamName,
        hasShortage: r.hasShortage,
        statusVersion: r.statusVersion || 0,
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
    const source = [...this.pendingRequests, ...this.reservedRequests, ...this.completedRequests].find((r) => r.id === id);
    this.dialogRequest = source ? structuredClone(source) : null;
    const req = this.dialogRequest;
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
    const req = this.selectedRequest;
    if (!req || this.saving) return;
    const confirmed = !item.confirmed;
    this.saving = true;
    this.mutationError = '';
    this.apiService.patch(`/inventory/material-requests/${req.id}/items/${item.lineId}`, {
      confirmed,
      statusVersion: req.statusVersion,
    }).subscribe({
      next: (updated: any) => {
        this.saving = false;
        item.confirmed = confirmed;
        req.statusVersion = updated.statusVersion;
        this.fetchRequests();
      },
      error: error => {
        this.saving = false;
        this.mutationError = error.error?.message || 'The material confirmation could not be saved.';
      },
    });
  }

  markKitted() {
    if (!this.selectedRequestId || this.saving) return;
    const req = this.selectedRequest;
    if (req && req.items.every((i) => i.confirmed)) {
      this.saving = true;
      this.mutationError = '';
      this.apiService.post(`/inventory/material-requests/${req.id}/reserve`, { statusVersion: req.statusVersion }).subscribe({
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
      if (!req.assignedTeamId) {
        this.validationMessage = 'The Main Technician must assign a service team first.';
        setTimeout(() => this.validationMessage = '', 4000);
        return;
      }
      this.saving = true;
      this.mutationError = '';
      this.apiService.post(`/inventory/material-requests/${req.id}/handover`, { statusVersion: req.statusVersion }).subscribe({
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
    return req?.status === 'reserved';
  }

  undoAction() {
    if (!this.selectedRequestId || this.saving) return;
    const req = this.selectedRequest;
    if (!req) return;

    if (req.status !== 'reserved') return;

    this.saving = true;
    this.mutationError = '';
    this.apiService.post(`/inventory/material-requests/${req.id}/release`, { statusVersion: req.statusVersion }).subscribe({
      next: () => {
        this.saving = false;
        this.setActiveTab('pending');
        this.fetchRequests();
        this.closeModal();
      },
      error: (error) => {
        this.saving = false;
        this.mutationError = error.error?.message || 'The transition could not be undone.';
      },
    });
  }

  canReserve(req: MaterialRequest | undefined): boolean {
    return Boolean(req?.items.length && !req.hasShortage && req.items.every(item => item.confirmed));
  }

  get shortageSuppliers(): Array<{ id: string; name: string }> {
    const groups = new Map<string, string>();
    for (const item of this.selectedRequest?.items || []) {
      if (item.shortage > 0) groups.set(item.supplierId || '', item.supplierName || 'Unassigned supplier');
    }
    return [...groups].map(([id, name]) => ({ id, name }));
  }

  createShortageOrder(supplierId?: string): void {
    const req = this.selectedRequest;
    if (!req?.hasShortage) return;
    const shortageItems = req.items
      .filter(item => item.shortage > 0 && (supplierId === undefined || (item.supplierId || '') === supplierId))
      .map(item => ({
      _id: item.inventoryId,
      name: item.name,
      sku: item.sku,
      suggestedQuantity: item.shortage,
      unit: item.unit,
      unitCost: item.unitCost,
      itemClass: item.itemClass,
      subcategory: item.subcategory,
      manufacturerPartNumber: item.manufacturerPartNumber,
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      }));
    this.router?.navigate(['/inventory-manager/order-creation/new'], {
      state: { shortageItems, sourceMaterialRequestId: req.sourceMaterialRequestId },
    });
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeModal();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeModal(); }
}
