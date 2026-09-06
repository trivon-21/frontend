import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import {
  InventoryManagerDashboardService,
  InventoryItem,
  ReturnsSummary,
  LeftoverReturnItem,
  RmaCaseItem,
  QuarantineItemData,
  HandedOverMaterialRequest,
} from '../../services/inventory-manager-dashboard.service';

@Component({
  selector: 'app-returns-rma-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconsModule],
  templateUrl: './returns-rma.component.html',
  styleUrls: ['./returns-rma.component.css'],
})
export class ReturnsRmaDashboardComponent implements OnInit {
  // Search
  searchQuery = '';

  // Loading & error
  loading = true;
  error: string | null = null;
  submitting = false;
  pendingActionIds = new Set<string>();
  private dialogTrigger: HTMLElement | null = null;
  successMessage: string | null = null;

  // Summary stats
  summary: ReturnsSummary = {
    leftoverReturns: { total: 0, restoredToStock: 0, movedToQuarantine: 0 },
    rmaCases: { total: 0, active: 0 },
    quarantine: { active: 0, disposed: 0 },
  };

  // Leftover return form
  leftoverForm = {
    jobId: '',
    warehousePickRequestId: '',
    warehouseLineId: '',
    statusVersion: 0,
    itemName: '',
    itemId: '',
    itemSku: '',
    quantityReturned: 1,
    condition: 'good' as 'good' | 'damaged' | 'scrap',
    notes: '',
  };
  handedOverRequests: HandedOverMaterialRequest[] = [];

  // Item autocomplete
  inventoryItems: InventoryItem[] = [];
  filteredInventoryItems: InventoryItem[] = [];
  showItemDropdown = false;

  // Leftover returns list
  leftoverReturns: LeftoverReturnItem[] = [];

  // RMA cases
  rmaCases: RmaCaseItem[] = [];
  showRmaModal = false;
  rmaForm = {
    serialNumber: '',
    itemName: '',
    itemSku: '',
    faultDescription: '',
    type: 'Single' as 'Single' | 'Kit' | 'Bundle',
  };

  // Quarantine
  quarantineItems: QuarantineItemData[] = [];
  confirmDisposeId: string | null = null;

  // RMA status labels and allowed transitions
  rmaStatusLabels: Record<string, string> = {
    'reported': 'Reported',
    'under-review': 'Under Review',
    'sent-to-supplier': 'Sent to Supplier',
    'replacement-pending': 'Replacement Pending',
    'resolved': 'Resolved',
    'closed': 'Closed',
  };

  rmaNextStatus: Record<string, string> = {
    'reported': 'under-review',
    'sent-to-supplier': 'replacement-pending',
    'resolved': 'closed',
  };

  // Internal repair modal
  showInternalRepairModal = false;
  internalRepairRma: RmaCaseItem | null = null;
  internalRepairNote = '';

  // Supplier replacement modal
  showReplacementModal = false;
  replacementRma: RmaCaseItem | null = null;
  replacementSerialNumber = '';
  replacementNotes = '';

  constructor(private dashboardService: InventoryManagerDashboardService) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  // ── Data Loading ──

  loadAllData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      summary: this.dashboardService.getReturnsSummary(),
      leftoverReturns: this.dashboardService.getLeftoverReturns(),
      rmaCases: this.dashboardService.getRmaCases(),
      quarantineItems: this.dashboardService.getQuarantineItems(),
      inventoryItems: this.dashboardService.getInventory(),
      handedOverRequests: this.dashboardService.getHandedOverMaterialRequests(),
    }).subscribe({
      next: (data) => {
        this.summary = data.summary;
        this.leftoverReturns = data.leftoverReturns;
        this.rmaCases = data.rmaCases;
        this.quarantineItems = data.quarantineItems;
        this.inventoryItems = data.inventoryItems;
        this.handedOverRequests = data.handedOverRequests;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load returns data. Please try again.';
        this.loading = false;
      },
    });
  }

  refreshData(): void {
    this.loadAllData();
  }

  // ── Leftover Return Form ──

  get selectedHandover(): HandedOverMaterialRequest | undefined {
    return this.handedOverRequests.find(request => request.requestId === this.leftoverForm.warehousePickRequestId);
  }

  selectHandover(requestId: string): void {
    const request = this.handedOverRequests.find(item => item.requestId === requestId);
    this.leftoverForm.jobId = request?.jobId || '';
    this.leftoverForm.statusVersion = request?.statusVersion || 0;
    this.leftoverForm.warehouseLineId = '';
    this.leftoverForm.itemId = '';
    this.leftoverForm.itemName = '';
    this.leftoverForm.itemSku = '';
  }

  selectHandoverLine(lineId: string): void {
    const line = this.selectedHandover?.items.find(item => item.lineId === lineId);
    this.leftoverForm.itemId = line?.inventoryId || '';
    this.leftoverForm.itemName = line?.name || '';
    this.leftoverForm.itemSku = line?.sku || '';
  }

  onItemSearch(query: string): void {
    this.leftoverForm.itemName = query;
    if (query.trim().length < 1) {
      this.filteredInventoryItems = [];
      this.showItemDropdown = false;
      this.leftoverForm.itemId = '';
      this.leftoverForm.itemSku = '';
      return;
    }
    const q = query.toLowerCase();
    this.filteredInventoryItems = this.inventoryItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q),
    ).slice(0, 8);
    this.showItemDropdown = this.filteredInventoryItems.length > 0;
  }

  selectItem(item: InventoryItem): void {
    this.leftoverForm.itemName = item.name;
    this.leftoverForm.itemId = (item as any)._id || item.id;
    this.leftoverForm.itemSku = item.sku;
    this.showItemDropdown = false;
    this.filteredInventoryItems = [];
  }

  hideItemDropdown(): void {
    // Delay to allow click on dropdown item
    setTimeout(() => (this.showItemDropdown = false), 200);
  }

  get isLeftoverFormValid(): boolean {
    return (
      this.leftoverForm.jobId.trim().length > 0 &&
      this.leftoverForm.warehousePickRequestId.trim().length > 0 &&
      this.leftoverForm.warehouseLineId.trim().length > 0 &&
      this.leftoverForm.itemName.trim().length > 0 &&
      this.leftoverForm.quantityReturned > 0 &&
      !!this.leftoverForm.condition
    );
  }

  submitLeftoverReturn(): void {
    if (!this.isLeftoverFormValid || this.submitting) return;
    this.submitting = true;
    this.successMessage = null;

    this.dashboardService.createLeftoverReturn(this.leftoverForm).subscribe({
      next: (result) => {
        this.submitting = false;
        const action = result.restoredToStock ? 'restored to stock' : 'moved to quarantine';
        this.successMessage = `${result.quantityReturned} units of ${result.itemName} ${action} successfully.`;
        this.resetLeftoverForm();
        this.refreshData();
        setTimeout(() => (this.successMessage = null), 5000);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.message || 'Failed to submit leftover return.';
        setTimeout(() => (this.error = null), 5000);
      },
    });
  }

  resetLeftoverForm(): void {
    this.leftoverForm = {
      jobId: '',
      warehousePickRequestId: '',
      warehouseLineId: '',
      statusVersion: 0,
      itemName: '',
      itemId: '',
      itemSku: '',
      quantityReturned: 1,
      condition: 'good',
      notes: '',
    };
  }

  // ── RMA Case ──

  openRmaModal(): void {
    this.dialogTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.rmaForm = {
      serialNumber: '',
      itemName: '',
      itemSku: '',
      faultDescription: '',
      type: 'Single',
    };
    this.showRmaModal = true;
  }

  get matchingRmaAssets(): Array<{ item: InventoryItem; serial: string }> {
    const query = this.rmaForm.serialNumber.toLowerCase().trim();
    if (!query) return [];
    return this.inventoryItems
      .flatMap((item) => (item.serialNumbers || []).map((serial) => ({ item, serial })))
      .filter(({ item, serial }) => serial.toLowerCase().includes(query)
        || item.name.toLowerCase().includes(query)
        || item.sku.toLowerCase().includes(query))
      .slice(0, 8);
  }

  selectRmaAsset(item: InventoryItem, serial: string): void {
    this.rmaForm.serialNumber = serial;
    this.rmaForm.itemName = item.name;
    this.rmaForm.itemSku = item.sku;
    this.rmaForm.type = item.type;
  }

  closeRmaModal(): void {
    if (this.submitting) return;
    this.showRmaModal = false;
    const trigger = this.dialogTrigger;
    this.dialogTrigger = null;
    setTimeout(() => trigger?.focus());
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeRmaModal(); }

  get isRmaFormValid(): boolean {
    return (
      this.rmaForm.serialNumber.trim().length > 0 &&
      this.rmaForm.faultDescription.trim().length > 0
    );
  }

  submitRmaCase(): void {
    if (!this.isRmaFormValid || this.submitting) return;
    this.submitting = true;

    this.dashboardService.createRmaCase(this.rmaForm).subscribe({
      next: () => {
        this.submitting = false;
        this.successMessage = 'RMA case created successfully.';
        this.closeRmaModal();
        this.refreshData();
        setTimeout(() => (this.successMessage = null), 5000);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.message || 'Failed to create RMA case.';
        setTimeout(() => (this.error = null), 5000);
      },
    });
  }

  advanceRmaStatus(rma: RmaCaseItem): void {
    const nextStatus = this.rmaNextStatus[rma.status];
    if (!nextStatus || this.pendingActionIds.has(rma.rmaId)) return;
    this.pendingActionIds.add(rma.rmaId);

    this.dashboardService.updateRmaCase(rma.rmaId, { status: nextStatus }).subscribe({
      next: () => {
        this.pendingActionIds.delete(rma.rmaId);
        this.refreshData();
        this.successMessage = `RMA ${rma.rmaId} moved to ${this.rmaStatusLabels[nextStatus]}.`;
        setTimeout(() => (this.successMessage = null), 5000);
      },
      error: (err) => {
        this.pendingActionIds.delete(rma.rmaId);
        this.error = err.error?.message || 'Failed to update RMA status.';
        setTimeout(() => (this.error = null), 5000);
      },
    });
  }

  getNextStatusLabel(status: string): string {
    const next = this.rmaNextStatus[status];
    return next ? this.rmaStatusLabels[next] : '';
  }

  sendToSupplier(rma: RmaCaseItem): void {
    if (this.pendingActionIds.has(rma.rmaId)) return;
    this.pendingActionIds.add(rma.rmaId);
    this.dashboardService.updateRmaCase(rma.rmaId, { status: 'sent-to-supplier' }).subscribe({
      next: () => {
        this.pendingActionIds.delete(rma.rmaId);
        this.refreshData();
        this.successMessage = `RMA ${rma.rmaId} sent to supplier.`;
        setTimeout(() => (this.successMessage = null), 5000);
      },
      error: (err) => {
        this.pendingActionIds.delete(rma.rmaId);
        this.error = err.error?.message || 'Failed to update RMA status.';
        setTimeout(() => (this.error = null), 5000);
      },
    });
  }

  openInternalRepairModal(rma: RmaCaseItem): void {
    this.internalRepairRma = rma;
    this.internalRepairNote = '';
    this.showInternalRepairModal = true;
  }

  closeInternalRepairModal(): void {
    this.showInternalRepairModal = false;
    this.internalRepairRma = null;
    this.internalRepairNote = '';
  }

  submitInternalRepair(): void {
    if (!this.internalRepairRma || !this.internalRepairNote.trim() || this.submitting) return;
    this.submitting = true;
    const rma = this.internalRepairRma;
    this.dashboardService.updateRmaCase(rma.rmaId, {
      status: 'resolved',
      resolutionType: 'internal-repair',
      resolution: this.internalRepairNote.trim(),
      resolutionNote: this.internalRepairNote.trim(),
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.closeInternalRepairModal();
        this.refreshData();
        this.successMessage = `RMA ${rma.rmaId} resolved via internal repair and returned to service.`;
        setTimeout(() => (this.successMessage = null), 5000);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.message || 'Failed to resolve RMA.';
        setTimeout(() => (this.error = null), 5000);
      },
    });
  }

  openReplacementModal(rma: RmaCaseItem): void {
    this.replacementRma = rma;
    this.replacementSerialNumber = '';
    this.replacementNotes = '';
    this.showReplacementModal = true;
  }

  closeReplacementModal(): void {
    this.showReplacementModal = false;
    this.replacementRma = null;
    this.replacementSerialNumber = '';
    this.replacementNotes = '';
  }

  submitReplacementReceipt(): void {
    if (!this.replacementRma || !this.replacementSerialNumber.trim() || this.submitting) return;
    this.submitting = true;
    const rma = this.replacementRma;
    this.dashboardService.receiveRmaReplacement(rma.rmaId, {
      serialNumber: this.replacementSerialNumber.trim(),
      notes: this.replacementNotes.trim() || undefined,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.closeReplacementModal();
        this.refreshData();
        this.successMessage = `Replacement serial ${this.replacementSerialNumber.trim()} received for RMA ${rma.rmaId}.`;
        setTimeout(() => (this.successMessage = null), 5000);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.message || 'Failed to receive replacement.';
        setTimeout(() => (this.error = null), 5000);
      },
    });
  }

  // ── Quarantine ──

  confirmDispose(quarantineId: string): void {
    this.confirmDisposeId = quarantineId;
  }

  cancelDispose(): void {
    this.confirmDisposeId = null;
  }

  disposeItem(quarantineId: string): void {
    if (this.pendingActionIds.has(quarantineId)) return;
    this.pendingActionIds.add(quarantineId);
    this.dashboardService.disposeQuarantineItem(quarantineId).subscribe({
      next: () => {
        this.pendingActionIds.delete(quarantineId);
        this.confirmDisposeId = null;
        this.successMessage = 'Item disposed successfully.';
        this.refreshData();
        setTimeout(() => (this.successMessage = null), 5000);
      },
      error: (err) => {
        this.pendingActionIds.delete(quarantineId);
        this.confirmDisposeId = null;
        if (err?.status === 409 || err?.error?.code === 'QUARANTINE_ALREADY_DISPOSED') {
          this.error = 'This quarantine item has already been disposed.';
          this.refreshData();
        } else if (err?.status === 404 || err?.error?.code === 'QUARANTINE_NOT_FOUND') {
          this.error = 'Quarantine item could not be found.';
          this.refreshData();
        } else {
          this.error = err?.error?.message || 'Failed to dispose item.';
        }
        setTimeout(() => (this.error = null), 5000);
      },
    });
  }

  // ── Filtering ──

  get filteredRmaCases(): RmaCaseItem[] {
    const query = (this.searchQuery || '').toLowerCase().trim();
    if (!query) return this.rmaCases;
    return this.rmaCases.filter(
      (r) =>
        r.serialNumber?.toLowerCase().includes(query) ||
        r.faultDescription?.toLowerCase().includes(query) ||
        r.reportedBy?.toLowerCase().includes(query) ||
        r.rmaId?.toLowerCase().includes(query),
    );
  }

  get filteredQuarantineItems(): QuarantineItemData[] {
    const query = (this.searchQuery || '').toLowerCase().trim();
    if (!query) return this.quarantineItems;
    return this.quarantineItems.filter(
      (i) =>
        i.itemName?.toLowerCase().includes(query) ||
        i.reason?.toLowerCase().includes(query) ||
        i.location?.toLowerCase().includes(query),
    );
  }

  get filteredLeftoverReturns(): LeftoverReturnItem[] {
    const query = (this.searchQuery || '').toLowerCase().trim();
    if (!query) return this.leftoverReturns;
    return this.leftoverReturns.filter(
      (r) =>
        r.itemName?.toLowerCase().includes(query) ||
        r.jobId?.toLowerCase().includes(query) ||
        r.returnId?.toLowerCase().includes(query),
    );
  }

  // ── Utilities ──

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
