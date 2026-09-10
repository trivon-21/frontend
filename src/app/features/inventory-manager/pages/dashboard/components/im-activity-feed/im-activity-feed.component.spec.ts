import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivityItem } from '../../../../services/inventory-manager-dashboard.service';
import { ImActivityFeedComponent } from './im-activity-feed.component';

describe('ImActivityFeedComponent action routing', () => {
  function activity(overrides: Partial<ActivityItem>): ActivityItem {
    return {
      id: 'act-1',
      type: 'request',
      title: 'Activity',
      description: '',
      timestamp: new Date('2026-09-10T08:00:00.000Z'),
      timeAgo: '1h ago',
      ...overrides,
    };
  }

  async function render(activities: ActivityItem[]): Promise<ComponentFixture<ImActivityFeedComponent>> {
    await TestBed.configureTestingModule({
      imports: [ImActivityFeedComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ImActivityFeedComponent);
    fixture.componentInstance.activities = activities;
    fixture.detectChanges();
    return fixture;
  }

  function actionHrefs(fixture: ComponentFixture<ImActivityFeedComponent>): (string | null)[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.activity-btn'),
    ).map((link) => link.getAttribute('href'));
  }

  it('routes every label the backend emits to a page in this portal', async () => {
    const fixture = await render([
      activity({ id: 'a1', type: 'grn', title: 'Goods Received', actionLabel: 'View GRN' }),
      activity({ id: 'a2', title: 'Purchase Order Issued', actionLabel: 'Receive Stock' }),
      activity({ id: 'a3', title: 'Non-PO Authorization Requested', actionLabel: 'View Authorization' }),
      activity({ id: 'a4', title: 'Tool Checked Out', actionLabel: 'View Asset' }),
      activity({ id: 'a5', type: 'return', title: 'Tool Returned', actionLabel: 'View Log' }),
      activity({ id: 'a6', title: 'Order Request Created', actionLabel: 'View Order' }),
      activity({ id: 'a7', type: 'return', title: 'Leftover Material Returned', actionLabel: 'View Returns' }),
      activity({ id: 'a8', type: 'return', title: 'RMA Case Created', actionLabel: 'View RMA' }),
      activity({ id: 'a9', type: 'alert', title: 'Item Quarantined', actionLabel: 'View Quarantine' }),
      activity({ id: 'a10', type: 'dispatch', title: 'Dispatch Stage Advanced', actionLabel: 'View Dispatch' }),
    ]);

    expect(actionHrefs(fixture)).toEqual([
      '/inventory-manager/procurement',
      '/inventory-manager/procurement',
      '/inventory-manager/procurement',
      '/inventory-manager/asset-management',
      '/inventory-manager/asset-management',
      '/inventory-manager/order-creation',
      '/inventory-manager/returns-rma',
      '/inventory-manager/returns-rma',
      '/inventory-manager/returns-rma',
      '/inventory-manager/dispatch-logistics',
    ]);
    fixture.destroy();
  });

  it('splits the shared "View Request" label by workflow', async () => {
    const fixture = await render([
      activity({ id: 'a1', title: 'Material Kit Reserved', actionLabel: 'View Request' }),
      activity({ id: 'a2', title: 'Material Kit Handed Over', actionLabel: 'View Request' }),
      activity({ id: 'a3', title: 'Purchase Request Submitted', actionLabel: 'View Request' }),
      activity({ id: 'a4', title: 'Purchase Request Approved', actionLabel: 'View Request' }),
    ]);

    expect(actionHrefs(fixture)).toEqual([
      '/inventory-manager/material-requests',
      '/inventory-manager/material-requests',
      '/inventory-manager/order-creation',
      '/inventory-manager/order-creation',
    ]);
    fixture.destroy();
  });

  it('renders no action when the label has no destination in this portal', async () => {
    const fixture = await render([
      activity({ id: 'a1', type: 'alert', title: 'Service ticket escalated', actionLabel: 'View Ticket' }),
      activity({ id: 'a2', title: 'Something New', actionLabel: 'View Something Unmapped' }),
      activity({ id: 'a3', title: 'Activity With No Action' }),
    ]);
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('.timeline-item').length).toBe(3);
    expect(root.querySelectorAll('.activity-btn').length).toBe(0);
    expect(root.querySelectorAll('.activity-actions').length).toBe(0);
    fixture.destroy();
  });

  it('caps the feed at the requested limit', async () => {
    const fixture = await render([
      activity({ id: 'a1', actionLabel: 'View Order' }),
      activity({ id: 'a2', actionLabel: 'View Order' }),
      activity({ id: 'a3', actionLabel: 'View Order' }),
    ]);
    fixture.componentInstance.limit = 2;
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.timeline-item').length).toBe(2);
    fixture.destroy();
  });
});
