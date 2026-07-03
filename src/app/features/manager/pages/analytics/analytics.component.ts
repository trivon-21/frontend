import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  AnalyticsService,
  AnalyticsData,
  AnalyticsPeriod,
  NamedValue,
} from '../../services/analytics.service';

interface PeriodOption {
  key: AnalyticsPeriod;
  label: string;
}

interface DonutSegment {
  label: string;
  value: number;
  percent: number;
  color: string;
  /** SVG stroke-dasharray + dashoffset for the ring segment. */
  dash: string;
  offset: number;
}

interface TrendPoint {
  x: number;
  y: number;
  label: string;
  revenue: number;
  jobs: number;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
})
export class AnalyticsComponent implements OnInit {
  // ── Chart palette (validated categorical hues from the design system) ──
  private readonly palette = ['#2a78d6', '#1baf7a', '#eda100', '#e34948', '#4a3aa7'];

  readonly periods: PeriodOption[] = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '12m', label: '12 Months' },
  ];
  activePeriod: AnalyticsPeriod = '7d';

  data: AnalyticsData | null = null;
  loading = false;
  error: string | null = null;

  // ── Trend chart geometry ──
  readonly chart = { w: 720, h: 260, padX: 44, padTop: 24, padBottom: 34 };
  areaPath = '';
  linePath = '';
  trendPoints: TrendPoint[] = [];
  yTicks: { y: number; label: string }[] = [];
  hover: TrendPoint | null = null;

  // ── Derived views ──
  donutSegments: DonutSegment[] = [];
  ticketTotal = 0;
  serviceTypes: (NamedValue & { pct: number; color: string })[] = [];
  maxServiceValue = 0;
  maxTechJobs = 0;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.load();
  }

  selectPeriod(period: AnalyticsPeriod): void {
    if (period === this.activePeriod) return;
    this.activePeriod = period;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.analyticsService.getAnalytics(this.activePeriod).subscribe({
      next: (data) => {
        this.data = data;
        this.buildDerived(data);
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load analytics data';
        this.loading = false;
      },
    });
  }

  // ── Formatting helpers used by the template ──

  formatKpi(value: number, unit: string): string {
    switch (unit) {
      case 'currency':
        return this.formatCurrency(value);
      case 'hours':
        return `${value}h`;
      case 'percent':
        return `${value}%`;
      default:
        return this.formatNumber(value);
    }
  }

  formatCurrency(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value}`;
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-US');
  }

  color(index: number): string {
    return this.palette[index % this.palette.length];
  }

  // ── Chart construction ──

  private buildDerived(data: AnalyticsData): void {
    this.buildTrendChart(data);
    this.buildDonut(data.ticketStatus);

    this.maxServiceValue = Math.max(1, ...data.serviceTypes.map((s) => s.value));
    this.serviceTypes = data.serviceTypes.map((s, i) => ({
      ...s,
      pct: Math.round((s.value / this.maxServiceValue) * 100),
      color: this.color(i),
    }));

    this.maxTechJobs = Math.max(1, ...data.technicians.map((t) => t.jobs));
  }

  private buildTrendChart(data: AnalyticsData): void {
    const values = data.revenueTrend.revenue;
    const labels = data.revenueTrend.labels;
    const { w, h, padX, padTop, padBottom } = this.chart;

    this.trendPoints = [];
    this.areaPath = '';
    this.linePath = '';
    this.yTicks = [];
    this.hover = null;

    if (!values.length) return;

    const max = Math.max(...values);
    const min = Math.min(...values);
    // Pad the range slightly so the line never hugs the top/bottom edge.
    const top = max + (max - min) * 0.15 || max * 1.1 || 1;
    const bottom = Math.max(0, min - (max - min) * 0.15);
    const range = top - bottom || 1;

    const plotW = w - padX * 2;
    const plotH = h - padTop - padBottom;
    const stepX = values.length > 1 ? plotW / (values.length - 1) : 0;

    this.trendPoints = values.map((v, i) => {
      const x = padX + stepX * i;
      const y = padTop + plotH * (1 - (v - bottom) / range);
      return { x, y, label: labels[i], revenue: v, jobs: data.revenueTrend.jobs[i] ?? 0 };
    });

    this.linePath = this.trendPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    const first = this.trendPoints[0];
    const last = this.trendPoints[this.trendPoints.length - 1];
    const baseY = padTop + plotH;
    this.areaPath = `${this.linePath} L ${last.x.toFixed(1)} ${baseY} L ${first.x.toFixed(
      1,
    )} ${baseY} Z`;

    // 4 horizontal reference ticks.
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const val = bottom + (range * i) / ticks;
      const y = padTop + plotH * (1 - i / ticks);
      this.yTicks.push({ y, label: this.formatCurrency(Math.round(val)) });
    }
  }

  private buildDonut(items: NamedValue[]): void {
    this.ticketTotal = items.reduce((sum, s) => sum + s.value, 0);
    const circumference = 2 * Math.PI * 54; // r = 54
    let cumulative = 0;

    this.donutSegments = items.map((item, i) => {
      const percent = this.ticketTotal ? item.value / this.ticketTotal : 0;
      const len = percent * circumference;
      // Small 2px gap between segments for surface separation.
      const gap = items.length > 1 ? 2 : 0;
      const dash = `${Math.max(0, len - gap)} ${circumference - Math.max(0, len - gap)}`;
      const offset = -cumulative * circumference;
      cumulative += percent;
      return {
        label: item.label,
        value: item.value,
        percent: Math.round(percent * 100),
        color: this.color(i),
        dash,
        offset,
      };
    });
  }

  // ── Trend hover interaction ──

  onTrendMove(event: MouseEvent): void {
    if (!this.trendPoints.length) return;
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    // Map cursor into the SVG's internal viewBox coordinate space.
    const cursorX = ((event.clientX - rect.left) / rect.width) * this.chart.w;
    let nearest = this.trendPoints[0];
    let best = Infinity;
    for (const p of this.trendPoints) {
      const d = Math.abs(p.x - cursorX);
      if (d < best) {
        best = d;
        nearest = p;
      }
    }
    this.hover = nearest;
  }

  onTrendLeave(): void {
    this.hover = null;
  }

  // ── CSV export of the current view ──

  exportCsv(): void {
    if (!this.data) return;
    const d = this.data;
    const rows: string[] = [];
    rows.push(`AirLux Manager Analytics — ${this.periodLabel()}`);
    rows.push(`Generated,${new Date().toLocaleString()}`);
    rows.push('');

    rows.push('KPI,Value,Change %');
    for (const k of [d.kpis.revenue, d.kpis.jobsCompleted, d.kpis.avgResolution, d.kpis.csat]) {
      rows.push(`${this.csv(k.label)},${this.csv(this.formatKpi(k.value, k.unit))},${k.delta}`);
    }
    rows.push('');

    rows.push('Date,Revenue,Jobs Completed');
    d.revenueTrend.labels.forEach((label, i) => {
      rows.push(`${this.csv(label)},${d.revenueTrend.revenue[i]},${d.revenueTrend.jobs[i]}`);
    });
    rows.push('');

    rows.push('Ticket Status,Count');
    d.ticketStatus.forEach((t) => rows.push(`${this.csv(t.label)},${t.value}`));
    rows.push('');

    rows.push('Service Type,Jobs');
    d.serviceTypes.forEach((s) => rows.push(`${this.csv(s.label)},${s.value}`));
    rows.push('');

    rows.push('Technician,Jobs,Rating');
    d.technicians.forEach((t) => rows.push(`${this.csv(t.name)},${t.jobs},${t.rating}`));

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `airlux-analytics-${this.activePeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private csv(value: string): string {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }

  periodLabel(): string {
    return this.periods.find((p) => p.key === this.activePeriod)?.label ?? '';
  }
}
