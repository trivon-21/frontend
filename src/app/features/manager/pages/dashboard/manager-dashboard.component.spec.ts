import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ManagerDashboardData, ManagerDashboardService } from '../../services/manager-dashboard.service';
import { AnalyticsData, AnalyticsService } from '../../services/analytics.service';
import { ManagerDashboardComponent } from './manager-dashboard.component';

describe('ManagerDashboardComponent presentation contract', () => {
  const analytics: Partial<AnalyticsData> = {
    period: '7d',
    status: 'Operational',
    generatedAt: new Date('2026-08-24T09:30:00.000Z'),
    performance: {
      ticketsCreated: { current: 10, previous: 8, deltaPercent: 25, deltaKind: 'percent', semantic: 'neutral' },
      ticketsResolved: { current: 7, previous: 5, deltaPercent: 40, deltaKind: 'percent', semantic: 'higher-is-better' },
      averageResolutionHours: { current: 4.5, previous: 6.0, deltaPercent: -25, deltaKind: 'percent', semantic: 'lower-is-better' },
      purchaseRequestCount: { current: 4, previous: 2, deltaPercent: 100, deltaKind: 'percent', semantic: 'neutral' },
      purchaseRequestValue: { current: 95000, previous: 50000, deltaPercent: 90, deltaKind: 'percent', semantic: 'neutral' },
      managerDecisions: { current: 3, previous: 2, deltaPercent: 50, deltaKind: 'percent', semantic: 'neutral' },
      financeDecisions: { current: 2, previous: 1, deltaPercent: 100, deltaKind: 'percent', semantic: 'neutral' },
    },
    financial: {
      collectedRevenue: { current: 450000, previous: 400000, deltaPercent: 12.5, deltaKind: 'percent', semantic: 'higher-is-better' },
      procurementSpend: { current: 120000, previous: 100000, deltaPercent: 20, deltaKind: 'percent', semantic: 'neutral' },
      operatingContribution: { current: 330000, previous: 300000, deltaPercent: 10, deltaKind: 'percent', semantic: 'higher-is-better' },
      outstandingReceivables: { count: 4, value: 80000, scope: 'current-snapshot', asOf: new Date() },
      pendingPaymentReview: { count: 1, value: 20000, scope: 'current-snapshot', asOf: new Date() },
      purchaseCommitments: { value: 65000, scope: 'current-snapshot', asOf: new Date() },
      unreconciledNonPo: { count: 0, value: 0, scope: 'current-snapshot', asOf: new Date() },
      revenueBySource: [],
      spendByMode: [],
      trend: { labels: ['Day 1'], collectedRevenue: [450000], procurementSpend: [120000] },
      basis: 'cash-collected-vs-goods-received',
    },
    purchasing: {
      currentPipeline: [{ status: 'pending-manager', count: 3, value: 85000 }],
      periodDecisions: [],
      averageManagerApprovalHours: 2.1,
      averageFinanceApprovalHours: 3.5,
      poProgress: { orderedQuantity: 10, receivedQuantity: 8, orderedValue: 100000, receivedValue: 80000 },
      pendingApprovalValue: { value: 85000, scope: 'current-snapshot', asOf: new Date() },
      oldestPendingAgeHours: 12,
    },
    inventoryRisk: {
      lowStockItems: { value: 2, scope: 'current-snapshot', asOf: new Date() },
      outOfStockItems: { value: 1, scope: 'current-snapshot', asOf: new Date() },
      reservedUnits: { value: 4, scope: 'current-snapshot', asOf: new Date() },
      pendingMaterialRequests: { value: 3, scope: 'current-snapshot', asOf: new Date() },
      approvedAwaitingReceipt: { value: 2, scope: 'current-snapshot', asOf: new Date() },
      topRisks: [],
    },
    exceptions: {
      nonPoCount: 2,
      nonPoValue: 15000,
      emergencyCount: 1,
      emergencyValue: 8000,
      nonPoPercentage: 8,
      averageAuthorizationHours: 1.5,
      awaitingFinance: { value: 1, scope: 'current-snapshot', asOf: new Date() },
      awaitingReceipt: { value: 1, scope: 'current-snapshot', asOf: new Date() },
      byReason: [],
      bySupplier: [],
      repeatedSkus: [],
      authorizedValue: 15000,
      receivedAuthorizedValue: 10000,
      slaProtectedJobs: 1,
    },
    dataCoverage: [],
  };

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
          { label: 'Value', value: 85000 },
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
    recentActivity: [
      {
        id: 'act-1',
        type: 'ticket',
        title: 'Resolved SVC-001',
        description: 'Compressor repaired',
        timestamp: new Date('2026-08-24T08:00:00.000Z'),
        timeAgo: '1h ago',
        route: '/manager/work-items',
      },
    ],
    pendingActions: [
      {
        id: 'order-1',
        type: 'approval',
        approvalType: 'purchase',
        category: 'approval',
        title: 'Review Purchase Request: PR-1049',
        description: 'Global HVAC Supplies · 3 line items',
        priority: 'high',
        amount: 85000,
        supplierName: 'Global HVAC Supplies',
        itemsCount: 3,
        reference: 'PR-1049',
        route: '/manager/orders',
        queryParams: { type: 'purchase', status: 'pending-manager' },
      },
      {
        id: 'ticket-1',
        type: 'ticket',
        title: 'SLA overdue: SVC-209',
        description: 'Compressor rattling on VRF unit',
        priority: 'high',
        route: '/manager/work-items',
        queryParams: { status: 'open' },
      },
      {
        id: 'shortage-1',
        type: 'inventory',
        title: 'Material shortage: MR-201',
        description: 'Compressor filter shortage',
        priority: 'high',
        route: '/manager/orders',
        queryParams: { type: 'purchase', status: 'pending' },
      },
    ],
    workloadPreview: [
      {
        assigneeId: 'tech-1',
        assigneeName: 'Alex Mercer',
        assigneeType: 'technician',
        active: 3,
        slaRisk: 1,
      },
    ],
  };

  async function create(
    dashboardServiceOverrides: Partial<ManagerDashboardService> = {},
  ): Promise<ComponentFixture<ManagerDashboardComponent>> {
    const service: Partial<ManagerDashboardService> = {
      getDashboard: () => of(dashboard),
      ...dashboardServiceOverrides,
    };
    const mockAnalyticsService: Partial<AnalyticsService> = {
      getAnalytics: () => of(analytics as AnalyticsData),
    };

    await TestBed.configureTestingModule({
      imports: [ManagerDashboardComponent],
      providers: [
        { provide: ManagerDashboardService, useValue: service },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
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
      '/manager/inventory',
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

  it('renders approvals and operational actions in pending actions section with amount and links', async () => {
    const fixture = await create();
    const root = fixture.nativeElement as HTMLElement;

    // Ensure recent customer orders card is NOT present
    expect(root.querySelector('.orders-card')).toBeNull();
    expect(root.querySelector('.recent-order-item')).toBeNull();

    // Verify Pending Actions card and items
    const actionsCard = root.querySelector('.actions-card');
    expect(actionsCard).not.toBeNull();
    expect(actionsCard?.textContent).toContain('Pending Actions & Approvals');

    // Verify approval action item
    const approvalItem = root.querySelector<HTMLElement>('.action-item--approval');
    expect(approvalItem).not.toBeNull();
    expect(approvalItem?.textContent).toContain('PR-1049');
    expect(approvalItem?.textContent).toContain('Global HVAC Supplies');
    expect(approvalItem?.textContent).toContain('LKR 85,000');
    expect(approvalItem?.textContent).toContain('PURCHASE REQUEST');

    const approvalBtn = approvalItem?.querySelector<HTMLAnchorElement>('a.action-btn-primary');
    expect(approvalBtn?.getAttribute('href')).toBe('/manager/orders?type=purchase&status=pending-manager');
    expect(approvalBtn?.textContent).toContain('Review Approval');

    // Verify ticket action item
    const actionItems = root.querySelectorAll<HTMLElement>('.action-item');
    expect(actionItems.length).toBe(3);

    const ticketBtn = actionItems[1].querySelector<HTMLAnchorElement>('a.action-btn-primary');
    expect(ticketBtn?.getAttribute('href')).toBe('/manager/work-items?status=open');
    expect(ticketBtn?.textContent).toContain('Open Ticket');

    const shortageBtn = actionItems[2].querySelector<HTMLAnchorElement>('a.action-btn-primary');
    expect(shortageBtn?.getAttribute('href')).toBe('/manager/orders?type=purchase&status=pending');
    expect(shortageBtn?.textContent).toContain('Resolve Shortage');

    // Verify Workforce Snapshot card is present
    const workforceCard = root.querySelector('.workforce-card');
    expect(workforceCard).not.toBeNull();
    expect(workforceCard?.textContent).toContain('Workforce Snapshot');
    expect(workforceCard?.textContent).toContain('Alex Mercer');

    fixture.destroy();
  });

  it('filters pending actions by category tab', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;

    expect(component.filteredActions.length).toBe(3);

    const filterChips = Array.from(root.querySelectorAll<HTMLButtonElement>('.filter-chip'));
    const approvalsChip = filterChips.find((chip) => chip.textContent?.includes('Approvals'));
    expect(approvalsChip).toBeDefined();

    approvalsChip?.click();
    fixture.detectChanges();

    expect(component.activeActionFilter).toBe('approvals');
    expect(component.filteredActions.length).toBe(1);
    expect(component.filteredActions[0].reference).toBe('PR-1049');

    const inventoryChip = filterChips.find((chip) => chip.textContent?.includes('Inventory Shortages'));
    expect(inventoryChip).toBeDefined();

    inventoryChip?.click();
    fixture.detectChanges();

    expect(component.activeActionFilter).toBe('inventory');
    expect(component.filteredActions.length).toBe(1);
    expect(component.filteredActions[0].id).toBe('shortage-1');

    const allChip = filterChips.find((chip) => chip.textContent?.includes('All'));
    allChip?.click();
    fixture.detectChanges();

    expect(component.activeActionFilter).toBe('all');
    expect(component.filteredActions.length).toBe(3);

    fixture.destroy();
  });

  it('renders Key Analytics & Insights section with fast jump links to all 4 pillars and view inventory button', async () => {
    const fixture = await create();
    const root = fixture.nativeElement as HTMLElement;

    const viewInventoryBtn = root.querySelector<HTMLAnchorElement>('.btn-inventory-nav');
    expect(viewInventoryBtn?.getAttribute('href')).toBe('/manager/inventory');

    const insightsSection = root.querySelector('.analytics-insights-section');
    expect(insightsSection).not.toBeNull();
    expect(insightsSection?.textContent).toContain('Key Analytics & Insights');

    const jumpLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>('.insight-card .insight-jump-link'));
    expect(jumpLinks.length).toBe(4);
    expect(jumpLinks[0].getAttribute('href')).toBe('/manager/analytics/service-operations');
    expect(jumpLinks[1].getAttribute('href')).toBe('/manager/analytics/financial-overview');
    expect(jumpLinks[2].getAttribute('href')).toBe('/manager/analytics/purchasing-approvals');
    expect(jumpLinks[3].getAttribute('href')).toBe('/manager/work-items');

    const fullAnalyticsBtn = root.querySelector<HTMLAnchorElement>('.insights-all-btn');
    expect(fullAnalyticsBtn?.getAttribute('href')).toBe('/manager/analytics/period-performance');

    fixture.destroy();
  });
});

