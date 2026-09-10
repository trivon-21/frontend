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
    expect(component.pendingManagerOrders[0].requestId).toBe('REQ-001');
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
    expect(component.pendingManagerOrders).toEqual([]);
  });

  it('selects Manager and Finance queues from dashboard query parameters', () => {
    const financeComponent = new OrderCreationComponent(
      TestBed.inject(ApiService),
      {} as OrderCreationService,
      { navigate: jasmine.createSpy() } as unknown as Router,
      { queryParams: of({ status: 'pending-finance' }) } as unknown as ActivatedRoute,
    );

    financeComponent.ngOnInit();

    expect(financeComponent.activeTab).toBe('pending-finance');
    http.expectOne(`${baseUrl}/order-requests`).flush([]);
    http.expectOne(`${baseUrl}/suggested-orders`).flush([]);
  });

  it('normalizes legacy statuses and populates allOrders and drafts', () => {
    component.loadData();
    http.expectOne(`${baseUrl}/order-requests`).flush([
      { _id: 'o-1', requestId: 'REQ-DRAFT', status: 'draft', supplierName: 'Sup A', items: [], totalEstimate: 50 },
      { _id: 'o-2', requestId: 'REQ-LEGACY', status: 'APPROVED', supplierName: 'Sup B', items: [], totalEstimate: 150 },
    ]);
    http.expectOne(`${baseUrl}/suggested-orders`).flush([]);

    expect(component.allOrders.length).toBe(2);
    expect(component.draftOrders.length).toBe(1);
    expect(component.approvedOrders.length).toBe(1);
    expect(component.approvedOrders[0].status).toBe('approved');
  });

  it('filters currentOrders across fields using searchQuery', () => {
    component.loadData();
    http.expectOne(`${baseUrl}/order-requests`).flush([
      { _id: 'o-1', requestId: 'REQ-100', status: 'draft', supplierName: 'Alpha Tech', items: [], totalEstimate: 50 },
      { _id: 'o-2', requestId: 'REQ-200', status: 'approved', supplierName: 'Beta Supplies', items: [], totalEstimate: 150 },
    ]);
    http.expectOne(`${baseUrl}/suggested-orders`).flush([]);

    component.setActiveTab('all');
    expect(component.currentOrders.length).toBe(2);

    component.searchQuery = 'Alpha';
    expect(component.currentOrders.length).toBe(1);
    expect(component.currentOrders[0].requestId).toBe('REQ-100');

    component.searchQuery = 'Beta';
    expect(component.currentOrders.length).toBe(1);
    expect(component.currentOrders[0].requestId).toBe('REQ-200');

    component.searchQuery = 'nonexistent';
    expect(component.currentOrders.length).toBe(0);
  });

  it('submits drafts directly via submitDraft', () => {
    const mockOrderService = jasmine.createSpyObj<OrderCreationService>('OrderCreationService', ['submitForManager']);
    mockOrderService.submitForManager.and.returnValue(of({} as any));

    const testComp = new OrderCreationComponent(
      TestBed.inject(ApiService),
      mockOrderService,
      { navigate: jasmine.createSpy() } as unknown as Router,
      { queryParams: of({}) } as ActivatedRoute,
    );

    const draftOrder: any = { _id: 'o-1', requestId: 'REQ-SUBMIT', status: 'draft', statusVersion: 1 };
    testComp.submitDraft(draftOrder);

    expect(mockOrderService.submitForManager).toHaveBeenCalledWith(draftOrder);
    http.expectOne(`${baseUrl}/order-requests`).flush([]);
    http.expectOne(`${baseUrl}/suggested-orders`).flush([]);
    expect(testComp.successMessage).toContain('REQ-SUBMIT');
  });

  it('leverages TtlCacheService and invalidates cache on submitDraft and issuePurchaseOrder', () => {
    const mockTtlCache = {
      observe: jasmine.createSpy('observe').and.callFake((key: string, ttl: number, factory: () => any) => factory()),
      force: jasmine.createSpy('force').and.callFake((key: string, ttl: number, factory: () => any) => factory()),
      invalidate: jasmine.createSpy('invalidate'),
    };
    const mockOrderService = jasmine.createSpyObj<OrderCreationService>('OrderCreationService', ['submitForManager', 'issuePurchaseOrder']);
    mockOrderService.submitForManager.and.returnValue(of({} as any));
    mockOrderService.issuePurchaseOrder.and.returnValue(of({} as any));

    const cachedComp = new OrderCreationComponent(
      TestBed.inject(ApiService),
      mockOrderService,
      { navigate: jasmine.createSpy() } as unknown as Router,
      { queryParams: of({}) } as ActivatedRoute,
      mockTtlCache as any
    );

    cachedComp.loadData();
    expect(mockTtlCache.observe).toHaveBeenCalledWith('inventory:order-requests', 30000, jasmine.any(Function));
    expect(mockTtlCache.observe).toHaveBeenCalledWith('inventory:suggested-orders', 30000, jasmine.any(Function));
    http.expectOne(`${baseUrl}/order-requests`).flush([]);
    http.expectOne(`${baseUrl}/suggested-orders`).flush([]);

    const draftOrder: any = { _id: 'o-1', requestId: 'REQ-1', status: 'draft', statusVersion: 1 };
    cachedComp.submitDraft(draftOrder);
    expect(mockTtlCache.invalidate).toHaveBeenCalledWith('inventory:');
    expect(mockTtlCache.force).toHaveBeenCalledWith('inventory:order-requests', 30000, jasmine.any(Function));
    expect(mockTtlCache.force).toHaveBeenCalledWith('inventory:suggested-orders', 30000, jasmine.any(Function));
    http.expectOne(`${baseUrl}/order-requests`).flush([]);
    http.expectOne(`${baseUrl}/suggested-orders`).flush([]);

    const approvedOrder: any = { _id: 'o-2', requestId: 'REQ-2', status: 'approved', statusVersion: 1 };
    cachedComp.issuePurchaseOrder(approvedOrder);
    expect(mockTtlCache.invalidate).toHaveBeenCalledWith('inventory:');
    http.expectOne(`${baseUrl}/order-requests`).flush([]);
    http.expectOne(`${baseUrl}/suggested-orders`).flush([]);
  });
});
