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
    recentActivity: [],
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
      awaitingReceipt: 4,
      awaitingFinance: 1,
    },
    logistics: [
      {
        id: 'ORD-1001',
        orderId: 'ORD-1001',
        customer: 'Colombo Air Care',
        status: 'to-pack',
        statusVersion: 0,
        type: 'standard',
        courier: 'Domestic Express',
        trackId: 'DOM-991',
        itemCount: 2,
        date: '2026-08-24',
      },
      {
        id: 'ORD-1002',
        orderId: 'ORD-1002',
        customer: 'Lanka Tech Solutions',
        status: 'ready',
        statusVersion: 1,
        type: 'express',
        courier: 'DHL Express',
        trackId: 'DHL-882',
        itemCount: 1,
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

  it('renders five distinct workflow stages with stage-specific destinations', async () => {
    const fixture = await create({ getDashboard: () => of(dashboard) });
    const root = fixture.nativeElement as HTMLElement;
    const stages = Array.from(root.querySelectorAll<HTMLElement>('.workflow-stage'));
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('.workflow-card a'));

    expect(stages.length).toBe(5);
    expect(stages.map((stage) => stage.textContent)).toEqual([
      jasmine.stringContaining('Awaiting Manager'),
      jasmine.stringContaining('Awaiting Finance Approval'),
      jasmine.stringContaining('Ready to Issue'),
      jasmine.stringContaining('Ready to Receive'),
      jasmine.stringContaining('Receipt Reconciliation'),
    ]);
    expect(root.querySelector('a.workflow-card')).toBeNull();
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/inventory-manager/order-creation?status=pending-manager',
      '/inventory-manager/procurement?authorizationStatus=pending',
      '/inventory-manager/order-creation?status=pending-finance',
      '/inventory-manager/order-creation?status=approved',
      '/inventory-manager/procurement?mode=PO',
      '/inventory-manager/procurement?mode=NON_PO&authorizationStatus=ready',
      '/inventory-manager/procurement?grnFilter=FINANCE',
    ]);
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
        awaitingReceipt: 0,
        awaitingFinance: 0,
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

  it('renders the dispatch logistics panel with order rows, status badges, courier tracking, and navigation link', async () => {
    const fixture = await create({ getDashboard: () => of(dashboard) });
    const root = fixture.nativeElement as HTMLElement;
    const logisticsCard = root.querySelector<HTMLElement>('.logistics-card')!;
    expect(logisticsCard).not.toBeNull();

    const viewAllLink = logisticsCard.querySelector<HTMLAnchorElement>('.card-header a')!;
    expect(viewAllLink.getAttribute('href')).toBe('/inventory-manager/dispatch-logistics');

    const rows = Array.from(logisticsCard.querySelectorAll<HTMLTableRowElement>('tbody tr'));
    expect(rows.length).toBe(2);

    const firstRow = rows[0];
    expect(firstRow.querySelector('.order-id-link')?.textContent?.trim()).toBe('ORD-1001');
    expect(firstRow.querySelector('.order-customer')?.textContent?.trim()).toBe('Colombo Air Care');
    expect(firstRow.querySelector('.logistics-status-badge')?.textContent?.trim()).toBe('to-pack');
    expect(firstRow.querySelector('.courier-text')?.textContent?.trim()).toBe('Domestic Express');
    expect(firstRow.querySelector('.track-id-text')?.textContent?.trim()).toBe('DOM-991');

    fixture.destroy();
  });

  it('renders empty state in logistics panel when no orders exist', async () => {
    const emptyData = { ...dashboard, logistics: [] };
    const fixture = await create({ getDashboard: () => of(emptyData) });
    const root = fixture.nativeElement as HTMLElement;
    const emptyState = root.querySelector<HTMLElement>('.empty-logistics-state')!;
    expect(emptyState).not.toBeNull();
    expect(emptyState.textContent).toContain('No dispatch orders recorded');
    fixture.destroy();
  });
});
