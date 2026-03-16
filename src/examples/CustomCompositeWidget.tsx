/**
 * Custom Composite Widget Example
 * 
 * This example demonstrates how to create a composite widget that combines
 * multiple UI elements and SDK components.
 * 
 * Key Concepts:
 * - Combining WidgetContainer with multiple child components
 * - Using Chart and custom UI elements together
 * - Advanced composition patterns
 * - Action buttons and footer sections
 * 
 * Usage:
 * ```tsx
 * <CustomCompositeWidget
 *   title="Composite Widget"
 *   chartData={{ labels: ['A', 'B'], values: [10, 20] }}
 *   stats={[{ label: 'Total', value: 30 }]}
 * />
 * ```
 */

import React from 'react';
import { Icon } from '@iconify/react';
// Import WidgetContainer, Chart, Button, and useAppTheme from external UI SDK package
import { WidgetContainer, Chart, Button, useAppTheme } from '@twinmatrix/ui-sdk';
import type { ChartData } from '@twinmatrix/ui-sdk';

export interface CustomCompositeWidgetProps {
  title?: string;
  description?: string;
  chartData: ChartData;
  stats?: Array<{ label: string; value: number }>;
  variant?: 'light' | 'dark';
  onAction?: () => void;
}

/**
 * Custom Composite Widget
 * 
 * Demonstrates advanced composition patterns:
 * - Chart visualization
 * - Stat indicators
 * - Action buttons
 * - Footer section
 */
export const CustomCompositeWidget: React.FC<CustomCompositeWidgetProps> = ({
  title = 'Composite Widget',
  description = 'Example composite widget',
  chartData,
  stats = [],
  variant = 'dark',
  onAction,
}) => {
  const theme = useAppTheme();
  const isEmpty = chartData.values.length === 0;

  // Prepare chart data
  const chartDataFormatted = React.useMemo(() => ({
    labels: chartData.labels,
    datasets: [
      {
        label: 'Data',
        data: chartData.values,
        backgroundColor: Array.isArray(chartData.colors)
          ? chartData.colors
          : chartData.labels.map((_, i) => `hsl(${(i * 360) / chartData.labels.length}, 70%, 50%)`),
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    ],
  }), [chartData]);

  return (
    <WidgetContainer
      title={title}
      description={description}
      variant={variant}
      empty={isEmpty}
      bodyMinHeight={300}
      actions={
        onAction ? (
          <Button variant="outline" size="small" onClick={onAction}>
            <Icon icon="mdi:refresh" width={16} height={16} />
          </Button>
        ) : undefined
      }
      footer={
        stats.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
              gap: '8px',
            }}
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                style={{
                  textAlign: 'center',
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: theme.surface.control,
                }}
              >
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: theme.text.primary,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: theme.text.muted,
                    marginTop: '4px',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        ) : undefined
      }
    >
      {!isEmpty && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Chart section */}
          <div style={{ height: '200px' }}>
            <Chart
              type="line"
              data={chartDataFormatted}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </WidgetContainer>
  );
};
