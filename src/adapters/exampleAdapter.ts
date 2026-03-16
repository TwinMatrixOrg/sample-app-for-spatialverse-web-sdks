/**
 * Example Adapter - Convert Client-Specific Alerts to SDK Format
 * 
 * This adapter demonstrates how to transform your own alert/event data
 * into the formats expected by SDK widgets.
 * 
 * Pattern:
 * 1. Your app receives alerts/events from your backend
 * 2. Store them in your event store (e.g., useEventStreamStore)
 * 3. Use an adapter to transform them to SDK widget formats
 * 4. Pass transformed data to SDK widgets
 * 
 * This example shows how to convert AilyticsAlert format to SDK widget formats.
 * You can adapt this pattern for your own alert/event formats.
 * 
 * @example
 * ```tsx
 * const events = useEventStreamStore(state => state.getVisibleEvents());
 * const widgetData = fromAilyticsEvents(events, { timezone: 'UTC' });
 * <AlertSeverityChart data={widgetData.chartBySeverity} />
 * ```
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { NormalizedEvent } from '../types/events';
import { AilyticsAlert, mapTriggerToSeverity } from '../types/alerts';
import { formatRelativeTime } from '../utils/formatTime';
import { getAilyticsAlertsFromEvents } from '../utils/eventHelpers';
// Import SDK types from external UI SDK package
import type {
  ChartData,
  AlertListItem,
  SourceStatsItem,
  InsightItem,
  InsightStatistics,
  TopCategoryItem,
} from '@twinmatrix/ui-sdk';

dayjs.extend(utc);
dayjs.extend(timezone);

// Trigger labels for display
const TRIGGER_LABELS: Record<string, string> = {
  worker_near_heavy_machine: 'Worker Near Heavy Machinery',
  ppe_detection: 'PPE Detection',
  no_access_area: 'No Access Area',
  slip_trip_fall: 'Slip/Trip/Fall',
  crowding: 'Crowding',
};

// Trigger icons for UI display
const TRIGGER_ICONS: Record<string, string> = {
  worker_near_heavy_machine: 'mdi:construction',
  ppe_detection: 'mdi:hard-hat',
  no_access_area: 'mdi:block-helper',
  slip_trip_fall: 'mdi:alert-circle',
  crowding: 'mdi:account-group',
};

// Trigger severity mapping
const TRIGGER_SEVERITY: Record<string, 'critical' | 'warning' | 'info'> = {
  worker_near_heavy_machine: 'critical',
  ppe_detection: 'critical',
  slip_trip_fall: 'warning',
  no_access_area: 'info',
  crowding: 'warning',
};

/**
 * Convert Ailytics alerts to AlertListItem[] format expected by SDK widgets
 */
export function toAlertListItems(alerts: AilyticsAlert[]): AlertListItem[] {
  return alerts.map((alert) => ({
    id: alert.id,
    message: `${alert.trigger.replace(/_/g, ' ')} - ${alert.camera_info.name}`,
    time: formatRelativeTime(alert.timestamp, alert.timezone),
    severity: mapTriggerToSeverity(alert.trigger),
    timestamp: alert.timestamp,
    category: alert.trigger.replace(/_/g, ' '),
  }));
}

/**
 * Convert NormalizedEvent[] to AlertListItem[]
 */
export function toAlertListItemsFromEvents(events: NormalizedEvent[]): AlertListItem[] {
  const alerts = getAilyticsAlertsFromEvents(events);
  return toAlertListItems(alerts);
}

/**
 * Chart data by trigger type
 * Groups alerts by trigger type and counts them
 */
export function toChartDataByTrigger(alerts: AilyticsAlert[]): ChartData {
  const triggerCounts: Record<string, number> = {};
  alerts.forEach((a) => {
    const label = TRIGGER_LABELS[a.trigger] ?? a.trigger.replace(/_/g, ' ');
    triggerCounts[label] = (triggerCounts[label] ?? 0) + 1;
  });
  return {
    labels: Object.keys(triggerCounts),
    values: Object.values(triggerCounts),
  };
}

/**
 * Chart data by camera (top N)
 * Groups alerts by camera and returns top N cameras by alert count
 */
export function toChartDataByCamera(
  alerts: AilyticsAlert[],
  topN = 5
): ChartData {
  const cameraCounts: Record<string, number> = {};
  alerts.forEach((a) => {
    const name = a.camera_info.name;
    cameraCounts[name] = (cameraCounts[name] ?? 0) + 1;
  });
  const sorted = Object.entries(cameraCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN);
  return { labels: sorted.map(([l]) => l), values: sorted.map(([, v]) => v) };
}

/**
 * Chart data by severity
 * Groups alerts by severity level
 */
export function toChartDataBySeverity(alerts: AilyticsAlert[]): ChartData {
  const severityCounts: Record<string, number> = {
    Severe: 0,
    Medium: 0,
    Normal: 0,
    Info: 0,
  };
  alerts.forEach((a) => {
    const s = mapTriggerToSeverity(a.trigger);
    severityCounts[s]++;
  });
  return {
    labels: Object.keys(severityCounts),
    values: Object.values(severityCounts),
  };
}

/**
 * Timeline chart data (bucket counts)
 * Groups alerts into time buckets for timeline visualization
 */
export function toChartDataTimeline(
  alerts: AilyticsAlert[],
  tz: string,
  timeWindowMinutes = 60,
  bucketSizeMinutes = 5
): ChartData {
  const nowInTz = dayjs().tz(tz);
  const hourStart = nowInTz.startOf('hour');
  const hourEnd = nowInTz.endOf('hour');
  const windowStart = hourStart.valueOf();
  const windowEnd = hourEnd.valueOf();
  const buckets = Math.ceil(timeWindowMinutes / bucketSizeMinutes);
  const bucketCounts = new Array(buckets).fill(0);
  const bucketLabels: string[] = [];

  for (let i = 0; i < buckets; i++) {
    const bucketTime = hourStart.add(i * bucketSizeMinutes, 'minute');
    bucketLabels.push(bucketTime.format('HH:mm'));
  }

  alerts.forEach((alert) => {
    const t = dayjs(alert.timestamp).valueOf();
    if (t >= windowStart && t <= windowEnd) {
      const idx = Math.floor((t - windowStart) / (bucketSizeMinutes * 60 * 1000));
      if (idx >= 0 && idx < buckets) bucketCounts[idx]++;
    }
  });

  return { labels: bucketLabels, values: bucketCounts };
}

/**
 * Source stats for TopCamerasList widget
 * Returns top N cameras with their alert counts and last activity
 */
export function toSourceStatsItems(
  alerts: AilyticsAlert[],
  topN = 5,
  tz = 'UTC'
): SourceStatsItem[] {
  const stats: Record<string, { name: string; count: number; lastAlertTime: string }> = {};
  alerts.forEach((a) => {
    const id = a.camera_info.id;
    const name = a.camera_info.name;
    if (!stats[id]) {
      stats[id] = { name, count: 0, lastAlertTime: a.timestamp };
    }
    stats[id].count++;
    if (new Date(a.timestamp) > new Date(stats[id].lastAlertTime)) {
      stats[id].lastAlertTime = a.timestamp;
    }
  });
  return Object.entries(stats)
    .map(([id, s]) => ({
      id,
      name: s.name,
      count: s.count,
      lastActivity: formatRelativeTime(s.lastAlertTime, tz),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/**
 * Insights and statistics for AIAnalysisPanel widget
 * Generates insights and statistics from alert data
 */
export function toInsightsAndStatistics(
  alerts: AilyticsAlert[],
  _mode: 'realtime' | 'dummy' = 'realtime'
): {
  insights: InsightItem[];
  statistics: InsightStatistics;
  topCategories: TopCategoryItem[];
} {
  const stats: InsightStatistics = {
    totalCount: alerts.length,
    byCategory: {},
    bySource: {},
    recentCount: 0,
    peakValue: null,
    topCategory: null,
    criticalCount: 0,
  };

  const hourCounts: Record<number, number> = {};
  const oneHourAgo = dayjs().subtract(1, 'hour');

  alerts.forEach((a) => {
    stats.byCategory![a.trigger] = (stats.byCategory![a.trigger] ?? 0) + 1;
    if (a.camera_info?.id) {
      stats.bySource![a.camera_info.id] = (stats.bySource![a.camera_info.id] ?? 0) + 1;
    }
    const t = dayjs(a.timestamp);
    if (t.isAfter(oneHourAgo)) stats.recentCount!++;
    const severity = TRIGGER_SEVERITY[a.trigger];
    if (severity === 'critical') stats.criticalCount!++;
    const h = t.hour();
    hourCounts[h] = (hourCounts[h] ?? 0) + 1;
  });

  let maxCount = 0;
  Object.entries(hourCounts).forEach(([h, c]) => {
    if (c > maxCount) {
      maxCount = c;
      stats.peakValue = parseInt(h, 10);
    }
  });

  let maxCat = '';
  let maxCatCount = 0;
  Object.entries(stats.byCategory!).forEach(([k, v]) => {
    if (v > maxCatCount) {
      maxCatCount = v;
      maxCat = k;
    }
  });
  stats.topCategory = maxCat || null;

  const insights: InsightItem[] = [];

  if (stats.totalCount === 0) {
    insights.push({
      type: 'success',
      title: 'No Active Alerts',
      message: 'All systems operating normally.',
      icon: 'mdi:check-circle',
    });
  } else {
    if (stats.criticalCount! > 0) {
      const pct = Math.round((stats.criticalCount! / stats.totalCount) * 100);
      insights.push({
        type: 'critical',
        title: `${stats.criticalCount} Critical Alert${stats.criticalCount! > 1 ? 's' : ''} Detected`,
        message: `${pct}% of alerts are critical. Immediate attention recommended.`,
        icon: 'mdi:alert-octagon',
      });
    }
    if (stats.topCategory) {
      const label = TRIGGER_LABELS[stats.topCategory] ?? stats.topCategory;
      const count = stats.byCategory![stats.topCategory];
      const pct = Math.round((count / stats.totalCount) * 100);
      insights.push({
        type: TRIGGER_SEVERITY[stats.topCategory] === 'critical' ? 'warning' : 'info',
        title: `${label} Most Common`,
        message: `${pct}% of alerts (${count} total).`,
        icon: TRIGGER_ICONS[stats.topCategory] ?? 'mdi:alert',
      });
    }
    if (stats.peakValue !== null) {
      const h12 = stats.peakValue % 12 || 12;
      const period = stats.peakValue < 12 ? 'AM' : 'PM';
      insights.push({
        type: 'info',
        title: 'Peak Alert Time',
        message: `Most alerts at ${h12}:00 ${period}.`,
        icon: 'mdi:clock-outline',
      });
    }
    if (stats.recentCount! > 0) {
      insights.push({
        type: stats.recentCount! > 5 ? 'warning' : 'info',
        title: `${stats.recentCount} Alert${stats.recentCount! > 1 ? 's' : ''} in Last Hour`,
        message:
          stats.recentCount! > 5
            ? 'High alert frequency. Review recent incidents.'
            : 'Recent activity within normal range.',
        icon: 'mdi:trending-up',
      });
    }
  }

  const topCategories: TopCategoryItem[] = Object.entries(stats.byCategory ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([trigger, count]) => ({
      label: TRIGGER_LABELS[trigger] ?? trigger.replace(/_/g, ' '),
      count,
      percentage: Math.round((count / stats.totalCount) * 100),
      icon: TRIGGER_ICONS[trigger] ?? 'mdi:alert',
      severity: TRIGGER_SEVERITY[trigger],
    }));

  return { insights, statistics: stats, topCategories };
}

/**
 * Convenience function: all widget data from NormalizedEvent[]
 * 
 * This is the main entry point for converting events to widget data.
 * It calls all the individual transformation functions and returns
 * a complete set of widget data.
 */
export function fromAilyticsEvents(
  events: NormalizedEvent[],
  options?: { timezone?: string; topN?: number }
) {
  const alerts = getAilyticsAlertsFromEvents(events);
  const tz = options?.timezone ?? 'UTC';
  const topN = options?.topN ?? 5;

  return {
    alertListItems: toAlertListItems(alerts),
    chartByTrigger: toChartDataByTrigger(alerts),
    chartByCamera: toChartDataByCamera(alerts, topN),
    chartBySeverity: toChartDataBySeverity(alerts),
    chartTimeline: toChartDataTimeline(alerts, tz),
    sourceStats: toSourceStatsItems(alerts, topN, tz),
    ...toInsightsAndStatistics(alerts),
  };
}
