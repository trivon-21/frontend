import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';
import { OrderCreationService } from './order-creation.service';
import { PurchaseRequest } from './purchase-workflow';

describe('OrderCreationService HTTP contract', () => {
  let service: OrderCreationService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/inventory`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrderCreationService, ApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrderCreationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the exact inventory, supplier, suggestion, and order-list GET endpoints', () => {
    const reads: Array<[string, () => void]> = [
      ['/list', () => service.getInventory().subscribe()],
      ['/suppliers', () => service.getSuppliers().subscribe()],
      ['/suggested-orders', () => service.getSuggestedItems().subscribe()],
      ['/order-requests', () => service.getOrderRequests().subscribe()],
    ];

    for (const [path, invoke] of reads) {
      invoke();
      const request = http.expectOne(`${baseUrl}${path}`);
      expect(request.request.method).withContext(path).toBe('GET');
      expect(request.request.params.keys()).withContext(path).toEqual([]);
      request.flush([]);
    }
  });

  it('posts a supplier with only its name', () => {
    service.addSupplier('Summit Cooling').subscribe();
    const request = http.expectOne(`${baseUrl}/suppliers`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Summit Cooling' });
    request.flush({ _id: 'supplier-1', name: 'Summit Cooling' });
  });

  it('posts a new draft and patches an existing draft without changing either payload', () => {
    const createPayload = { supplierId: 'supplier-1', supplierName: 'Summit Cooling', items: [] };
    service.submitOrderRequest(createPayload, false).subscribe();
    let request = http.expectOne(`${baseUrl}/order-requests`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(createPayload);
    request.flush({});

    const editPayload = { ...createPayload, statusVersion: 4 };
    service.submitOrderRequest(editPayload, true, 'REQ-001').subscribe();
    request = http.expectOne(`${baseUrl}/order-requests/REQ-001`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(editPayload);
    request.flush({});
  });

  it('retains POST behavior when edit mode has no order ID', () => {
    const payload = { supplierName: 'Summit Cooling', items: [] };
    service.submitOrderRequest(payload, true).subscribe();
    const request = http.expectOne(`${baseUrl}/order-requests`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({});
  });

  it('submits and issues purchase requests with the current status version', () => {
    const order = { requestId: 'REQ-001', statusVersion: 6 } as PurchaseRequest;
    service.submitForManager(order).subscribe();
    let request = http.expectOne(`${baseUrl}/order-requests/REQ-001/submit`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ statusVersion: 6 });
    request.flush(order);

    service.issuePurchaseOrder(order).subscribe();
    request = http.expectOne(`${baseUrl}/order-requests/REQ-001/issue-po`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ statusVersion: 6 });
    request.flush(order);
  });
});
