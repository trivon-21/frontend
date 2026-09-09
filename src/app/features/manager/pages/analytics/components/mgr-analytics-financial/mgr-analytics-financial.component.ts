import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortalIconsModule } from '../../../../../../shared/components/portal-icons/portal-icons.module';
import { AnalyticsData, AnalyticsPeriod, ComparisonMetric } from '../../../../services/analytics.service';
import { deltaClass, deltaText } from '../../analytics-format.util';

@Component({
  selector: 'app-mgr-analytics-financial',
  standalone: true,
  imports: [CommonModule, PortalIconsModule],
  templateUrl: './mgr-analytics-financial.component.html',
  styleUrls: ['../analytics-section-shared.css', './mgr-analytics-financial.component.css'],
})
export class MgrAnalyticsFinancialComponent {
  @Input({ required: true }) report!: AnalyticsData;
  @Input({ required: true }) activePeriod!: AnalyticsPeriod;

  deltaText(metric: ComparisonMetric): string {
    return deltaText(metric);
  }

  deltaClass(metric: ComparisonMetric): string {
    return deltaClass(metric);
  }

  financialTrendMax(report: AnalyticsData): number {
    return Math.max(
      1,
      ...report.financial.trend.collectedRevenue,
      ...report.financial.trend.procurementSpend,
    );
  }

  financialBarWidth(value: number, report: AnalyticsData): number {
    return Math.max(0, (value / this.financialTrendMax(report)) * 100);
  }
}
