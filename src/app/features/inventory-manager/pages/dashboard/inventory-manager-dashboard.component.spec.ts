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
    procurementWorkflow: { awaitingManager: 2, awaitingReceipt: 3, awaitingFinance: 1 },
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
    fixture.destroy();
  });

  it('keeps Retry available after a dashboard load failure', async () => {
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
    expect(root.querySelector('.welcome-title')?.textContent).toContain('Welcome back');
    fixture.destroy();
  });
});
