import { ComparisonMetric } from '../../../../services/analytics.service';
import { MgrAnalyticsPerformanceComponent } from './mgr-analytics-performance.component';

describe('MgrAnalyticsPerformanceComponent', () => {
  let component: MgrAnalyticsPerformanceComponent;

  beforeEach(() => {
    component = new MgrAnalyticsPerformanceComponent();
  });

  it('describes zero-baseline and unchanged comparisons without infinity', () => {
    const fresh: ComparisonMetric = {
      current: 4, previous: 0, deltaPercent: null, deltaKind: 'new', semantic: 'neutral',
    };
    const unchanged: ComparisonMetric = {
      current: 0, previous: 0, deltaPercent: null, deltaKind: 'no-change', semantic: 'neutral',
    };
    expect(component.deltaText(fresh)).toBe('New vs previous period');
    expect(component.deltaText(unchanged)).toBe('No change');
  });

  it('treats reduced resolution time as a positive change', () => {
    const metric: ComparisonMetric = {
      current: 4, previous: 8, deltaPercent: -50, deltaKind: 'percent', semantic: 'lower-is-better',
    };
    expect(component.deltaClass(metric)).toBe('positive');
  });
});
