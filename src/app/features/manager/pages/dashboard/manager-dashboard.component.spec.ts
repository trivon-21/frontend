import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ManagerDashboardData, ManagerDashboardService } from '../../services/manager-dashboard.service';
import { ManagerDashboardComponent } from './manager-dashboard.component';

describe('ManagerDashboardComponent presentation contract', () => {
  const dashboard: ManagerDashboardData = {
    managerName: 'Morgan Reed',
    currentDate: new Date('2026-08-24T09:30:00.000Z'),
    status: 'Live',
    stats: {
      openTickets: { total: 8, subStats: [] },
      unassignedTickets: { total: 2, subStats: [] },
      slaRisk: { total: 1, subStats: [] },
      pendingApprovals: { total: 3, subStats: [] },
    },
    inventoryKpis: {
      reservedItems: { label: 'Reserved Items', value: 4, icon: 'clipboard-check' },
      lowStockAlerts: { label: 'Low Stock Alerts', value: 2, icon: 'triangle-alert' },
      pendingMaterialRequests: { label: 'Pending Material Requests', value: 5, icon: 'package' },
      blockedMaterialRequests: { label: 'Blocked Material Requests', value: 1, icon: 'triangle-alert' },
    },
    recentActivity: [],
    pendingActions: [],
  };

  async function create(
    dashboardService: Pick<ManagerDashboardService, 'getDashboard'>,
  ): Promise<ComponentFixture<ManagerDashboardComponent>> {
    await TestBed.configureTestingModule({
      imports: [ManagerDashboardComponent],
      providers: [
        { provide: ManagerDashboardService, useValue: dashboardService },
        provideRouter([]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ManagerDashboardComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders navigation-only summary cards as semantic links with unchanged destinations', async () => {
    const fixture = await create({ getDashboard: () => of(dashboard) });
    const root = fixture.nativeElement as HTMLElement;
    const cards = Array.from(root.querySelectorAll<HTMLAnchorElement>('a.summary-card'));

    expect(cards.length).toBe(4);
    expect(cards.map((card) => card.getAttribute('href'))).toEqual([
      '/manager/work-items',
      '/manager/work-items?assignment=unassigned',
      '/manager/work-items?sla=overdue',
      '/manager/orders?status=pending-manager',
    ]);
    fixture.destroy();
  });

  it('keeps the dashboard retry action available after a load failure', async () => {
    const getDashboard = jasmine.createSpy().and.returnValues(
      throwError(() => new Error('offline')),
      of(dashboard),
    );
    const fixture = await create({ getDashboard });
    const root = fixture.nativeElement as HTMLElement;

    const retry = root.querySelector<HTMLButtonElement>('.portal-retry-button')!;
    expect(root.querySelector('[role="alert"]')).not.toBeNull();
    expect(retry.disabled).toBeFalse();

    retry.click();
    fixture.detectChanges();

    expect(getDashboard).toHaveBeenCalledTimes(2);
    expect(root.querySelector('.welcome-title')?.textContent).toContain('Morgan Reed');
    fixture.destroy();
  });
});
