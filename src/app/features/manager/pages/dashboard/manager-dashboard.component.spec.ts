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
          { label: 'Value', value: 85000 },
          { label: 'Non-PO', value: 1 },
        ],
      },
    },
    inventoryKpis: {
      reservedItems: { label: 'Reserved Items', value: 4, icon: 'clipboard-check' },
      belowReorderItems: { label: 'Below Reorder', value: 2, icon: 'triangle-alert' },
      outOfStockItems: { label: 'Out of Stock', value: 1, icon: 'triangle-alert' },
      stockRiskItems: { label: 'Stock Risk', value: 3, icon: 'triangle-alert' },
      blockedMaterialRequests: { label: 'Blocked Material Requests', value: 1, icon: 'triangle-alert' },
    },
    pendingActionsTotal: 1,
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

    await TestBed.configureTestingModule({
      imports: [ManagerDashboardComponent],
      providers: [
        { provide: ManagerDashboardService, useValue: service },
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
    const workQueue = root.querySelector<HTMLAnchorElement>('a[href="/manager/work-items"]')!;
    expect(workQueue.textContent).toContain('Open Work Queue');
    expect(workQueue.classList).toContain('mgr-btn--primary');

    const fullAnalyticsLink = root.querySelector<HTMLAnchorElement>(
      'a[href="/manager/analytics/period-performance"]',
    );
    expect(fullAnalyticsLink?.textContent).toContain('Full Analytics');

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

  it('renders approvals and operational actions in the pending actions panel with a view-all link', async () => {
    const fixture = await create();
    const root = fixture.nativeElement as HTMLElement;

    // Ensure sections dropped from the simplified layout are NOT present
    expect(root.querySelector('.orders-card')).toBeNull();
    expect(root.querySelector('.recent-order-item')).toBeNull();
    expect(root.querySelector('.analytics-insights-section')).toBeNull();
    expect(root.querySelector('.filter-chip')).toBeNull();
    expect(root.querySelector('.approvals-quick-banner')).toBeNull();

    // Verify Pending Actions card and items
    const actionsCard = root.querySelector('.actions-card');
    expect(actionsCard).not.toBeNull();
    expect(actionsCard?.textContent).toContain('Pending Actions & Approvals');

    const viewAllLink = actionsCard?.querySelector<HTMLAnchorElement>('.card-link');
    expect(viewAllLink?.getAttribute('href')).toBe('/manager/work-items');

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
});
