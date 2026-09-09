import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsData, AnalyticsPeriod } from '../../../../services/analytics.service';
import { label } from '../../analytics-format.util';

@Component({
  selector: 'app-mgr-analytics-inventory',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mgr-analytics-inventory.component.html',
  styleUrls: ['../analytics-section-shared.css', './mgr-analytics-inventory.component.css'],
})
export class MgrAnalyticsInventoryComponent {
  @Input({ required: true }) report!: AnalyticsData;
  @Input({ required: true }) activePeriod!: AnalyticsPeriod;

  label(value: string): string {
    return label(value);
  }
}
