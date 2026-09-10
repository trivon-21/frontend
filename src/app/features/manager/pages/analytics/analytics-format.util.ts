import { ComparisonMetric } from '../../services/analytics.service';

export function deltaText(metric: ComparisonMetric): string {
  if (metric.deltaKind === 'new') return 'New vs previous period';
  if (metric.deltaKind === 'no-change') return 'No change';
  const prefix = Number(metric.deltaPercent) > 0 ? '+' : '';
  return `${prefix}${metric.deltaPercent}% vs previous period`;
}

export function deltaClass(metric: ComparisonMetric): string {
  if (metric.deltaKind !== 'percent' || metric.semantic === 'neutral' || metric.deltaPercent === 0) return 'neutral';
  const increase = Number(metric.deltaPercent) > 0;
  const favorable = metric.semantic === 'higher-is-better' ? increase : !increase;
  return favorable ? 'positive' : 'negative';
}

export function label(value: string): string {
  return value.replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
