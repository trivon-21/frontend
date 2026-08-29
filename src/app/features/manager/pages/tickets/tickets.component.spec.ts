import { ElementRef } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TicketsComponent } from './tickets.component';
import { OperationalWorkItem, TicketsService, WorkItemsResponse } from '../../services/tickets.service';

const workItem: OperationalWorkItem = {
  id: 'work-item-1',
  sourceType: 'service',
  sourceId: 'service-1',
  reference: 'SRV-1001',
  customer: { id: 'customer-1', fullName: 'Sample Customer' },
  category: 'Repair',
  operationalStatus: 'open',
  domainStatus: 'Open',
  priority: 'high',
  slaDueAt: null,
  assignedTeam: null,
  assignedTechnician: null,
  escalated: false,
  managerClosed: false,
  blockers: [],
  children: [],
  allowedActions: ['update-control', 'escalate'],
  version: 1,
  technicalComplete: false,
  reportComplete: false,
  createdAt: null,
  updatedAt: null,
};

function createComponent(): TicketsComponent {
  const service = { getWorkItems: jasmine.createSpy() } as unknown as TicketsService;
  const route = { queryParamMap: of(convertToParamMap({})) } as ActivatedRoute;
  return new TicketsComponent(service, route);
}

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

describe('TicketsComponent work-item dialog', () => {
  it('focuses the dialog close button on open and restores the view trigger on close', fakeAsync(() => {
    const component = createComponent();
    const trigger = document.createElement('button');
    const closeButton = document.createElement('button');
    document.body.append(trigger, closeButton);
    component.detailsCloseButton = new ElementRef(closeButton);

    component.openDetails(workItem, trigger);
    tick();

    expect(component.selectedItem).toBe(workItem);
    expect(document.activeElement).toBe(closeButton);

    component.closeDetails();
    tick();

    expect(component.selectedItem).toBeNull();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
    closeButton.remove();
  }));

  it('closes only for a direct backdrop click', fakeAsync(() => {
    const component = createComponent();
    const backdrop = document.createElement('div');
    const dialog = document.createElement('section');
    component.openDetails(workItem);
    tick();

    component.onDetailsBackdrop({ target: dialog, currentTarget: backdrop } as unknown as MouseEvent);
    expect(component.selectedItem).toBe(workItem);

    component.onDetailsBackdrop({ target: backdrop, currentTarget: backdrop } as unknown as MouseEvent);
    expect(component.selectedItem).toBeNull();
  }));

  it('supports Escape dismissal but keeps the dialog open during an update', fakeAsync(() => {
    const component = createComponent();
    component.openDetails(workItem);
    tick();
    component.updatingId = workItem.id;

    component.onEscape();
    expect(component.selectedItem).toBe(workItem);

    component.updatingId = null;
    component.onEscape();
    expect(component.selectedItem).toBeNull();
  }));
});
