import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TicketsComponent } from './tickets.component';
import { TicketsService, WorkItemsResponse } from '../../services/tickets.service';

describe('TicketsComponent pagination', () => {
  it('consumes page metadata and enforces pagination boundaries', () => {
    const response: WorkItemsResponse = {
      status: 'Live',
      summary: { total: 60, open: 60, inProgress: 0, escalated: 0, awaitingVerification: 0, closed: 0 },
      page: 2,
      limit: 25,
      total: 60,
      items: [],
    };
    const service = { getWorkItems: jasmine.createSpy().and.returnValue(of(response)) } as unknown as TicketsService;
    const route = { queryParamMap: of(convertToParamMap({ status: 'open' })) } as ActivatedRoute;
    const component = new TicketsComponent(service, route);

    component.ngOnInit();

    expect(component.page).toBe(2);
    expect(component.totalPages).toBe(3);
    expect(component.firstResult).toBe(26);
    expect(component.lastResult).toBe(50);
    component.changePage(4);
    expect(service.getWorkItems).toHaveBeenCalledTimes(1);
  });

  it('resets to page one whenever a filter changes', () => {
    const response = {
      status: 'Live', summary: { total: 0, open: 0, inProgress: 0, escalated: 0, awaitingVerification: 0, closed: 0 },
      page: 1, limit: 25, total: 0, items: [],
    };
    const service = { getWorkItems: jasmine.createSpy().and.returnValue(of(response)) } as unknown as TicketsService;
    const component = new TicketsComponent(service, { queryParamMap: of(convertToParamMap({})) } as ActivatedRoute);
    component.page = 3;

    component.setFilter('priority', 'high');

    expect(component.page).toBe(1);
    expect(service.getWorkItems).toHaveBeenCalledWith(jasmine.objectContaining({ page: 1, priority: 'high' }));
  });
});
