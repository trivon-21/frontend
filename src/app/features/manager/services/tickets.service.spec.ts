import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';
import { OperationalWorkItem, TicketsService } from './tickets.service';

describe('TicketsService', () => {
  let service: TicketsService;
  let http: HttpTestingController;

  const wireItem = {
    id: 'item-1',
    sourceType: 'service',
    sourceId: 'service-1',
    reference: 'SRV-001',
    customer: null,
    category: 'Repair',
    operationalStatus: 'open',
    domainStatus: 'submitted',
    priority: 'medium',
    slaDueAt: '2026-08-30T10:00:00.000Z',
    assignedTeam: null,
    assignedTechnician: null,
    escalated: false,
    managerClosed: false,
    blockers: [],
    children: [
      {
        type: 'report',
        id: 'child-1',
        status: 'submitted',
        submittedAt: '2026-08-23T09:00:00.000Z',
        nextServiceDate: '2026-09-23T09:00:00.000Z',
      },
    ],
    allowedActions: ['update-control', 'escalate'],
    version: 5,
    technicalComplete: false,
    reportComplete: true,
    createdAt: '2026-08-20T08:00:00.000Z',
    updatedAt: '2026-08-24T11:00:00.000Z',
  };
  const item = wireItem as unknown as OperationalWorkItem;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TicketsService, ApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TicketsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('serializes work-item pagination and filters while omitting empty and all values', () => {
    let result: OperationalWorkItem | undefined;
    service
      .getWorkItems({
        type: 'service',
        status: 'all',
        priority: 'high',
        assignment: '',
        sla: 'at-risk',
        page: 2,
        limit: 25,
      })
      .subscribe((response) => (result = response.items[0]));

    const request = http.expectOne((candidate) => candidate.url === `${environment.apiUrl}/manager/work-items`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys().sort()).toEqual(['limit', 'page', 'priority', 'sla', 'type']);
    expect(request.request.params.get('type')).toBe('service');
    expect(request.request.params.get('priority')).toBe('high');
    expect(request.request.params.get('sla')).toBe('at-risk');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('25');
    expect(request.request.params.has('status')).toBeFalse();
    expect(request.request.params.has('assignment')).toBeFalse();
    request.flush({
      status: 'Live',
      summary: { total: 1, open: 1, inProgress: 0, escalated: 0, awaitingVerification: 0, closed: 0 },
      page: 2,
      limit: 25,
      total: 1,
      items: [wireItem],
    });

    expect(result?.slaDueAt).toEqual(new Date('2026-08-30T10:00:00.000Z'));
    expect(result?.createdAt).toEqual(new Date('2026-08-20T08:00:00.000Z'));
    expect(result?.updatedAt).toEqual(new Date('2026-08-24T11:00:00.000Z'));
    expect(result?.children[0].submittedAt).toEqual(new Date('2026-08-23T09:00:00.000Z'));
    expect(result?.children[0].nextServiceDate).toEqual(new Date('2026-09-23T09:00:00.000Z'));
  });

  it('sends the exact control URL and versioned PATCH payload, then hydrates the result', () => {
    let result: OperationalWorkItem | undefined;
    service.updateControl(item, 'high', '2026-08-31T10:00:00.000Z').subscribe((value) => (result = value));

    const request = http.expectOne(
      `${environment.apiUrl}/manager/work-items/service/service-1/control`,
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      priority: 'high',
      slaDueAt: '2026-08-31T10:00:00.000Z',
      expectedVersion: 5,
    });
    request.flush(wireItem);
    expect(result?.updatedAt).toEqual(new Date('2026-08-24T11:00:00.000Z'));
  });

  it('sends the exact lifecycle URL and versioned POST payload, then hydrates the result', () => {
    let result: OperationalWorkItem | undefined;
    service.runAction(item, 'escalate', 'SLA intervention needed').subscribe((value) => (result = value));

    const request = http.expectOne(
      `${environment.apiUrl}/manager/work-items/service/service-1/escalate`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ reason: 'SLA intervention needed', expectedVersion: 5 });
    request.flush(wireItem);
    expect(result?.children[0].submittedAt).toEqual(new Date('2026-08-23T09:00:00.000Z'));
  });
});
