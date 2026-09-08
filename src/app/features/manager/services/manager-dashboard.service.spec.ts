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
});
