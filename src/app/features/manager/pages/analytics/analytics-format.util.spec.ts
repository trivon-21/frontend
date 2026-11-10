import { ComparisonMetric } from '../../services/analytics.service';
import { deltaClass, deltaText, label } from './analytics-format.util';

describe('analytics-format.util', () => {
  it('describes zero-baseline and unchanged comparisons without infinity', () => {
    const fresh: ComparisonMetric = {
      current: 4, previous: 0, deltaPercent: null, deltaKind: 'new', semantic: 'neutral',
    };
    const unchanged: ComparisonMetric = {
      current: 0, previous: 0, deltaPercent: null, deltaKind: 'no-change', semantic: 'neutral',
    };
    expect(deltaText(fresh)).toBe('New vs previous period');
    expect(deltaText(unchanged)).toBe('No change');
  });

  it('treats reduced resolution time as a positive change', () => {
    const metric: ComparisonMetric = {
      current: 4, previous: 8, deltaPercent: -50, deltaKind: 'percent', semantic: 'lower-is-better',
    };
    expect(deltaClass(metric)).toBe('positive');
  });

  it('title-cases hyphenated and underscored status labels', () => {
    expect(label('pending-manager')).toBe('Pending Manager');
    expect(label('non_po')).toBe('Non Po');
  });
});
