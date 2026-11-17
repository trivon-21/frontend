import { of, throwError } from 'rxjs';
import { ActivityLogComponent } from './activity-log.component';
import { ActivityItem, InventoryManagerDashboardService } from '../../services/inventory-manager-dashboard.service';
import { IconMappingService } from '../../../../shared/services/icon-mapping.service';

describe('ActivityLogComponent', () => {
  let component: ActivityLogComponent;
  let mockDashboardService: jasmine.SpyObj<InventoryManagerDashboardService>;
  let iconMappingService: IconMappingService;

  const mockActivities: ActivityItem[] = [
    {
      id: 'act-1',
      type: 'grn',
      title: 'STOCK_RECEIVED',
      description: 'Received 10 units of Compressor',
      timestamp: new Date('2026-08-25T10:00:00.000Z'),
      status: 'completed',
    },
    {
      id: 'act-2',
      type: 'dispatch',
      title: 'DISPATCH_SHIPPED',
      description: 'Dispatched order #1002',
      timestamp: new Date('2026-08-25T11:00:00.000Z'),
      status: 'completed',
    },
  ];

  beforeEach(() => {
    mockDashboardService = jasmine.createSpyObj<InventoryManagerDashboardService>(
      'InventoryManagerDashboardService',
      ['getActivityLog']
    );
    iconMappingService = new IconMappingService();
    component = new ActivityLogComponent(mockDashboardService, iconMappingService);
  });

  it('loads activities on initialization successfully', () => {
    mockDashboardService.getActivityLog.and.returnValue(of(mockActivities));

    component.ngOnInit();

    expect(mockDashboardService.getActivityLog).toHaveBeenCalled();
    expect(component.activities).toEqual(mockActivities);
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('');
  });

  it('sets error message when activity fetch fails', () => {
    mockDashboardService.getActivityLog.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    component.ngOnInit();

    expect(mockDashboardService.getActivityLog).toHaveBeenCalled();
    expect(component.activities).toEqual([]);
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toContain('Activity history could not be loaded');
  });

  it('maps activity types to correct icons using iconMappingService', () => {
    expect(component.getActivityIcon('grn')).toBe('box');
    expect(component.getActivityIcon('dispatch')).toBe('truck');
    expect(component.getActivityIcon('return')).toBe('rotate-ccw');
    expect(component.getActivityIcon('unknown-type')).toBe('circle');
  });
});
