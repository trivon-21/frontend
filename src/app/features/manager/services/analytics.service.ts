import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export type AnalyticsPeriod = '7d' | '30d' | '12m';
export type MetricSemantic = 'neutral' | 'higher-is-better' | 'lower-is-better';

export interface NamedValue { label: string; value: number; }
export interface ComparisonMetric {
  current: number;
  previous: number;
  deltaPercent: number | null;
  deltaKind: 'percent' | 'new' | 'no-change';
  semantic: MetricSemantic;
}
export interface SnapshotMetric { value: number; scope: 'current-snapshot'; asOf: Date; }
export interface MoneyCountSnapshot extends SnapshotMetric { count: number; }
export interface PipelineSummary { status: string; count: number; value: number; }
export interface DecisionSummary { stage: 'manager' | 'finance'; decision: 'approved' | 'rejected'; count: number; value: number; }
export interface WorkloadRow {
  name: string;
  active: number;
  slaRisk: number;
  escalated: number;
  awaitingAction: number;
  completedInPeriod: number;
}
export interface StockRisk {
  id: string;
  name: string;
  sku: string;
  available: number;
  reserved: number;
  reorderLevel: number;
  status: 'low-stock' | 'out-of-stock';
}
export interface CoverageNotice { key: string; status: 'partial' | 'unavailable'; message: string; }

function hydrateSnapshot(metric: SnapshotMetric): SnapshotMetric {
  return { ...metric, asOf: new Date(metric.asOf.toString()) };
}

export interface AnalyticsData {
  period: AnalyticsPeriod;
  status: string;
  generatedAt: Date;
  reportingPeriod: {
    period: AnalyticsPeriod;
    currentStart: Date;
    currentEnd: Date;
    previousStart: Date;
    previousEnd: Date;
  };
  performance: {
    ticketsCreated: ComparisonMetric;
    ticketsResolved: ComparisonMetric;
    averageResolutionHours: ComparisonMetric;
    purchaseRequestCount: ComparisonMetric;
    purchaseRequestValue: ComparisonMetric;
    managerDecisions: ComparisonMetric;
    financeDecisions: ComparisonMetric;
  };
  currentPosition: {
    openTickets: SnapshotMetric;
    unassignedTickets: SnapshotMetric;
    slaRiskTickets: SnapshotMetric;
    pendingApprovalValue: SnapshotMetric;
    stockRiskItems: SnapshotMetric;
  };
  serviceOperations: {
    ticketTrend: { labels: string[]; created: number[]; resolved: number[] };
    currentTicketStatus: NamedValue[];
    serviceTypes: NamedValue[];
  };
  workforce: { currentWorkload: WorkloadRow[]; attribution: 'current-assignee' };
  purchasing: {
    currentPipeline: PipelineSummary[];
    periodDecisions: DecisionSummary[];
    averageManagerApprovalHours: number;
    averageFinanceApprovalHours: number;
    poProgress: { orderedQuantity: number; receivedQuantity: number; orderedValue: number; receivedValue: number };
    pendingApprovalValue: SnapshotMetric;
    oldestPendingAgeHours: number;
  };
  financial: {
    collectedRevenue: ComparisonMetric;
    procurementSpend: ComparisonMetric;
    operatingContribution: ComparisonMetric;
    outstandingReceivables: MoneyCountSnapshot;
    pendingPaymentReview: MoneyCountSnapshot;
    purchaseCommitments: SnapshotMetric;
    unreconciledNonPo: MoneyCountSnapshot;
    revenueBySource: Array<{ label: string; count: number; value: number }>;
    spendByMode: Array<{ label: string; count: number; value: number }>;
    trend: { labels: string[]; collectedRevenue: number[]; procurementSpend: number[] };
    basis: 'cash-collected-vs-goods-received';
  };
  inventoryRisk: {
    lowStockItems: SnapshotMetric;
    outOfStockItems: SnapshotMetric;
    reservedUnits: SnapshotMetric;
    pendingMaterialRequests: SnapshotMetric;
    approvedAwaitingReceipt: SnapshotMetric;
    topRisks: StockRisk[];
  };
  exceptions: {
    nonPoCount: number;
    nonPoValue: number;
    emergencyCount: number;
    emergencyValue: number;
    nonPoPercentage: number;
    averageAuthorizationHours: number;
    awaitingFinance: SnapshotMetric;
    awaitingReceipt: SnapshotMetric;
    byReason: Array<{ label: string; count: number; value: number }>;
    bySupplier: Array<{ label: string; count: number; value: number }>;
    repeatedSkus: Array<{ sku: string; count: number }>;
    authorizedValue: number;
    receivedAuthorizedValue: number;
    slaProtectedJobs: number;
  };
  dataCoverage: CoverageNotice[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiUrl}/manager`;

  constructor(private readonly http: HttpClient) {}

  getAnalytics(period: AnalyticsPeriod): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(`${this.apiUrl}/analytics`, { params: { period } }).pipe(
      map((data) => ({
        ...data,
        generatedAt: new Date(data.generatedAt),
        reportingPeriod: {
          ...data.reportingPeriod,
          currentStart: new Date(data.reportingPeriod.currentStart),
          currentEnd: new Date(data.reportingPeriod.currentEnd),
          previousStart: new Date(data.reportingPeriod.previousStart),
          previousEnd: new Date(data.reportingPeriod.previousEnd),
        },
        currentPosition: {
          openTickets: hydrateSnapshot(data.currentPosition.openTickets),
          unassignedTickets: hydrateSnapshot(data.currentPosition.unassignedTickets),
          slaRiskTickets: hydrateSnapshot(data.currentPosition.slaRiskTickets),
          pendingApprovalValue: hydrateSnapshot(data.currentPosition.pendingApprovalValue),
          stockRiskItems: hydrateSnapshot(data.currentPosition.stockRiskItems),
        },
        purchasing: {
          ...data.purchasing,
          pendingApprovalValue: hydrateSnapshot(data.purchasing.pendingApprovalValue),
        },
        financial: {
          ...data.financial,
          outstandingReceivables: hydrateSnapshot(data.financial.outstandingReceivables) as MoneyCountSnapshot,
          pendingPaymentReview: hydrateSnapshot(data.financial.pendingPaymentReview) as MoneyCountSnapshot,
          purchaseCommitments: hydrateSnapshot(data.financial.purchaseCommitments),
          unreconciledNonPo: hydrateSnapshot(data.financial.unreconciledNonPo) as MoneyCountSnapshot,
        },
        inventoryRisk: {
          ...data.inventoryRisk,
          lowStockItems: hydrateSnapshot(data.inventoryRisk.lowStockItems),
          outOfStockItems: hydrateSnapshot(data.inventoryRisk.outOfStockItems),
          reservedUnits: hydrateSnapshot(data.inventoryRisk.reservedUnits),
          pendingMaterialRequests: hydrateSnapshot(data.inventoryRisk.pendingMaterialRequests),
          approvedAwaitingReceipt: hydrateSnapshot(data.inventoryRisk.approvedAwaitingReceipt),
        },
        exceptions: {
          ...data.exceptions,
          awaitingFinance: hydrateSnapshot(data.exceptions.awaitingFinance),
          awaitingReceipt: hydrateSnapshot(data.exceptions.awaitingReceipt),
        },
      })),
    );
  }
}
