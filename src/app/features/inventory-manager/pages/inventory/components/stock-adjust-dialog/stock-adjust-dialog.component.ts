import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PortalIconsModule } from '../../../../../../shared/components/portal-icons/portal-icons.module';
import { InventoryManagerDashboardService } from '../../../../services/inventory-manager-dashboard.service';
import {
  InventoryItem,
  STOCK_ADJUSTMENT_REASONS,
  StockAdjustmentMode,
  StockAdjustmentReasonCode,
  StockMovement,
} from '../../../../services/inventory-domain';

interface ShortageDetail {
  sku?: string;
  required?: number;
  available?: number;
}

@Component({
  selector: 'app-stock-adjust-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconsModule],
  templateUrl: './stock-adjust-dialog.component.html',
  styleUrls: ['./stock-adjust-dialog.component.css'],
})
export class StockAdjustDialogComponent implements OnChanges {
  @Input() open = false;
  @Input() item: InventoryItem | null = null;
  /**
   * Shortage carried over from a failed reservation elsewhere (e.g. the
   * material-requests page), so the item's own available quantity is
   * pre-filled as the obvious opening balance to enter.
   */
  @Input() shortage: ShortageDetail | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() adjusted = new EventEmitter<InventoryItem>();

  readonly reasons = STOCK_ADJUSTMENT_REASONS;

  mode: StockAdjustmentMode = 'SET';
  quantity: number | null = null;
  reasonCode: StockAdjustmentReasonCode = 'OPENING_BALANCE';
  note = '';
  saving = false;
  errorMessage = '';

  movements: StockMovement[] = [];
  movementsLoading = false;

  private eventId = '';

  constructor(private inventoryService: InventoryManagerDashboardService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.resetForm();
      this.loadMovements();
    }
  }

  get requiresNote(): boolean {
    return this.reasons.find((reason) => reason.code === this.reasonCode)?.requiresNote ?? true;
  }

  get preview(): { delta: number; after: number } | null {
    if (!this.item || this.quantity === null || !Number.isInteger(this.quantity)) return null;
    const current = Number(this.item.available) || 0;
    const after = this.mode === 'SET' ? this.quantity : current + this.quantity;
    return { delta: after - current, after };
  }

  get isValid(): boolean {
    if (this.quantity === null || !Number.isInteger(this.quantity)) return false;
    if (this.mode === 'SET' && this.quantity < 0) return false;
    if (this.mode === 'DELTA' && this.quantity === 0) return false;
    if (this.requiresNote && !this.note.trim()) return false;
    const preview = this.preview;
    return !!preview && preview.after >= 0;
  }

  private resetForm(): void {
    this.mode = 'SET';
    // A shortage carried in from elsewhere pre-fills the counted quantity a
    // stock-take would need to clear it — the manager can still change it.
    this.quantity = this.shortage?.required ?? null;
    this.reasonCode = 'OPENING_BALANCE';
    this.note = '';
    this.errorMessage = '';
    this.saving = false;
    this.eventId = (crypto as { randomUUID?: () => string })?.randomUUID?.()
      || `adj-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private loadMovements(): void {
    const id = this.itemId;
    if (!id) return;
    this.movementsLoading = true;
    this.inventoryService.getStockMovements(id, { force: true, limit: 20 }).subscribe({
      next: (movements) => { this.movements = movements; this.movementsLoading = false; },
      error: () => { this.movementsLoading = false; },
    });
  }

  get itemId(): string | undefined {
    return this.item?._id || this.item?.id;
  }

  onModeChange(): void {
    // Switching mode changes what "quantity" means; clear it rather than
    // silently reinterpreting a number the manager already typed.
    this.quantity = null;
  }

  submit(): void {
    if (!this.item || !this.itemId || !this.isValid || this.saving) return;
    this.saving = true;
    this.errorMessage = '';
    this.inventoryService.adjustStock(this.itemId, {
      mode: this.mode,
      quantity: this.quantity as number,
      reasonCode: this.reasonCode,
      note: this.note.trim(),
      expectedAvailable: Number(this.item.available) || 0,
      adjustmentEventId: this.eventId,
    }).subscribe({
      next: (result) => {
        this.saving = false;
        this.adjusted.emit(result.item);
        this.close();
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        if (error.error?.code === 'STOCK_CHANGED' && this.itemId) {
          // Reload the live item so the manager retries against current
          // figures instead of hammering a stale expectedAvailable.
          this.inventoryService.getItem(this.itemId, { force: true }).subscribe((fresh) => {
            this.item = fresh;
            this.errorMessage = 'Stock changed since this dialog opened — figures refreshed, review and try again.';
          });
          return;
        }
        this.errorMessage = error.error?.message || 'The adjustment could not be saved.';
      },
    });
  }

  close(): void {
    this.closed.emit();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }
}
