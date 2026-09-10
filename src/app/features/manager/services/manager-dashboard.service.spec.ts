import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';
import { ManagerDashboardData, ManagerDashboardService } from './manager-dashboard.service';

describe('ManagerDashboardService', () => {
  let service: ManagerDashboardService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ManagerDashboardService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ManagerDashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the dashboard contract and hydrates the current date', () => {
    spyOn(Date, 'now').and.returnValue(Date.parse('2026-08-24T12:30:00.000Z'));
    const response = {
      managerName: 'Alex Manager',
      currentDate: '2026-08-24T00:00:00.000Z',
      status: 'Live',
      stats: {
        openTickets: { total: 2, subStats: [] },
        unassignedTickets: { total: 1, subStats: [] },
        slaRisk: { total: 1, subStats: [] },
        pendingApprovals: { total: 3, subStats: [] },
      },
      inventoryKpis: {
        reservedItems: { label: 'Reserved', value: 2, icon: 'package' },
        belowReorderItems: { label: 'Below Reorder', value: 1, icon: 'alert' },
        outOfStockItems: { label: 'Out of Stock', value: 0, icon: 'alert' },
        stockRiskItems: { label: 'Stock Risk', value: 1, icon: 'alert' },
        blockedMaterialRequests: { label: 'Blocked', value: 1, icon: 'alert' },
      },
      pendingActions: [],
      pendingActionsTotal: 0,
    };
    let result: ManagerDashboardData | undefined;

    service.getDashboard().subscribe((data) => (result = data));

    const request = http.expectOne(`${environment.apiUrl}/manager/dashboard`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush(response);

    expect(result?.currentDate).toEqual(new Date('2026-08-24T00:00:00.000Z'));
  });

  it('serves a second subscribe within the TTL from cache, issuing no HTTP request', () => {
    service.getDashboard().subscribe();
    http.expectOne(`${environment.apiUrl}/manager/dashboard`).flush(minimalDashboard());

    let second: ManagerDashboardData | undefined;
    service.getDashboard().subscribe((data) => (second = data));
    http.expectNone(`${environment.apiUrl}/manager/dashboard`);

    expect(second?.status).toBe('Live');
  });

  it('force always issues a fresh HTTP request, bypassing the cache', () => {
    service.getDashboard().subscribe();
    http.expectOne(`${environment.apiUrl}/manager/dashboard`).flush(minimalDashboard());

    let result: ManagerDashboardData | undefined;
    service.getDashboard({ force: true }).subscribe((data) => (result = data));
    const request = http.expectOne(`${environment.apiUrl}/manager/dashboard`);
    request.flush(minimalDashboard());

    expect(request.request.method).toBe('GET');
    expect(result?.status).toBe('Live');
  });

  it('does not cache an errored request; the next call retries against the network', () => {
    let errored = false;
    service.getDashboard().subscribe({ error: () => (errored = true) });
    http.expectOne(`${environment.apiUrl}/manager/dashboard`).flush(
      { message: 'boom' },
      { status: 500, statusText: 'Server Error' },
    );
    expect(errored).toBeTrue();

    service.getDashboard().subscribe();
    http.expectOne(`${environment.apiUrl}/manager/dashboard`).flush(minimalDashboard());
  });

  function minimalDashboard() {
    return {
      managerName: 'Manager',
      currentDate: '2026-08-24T00:00:00.000Z',
      status: 'Live',
      stats: {
        openTickets: { total: 0, subStats: [] },
        unassignedTickets: { total: 0, subStats: [] },
        slaRisk: { total: 0, subStats: [] },
        pendingApprovals: { total: 0, subStats: [] },
      },
      inventoryKpis: {
        reservedItems: { label: 'Reserved', value: 0, icon: 'package' },
        belowReorderItems: { label: 'Below Reorder', value: 0, icon: 'alert' },
        outOfStockItems: { label: 'Out of Stock', value: 0, icon: 'alert' },
        stockRiskItems: { label: 'Stock Risk', value: 0, icon: 'alert' },
        blockedMaterialRequests: { label: 'Blocked', value: 0, icon: 'alert' },
      },
      pendingActions: [],
      pendingActionsTotal: 0,
    };
  }
});
