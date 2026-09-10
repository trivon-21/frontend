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

  it('requests the dashboard contract and hydrates current and activity dates', () => {
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
        lowStockAlerts: { label: 'Low stock', value: 1, icon: 'alert' },
        pendingMaterialRequests: { label: 'Pending', value: 3, icon: 'clipboard' },
        blockedMaterialRequests: { label: 'Blocked', value: 1, icon: 'alert' },
      },
      recentActivity: [
        {
          id: 'activity-1',
          type: 'ticket',
          title: 'Ticket updated',
          description: 'A fabricated ticket was updated.',
          timestamp: '2026-08-24T12:00:00.000Z',
          route: '/manager/work-items',
        },
      ],
      pendingActions: [],
    };
    let result: ManagerDashboardData | undefined;

    service.getDashboard().subscribe((data) => (result = data));

    const request = http.expectOne(`${environment.apiUrl}/manager/dashboard`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush(response);

    expect(result?.currentDate).toEqual(new Date('2026-08-24T00:00:00.000Z'));
    expect(result?.recentActivity[0].timestamp).toEqual(new Date('2026-08-24T12:00:00.000Z'));
    expect(result?.recentActivity[0].timeAgo).toBe('30m ago');
  });
});
