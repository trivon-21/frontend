import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsData, AnalyticsPeriod } from '../../../../services/analytics.service';
import { label } from '../../analytics-format.util';

@Component({
  selector: 'app-mgr-analytics-purchasing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mgr-analytics-purchasing.component.html',
  styleUrls: ['../analytics-section-shared.css', './mgr-analytics-purchasing.component.css'],
})
export class MgrAnalyticsPurchasingComponent {
  @Input({ required: true }) report!: AnalyticsData;
  @Input({ required: true }) activePeriod!: AnalyticsPeriod;

  label(value: string): string {
    return label(value);
  }

  countTotal(items: Array<{ count: number }>): number { return items.reduce((sum, item) => sum + item.count, 0); }

  pendingPurchaseCount(report: AnalyticsData): number {
    return report.purchasing.currentPipeline
      .filter((item) => ['pending-manager', 'pending-finance'].includes(item.status))
      .reduce((sum, item) => sum + item.count, 0);
  }

  decisionCount(report: AnalyticsData, stage: 'manager' | 'finance'): number {
    return report.purchasing.periodDecisions
      .filter((item) => item.stage === stage)
      .reduce((sum, item) => sum + item.count, 0);
  }
}
