import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';
import { OrdersService, PurchaseRequest, ReceiptAuthorization } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let http: HttpTestingController;

  const order = {
    _id: 'order-1',
    requestId: 'REQ-001',
    statusVersion: 4,
  } as PurchaseRequest;
  const authorization = {
    _id: 'authorization-1',
    authorizationNumber: 'NPO-001',
    statusVersion: 7,
  } as ReceiptAuthorization;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrdersService, ApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrdersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('omits the default order status and serializes a non-default status', () => {
    service.getOrders().subscribe();
    const allRequest = http.expectOne(`${environment.apiUrl}/manager/orders`);
    expect(allRequest.request.method).toBe('GET');
    expect(allRequest.request.params.has('status')).toBeFalse();
    allRequest.flush({ status: 'Live', summary: {}, orders: [] });

    service.getOrders('pending-manager').subscribe();
    const filteredRequest = http.expectOne(
      `${environment.apiUrl}/manager/orders?status=pending-manager`,
    );
    expect(filteredRequest.request.method).toBe('GET');
    expect(filteredRequest.request.params.get('status')).toBe('pending-manager');
    filteredRequest.flush({ status: 'Live', summary: {}, orders: [] });
  });

  it('sends the exact purchase decision URL and versioned PATCH payload', () => {
    service.decide(order, 'rejected', 'Insufficient justification').subscribe();

    const request = http.expectOne(`${environment.apiUrl}/manager/orders/order-1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      decision: 'rejected',
      comment: 'Insufficient justification',
      statusVersion: 4,
    });
    request.flush(order);
  });

  it('omits the default receipt status and serializes a non-default status', () => {
    service.getReceiptAuthorizations().subscribe();
    const allRequest = http.expectOne(`${environment.apiUrl}/manager/receipt-authorizations`);
    expect(allRequest.request.method).toBe('GET');
    expect(allRequest.request.params.has('status')).toBeFalse();
    allRequest.flush([]);

    service.getReceiptAuthorizations('pending').subscribe();
    const filteredRequest = http.expectOne(
      `${environment.apiUrl}/manager/receipt-authorizations?status=pending`,
    );
    expect(filteredRequest.request.method).toBe('GET');
    expect(filteredRequest.request.params.get('status')).toBe('pending');
    filteredRequest.flush([]);
  });

  it('sends the exact receipt decision URL and versioned POST payload', () => {
    service.decideReceiptAuthorization(authorization, 'approved', 'Operationally required').subscribe();

    const request = http.expectOne(
      `${environment.apiUrl}/manager/receipt-authorizations/authorization-1/decision`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      decision: 'approved',
      comment: 'Operationally required',
      statusVersion: 7,
    });
    request.flush(authorization);
  });
});
