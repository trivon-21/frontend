import { FormBuilder } from '@angular/forms';
import { convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { InventoryManagerDashboardService } from '../../services/inventory-manager-dashboard.service';
import { ReceiptAuthorization } from '../../services/purchase-workflow';
import { ConfirmService } from '../../../../services/confirm.service';
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
      unit: 'units', location: 'A', binLocation: 'A102', isSerialized: false,
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

  function create(params: Record<string, string> = {}, summaryOverrides: Record<string, unknown> = {}) {
    const service = jasmine.createSpyObj<InventoryManagerDashboardService>(
      'InventoryManagerDashboardService',
      ['getProcurementSummary', 'getProcurements', 'getInventory', 'getOrderRequests', 'getReceiptAuthorizations', 'getReceiptDiscrepancies', 'getLocations', 'receiveInventory', 'getSuppliers', 'createReceiptAuthorization'],
    );
    service.getSuppliers.and.returnValue(of([]));
    service.getProcurementSummary.and.returnValue(of({
      procurements: [],
      inventoryItems: [],
      orderRequests: [],
      authorizations: [newItemAuthorization],
      discrepancies: [],
      locations: [
        { warehouse: 'A', racks: [{ rackTag: 'R1', bins: ['A101', 'A102'] }, { rackTag: 'R2', bins: ['A201', 'A202'] }] },
        { warehouse: 'C', racks: [{ rackTag: 'R1', bins: ['C101', 'C102'] }] },
      ],
      ...summaryOverrides,
    } as any));
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
    const confirmService = jasmine.createSpyObj<ConfirmService>('ConfirmService', ['confirm']);
    const component = new ProcurementDashboardComponent(new FormBuilder(), service, confirmService, route as never);
    component.ngOnInit();
    return { component, service, confirmService };
  }

  it('finishes loading when a ready-to-receive PO is present and no line is selected yet', () => {
    const { component } = create({}, {
      inventoryItems: [{ _id: 'item-1', name: 'Copper Piping', sku: 'PIPE-CU-025', unit: 'meters', isSerialized: false }],
      orderRequests: [{
        _id: 'order-1',
        requestId: 'REQ-1',
        status: 'ordered',
        workflowStages: ['ready-to-receive'],
        items: [{ lineId: 'line-1', inventoryId: 'item-1', name: 'Copper Piping', quantity: 10, receivedQuantity: 0 }],
      }],
    });

    expect(component.loading).toBeFalse();
    expect(component.loadError).toBe('');
    expect(component.purchaseOrders.length).toBe(1);
  });

  it('loads the page from the bundled summary rather than fanning out per-entity requests', () => {
    const { service } = create();

    expect(service.getProcurementSummary).toHaveBeenCalledTimes(1);
    expect(service.getProcurements).not.toHaveBeenCalled();
    expect(service.getInventory).not.toHaveBeenCalled();
    expect(service.getOrderRequests).not.toHaveBeenCalled();
    expect(service.getReceiptAuthorizations).not.toHaveBeenCalled();
    expect(service.getReceiptDiscrepancies).not.toHaveBeenCalled();
    expect(service.getLocations).not.toHaveBeenCalled();
  });

  it('honors dashboard workflow query parameters', () => {
    const { component } = create({ mode: 'NON_PO', grnFilter: 'FINANCE' });

    expect(component.receiptMode).toBe('NON_PO');
    expect(component.grnFilter).toBe('FINANCE');
    expect(component.authorizations).toEqual([newItemAuthorization]);
  });

  it('receives an approved new-item authorization without inventing an inventory id', () => {
    const { component, service } = create({ mode: 'NON_PO' });
    component.nonPoAction = 'receive';
    component.selectAuthorization(newItemAuthorization);
    component.receiptForm.patchValue({
      source: { sourceDocumentNumber: 'DELIVERY-1', receivedDate: '2026-09-02', condition: 'Good' },
      stock: { quantity: 2, location: 'A', rackTag: 'R1', binLocation: 'A102' },
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
    component.nonPoAction = 'receive';
    component.selectAuthorization({ ...newItemAuthorization, authorizedQuantity: 3 });
    component.receiptForm.patchValue({
      source: { sourceDocumentNumber: 'DELIVERY-2', receivedDate: '2026-09-02', condition: 'Incomplete' },
      stock: {
        quantity: 3, acceptedQuantity: 1, damagedQuantity: 0, missingQuantity: 2,
        location: 'A', rackTag: 'R1', binLocation: 'A102',
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
    component.nonPoAction = 'receive';
    component.selectAuthorization(newItemAuthorization);
    component.receiptForm.get('source.condition')?.setValue('Damaged');

    expect(component.acceptedQuantity).toBe(0);
    expect(component.damagedQuantity).toBe(2);
    expect(component.receiptBreakdownValid).toBeTrue();
  });

  it('blocks posting when the disposition does not equal the expected delivery', () => {
    const { component } = create({ mode: 'NON_PO' });
    component.nonPoAction = 'receive';
    component.selectAuthorization(newItemAuthorization);
    component.receiptForm.patchValue({
      source: { sourceDocumentNumber: 'DELIVERY-3', receivedDate: '2026-09-02', condition: 'Incomplete' },
      stock: {
        quantity: 2, acceptedQuantity: 1, damagedQuantity: 0, missingQuantity: 0,
        location: 'A', rackTag: 'R1', binLocation: 'A102',
      },
    });
    component.currentStep = 3;

    expect(component.receiptBreakdownValid).toBeFalse();
    expect(component.canGoNext()).toBeFalse();
  });

  it('rejects a rack from a different warehouse in the receipt form', () => {
    const { component } = create({ mode: 'NON_PO' });
    component.nonPoAction = 'receive';
    component.selectAuthorization(newItemAuthorization);
    component.receiptForm.get('stock')?.patchValue({
      location: 'C',
      rackTag: 'R1',
      binLocation: 'A102',
    });

    expect(component.receiptForm.get('stock')?.hasError('storageLocation')).toBeTrue();
  });

  it('narrows bins to the selected rack and clears a bin from another rack', () => {
    const { component } = create({ mode: 'NON_PO' });
    component.nonPoAction = 'receive';
    component.selectAuthorization(newItemAuthorization);
    component.receiptForm.get('stock')?.patchValue({ location: 'A', rackTag: 'R2', binLocation: 'A102' });
    component.onRackChange();

    expect(component.availableBins).toEqual(['A201', 'A202']);
    expect(component.receiptForm.get('stock.binLocation')?.value).toBe('');
  });

  it('initializes receivedDate with business date string', () => {
    const { component } = create();
    const receivedDate = component.receiptForm.get('source.receivedDate')?.value;
    expect(receivedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

