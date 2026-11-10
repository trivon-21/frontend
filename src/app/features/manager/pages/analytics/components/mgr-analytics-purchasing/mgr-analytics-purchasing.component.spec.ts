import { AnalyticsData } from '../../../../services/analytics.service';
import { MgrAnalyticsPurchasingComponent } from './mgr-analytics-purchasing.component';

describe('MgrAnalyticsPurchasingComponent', () => {
  let component: MgrAnalyticsPurchasingComponent;

  beforeEach(() => {
    component = new MgrAnalyticsPurchasingComponent();
  });

  it('sums pipeline counts across stages', () => {
    expect(component.countTotal([{ count: 2 }, { count: 3 }])).toBe(5);
  });

  it('counts pending requests only for manager/finance pending stages', () => {
    const report = {
      purchasing: {
        currentPipeline: [
          { status: 'pending-manager', count: 2, value: 0 },
          { status: 'pending-finance', count: 1, value: 0 },
          { status: 'approved', count: 4, value: 0 },
        ],
      },
    } as unknown as AnalyticsData;
    expect(component.pendingPurchaseCount(report)).toBe(3);
  });

  it('counts decisions scoped to a single stage', () => {
    const report = {
      purchasing: {
        periodDecisions: [
          { stage: 'manager', decision: 'approved', count: 2, value: 0 },
          { stage: 'finance', decision: 'approved', count: 1, value: 0 },
        ],
      },
    } as unknown as AnalyticsData;
    expect(component.decisionCount(report, 'manager')).toBe(2);
    expect(component.decisionCount(report, 'finance')).toBe(1);
  });
});
