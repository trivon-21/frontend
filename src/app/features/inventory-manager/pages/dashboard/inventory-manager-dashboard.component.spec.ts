import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  InventoryDashboardData,
  InventoryManagerDashboardService,
} from '../../services/inventory-manager-dashboard.service';
import { InventoryManagerDashboardComponent } from './inventory-manager-dashboard.component';

describe('InventoryManagerDashboardComponent presentation contract', () => {
  const dashboard: InventoryDashboardData = {
    managerName: 'Ishara Perera',
    currentDate: new Date('2026-08-24T09:30:00.000Z'),
    status: 'Online',
    stats: {
      materialReservations: { total: 8, subStats: [] },
      dispatchQueue: { total: 4, subStats: [] },
      assetHealth: { total: 12, subStats: [] },
      stockAlerts: { total: 3, subStats: [] },
    },
    recentActivity: [
      { id: 'act-1', type: 'grn', title: 'GRN-2201 received', description: '', timestamp: new Date('2026-08-24T08:00:00.000Z'), timeAgo: '1h ago' },
      { id: 'act-2', type: 'dispatch', title: 'ORD-1001 packed', description: '', timestamp: new Date('2026-08-24T07:00:00.000Z'), timeAgo: '2h ago' },
      { id: 'act-3', type: 'request', title: 'MR-301 reserved', description: '', timestamp: new Date('2026-08-24T06:00:00.000Z'), timeAgo: '3h ago' },
    ],
    reorderList: [],
    procurementWorkflow: {
      awaitingManager: 2,
      awaitingFinanceApproval: 1,
      readyToIssue: 3,
      readyToReceive: 4,
      awaitingReceiptReconciliation: 1,
      breakdown: {
        awaitingManager: { purchaseRequests: 1, receiptAuthorizations: 1 },
        readyToReceive: { purchaseOrders: 3, receiptAuthorizations: 1 },
      },
    },
    logistics: [
      {
        orderId: 'ORD-1001',
        customer: 'Colombo Air Care',
        status: 'to-pack',
        courier: 'Domestic Express',
        trackId: 'DOM-991',
        date: '2026-08-24',
      },
      {
        orderId: 'ORD-1002',
        customer: 'Lanka Tech Solutions',
        status: 'ready',
        courier: 'DHL Express',
        trackId: 'DHL-882',
        date: '2026-08-24',
      },
    ],
  };

  async function create(
    dashboardService: Pick<InventoryManagerDashboardService, 'getDashboard'>,
  ): Promise<ComponentFixture<InventoryManagerDashboardComponent>> {
    await TestBed.configureTestingModule({
      imports: [InventoryManagerDashboardComponent],
      providers: [
        { provide: InventoryManagerDashboardService, useValue: dashboardService },
        provideRouter([]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryManagerDashboardComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the four navigation metrics as semantic links', async () => {
    const fixture = await create({ getDashboard: () => of(dashboard) });
    const cards = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('a.summary-card'),
    );

    expect(cards.map((card) => card.getAttribute('href'))).toEqual([
      '/inventory-manager/material-requests',
      '/inventory-manager/dispatch-logistics',
      '/inventory-manager/asset-management',
      '/inventory-manager/inventory',
    ]);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.live-time')).toBeNull();
    expect(root.querySelector<HTMLButtonElement>('.btn-new-order')?.textContent).toContain('Create New Order');
    const reorderRegion = root.querySelector<HTMLElement>('.reorder-card .alx-table-container')!;
    const reorderTable = reorderRegion.querySelector<HTMLTableElement>('.alx-table')!;
    expect(reorderRegion.getAttribute('role')).toBe('region');
    expect(reorderRegion.tabIndex).toBe(0);
    expect(reorderTable.classList).toContain('alx-table--fixed');
    expect(reorderTable.classList).toContain('alx-table--sticky-header');
    fixture.destroy();
  });

  it('renders only the two dashboard panels (reorder list + activity feed), no workflow funnel or logistics table', async () => {
    const fixture = await create({ getDashboard: () => of(dashboard) });
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.workflow-stage')).toBeNull();
    expect(root.querySelector('.logistics-card')).toBeNull();

    const activityCard = root.querySelector<HTMLElement>('.activity-card')!;
    expect(activityCard).not.toBeNull();
    expect(activityCard.textContent).toContain('Recent Activity');

    const viewAllLink = activityCard.querySelector<HTMLAnchorElement>('.view-all-link');
    expect(viewAllLink?.getAttribute('href')).toBe('/inventory-manager/activity-log');

    const items = Array.from(activityCard.querySelectorAll<HTMLElement>('.timeline-item'));
    expect(items.length).toBe(3);
    fixture.destroy();
  });

  it('keeps Retry available after a dashboard load failure and avoids false zero metrics', async () => {
    const getDashboard = jasmine.createSpy().and.returnValues(
      throwError(() => ({ error: { message: 'Inventory dashboard is currently unavailable' } })),
      of(dashboard),
    );
    const fixture = await create({ getDashboard });
    const root = fixture.nativeElement as HTMLElement;
    const retry = root.querySelector<HTMLButtonElement>('.portal-retry-button')!;

    expect(root.querySelector('[role="alert"]')).not.toBeNull();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Inventory dashboard is currently unavailable');
    expect(root.querySelectorAll('a.summary-card').length).toBe(0);
    expect(retry.disabled).toBeFalse();
    retry.click();
    fixture.detectChanges();

    expect(getDashboard).toHaveBeenCalledTimes(2);
    expect(root.querySelector('.welcome-title')?.textContent).toContain('Welcome back');
    expect(root.querySelectorAll('a.summary-card').length).toBe(4);
    fixture.destroy();
  });

  it('preserves the last successful view labelled as stale when a subsequent refresh fails', async () => {
    const getDashboard = jasmine.createSpy().and.returnValues(
      of(dashboard),
      throwError(() => ({ error: { message: 'Temporary network disconnect' } })),
    );
    const fixture = await create({ getDashboard });
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('a.summary-card').length).toBe(4);
    expect(root.querySelector('.status-badge')?.textContent).toContain('Online');
    expect(root.querySelector('.stale-banner')).toBeNull();

    // Trigger second load which fails
    fixture.componentInstance.loadData();
    fixture.detectChanges();

    expect(getDashboard).toHaveBeenCalledTimes(2);
    expect(root.querySelector('[role="alert"]')).not.toBeNull();
    expect(root.querySelector('.stale-banner')).not.toBeNull();
    expect(root.querySelector('.status-badge')?.textContent).toContain('Stale');
    // Cards from the first successful load are preserved
    expect(root.querySelectorAll('a.summary-card').length).toBe(4);
    fixture.destroy();
  });

  it('renders valid zero totals when the service successfully returns an empty dataset', async () => {
    const emptyDashboardData: InventoryDashboardData = {
      managerName: 'Test Manager',
      currentDate: new Date('2026-08-24T00:00:00.000Z'),
      status: 'Operational',
      stats: {
        materialReservations: { total: 0, subStats: [] },
        dispatchQueue: { total: 0, subStats: [] },
        assetHealth: { total: 0, subStats: [] },
        stockAlerts: { total: 0, subStats: [] },
      },
      recentActivity: [],
      reorderList: [],
      procurementWorkflow: {
        awaitingManager: 0,
        awaitingFinanceApproval: 0,
        readyToIssue: 0,
        readyToReceive: 0,
        awaitingReceiptReconciliation: 0,
        breakdown: {
          awaitingManager: { purchaseRequests: 0, receiptAuthorizations: 0 },
          readyToReceive: { purchaseOrders: 0, receiptAuthorizations: 0 },
        },
      },
      logistics: [],
    };
    const fixture = await create({ getDashboard: () => of(emptyDashboardData) });
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[role="alert"]')).toBeNull();
    expect(root.querySelector('.status-badge')?.textContent).toContain('Operational');
    const cards = Array.from(root.querySelectorAll('a.summary-card .card-value'));
    expect(cards.map((c) => c.textContent?.trim())).toEqual(['0', '0', '0', '0']);
    fixture.destroy();
  });

  it('requests dashboard with force: true when retry button is clicked', async () => {
    const getDashboard = jasmine.createSpy().and.returnValues(
      throwError(() => ({ error: { message: 'Network error' } })),
      of(dashboard),
    );
    const fixture = await create({ getDashboard });
    const root = fixture.nativeElement as HTMLElement;
    const retry = root.querySelector<HTMLButtonElement>('.portal-retry-button')!;

    expect(getDashboard).toHaveBeenCalledWith({});
    retry.click();
    fixture.detectChanges();

    expect(getDashboard).toHaveBeenCalledWith({ force: true });
    fixture.destroy();
  });

  it('keeps data visible and avoids resetting loading spinner when re-fetching already loaded data', async () => {
    const getDashboard = jasmine.createSpy().and.returnValue(of(dashboard));
    const fixture = await create({ getDashboard });
    const comp = fixture.componentInstance;

    expect(comp.hasLoadedSuccess).toBeTrue();
    expect(comp.loading).toBeFalse();

    comp.loadData();
    expect(comp.loading).toBeFalse();
    expect(comp.hasLoadedSuccess).toBeTrue();
    fixture.destroy();
  });
});
