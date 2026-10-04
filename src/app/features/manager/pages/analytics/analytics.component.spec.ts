import { AnalyticsComponent } from './analytics.component';
import { AnalyticsService } from '../../services/analytics.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('AnalyticsComponent', () => {
  function createComponent(section: string) {
    const route = { data: of({ analyticsSection: section }) } as unknown as ActivatedRoute;
    const service = { getAnalytics: () => of(null) } as unknown as AnalyticsService;
    return new AnalyticsComponent(service, route);
  }

  it('reads the active section from route data', () => {
    const component = createComponent('financial');
    component.ngOnInit();
    expect(component.section).toBe('financial');
  });

  it('falls back to the performance section when route data omits it', () => {
    const component = createComponent('');
    component.ngOnInit();
    expect(component.section).toBe('performance');
  });

  it('does nothing when exporting with no data loaded', () => {
    const component = createComponent('performance');
    expect(() => component.exportCsv()).not.toThrow();
  });
});
