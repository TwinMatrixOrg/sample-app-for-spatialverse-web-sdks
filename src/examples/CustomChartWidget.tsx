/**
 * Custom Chart Widget Example
 * 
 * This example demonstrates how to create a custom chart widget using
 * WidgetContainer and Chart components from the UI SDK.
 * 
 * Key Concepts:
 * - WidgetContainer provides consistent styling and layout
 * - Chart component handles chart rendering
 * - ChartData format: { labels: string[], values: number[], colors?: ... }
 * - Theme integration via useAppTheme hook
 * 
 * Usage:
 * ```tsx
 * <CustomChartWidget
 *   title="Custom Chart"
 *   data={{
 *     labels: ['A', 'B', 'C'],
 *     values: [10, 20, 30],
 *   }}
 * />
 * ```
 */

import React from 'react';
// Import WidgetContainer and Chart from external UI SDK package
import { WidgetContainer, Chart } from '@twinmatrix/ui-sdk';
import type { ChartData } from '@twinmatrix/ui-sdk';

export interface CustomChartWidgetProps {
  title?: string;
  description?: string;
  data: ChartData;
  variant?: 'light' | 'dark';
}

/**
 * Custom Chart Widget
 * 
 * Demonstrates creating a custom widget using SDK components.
 * This pattern can be used to create any custom chart widget.
 */
export const CustomChartWidget: React.FC<CustomChartWidgetProps> = ({
  title = 'Custom Chart',
  description = 'Example custom chart widget',
  data,
  variant = 'dark',
}) => {
  const isEmpty = data.values.length === 0;

  // Prepare chart data format expected by Chart component
  const chartData = React.useMemo(() => ({
    labels: data.labels,
    datasets: [
      {
        label: 'Custom Data',
        data: data.values,
        backgroundColor: Array.isArray(data.colors)
          ? data.colors
          : data.labels.map((_, i) => `hsl(${(i * 360) / data.labels.length}, 70%, 50%)`),
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    ],
  }), [data]);

  return (
    <WidgetContainer
      title={title}
      description={description}
      variant={variant}
      empty={isEmpty}
      bodyMinHeight={220}
    >
      {!isEmpty && (
        <Chart
          type="bar"
          data={chartData}
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
      )}
    </WidgetContainer>
  );
};
