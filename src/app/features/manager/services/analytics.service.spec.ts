import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AnalyticsData, AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AnalyticsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AnalyticsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends the required period parameter and hydrates reporting and snapshot dates', () => {
    const snapshot = (value: number, asOf: string) => ({ value, scope: 'current-snapshot', asOf });
    const response = {
      period: '30d',
      status: 'Live',
      generatedAt: '2026-08-24T12:00:00.000Z',
      reportingPeriod: {
        period: '30d',
        currentStart: '2026-07-26T00:00:00.000Z',
        currentEnd: '2026-08-24T23:59:59.999Z',
        previousStart: '2026-06-26T00:00:00.000Z',
        previousEnd: '2026-07-25T23:59:59.999Z',
      },
      performance: {},
      currentPosition: {
        openTickets: snapshot(4, '2026-08-24T12:00:00.000Z'),
        unassignedTickets: snapshot(1, '2026-08-24T12:00:01.000Z'),
        slaRiskTickets: snapshot(2, '2026-08-24T12:00:02.000Z'),
        pendingApprovalValue: snapshot(1500, '2026-08-24T12:00:03.000Z'),
        stockRiskItems: snapshot(3, '2026-08-24T12:00:04.000Z'),
      },
      serviceOperations: {},
      workforce: {},
      purchasing: {
        pendingApprovalValue: snapshot(1500, '2026-08-24T12:00:05.000Z'),
      },
      financial: {
        collectedRevenue: {}, procurementSpend: {}, operatingContribution: {},
        outstandingReceivables: { ...snapshot(3000, '2026-08-24T12:00:05.000Z'), count: 2 },
        pendingPaymentReview: { ...snapshot(1200, '2026-08-24T12:00:06.000Z'), count: 1 },
        purchaseCommitments: snapshot(5000, '2026-08-24T12:00:07.000Z'),
        unreconciledNonPo: { ...snapshot(400, '2026-08-24T12:00:08.000Z'), count: 1 },
        revenueBySource: [], spendByMode: [],
        trend: { labels: [], collectedRevenue: [], procurementSpend: [] },
        basis: 'cash-collected-vs-goods-received',
      },
      inventoryRisk: {
        lowStockItems: snapshot(2, '2026-08-24T12:00:06.000Z'),
        outOfStockItems: snapshot(1, '2026-08-24T12:00:07.000Z'),
        reservedUnits: snapshot(9, '2026-08-24T12:00:08.000Z'),
        pendingMaterialRequests: snapshot(3, '2026-08-24T12:00:09.000Z'),
        approvedAwaitingReceipt: snapshot(5, '2026-08-24T12:00:10.000Z'),
      },
      exceptions: {
        awaitingFinance: snapshot(2, '2026-08-24T12:00:11.000Z'),
        awaitingReceipt: snapshot(3, '2026-08-24T12:00:12.000Z'),
      },
      dataCoverage: [],
    };
    let result: AnalyticsData | undefined;

    service.getAnalytics('30d').subscribe((data) => (result = data));

    const request = http.expectOne(`${environment.apiUrl}/manager/analytics?period=30d`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('period')).toBe('30d');
    request.flush(response);

    expect(result?.generatedAt).toEqual(new Date('2026-08-24T12:00:00.000Z'));
    expect(result?.reportingPeriod.currentStart).toEqual(new Date('2026-07-26T00:00:00.000Z'));
    expect(result?.reportingPeriod.currentEnd).toEqual(new Date('2026-08-24T23:59:59.999Z'));
    expect(result?.reportingPeriod.previousStart).toEqual(new Date('2026-06-26T00:00:00.000Z'));
    expect(result?.reportingPeriod.previousEnd).toEqual(new Date('2026-07-25T23:59:59.999Z'));
    expect(result?.currentPosition.openTickets.asOf).toEqual(new Date('2026-08-24T12:00:00.000Z'));
    expect(result?.purchasing.pendingApprovalValue.asOf).toEqual(new Date('2026-08-24T12:00:05.000Z'));
    expect(result?.financial.outstandingReceivables.asOf).toEqual(new Date('2026-08-24T12:00:05.000Z'));
    expect(result?.financial.pendingPaymentReview.count).toBe(1);
    expect(result?.inventoryRisk.approvedAwaitingReceipt.asOf).toEqual(
      new Date('2026-08-24T12:00:10.000Z'),
    );
    expect(result?.exceptions.awaitingReceipt.asOf).toEqual(new Date('2026-08-24T12:00:12.000Z'));
  });

  it('serves a second subscribe for the same period within the TTL from cache', () => {
    service.getAnalytics('7d').subscribe();
    http.expectOne(`${environment.apiUrl}/manager/analytics?period=7d`).flush(minimalAnalytics());

    let second: AnalyticsData | undefined;
    service.getAnalytics('7d').subscribe((data) => (second = data));
    http.expectNone(`${environment.apiUrl}/manager/analytics?period=7d`);

    expect(second?.status).toBe('Live');
  });

  it('caches each period independently', () => {
    service.getAnalytics('7d').subscribe();
    http.expectOne(`${environment.apiUrl}/manager/analytics?period=7d`).flush(minimalAnalytics());

    let result: AnalyticsData | undefined;
    service.getAnalytics('30d').subscribe((data) => (result = data));
    const request = http.expectOne(`${environment.apiUrl}/manager/analytics?period=30d`);
    request.flush(minimalAnalytics());

    expect(request.request.params.get('period')).toBe('30d');
    expect(result?.status).toBe('Live');
  });

  it('force always issues a fresh HTTP request, bypassing the cache', () => {
    service.getAnalytics('7d').subscribe();
    http.expectOne(`${environment.apiUrl}/manager/analytics?period=7d`).flush(minimalAnalytics());

    let result: AnalyticsData | undefined;
    service.getAnalytics('7d', { force: true }).subscribe((data) => (result = data));
    const request = http.expectOne(`${environment.apiUrl}/manager/analytics?period=7d`);
    request.flush(minimalAnalytics());

    expect(request.request.method).toBe('GET');
    expect(result?.status).toBe('Live');
  });

  it('does not cache an errored request; the next call retries against the network', () => {
    let errored = false;
    service.getAnalytics('7d').subscribe({ error: () => (errored = true) });
    http.expectOne(`${environment.apiUrl}/manager/analytics?period=7d`).flush(
      { message: 'boom' },
      { status: 500, statusText: 'Server Error' },
    );
    expect(errored).toBeTrue();

    service.getAnalytics('7d').subscribe();
    http.expectOne(`${environment.apiUrl}/manager/analytics?period=7d`).flush(minimalAnalytics());
  });

  function minimalAnalytics() {
    const snapshot = (value: number, asOf: string) => ({ value, scope: 'current-snapshot', asOf });
    return {
      period: '7d',
      status: 'Live',
      generatedAt: '2026-08-24T12:00:00.000Z',
      reportingPeriod: {
        period: '7d',
        currentStart: '2026-08-17T00:00:00.000Z',
        currentEnd: '2026-08-24T23:59:59.999Z',
        previousStart: '2026-08-10T00:00:00.000Z',
        previousEnd: '2026-08-16T23:59:59.999Z',
      },
      performance: {},
      currentPosition: {
        openTickets: snapshot(0, '2026-08-24T12:00:00.000Z'),
        unassignedTickets: snapshot(0, '2026-08-24T12:00:00.000Z'),
        slaRiskTickets: snapshot(0, '2026-08-24T12:00:00.000Z'),
        pendingApprovalValue: snapshot(0, '2026-08-24T12:00:00.000Z'),
        stockRiskItems: snapshot(0, '2026-08-24T12:00:00.000Z'),
      },
      serviceOperations: {},
      workforce: {},
      purchasing: { pendingApprovalValue: snapshot(0, '2026-08-24T12:00:00.000Z') },
      financial: {
        collectedRevenue: {}, procurementSpend: {}, operatingContribution: {},
        outstandingReceivables: { ...snapshot(0, '2026-08-24T12:00:00.000Z'), count: 0 },
        pendingPaymentReview: { ...snapshot(0, '2026-08-24T12:00:00.000Z'), count: 0 },
        purchaseCommitments: snapshot(0, '2026-08-24T12:00:00.000Z'),
        unreconciledNonPo: { ...snapshot(0, '2026-08-24T12:00:00.000Z'), count: 0 },
        revenueBySource: [], spendByMode: [],
        trend: { labels: [], collectedRevenue: [], procurementSpend: [] },
        basis: 'cash-collected-vs-goods-received',
      },
      inventoryRisk: {
        lowStockItems: snapshot(0, '2026-08-24T12:00:00.000Z'),
        outOfStockItems: snapshot(0, '2026-08-24T12:00:00.000Z'),
        reservedUnits: snapshot(0, '2026-08-24T12:00:00.000Z'),
        pendingMaterialRequests: snapshot(0, '2026-08-24T12:00:00.000Z'),
        approvedAwaitingReceipt: snapshot(0, '2026-08-24T12:00:00.000Z'),
      },
      exceptions: {
        awaitingFinance: snapshot(0, '2026-08-24T12:00:00.000Z'),
        awaitingReceipt: snapshot(0, '2026-08-24T12:00:00.000Z'),
      },
      dataCoverage: [],
    };
  }
});
