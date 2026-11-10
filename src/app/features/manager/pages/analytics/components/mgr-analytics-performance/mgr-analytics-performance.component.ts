import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../../../shared/components/portal-icons/portal-icons.module';
import { AnalyticsData, AnalyticsPeriod, ComparisonMetric } from '../../../../services/analytics.service';
import { deltaClass, deltaText } from '../../analytics-format.util';

@Component({
  selector: 'app-mgr-analytics-performance',
  standalone: true,
  imports: [CommonModule, RouterModule, PortalIconsModule],
  templateUrl: './mgr-analytics-performance.component.html',
  styleUrls: ['../analytics-section-shared.css', './mgr-analytics-performance.component.css'],
})
export class MgrAnalyticsPerformanceComponent {
  @Input({ required: true }) report!: AnalyticsData;
  @Input({ required: true }) activePeriod!: AnalyticsPeriod;

  deltaText(metric: ComparisonMetric): string {
    return deltaText(metric);
  }

  deltaClass(metric: ComparisonMetric): string {
    return deltaClass(metric);
  }
}
