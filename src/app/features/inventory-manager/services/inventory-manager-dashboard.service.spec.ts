import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  InventoryManagerDashboardService,
  normalizeInventoryDashboard,
} from './inventory-manager-dashboard.service';

describe('normalizeInventoryDashboard', () => {
  it('preserves complete live dashboard data', () => {
    const data = normalizeInventoryDashboard({
      managerName: 'Inventory Manager',
      currentDate: new Date('2026-08-24T00:00:00.000Z'),
      status: 'Live',
      stats: {
        materialReservations: { total: 3, subStats: [{ label: 'Pending', value: 2 }] },
        dispatchQueue: { total: 4, subStats: [] },
        assetHealth: { total: 5, subStats: [] },
        stockAlerts: { total: 6, subStats: [] },
      },
      recentActivity: [],
      reorderList: [],
      procurementWorkflow: {
        awaitingManager: 3,
        awaitingFinanceApproval: 1,
        readyToIssue: 2,
        readyToReceive: 4,
        awaitingReceiptReconciliation: 1,
        breakdown: {
          awaitingManager: { purchaseRequests: 2, receiptAuthorizations: 1 },
          readyToReceive: { purchaseOrders: 3, receiptAuthorizations: 1 },
        },
        awaitingReceipt: 4,
        awaitingFinance: 1,
      },
    });

    expect(data.stats.materialReservations.total).toBe(3);
    expect(data.procurementWorkflow.readyToReceive).toBe(4);
    expect(data.procurementWorkflow.awaitingFinanceApproval).toBe(1);
    expect(data.procurementWorkflow.breakdown.awaitingManager.receiptAuthorizations).toBe(1);
  });

  it('fills every nested collection and procurement count in an incomplete HTTP-200 fallback', () => {
    const data = normalizeInventoryDashboard({ status: 'Offline', stats: {} as never });

    expect(data.recentActivity).toEqual([]);
    expect(data.reorderList).toEqual([]);
    expect(data.stats.stockAlerts).toEqual({ total: 0, subStats: [] });
    expect(data.procurementWorkflow.readyToReceive).toBe(0);
    expect(data.procurementWorkflow.awaitingReceiptReconciliation).toBe(0);
  });

  it('maps legacy three-stage responses into safe compatibility defaults', () => {
    const data = normalizeInventoryDashboard({
      procurementWorkflow: { awaitingManager: 1, awaitingReceipt: 2, awaitingFinance: 3 } as never,
    });

    expect(data.procurementWorkflow.readyToReceive).toBe(2);
    expect(data.procurementWorkflow.awaitingReceiptReconciliation).toBe(3);
    expect(data.procurementWorkflow.awaitingFinanceApproval).toBe(0);
    expect(data.procurementWorkflow.readyToIssue).toBe(0);
  });
});

describe('InventoryManagerDashboardService HTTP contract', () => {
  let service: InventoryManagerDashboardService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/inventory`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InventoryManagerDashboardService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(InventoryManagerDashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    jasmine.clock().uninstall();
  });

  it('requests and hydrates the dashboard DTO', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-08-24T12:30:00.000Z'));
    let result: ReturnType<typeof normalizeInventoryDashboard> | undefined;

    service.getDashboard().subscribe((value) => (result = value));
    const request = http.expectOne(`${baseUrl}/dashboard`);
    expect(request.request.method).toBe('GET');
    request.flush({
      managerName: 'Inventory Manager',
      currentDate: '2026-08-24T00:00:00.000Z',
      status: 'Live',
      stats: {
        materialReservations: { total: 1, subStats: [] },
        dispatchQueue: { total: 2, subStats: [] },
        assetHealth: { total: 3, subStats: [] },
        stockAlerts: { total: 4, subStats: [] },
      },
      recentActivity: [{
        id: 'activity-1', type: 'request', title: 'Request created', description: 'Fixture',
        timestamp: '2026-08-24T12:00:00.000Z',
      }],
      reorderList: [],
      procurementWorkflow: {
        awaitingManager: 1,
        awaitingFinanceApproval: 2,
        readyToIssue: 3,
        readyToReceive: 4,
        awaitingReceiptReconciliation: 5,
        breakdown: {
          awaitingManager: { purchaseRequests: 1, receiptAuthorizations: 0 },
          readyToReceive: { purchaseOrders: 3, receiptAuthorizations: 1 },
        },
        awaitingReceipt: 4,
        awaitingFinance: 5,
      },
    });

    expect(result?.currentDate).toEqual(new Date('2026-08-24T00:00:00.000Z'));
    expect(result?.recentActivity[0].timestamp).toEqual(new Date('2026-08-24T12:00:00.000Z'));
    expect(result?.recentActivity[0].timeAgo).toBe('30m ago');
  });

  it('uses the exact read-only inventory and procurement endpoints', () => {
    const reads: Array<[string, () => void]> = [
      ['/list', () => service.getInventory().subscribe()],
      ['/locations', () => service.getLocations().subscribe()],
      ['/item/item-1', () => service.getItem('item-1').subscribe()],
      ['/suppliers', () => service.getSuppliers().subscribe()],
      ['/procurements', () => service.getProcurements().subscribe()],
      ['/order-requests', () => service.getOrderRequests().subscribe()],
      ['/returns-summary', () => service.getReturnsSummary().subscribe()],
      ['/leftover-returns', () => service.getLeftoverReturns().subscribe()],
      ['/rma-cases', () => service.getRmaCases().subscribe()],
      ['/quarantine', () => service.getQuarantineItems().subscribe()],
    ];

    for (const [path, invoke] of reads) {
      invoke();
      const request = http.expectOne(`${baseUrl}${path}`);
      expect(request.request.method).withContext(path).toBe('GET');
      expect(request.request.params.keys()).withContext(path).toEqual([]);
      request.flush(path === '/returns-summary' ? {} : []);
    }
  });

  it('uses exact catalog, supplier, and receipt write contracts', () => {
    const update = { name: 'Updated Compressor', reorderLevel: 4 };
    service.updateItem('item-1', update as never).subscribe();
    let request = http.expectOne(`${baseUrl}/item/item-1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(update);
    request.flush({});

    const item = { sku: 'COMP-1', name: 'Compressor' };
    service.addItem(item as never).subscribe();
    request = http.expectOne(`${baseUrl}/item`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(item);
    request.flush({});

    service.addSupplier('Summit Cooling').subscribe();
    request = http.expectOne(`${baseUrl}/suppliers`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Summit Cooling' });
    request.flush({});

    const receipt = {
      receiptMode: 'PO', orderRequestId: 'order-1', orderLineId: 'line-1', quantity: 2,
      sourceDocumentNumber: 'INV-1', receiptEventId: 'event-1', serialNumbers: [],
    };
    service.receiveInventory(receipt).subscribe();
    request = http.expectOne(`${baseUrl}/receipts`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(receipt);
    request.flush({ item: {}, procurement: {} });
  });

  it('omits an absent receipt-authorization filter and serializes a supplied status', () => {
    service.getReceiptAuthorizations().subscribe();
    let request = http.expectOne(`${baseUrl}/receipt-authorizations`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.has('status')).toBeFalse();
    request.flush([]);

    service.getReceiptAuthorizations('approved').subscribe();
    request = http.expectOne(`${baseUrl}/receipt-authorizations?status=approved`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('status')).toBe('approved');
    request.flush([]);

    const payload = {
      nonPoReason: 'EMERGENCY_REPAIR', authorizedQuantity: 2, unitCost: 500,
      explanation: 'Urgent repair', sourceDocumentNumber: 'Q-1', supplierId: 'supplier-1',
    };
    service.createReceiptAuthorization(payload).subscribe();
    request = http.expectOne(`${baseUrl}/receipt-authorizations`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({});
  });

  it('hydrates activity timestamps and relative time', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-08-24T13:00:00.000Z'));
    let timestamp: Date | undefined;
    let timeAgo: string | undefined;

    service.getActivityLog().subscribe((items) => {
      timestamp = items[0].timestamp;
      timeAgo = items[0].timeAgo;
    });
    const request = http.expectOne(`${baseUrl}/activity`);
    expect(request.request.method).toBe('GET');
    request.flush([{
      id: 'activity-1', type: 'grn', title: 'Goods received', description: 'Fixture',
      timestamp: '2026-08-24T11:00:00.000Z',
    }]);

    expect(timestamp).toEqual(new Date('2026-08-24T11:00:00.000Z'));
    expect(timeAgo).toBe('2h ago');
  });

  it('uses exact returns, RMA, and quarantine mutation contracts', () => {
    const cases: Array<[string, string, unknown, () => void]> = [
      ['/leftover-returns', 'POST', { jobId: 'JOB-1', quantityReturned: 2 }, () =>
        service.createLeftoverReturn({ jobId: 'JOB-1', quantityReturned: 2 }).subscribe()],
      ['/rma-cases', 'POST', { serialNumber: 'TAG-1', faultDescription: 'No power' }, () =>
        service.createRmaCase({ serialNumber: 'TAG-1', faultDescription: 'No power' }).subscribe()],
      ['/rma-cases/RMA-1', 'PATCH', { status: 'under-review' }, () =>
        service.updateRmaCase('RMA-1', { status: 'under-review' }).subscribe()],
      ['/quarantine', 'POST', { itemName: 'Damaged filter', quantity: 1, reason: 'Cracked' }, () =>
        service.createQuarantineItem({ itemName: 'Damaged filter', quantity: 1, reason: 'Cracked' }).subscribe()],
      ['/quarantine/QZ-1/dispose', 'PATCH', {}, () => service.disposeQuarantineItem('QZ-1').subscribe()],
    ];

    for (const [path, method, body, invoke] of cases) {
      invoke();
      const request = http.expectOne(`${baseUrl}${path}`);
      expect(request.request.method).withContext(path).toBe(method);
      expect(request.request.body).withContext(path).toEqual(body);
      request.flush({});
    }
  });
});
