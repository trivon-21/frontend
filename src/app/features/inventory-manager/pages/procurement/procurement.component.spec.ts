import { FormBuilder } from '@angular/forms';
import { convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { InventoryManagerDashboardService } from '../../services/inventory-manager-dashboard.service';
import { ReceiptAuthorization } from '../../services/purchase-workflow';
import { ProcurementDashboardComponent } from './procurement.component';

describe('ProcurementDashboardComponent workflow queues', () => {
  const newItemAuthorization: ReceiptAuthorization = {
    _id: 'authorization-1',
    authorizationNumber: 'NPO-TEST-001',
    nonPoReason: 'LOCAL_PURCHASE',
    explanation: 'Fabricated test authorization',
    newItemSnapshot: {
      name: 'Fabricated filter', sku: 'TEST-FILTER-1', brand: 'Fixture',
      itemClass: 'Consumables', subcategory: 'Disposable Filter', type: 'Single',
      unit: 'units', location: 'Central Warehouse', binLocation: 'Consumables Storage', isSerialized: false,
      reorderLevel: 1, maxStockLevel: 5, unitCost: 100,
    },
    supplierId: 'supplier-1',
    supplierName: 'Fixture Supplier',
    authorizedQuantity: 2,
    receivedQuantity: 0,
    unitCost: 100,
    estimatedTotal: 200,
    affectedWorkType: 'NONE',
    sourceDocumentNumber: 'SOURCE-1',
    requestedByName: 'Fixture User',
    status: 'approved',
    financeReviewStatus: 'pending',
    statusVersion: 1,
    workflowStages: ['ready-to-receive'],
  };

  function create(params: Record<string, string> = {}) {
    const service = jasmine.createSpyObj<InventoryManagerDashboardService>(
      'InventoryManagerDashboardService',
      ['getProcurements', 'getInventory', 'getOrderRequests', 'getReceiptAuthorizations', 'getReceiptDiscrepancies', 'getLocations', 'receiveInventory'],
    );
    service.getProcurements.and.returnValue(of([]));
    service.getInventory.and.returnValue(of([]));
    service.getOrderRequests.and.returnValue(of([]));
    service.getReceiptAuthorizations.and.returnValue(of([newItemAuthorization]));
    service.getReceiptDiscrepancies.and.returnValue(of([]));
    service.getLocations.and.returnValue(of([
      { warehouse: 'Central Warehouse', placementAreas: ['Consumables Storage', 'Small Parts Racking'] },
      { warehouse: 'Service Warehouse', placementAreas: ['Tool Crib'] },
    ]));
    service.receiveInventory.and.returnValue(of({
      item: { ...newItemAuthorization.newItemSnapshot, available: 2, reserved: 0, status: 'normal', category: 'Consumables' } as never,
      procurement: {
        _id: 'procurement-1', acceptedQuantity: 2, damagedQuantity: 0, missingQuantity: 0,
        acceptedTotalCost: 200, disputedTotalCost: 0,
      },
      discrepancy: null,
      quarantine: null,
    }));
    const route = { snapshot: { queryParamMap: convertToParamMap(params) } };
    const component = new ProcurementDashboardComponent(new FormBuilder(), service, route as never);
    component.ngOnInit();
    return { component, service };
  }

  it('honors dashboard workflow query parameters', () => {
    const { component } = create({ mode: 'NON_PO', authorizationStatus: 'ready', grnFilter: 'FINANCE' });

    expect(component.receiptMode).toBe('NON_PO');
    expect(component.authorizationStatus).toBe('ready');
    expect(component.grnFilter).toBe('FINANCE');
    expect(component.filteredAuthorizationQueue).toEqual([newItemAuthorization]);
  });

  it('receives an approved new-item authorization without inventing an inventory id', () => {
    const { component, service } = create({ mode: 'NON_PO' });
    component.selectAuthorization(newItemAuthorization);
    component.receiptForm.patchValue({
      source: { sourceDocumentNumber: 'DELIVERY-1', receivedDate: '2026-09-02', condition: 'Good' },
      stock: { quantity: 2, location: 'Central Warehouse', binLocation: 'Consumables Storage' },
    });
    component.currentStep = 3;

    component.onSubmit();

    const payload = service.receiveInventory.calls.mostRecent().args[0];
    expect(payload['inventoryId']).toBeUndefined();
    expect(payload['receiptAuthorizationId']).toBe('authorization-1');
    expect(payload['receiptMode']).toBe('NON_PO');
    expect(payload['acceptedQuantity']).toBe(2);
    expect(payload['damagedQuantity']).toBe(0);
    expect(payload['missingQuantity']).toBe(0);
  });

  it('submits an incomplete delivery with only accepted units destined for stock', () => {
    const { component, service } = create({ mode: 'NON_PO' });
    component.selectAuthorization({ ...newItemAuthorization, authorizedQuantity: 3 });
    component.receiptForm.patchValue({
      source: { sourceDocumentNumber: 'DELIVERY-2', receivedDate: '2026-09-02', condition: 'Incomplete' },
      stock: {
        quantity: 3, acceptedQuantity: 1, damagedQuantity: 0, missingQuantity: 2,
        location: 'Central Warehouse', binLocation: 'Consumables Storage',
      },
    });
    component.currentStep = 3;

    component.onSubmit();

    const payload = service.receiveInventory.calls.mostRecent().args[0];
    expect(payload.acceptedQuantity).toBe(1);
    expect(payload.missingQuantity).toBe(2);
    expect(payload.condition).toBe('Incomplete');
  });

  it('defaults a damaged delivery to quarantine-only disposition', () => {
    const { component } = create({ mode: 'NON_PO' });
    component.selectAuthorization(newItemAuthorization);
    component.receiptForm.get('source.condition')?.setValue('Damaged');

    expect(component.acceptedQuantity).toBe(0);
    expect(component.damagedQuantity).toBe(2);
    expect(component.receiptBreakdownValid).toBeTrue();
  });

  it('blocks posting when the disposition does not equal the expected delivery', () => {
    const { component } = create({ mode: 'NON_PO' });
    component.selectAuthorization(newItemAuthorization);
    component.receiptForm.patchValue({
      source: { sourceDocumentNumber: 'DELIVERY-3', receivedDate: '2026-09-02', condition: 'Incomplete' },
      stock: {
        quantity: 2, acceptedQuantity: 1, damagedQuantity: 0, missingQuantity: 0,
        location: 'Central Warehouse', binLocation: 'Consumables Storage',
      },
    });
    component.currentStep = 3;

    expect(component.receiptBreakdownValid).toBeFalse();
    expect(component.canGoNext()).toBeFalse();
  });

  it('rejects a placement area from a different warehouse in the receipt form', () => {
    const { component } = create({ mode: 'NON_PO' });
    component.selectAuthorization(newItemAuthorization);
    component.receiptForm.get('stock')?.patchValue({
      location: 'Service Warehouse',
      binLocation: 'Consumables Storage',
    });

    expect(component.receiptForm.get('stock')?.hasError('storageLocation')).toBeTrue();
  });
});
