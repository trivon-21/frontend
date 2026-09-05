import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { ApiService } from '../../../../core/services/api.service';
import { AssetManagementDashboardComponent } from './asset-management.component';

describe('AssetManagementDashboardComponent HTTP contract', () => {
  let component: AssetManagementDashboardComponent;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/inventory`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    component = new AssetManagementDashboardComponent(TestBed.inject(ApiService));
    http = TestBed.inject(HttpTestingController);
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-08-24T10:30:00.000Z'));
  });

  afterEach(() => {
    http.verify();
    jasmine.clock().uninstall();
  });

  it('loads all four tool-lending resources atomically from exact endpoints', () => {
    component.fetchData();
    const fixtures: Array<[string, object]> = [
      ['/technicians', [{ _id: 'technician-1', name: 'Fixture Technician' }]],
      ['/available-tools', [{ _id: 'tool-1', name: 'Vacuum Pump', availableSerialNumbers: ['TAG-1'] }]],
      ['/asset-loans', [{
        _id: 'loan-1', toolId: 'tool-1', toolName: 'Vacuum Pump', assetTag: 'TAG-2',
        technicianId: 'technician-1', technicianName: 'Fixture Technician',
        checkedOutAt: '2026-08-20T00:00:00.000Z', dueDate: '2026-08-25T00:00:00.000Z',
      }]],
      ['/asset-return-logs', []],
    ];
    for (const [path, body] of fixtures) {
      const request = http.expectOne(`${baseUrl}${path}`);
      expect(request.request.method).withContext(path).toBe('GET');
      request.flush(body);
    }

    expect(component.loading).toBeFalse();
    expect(component.loans[0].status).toBe('On Time');
  });

  it('posts the exact serialized-tool checkout payload', () => {
    component.technicians = [{ _id: 'technician-1', name: 'Fixture Technician' }];
    component.tools = [{ _id: 'tool-1', name: 'Vacuum Pump', availableSerialNumbers: ['TAG-1'] }];
    component.selectedTechnicianId = 'technician-1';
    component.selectedToolId = 'tool-1';
    component.selectedAssetTag = 'TAG-1';
    component.dueDate = '2026-08-30';

    component.checkOut();
    const request = http.expectOne(`${baseUrl}/asset-loans`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      toolId: 'tool-1',
      toolName: 'Vacuum Pump',
      assetTag: 'TAG-1',
      technicianId: 'technician-1',
      technicianName: 'Fixture Technician',
      dueDate: '2026-08-30',
    });
    request.flush({ message: 'Fixture rejection' }, { status: 409, statusText: 'Conflict' });
  });

  it('posts the selected return condition to the exact tool-return endpoint', () => {
    component.returnConditions['loan-1'] = 'damaged';
    component.markReturned('loan-1');
    const request = http.expectOne(`${baseUrl}/asset-loans/return/loan-1`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ condition: 'damaged' });
    request.flush({ message: 'Fixture rejection' }, { status: 409, statusText: 'Conflict' });
  });

  it('manages return modal state and posts condition with notes when confirmed', () => {
    const loan = {
      _id: 'loan-42',
      toolId: 'tool-42',
      toolName: 'Manifold Gauge',
      assetTag: 'TAG-42',
      technicianId: 'tech-1',
      technicianName: 'Alice Tech',
      checkedOutAt: '2026-08-20T00:00:00.000Z',
      dueDate: '2026-08-25T00:00:00.000Z',
    };

    component.openReturnModal(loan);
    expect(component.showReturnModal).toBeTrue();
    expect(component.activeReturnLoan).toBe(loan);
    expect(component.returnCondition).toBe('good');

    component.returnCondition = 'damaged';
    component.returnNotes = 'Cracked sight glass';
    component.confirmReturn();

    const request = http.expectOne(`${baseUrl}/asset-loans/return/loan-42`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      condition: 'damaged',
      notes: 'Cracked sight glass',
    });
    request.flush({ success: true });

    // Expect data refresh calls after successful return
    http.expectOne(`${baseUrl}/asset-loans`).flush([]);
    http.expectOne(`${baseUrl}/asset-return-logs`).flush([]);
    http.expectOne(`${baseUrl}/available-tools`).flush([]);

    expect(component.showReturnModal).toBeFalse();
    expect(component.activeReturnLoan).toBeNull();
  });
});
