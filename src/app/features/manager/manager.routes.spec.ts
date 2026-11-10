import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { TicketsComponent } from './pages/tickets/tickets.component';
import { MANAGER_ROUTES } from './manager.routes';

describe('MANAGER_ROUTES', () => {
  const children = MANAGER_ROUTES[0].children ?? [];

  it('registers the canonical operations route and the query-preserving legacy alias', () => {
    expect(children.find((route) => route.path === 'work-items')?.component).toBe(TicketsComponent);
    expect(children.find((route) => route.path === 'tickets')?.component).toBe(TicketsComponent);
  });

  it('registers the customers route', () => {
    expect(children.find((route) => route.path === 'customers')?.component).toBe(CustomersComponent);
  });

  it('registers the inventory route with readOnly: true', () => {
    const inventoryRoute = children.find((route) => route.path === 'inventory');
    expect(inventoryRoute).toBeDefined();
    expect(inventoryRoute?.data?.['readOnly']).toBe(true);
  });

  it('maps every analytics URL to its expected section', () => {
    const expected = new Map([
      ['analytics/period-performance', 'performance'],
      ['analytics/service-operations', 'service'],
      ['analytics/financial-overview', 'financial'],
      ['analytics/purchasing-approvals', 'purchasing'],
      ['analytics/inventory-exception-control', 'inventory'],
    ]);

    for (const [path, section] of expected) {
      const route = children.find((candidate) => candidate.path === path);
      expect(route?.component).toBe(AnalyticsComponent);
      expect(route?.data?.['analyticsSection']).toBe(section);
    }
  });

  it('keeps unknown Manager URLs inside the Manager portal', () => {
    expect(children.at(-1)).toEqual(jasmine.objectContaining({
      path: '**',
      redirectTo: '/manager',
    }));
  });
});
