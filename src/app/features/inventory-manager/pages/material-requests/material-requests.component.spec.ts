import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { ApiService } from '../../../../core/services/api.service';
import { MaterialRequestsDashboardComponent } from './material-requests.component';

describe('MaterialRequestsDashboardComponent HTTP contract', () => {
  let component: MaterialRequestsDashboardComponent;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/inventory/material-requests`;
  const pending = {
    requestId: 'MAT-001', requester: 'Fixture Technician', date: '2026-08-24', location: 'Job 1',
    status: 'pending', items: [{ name: 'Filter', sku: 'FLT-1', qty: 2, confirmed: true }],
    serviceTeam: 'Central Team',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    component = new MaterialRequestsDashboardComponent(TestBed.inject(ApiService));
    http = TestBed.inject(HttpTestingController);
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-08-24T10:30:00.000Z'));
  });

  afterEach(() => {
    http.verify();
    jasmine.clock().uninstall();
  });

  function load(record: Record<string, unknown> = pending): void {
    component.fetchRequests();
    const request = http.expectOne(url);
    expect(request.request.method).toBe('GET');
    request.flush([record]);
    component.openModal(String(record['requestId']));
  }

  it('loads the exact reservations endpoint and maps records by request ID', () => {
    component.fetchRequests();
    const request = http.expectOne(url);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush([pending]);

    expect(component.pendingRequests[0].id).toBe('MAT-001');
    expect(component.loading).toBeFalse();
  });

  it('patches only the staged item reservations', () => {
    load();
    component.saveStatus();
    const request = http.expectOne(`${url}/MAT-001`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ items: pending.items });
    request.flush({ message: 'Fixture rejection' }, { status: 409, statusText: 'Conflict' });
  });

  it('patches only the edited service-team assignment', () => {
    load();
    component.editServiceTeam = 'Northern Team';
    component.saveServiceTeam();
    const request = http.expectOne(`${url}/MAT-001`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ serviceTeam: 'Northern Team' });
    request.flush({ message: 'Fixture rejection' }, { status: 409, statusText: 'Conflict' });
  });

  it('uses the exact pending-to-reserved transition payload', () => {
    load();
    component.markKitted();
    const request = http.expectOne(`${url}/MAT-001`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      status: 'reserved',
      lastMovedAt: '2026-08-24T10:30:00.000Z',
    });
    request.flush({ message: 'Fixture rejection' }, { status: 409, statusText: 'Conflict' });
  });

  it('uses the exact reserved-to-completed and completed undo payloads', () => {
    load({ ...pending, status: 'reserved' });
    component.markHandedOver();
    let request = http.expectOne(`${url}/MAT-001`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      status: 'completed',
      completedAt: '2026-08-24',
      lastMovedAt: '2026-08-24T10:30:00.000Z',
    });
    request.flush({ message: 'Fixture rejection' }, { status: 409, statusText: 'Conflict' });

    load({ ...pending, status: 'completed', completedAt: '2026-08-24' });
    component.undoAction();
    request = http.expectOne(`${url}/MAT-001`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'reserved', completedAt: null, lastMovedAt: null });
    request.flush({ message: 'Fixture rejection' }, { status: 409, statusText: 'Conflict' });
  });
});
