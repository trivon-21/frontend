import { AnalyticsComponent } from './analytics.component';
import { AnalyticsData, AnalyticsService, ComparisonMetric } from '../../services/analytics.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('AnalyticsComponent', () => {
  let component: AnalyticsComponent;

  beforeEach(() => {
    const route = { data: of({ analyticsSection: 'performance' }) } as unknown as ActivatedRoute;
    component = new AnalyticsComponent({} as AnalyticsService, route);
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

  it('samples labels for a thirty-day chart while retaining both endpoints', () => {
    expect(component.showAxisLabel(0, 30)).toBeTrue();
    expect(component.showAxisLabel(5, 30)).toBeTrue();
    expect(component.showAxisLabel(6, 30)).toBeFalse();
    expect(component.showAxisLabel(29, 30)).toBeTrue();
  });

  it('creates proportional donut segments from exact status totals', () => {
    const segments = component.donutSegments([{ label: 'open', value: 3 }, { label: 'resolved', value: 1 }]);
    expect(segments[0].percent).toBe(75);
    expect(segments[1].percent).toBe(25);
    expect(segments[1].offset).toBeLessThan(0);
  });

  it('detects genuine trend activity rather than the presence of buckets', () => {
    const report = {
      serviceOperations: { ticketTrend: { labels: ['Day 1'], created: [0], resolved: [0] } },
    } as AnalyticsData;
    expect(component.hasTrendActivity(report)).toBeFalse();
    report.serviceOperations.ticketTrend.resolved[0] = 1;
    expect(component.hasTrendActivity(report)).toBeTrue();
  });
});
