import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalIconComponent } from '../../../../shared/components/local-icon/local-icon.component';
import {
  InventoryManagerDashboardService,
  InventoryItem,
  ReturnsSummary,
  LeftoverReturnItem,
  RmaCaseItem,
  QuarantineItemData,
} from '../../services/inventory-manager-dashboard.service';

@Component({
  selector: 'app-returns-rma-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LocalIconComponent],
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
    itemName: '',
    itemId: '',
    itemSku: '',
    quantityReturned: 1,
    condition: 'good' as 'good' | 'damaged' | 'scrap',
    notes: '',
  };

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
    'resolved': 'Resolved',
    'closed': 'Closed',
  };

  rmaNextStatus: Record<string, string> = {
    'reported': 'under-review',
    'under-review': 'sent-to-supplier',
    'sent-to-supplier': 'resolved',
    'resolved': 'closed',
  };

  constructor(private dashboardService: InventoryManagerDashboardService) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  // ── Data Loading ──

  loadAllData(): void {
    this.loading = true;
    this.error = null;

    // Load all data in parallel
    this.dashboardService.getReturnsSummary().subscribe((data) => (this.summary = data));
    this.dashboardService.getLeftoverReturns().subscribe((data) => (this.leftoverReturns = data));
    this.dashboardService.getRmaCases().subscribe((data) => (this.rmaCases = data));
    this.dashboardService.getQuarantineItems().subscribe({
      next: (data) => {
        this.quarantineItems = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load returns data. Please try again.';
        this.loading = false;
      },
    });

    // Load inventory for autocomplete
    this.dashboardService.getInventory().subscribe((items) => (this.inventoryItems = items));
  }

  refreshData(): void {
    this.dashboardService.getReturnsSummary().subscribe((data) => (this.summary = data));
    this.dashboardService.getLeftoverReturns().subscribe((data) => (this.leftoverReturns = data));
    this.dashboardService.getRmaCases().subscribe((data) => (this.rmaCases = data));
    this.dashboardService.getQuarantineItems().subscribe((data) => (this.quarantineItems = data));
  }

  // ── Leftover Return Form ──

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
    this.showRmaModal = false;
  }

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
    if (!nextStatus) return;

    this.dashboardService.updateRmaCase(rma.rmaId, { status: nextStatus }).subscribe({
      next: () => {
        this.refreshData();
        this.successMessage = `RMA ${rma.rmaId} moved to ${this.rmaStatusLabels[nextStatus]}.`;
        setTimeout(() => (this.successMessage = null), 5000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update RMA status.';
        setTimeout(() => (this.error = null), 5000);
      },
    });
  }

  getNextStatusLabel(status: string): string {
    const next = this.rmaNextStatus[status];
    return next ? this.rmaStatusLabels[next] : '';
  }

  // ── Quarantine ──

  confirmDispose(quarantineId: string): void {
    this.confirmDisposeId = quarantineId;
  }

  cancelDispose(): void {
    this.confirmDisposeId = null;
  }

  disposeItem(quarantineId: string): void {
    this.dashboardService.disposeQuarantineItem(quarantineId).subscribe({
      next: () => {
        this.confirmDisposeId = null;
        this.successMessage = 'Item disposed successfully.';
        this.refreshData();
        setTimeout(() => (this.successMessage = null), 5000);
      },
      error: (err) => {
        this.confirmDisposeId = null;
        this.error = err.error?.message || 'Failed to dispose item.';
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
