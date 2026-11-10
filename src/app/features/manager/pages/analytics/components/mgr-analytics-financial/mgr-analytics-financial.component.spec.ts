import { AnalyticsData } from '../../../../services/analytics.service';
import { MgrAnalyticsFinancialComponent } from './mgr-analytics-financial.component';

describe('MgrAnalyticsFinancialComponent', () => {
  let component: MgrAnalyticsFinancialComponent;

  beforeEach(() => {
    component = new MgrAnalyticsFinancialComponent();
  });

  it('scales financial revenue and spend bars against the same maximum', () => {
    const report = {
      financial: {
        trend: { labels: ['Day 1'], collectedRevenue: [2000], procurementSpend: [500] },
      },
    } as AnalyticsData;

    expect(component.financialTrendMax(report)).toBe(2000);
    expect(component.financialBarWidth(500, report)).toBe(25);
  });
});
