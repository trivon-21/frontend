import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { StockAdjustDialogComponent } from './stock-adjust-dialog.component';
import { InventoryItem, InventoryManagerDashboardService, StockMovement } from '../../../../services/inventory-manager-dashboard.service';

function inventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    _id: 'item-1',
    name: 'Split AC Scroll Compressor',
    sku: 'AC-COMP-001',
    available: 0,
    reserved: 0,
    reorderLevel: 5,
    maxStockLevel: 20,
    status: 'critical',
    type: 'Single',
    category: 'Spare Parts',
    brand: 'Copeland',
    location: 'A',
    unit: 'units',
    unitCost: 185000,
    isSerialized: false,
    ...overrides,
  };
}

describe('StockAdjustDialogComponent', () => {
  let component: StockAdjustDialogComponent;
  let service: jasmine.SpyObj<InventoryManagerDashboardService>;

  beforeEach(() => {
    service = jasmine.createSpyObj<InventoryManagerDashboardService>(
      'InventoryManagerDashboardService',
      ['adjustStock', 'getStockMovements', 'getItem'],
    );
    service.getStockMovements.and.returnValue(of([] as StockMovement[]));
    component = new StockAdjustDialogComponent(service);
  });

  function openWith(item: InventoryItem): void {
    component.item = item;
    component.open = true;
    component.ngOnChanges({ open: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false } });
  }

  it('resets the form and loads movement history when opened', () => {
    openWith(inventoryItem());
    expect(component.mode).toBe('SET');
    expect(component.reasonCode).toBe('OPENING_BALANCE');
    expect(component.note).toBe('');
    expect(service.getStockMovements).toHaveBeenCalledWith('item-1', { force: true, limit: 20 });
  });

  it('pre-fills the counted quantity from a carried-over shortage', () => {
    component.shortage = { sku: 'AC-COMP-001', required: 6, available: 0 };
    openWith(inventoryItem());
    expect(component.quantity).toBe(6);
  });

  it('computes a preview delta for SET mode', () => {
    openWith(inventoryItem({ available: 10 }));
    component.mode = 'SET';
    component.quantity = 24;
    expect(component.preview).toEqual({ delta: 14, after: 24 });
  });

  it('computes a preview delta for DELTA mode', () => {
    openWith(inventoryItem({ available: 10 }));
    component.mode = 'DELTA';
    component.quantity = -3;
    expect(component.preview).toEqual({ delta: -3, after: 7 });
  });

  it('is invalid when the result would go negative', () => {
    openWith(inventoryItem({ available: 2 }));
    component.mode = 'DELTA';
    component.quantity = -5;
    component.reasonCode = 'SHRINKAGE';
    component.note = 'counted short';
    expect(component.isValid).toBeFalse();
  });

  it('is invalid without a required note', () => {
    openWith(inventoryItem({ available: 2 }));
    component.mode = 'DELTA';
    component.quantity = -1;
    component.reasonCode = 'DAMAGE';
    component.note = '';
    expect(component.isValid).toBeFalse();
    component.note = 'dropped in warehouse';
    expect(component.isValid).toBeTrue();
  });

  it('opening balance needs no note', () => {
    openWith(inventoryItem({ available: 0 }));
    component.mode = 'SET';
    component.quantity = 24;
    component.reasonCode = 'OPENING_BALANCE';
    component.note = '';
    expect(component.isValid).toBeTrue();
  });

  it('submits an adjustment and emits the updated item', () => {
    const updatedItem = inventoryItem({ available: 24 });
    service.adjustStock.and.returnValue(of({ item: updatedItem, movement: {} as StockMovement, duplicate: false }));
    const adjustedSpy = jasmine.createSpy('adjusted');
    component.adjusted.subscribe(adjustedSpy);
    const closedSpy = jasmine.createSpy('closed');
    component.closed.subscribe(closedSpy);

    openWith(inventoryItem({ available: 0 }));
    component.mode = 'SET';
    component.quantity = 24;
    component.reasonCode = 'OPENING_BALANCE';
    component.submit();

    expect(service.adjustStock).toHaveBeenCalledWith('item-1', jasmine.objectContaining({
      mode: 'SET', quantity: 24, reasonCode: 'OPENING_BALANCE', expectedAvailable: 0,
    }));
    expect(adjustedSpy).toHaveBeenCalledWith(updatedItem);
    expect(closedSpy).toHaveBeenCalled();
    expect(component.saving).toBeFalse();
  });

  it('does not submit while invalid or already saving', () => {
    openWith(inventoryItem({ available: 0 }));
    component.quantity = null;
    component.submit();
    expect(service.adjustStock).not.toHaveBeenCalled();
  });

  it('refreshes the item and shows a message on STOCK_CHANGED without closing', () => {
    const staleError = new HttpErrorResponse({ status: 409, error: { code: 'STOCK_CHANGED', message: 'stale' } });
    service.adjustStock.and.returnValue(throwError(() => staleError));
    const freshItem = inventoryItem({ available: 5 });
    service.getItem.and.returnValue(of(freshItem));
    const closedSpy = jasmine.createSpy('closed');
    component.closed.subscribe(closedSpy);

    openWith(inventoryItem({ available: 0 }));
    component.mode = 'SET';
    component.quantity = 24;
    component.submit();

    expect(component.item).toEqual(freshItem);
    expect(component.errorMessage).toContain('refreshed');
    expect(closedSpy).not.toHaveBeenCalled();
    expect(component.saving).toBeFalse();
  });

  it('surfaces a generic error message for other failures', () => {
    // A valid-looking client-side submission (positive result) that the
    // server still rejects for a reason the dialog does not special-case.
    const error = new HttpErrorResponse({ status: 400, error: { code: 'ADJUSTMENT_NOTE_REQUIRED', message: 'A note is required' } });
    service.adjustStock.and.returnValue(throwError(() => error));

    openWith(inventoryItem({ available: 2 }));
    component.mode = 'DELTA';
    component.quantity = 5;
    component.reasonCode = 'SHRINKAGE';
    component.note = 'count';
    component.submit();

    expect(component.errorMessage).toBe('A note is required');
  });

  it('emits closed on cancel and on backdrop click', () => {
    const closedSpy = jasmine.createSpy('closed');
    component.closed.subscribe(closedSpy);
    component.close();
    expect(closedSpy).toHaveBeenCalledTimes(1);

    const sameTarget = {} as EventTarget;
    component.onBackdrop({ target: sameTarget, currentTarget: sameTarget } as unknown as MouseEvent);
    expect(closedSpy).toHaveBeenCalledTimes(2);

    const outerTarget = {} as EventTarget;
    const innerTarget = {} as EventTarget;
    component.onBackdrop({ target: innerTarget, currentTarget: outerTarget } as unknown as MouseEvent);
    expect(closedSpy).toHaveBeenCalledTimes(2);
  });
});
