import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortalIconsModule } from '../../../../../../shared/components/portal-icons/portal-icons.module';
import { AnalyticsData, AnalyticsPeriod, NamedValue } from '../../../../services/analytics.service';
import { label } from '../../analytics-format.util';

interface TrendPoint {
  x: number;
  y: number;
  index: number;
  value: number;
  label: string;
}

interface DonutSegment extends NamedValue {
  percent: number;
  dash: string;
  offset: number;
  className: string;
}

@Component({
  selector: 'app-mgr-analytics-service',
  standalone: true,
  imports: [CommonModule, PortalIconsModule],
  templateUrl: './mgr-analytics-service.component.html',
  styleUrls: ['../analytics-section-shared.css', './mgr-analytics-service.component.css'],
})
export class MgrAnalyticsServiceComponent {
  @Input({ required: true }) report!: AnalyticsData;
  @Input({ required: true }) activePeriod!: AnalyticsPeriod;

  readonly chartWidth = 680;
  readonly chartHeight = 260;
  readonly chartLeft = 42;
  readonly chartRight = 16;
  readonly chartTop = 18;
  readonly chartBottom = 38;
  readonly gridFractions = [0, 0.25, 0.5, 0.75, 1];

  activeTrendIndex: number | null = null;

  label(value: string): string {
    return label(value);
  }

  max(items: NamedValue[]): number { return Math.max(1, ...items.map((item) => item.value)); }

  total(items: NamedValue[]): number { return items.reduce((sum, item) => sum + item.value, 0); }

  positive(items: NamedValue[]): NamedValue[] { return items.filter((item) => item.value > 0); }

  percentage(value: number, total: number): number { return total ? Math.round((value / total) * 100) : 0; }

  barWidth(value: number, max: number): number { return max > 0 ? Math.max(0, (value / max) * 100) : 0; }

  trendMax(report: AnalyticsData): number {
    return Math.max(1, ...report.serviceOperations.ticketTrend.created, ...report.serviceOperations.ticketTrend.resolved);
  }

  trendPoints(report: AnalyticsData, series: 'created' | 'resolved'): TrendPoint[] {
    const trend = report.serviceOperations.ticketTrend;
    const values = trend[series];
    const usableWidth = this.chartWidth - this.chartLeft - this.chartRight;
    const usableHeight = this.chartHeight - this.chartTop - this.chartBottom;
    const maximum = this.trendMax(report);
    return values.map((value, index) => ({
      x: this.chartLeft + (values.length <= 1 ? usableWidth / 2 : (index / (values.length - 1)) * usableWidth),
      y: this.chartTop + usableHeight - (value / maximum) * usableHeight,
      index,
      value,
      label: trend.labels[index],
    }));
  }

  linePath(points: TrendPoint[]): string {
    return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  }

  areaPath(report: AnalyticsData): string {
    const points = this.trendPoints(report, 'created');
    if (!points.length) return '';
    const baseline = this.chartHeight - this.chartBottom;
    return `${this.linePath(points)} L ${points.at(-1)?.x} ${baseline} L ${points[0].x} ${baseline} Z`;
  }

  gridY(fraction: number): number {
    return this.chartTop + (1 - fraction) * (this.chartHeight - this.chartTop - this.chartBottom);
  }

  gridValue(report: AnalyticsData, fraction: number): number {
    return Math.round(this.trendMax(report) * fraction);
  }

  showAxisLabel(index: number, count: number): boolean {
    if (count <= 12) return true;
    const interval = count >= 30 ? 5 : 2;
    return index === 0 || index === count - 1 || index % interval === 0;
  }

  hasTrendActivity(report: AnalyticsData): boolean {
    const trend = report.serviceOperations.ticketTrend;
    return [...trend.created, ...trend.resolved].some((value) => value > 0);
  }

  donutSegments(items: NamedValue[]): DonutSegment[] {
    const total = this.total(items);
    const circumference = 2 * Math.PI * 48;
    let consumed = 0;
    return items.map((item, index) => {
      const percent = total ? (item.value / total) * 100 : 0;
      const length = total ? (item.value / total) * circumference : 0;
      const segment = {
        ...item,
        percent: Math.round(percent),
        dash: `${length} ${circumference - length}`,
        offset: -consumed,
        className: `segment-${index % 5}`,
      };
      consumed += length;
      return segment;
    });
  }
}
