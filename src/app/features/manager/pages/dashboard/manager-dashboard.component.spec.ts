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
      pendingApprovals: {
        total: 3,
        subStats: [
          { label: 'Urgent', value: 1 },
          { label: 'Value', value: 2500 },
          { label: 'Non-PO', value: 1 },
        ],
      },
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

  it('renders interactive summary cards with independent approval destinations', async () => {
    const fixture = await create({ getDashboard: () => of(dashboard) });
    const root = fixture.nativeElement as HTMLElement;
    const summaryCards = Array.from(
      root.querySelectorAll<HTMLElement>('.summary-grid > .summary-card'),
    );
    const ticketCards = Array.from(root.querySelectorAll<HTMLAnchorElement>('a.summary-card'));
    const approvalCard = root.querySelector<HTMLElement>('.approval-card')!;
    const approvalPrimary = approvalCard.querySelector<HTMLAnchorElement>('.approval-card-primary')!;
    const approvalLinks = Array.from(
      approvalCard.querySelectorAll<HTMLAnchorElement>('.approval-links a'),
    );

    expect(summaryCards.length).toBe(4);
    expect(summaryCards.every((card) => card.classList.contains('clickable'))).toBeTrue();
    expect(ticketCards.map((card) => card.getAttribute('href'))).toEqual([
      '/manager/work-items',
      '/manager/work-items?assignment=unassigned',
      '/manager/work-items?sla=overdue',
    ]);
    expect(approvalPrimary.getAttribute('href')).toBe(
      '/manager/orders?type=purchase&status=pending-manager',
    );
    expect(approvalLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/manager/orders?type=purchase&status=pending-manager',
      '/manager/orders?type=non-po&status=pending',
    ]);
    expect(approvalCard.querySelector('a a')).toBeNull();
    expect(approvalPrimary.contains(approvalLinks[0])).toBeFalse();
    expect(approvalPrimary.contains(approvalLinks[1])).toBeFalse();
    expect(root.querySelector('.live-time')).toBeNull();
    const workQueue = root.querySelector<HTMLButtonElement>('.btn-new-order')!;
    expect(workQueue.textContent).toContain('Open Work Queue');
    expect(workQueue.classList).toContain('mgr-btn--primary');
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
    expect(retry.classList).toContain('mgr-btn--compact');

    retry.click();
    fixture.detectChanges();

    expect(getDashboard).toHaveBeenCalledTimes(2);
    expect(root.querySelector('.welcome-title')?.textContent).toContain('Morgan Reed');
    fixture.destroy();
  });
});
