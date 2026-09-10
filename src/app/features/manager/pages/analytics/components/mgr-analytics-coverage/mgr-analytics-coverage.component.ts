import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsData } from '../../../../services/analytics.service';
import { label } from '../../analytics-format.util';

@Component({
  selector: 'app-mgr-analytics-coverage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mgr-analytics-coverage.component.html',
  styleUrls: ['../analytics-section-shared.css', './mgr-analytics-coverage.component.css'],
})
export class MgrAnalyticsCoverageComponent {
  @Input({ required: true }) report!: AnalyticsData;

  label(value: string): string {
    return label(value);
  }
}
