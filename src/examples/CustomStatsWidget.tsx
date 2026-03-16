/**
 * Custom Stats Widget Example
 * 
 * This example demonstrates how to create a custom stats widget using
 * WidgetContainer with custom UI indicators (counts, percentages, icons).
 * 
 * Key Concepts:
 * - WidgetContainer for consistent styling
 * - useAppTheme for theme colors
 * - Custom stat indicators (counts, percentages, icons)
 * - Semantic colors from theme (success, warning, critical, info)
 * 
 * Usage:
 * ```tsx
 * <CustomStatsWidget
 *   title="System Stats"
 *   stats={[
 *     { label: 'Total', value: 100, icon: 'mdi:chart-line' },
 *     { label: 'Active', value: 75, percentage: 75, severity: 'success' },
 *   ]}
 * />
 * ```
 */

import React from 'react';
import { Icon } from '@iconify/react';
// Import WidgetContainer and useAppTheme from external UI SDK package
import { WidgetContainer, useAppTheme } from '@twinmatrix/ui-sdk';

export interface StatItem {
  label: string;
  value: number;
  percentage?: number;
  icon?: string;
  severity?: 'success' | 'warning' | 'critical' | 'info';
}

export interface CustomStatsWidgetProps {
  title?: string;
  description?: string;
  stats: StatItem[];
  variant?: 'light' | 'dark';
}

/**
 * Custom Stats Widget
 * 
 * Demonstrates creating a custom widget with stat indicators.
 * Shows different UI patterns: counts, percentages, icons, and severity colors.
 */
export const CustomStatsWidget: React.FC<CustomStatsWidgetProps> = ({
  title = 'Custom Stats',
  description = 'Example custom stats widget',
  stats,
  variant = 'dark',
}) => {
  const theme = useAppTheme();
  const isEmpty = stats.length === 0;

  // Get severity color from theme
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return theme.semantic.critical;
      case 'warning':
        return theme.semantic.warning;
      case 'info':
        return theme.semantic.info;
      case 'success':
        return theme.semantic.success;
      default:
        return theme.text.muted;
    }
  };

  return (
    <WidgetContainer
      title={title}
      description={description}
      variant={variant}
      empty={isEmpty}
      bodyMinHeight={180}
    >
      {!isEmpty && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {stats.map((stat, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: theme.surface.control,
                border: `1px solid ${theme.border.subtle}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {stat.icon && (
                  <Icon
                    icon={stat.icon}
                    width={24}
                    height={24}
                    style={{ color: getSeverityColor(stat.severity) }}
                  />
                )}
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: theme.text.primary,
                    }}
                  >
                    {stat.label}
                  </div>
                  {stat.percentage !== undefined && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: theme.text.muted,
                        marginTop: '2px',
                      }}
                    >
                      {stat.percentage}%
                    </div>
                  )}
                </div>
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: getSeverityColor(stat.severity),
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetContainer>
  );
};
