import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export type AnalyticsPeriod = '7d' | '30d' | '12m';

export interface KpiMetric {
  label: string;
  value: number;
  /** How the raw value should be rendered. */
  unit: 'currency' | 'count' | 'hours' | 'percent';
  /** Percentage change vs the previous comparable window. */
  delta: number;
  trend: 'up' | 'down';
  /** Whether the current trend direction is a good thing (drives colour). */
  positive: boolean;
  icon: string;
}

export interface AnalyticsKpis {
  revenue: KpiMetric;
  jobsCompleted: KpiMetric;
  avgResolution: KpiMetric;
  csat: KpiMetric;
}

export interface RevenueTrend {
  labels: string[];
  revenue: number[];
  jobs: number[];
}

export interface NamedValue {
  label: string;
  value: number;
}

export interface TechnicianStat {
  name: string;
  jobs: number;
  rating: number;
}

export interface AnalyticsData {
  period: AnalyticsPeriod;
  status: string;
  generatedAt: Date;
  kpis: AnalyticsKpis;
  revenueTrend: RevenueTrend;
  ticketStatus: NamedValue[];
  serviceTypes: NamedValue[];
  technicians: TechnicianStat[];
  inventorySignals: {
    lowStockAlerts: number;
    reservedItems: number;
    pendingRequests: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private apiUrl = 'http://localhost:5000/api/manager';

  constructor(private http: HttpClient) {}

  getAnalytics(period: AnalyticsPeriod): Observable<AnalyticsData> {
    return this.http
      .get<AnalyticsData>(`${this.apiUrl}/analytics`, { params: { period } })
      .pipe(
        catchError((err) => {
          console.error('Analytics backend unavailable. Switching to Offline mode.', err);
          return of(this.buildOfflineData(period));
        }),
      );
  }

  // ── Offline fallback ──────────────────────────────────────────────
  // Mirrors the shape the backend produces so the page is fully usable
  // even when the API is down (same strategy as the dashboard service).

  private buildOfflineData(period: AnalyticsPeriod): AnalyticsData {
    const trend = this.buildTrend(period);
    const totalRevenue = trend.revenue.reduce((a, b) => a + b, 0);
    const totalJobs = trend.jobs.reduce((a, b) => a + b, 0);
    const avgResolution = period === '12m' ? 26.4 : 18.7;

    return {
      period,
      status: 'Offline',
      generatedAt: new Date(),
      kpis: {
        revenue: {
          label: 'Total Revenue',
          value: totalRevenue,
          unit: 'currency',
          delta: 12.4,
          trend: 'up',
          positive: true,
          icon: 'dollar-sign',
        },
        jobsCompleted: {
          label: 'Jobs Completed',
          value: totalJobs,
          unit: 'count',
          delta: 8.1,
          trend: 'up',
          positive: true,
          icon: 'circle-check-big',
        },
        avgResolution: {
          label: 'Avg. Resolution',
          value: avgResolution,
          unit: 'hours',
          delta: -8.3,
          trend: 'down',
          positive: true,
          icon: 'timer',
        },
        csat: {
          label: 'Customer Satisfaction',
          value: 94.2,
          unit: 'percent',
          delta: 2.3,
          trend: 'up',
          positive: true,
          icon: 'smile',
        },
      },
      revenueTrend: trend,
      ticketStatus: [
        { label: 'Resolved', value: 148 },
        { label: 'In Progress', value: 42 },
        { label: 'Open', value: 27 },
        { label: 'Escalated', value: 6 },
      ],
      serviceTypes: [
        { label: 'Installation', value: 38 },
        { label: 'Repair', value: 31 },
        { label: 'Maintenance', value: 22 },
        { label: 'Inspection', value: 9 },
      ],
      technicians: [
        { name: 'A. Fernando', jobs: 47, rating: 4.9 },
        { name: 'M. Perera', jobs: 41, rating: 4.7 },
        { name: 'S. Jayasuriya', jobs: 38, rating: 4.8 },
        { name: 'R. De Silva', jobs: 33, rating: 4.5 },
        { name: 'K. Bandara', jobs: 29, rating: 4.6 },
      ],
      inventorySignals: { lowStockAlerts: 4, reservedItems: 45, pendingRequests: 8 },
    };
  }

  /** Deterministic seeded trend so the offline charts stay stable across refreshes. */
  private buildTrend(period: AnalyticsPeriod): RevenueTrend {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthLabels = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const points = period === '12m' ? 12 : period === '30d' ? 30 : 7;
    const isMonth = period === '12m';

    let s = (points * 97 + 13) % 2147483647;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };

    const now = new Date();
    const labels: string[] = [];
    const revenue: number[] = [];
    const jobs: number[] = [];

    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(now);
      if (isMonth) {
        d.setMonth(now.getMonth() - i);
        labels.push(monthLabels[d.getMonth()]);
      } else {
        d.setDate(now.getDate() - i);
        labels.push(points > 10 ? `${d.getMonth() + 1}/${d.getDate()}` : dayLabels[d.getDay()]);
      }

      const base = isMonth ? 42000 : 5200;
      const drift = (points - i) / points;
      const noise = 0.75 + rand() * 0.5;
      const weekendDip = !isMonth && (d.getDay() === 0 || d.getDay() === 6) ? 0.6 : 1;
      revenue.push(Math.round(base * (0.8 + drift * 0.5) * noise * weekendDip));

      const jobBase = isMonth ? 210 : 26;
      jobs.push(Math.round(jobBase * (0.85 + drift * 0.35) * (0.8 + rand() * 0.4) * weekendDip));
    }

    return { labels, revenue, jobs };
  }
}
