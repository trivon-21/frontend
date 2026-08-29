import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { ApiService } from '../../../../core/services/api.service';
import { MaterialRequestsDashboardComponent } from './material-requests.component';

describe('MaterialRequestsDashboardComponent workflow contract', () => {
  let component: MaterialRequestsDashboardComponent;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/inventory/material-requests`;
  const pending = {
    requestId: 'WPR-001', sourceMaterialRequestId: '65d1f1000000000000000001', requester: 'Fixture Technician',
    date: '2026-08-29', location: 'Fixture job', status: 'pending', statusVersion: 2, hasShortage: false,
    items: [{ lineId: 'line-1', inventoryId: '65d1f1000000000000000002', name: 'Filter', sku: 'FLT-1', qty: 2,
      confirmed: false, available: 4, shortage: 0, unit: 'units' }],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ApiService, provideHttpClient(), provideHttpClientTesting()] });
    component = new MaterialRequestsDashboardComponent(TestBed.inject(ApiService));
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function load(record: Record<string, unknown> = pending): void {
    component.fetchRequests();
    http.expectOne(url).flush([record]);
    component.openModal(String(record['requestId']));
  }

  it('loads linked warehouse requests with shortage state', () => {
    component.fetchRequests();
    const request = http.expectOne(url);
    expect(request.request.method).toBe('GET');
    request.flush([pending]);
    expect(component.pendingRequests[0].sourceMaterialRequestId).toBe(pending.sourceMaterialRequestId);
    expect(component.pendingRequests[0].items[0].available).toBe(4);
  });

  it('persists one line confirmation with optimistic versioning', () => {
    load();
    component.confirmItem(component.selectedRequest!.items[0]);
    const request = http.expectOne(`${url}/WPR-001/items/line-1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ confirmed: true, statusVersion: 2 });
    request.flush({ ...pending, statusVersion: 3 });
    http.expectOne(url).flush([pending]);
  });

  it('uses explicit reserve, release and handover commands', () => {
    load({ ...pending, items: [{ ...pending.items[0], confirmed: true }] });
    component.markKitted();
    let request = http.expectOne(`${url}/WPR-001/reserve`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ statusVersion: 2 });
    request.flush({});
    http.expectOne(url).flush([]);

    load({ ...pending, status: 'reserved', assignedTeamId: '65d1f1000000000000000003', assignedTeamName: 'Fixture Team' });
    component.markHandedOver();
    request = http.expectOne(`${url}/WPR-001/handover`);
    expect(request.request.body).toEqual({ statusVersion: 2 });
    request.flush({});
    http.expectOne(url).flush([]);

    load({ ...pending, status: 'reserved' });
    component.undoAction();
    request = http.expectOne(`${url}/WPR-001/release`);
    expect(request.request.body).toEqual({ statusVersion: 2 });
    request.flush({});
    http.expectOne(url).flush([]);
  });

  it('does not allow completed handovers to be undone', () => {
    load({ ...pending, status: 'completed' });
    expect(component.canUndo(component.selectedRequest)).toBeFalse();
    component.undoAction();
  });
});
