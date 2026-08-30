import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiService } from '../../../../core/services/api.service';
import { OrderCreationService } from '../../services/order-creation.service';
import { OrderCreationComponent } from './order-creation.component';

describe('OrderCreationComponent HTTP contract', () => {
  let component: OrderCreationComponent;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/inventory`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    component = new OrderCreationComponent(
      TestBed.inject(ApiService),
      {} as OrderCreationService,
      { navigate: jasmine.createSpy() } as unknown as Router,
      { queryParams: of({}) } as ActivatedRoute,
    );
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads order requests and suggested stock from their exact endpoints as one state', () => {
    component.loadData();
    const orderRequest = http.expectOne(`${baseUrl}/order-requests`);
    const suggestionRequest = http.expectOne(`${baseUrl}/suggested-orders`);
    expect(orderRequest.request.method).toBe('GET');
    expect(suggestionRequest.request.method).toBe('GET');

    orderRequest.flush([{
      _id: 'order-1', requestId: 'REQ-001', supplierName: 'Fixture Supplier', totalEstimate: 100,
      status: 'pending-manager', statusVersion: 1, priority: 'normal', requestedBy: 'Fixture User', items: [],
    }]);
    suggestionRequest.flush([{
      _id: 'item-1', name: 'Filter', sku: 'FLT-1', available: 1, reserved: 0,
      reorderLevel: 2, status: 'warning', type: 'Single', category: 'Consumables',
      itemClass: 'Consumables', subcategory: 'Filters', brand: 'Fixture', location: 'Warehouse',
      unit: 'units', unitCost: 100, isSerialized: false,
    }]);

    expect(component.loading).toBeFalse();
    expect(component.pendingOrders[0].requestId).toBe('REQ-001');
    expect(component.suggestedItems[0].sku).toBe('FLT-1');
  });

  it('does not expose partial order state when either initial request fails', () => {
    component.loadData();
    const orderRequest = http.expectOne(`${baseUrl}/order-requests`);
    const suggestionRequest = http.expectOne(`${baseUrl}/suggested-orders`);
    orderRequest.flush([]);
    suggestionRequest.flush({ message: 'Fixture outage' }, { status: 500, statusText: 'Server Error' });

    expect(component.loading).toBeFalse();
    expect(component.loadError).toContain('No partial data');
    expect(component.pendingOrders).toEqual([]);
  });
});
