import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { ApiService } from '../../../../core/services/api.service';
import { DispatchLogisticsDashboardComponent } from './dispatch-logistics.component';

describe('DispatchLogisticsDashboardComponent HTTP contract', () => {
  let component: DispatchLogisticsDashboardComponent;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/inventory/orders`;
  const toPack = {
    orderId: 'DSP-001', customer: 'Fixture Customer', status: 'to-pack', type: 'Delivery',
    date: '2026-08-24', items: [{ name: 'Filter', sku: 'FLT-1', qty: 1, confirmed: true }],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    component = new DispatchLogisticsDashboardComponent(TestBed.inject(ApiService));
    http = TestBed.inject(HttpTestingController);
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-08-24T10:30:00.000Z'));
  });

  afterEach(() => {
    http.verify();
    jasmine.clock().uninstall();
  });

  function load(record: Record<string, unknown> = toPack): void {
    component.fetchOrders();
    const request = http.expectOne(url);
    expect(request.request.method).toBe('GET');
    request.flush([record]);
  }

  it('loads the exact logistics endpoint and maps records by order ID', () => {
    load();
    expect(component.ordersToPack[0].id).toBe('DSP-001');
    expect(component.loading).toBeFalse();
  });

  it('patches only the staged packing items', () => {
    load();
    component.openPackModal('DSP-001');
    component.saveStatus();
    const request = http.expectOne(`${url}/DSP-001`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ items: toPack.items });
    request.flush({ message: 'Fixture rejection' }, { status: 409, statusText: 'Conflict' });
  });

  it('uses the exact courier assignment transition payload', () => {
    load();
    component.selectOrder('DSP-001');
    component.courierService = 'Fixture Courier';
    component.trackingId = 'TRACK-001';
    component.completeAssignment();
    const request = http.expectOne(`${url}/DSP-001`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      status: 'ready',
      courier: 'Fixture Courier',
      trackId: 'TRACK-001',
      lastMovedAt: '2026-08-24T10:30:00.000Z',
    });
    request.flush({ message: 'Fixture rejection' }, { status: 409, statusText: 'Conflict' });
  });

  it('freezes in-transit, completed, and undo transition payloads', () => {
    load({ ...toPack, status: 'ready' });
    component.openAssignModal('DSP-001');
    component.markHandedOver();
    let request = http.expectOne(`${url}/DSP-001`);
    expect(request.request.body).toEqual({
      status: 'in-transit',
      lastMovedAt: '2026-08-24T10:30:00.000Z',
    });
    request.flush({ message: 'Fixture rejection' }, { status: 409, statusText: 'Conflict' });

    load({ ...toPack, status: 'in-transit' });
    component.openAssignModal('DSP-001');
    component.markComplete();
    request = http.expectOne(`${url}/DSP-001`);
    expect(request.request.body).toEqual({
      status: 'completed',
      completedAt: '2026-08-24',
      lastMovedAt: '2026-08-24T10:30:00.000Z',
    });
    request.flush({ message: 'Fixture rejection' }, { status: 409, statusText: 'Conflict' });

    load({ ...toPack, status: 'completed', completedAt: '2026-08-24' });
    component.openAssignModal('DSP-001');
    component.undoAction();
    request = http.expectOne(`${url}/DSP-001`);
    expect(request.request.body).toEqual({ status: 'in-transit', completedAt: null, lastMovedAt: null });
    request.flush({ message: 'Fixture rejection' }, { status: 409, statusText: 'Conflict' });
  });
});
