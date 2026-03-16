# Sample App - SDK Reference Implementation

This is a minimal sample application that demonstrates how to use the Dashboard SDK and Map SDK in a real-world application. It serves as a reference implementation for SDK users.

## Overview

This sample app demonstrates:

- **Dashboard-centric UI** with responsive design (desktop and mobile)
- **Focus tree navigation** for site/building/level selection
- **Layer selector** for filtering map objects by taxonomy
- **Alerts/cameras mechanism** with dummy and realtime modes
- **Map interactions** (popup/marker display on selection)
- **Adapter pattern** for converting client-specific data to SDK formats
- **Custom widget examples** showing how to build your own widgets

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Sample App                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐         ┌──────────────┐            │
│  │   UI SDK     │         │   Map SDK    │            │
│  │ (External)   │         │  (External)  │            │
│  └──────────────┘         └──────────────┘            │
│         │                       │                      │
│         └───────────┬───────────┘                      │
│                     │                                   │
│         ┌───────────▼───────────┐                      │
│         │   App Components      │                      │
│         │  - DashboardLayout    │                      │
│         │  - FocusControl       │                      │
│         │  - LayerSelector      │                      │
│         └───────────┬───────────┘                      │
│                     │                                   │
│         ┌───────────▼───────────┐                      │
│         │      Stores           │                      │
│         │  - useEventStreamStore │                      │
│         │  - camerasStore       │                      │
│         │  - dashboardStore     │                      │
│         └───────────┬───────────┘                      │
│                     │                                   │
│         ┌───────────▼───────────┐                      │
│         │     Adapters          │                      │
│         │  - exampleAdapter     │                      │
│         └───────────────────────┘                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Access to SDK packages (`@twinmatrix/ui-sdk` and `@twinmatrix/spatialverse-sdk-web`)

### Installation

1. Install dependencies:

```bash
npm install
```

2. **Import SDK styles** (already done in `src/main.tsx`):

```typescript
import '@twinmatrix/ui-sdk/styles.css';
```

This imports the precompiled Tailwind CSS bundle from the SDK. **No Tailwind configuration needed** in your app!

3. Configure SDK access tokens in `src/config/app.config.ts`:

```typescript
export default {
  metaAtlas: {
    accessToken: 'YOUR_ACCESS_TOKEN',
    secretKey: 'YOUR_SECRET_KEY',
    role: 'YOUR_ROLE',
  },
  // ... other config
};
```

4. Start the development server:

```bash
npm run dev
```

## Key Concepts

### 1. External SDK Packages

Both SDKs are external npm packages, not part of this codebase:

- **UI SDK** (`@twinmatrix/ui-sdk`): Provides dashboard layout components, widgets, and UI primitives
- **Map SDK** (`@twinmatrix/spatialverse-sdk-web`): Provides map components, hooks, and stores

All imports use package names:

```typescript
// UI SDK imports
import { DashboardShell, AlertsPanel, AlertSeverityChart } from '@twinmatrix/ui-sdk';

// Map SDK imports
import { MetaAtlasMap, useFocus, useSearch } from '@twinmatrix/spatialverse-sdk-web/react';
```

### 2. Event Stream Pattern

The `useEventStreamStore` manages events from different sources:

- **Dummy Mode**: Generates mock alerts for testing
- **Realtime Mode**: Connects to WebSocket for live alerts

Events are normalized to a common format (`NormalizedEvent`) regardless of source:

```typescript
const events = useEventStreamStore(state => state.getVisibleEvents());
const startDummy = useEventStreamStore(state => state.startDummy);
startDummy(); // Start generating dummy alerts
```

### 3. Adapter Pattern

The adapter pattern converts your client-specific alert/event data to SDK widget formats:

```typescript
import { fromAilyticsEvents } from './adapters/exampleAdapter';

const events = useEventStreamStore(state => state.getVisibleEvents());
const widgetData = fromAilyticsEvents(events, { timezone: 'UTC' });

// Use transformed data with SDK widgets
<AlertSeverityChart data={widgetData.chartBySeverity} />
```

See `src/adapters/exampleAdapter.ts` for a complete example.

### 4. Map Interactions

Map interactions are centralized in `MapInteraction.tsx`:

- Listens to `activeObject` changes from Map SDK
- Creates popups/markers when objects are selected
- Syncs camera selection to dashboard state

```typescript
<MetaAtlasMap>
  <MapInteraction enabled={true} onRoute={handleRoute} />
</MetaAtlasMap>
```

### 5. Widget Composition

SDK widgets are composed using layout components:

```typescript
<DashboardShell>
  <DashboardMain>
    {/* Map content */}
  </DashboardMain>
  <DashboardSidePanel side="left" isOpen={true}>
    <AlertSeverityChart data={chartData} />
    <TopCamerasList items={cameraStats} />
  </DashboardSidePanel>
</DashboardShell>
```

## File Structure

```
sample-app/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component
│   ├── config/
│   │   └── app.config.ts          # App configuration
│   ├── features/
│   │   └── dashboard/
│   │       ├── DashboardLayout.tsx # Main layout
│   │       ├── components/
│   │       │   ├── FocusControl.tsx
│   │       │   └── LayerSelector.tsx
│   │       ├── stores/
│   │       │   └── dashboardStore.ts
│   │       └── hooks/
│   │           └── useCameraLoader.ts
│   ├── stores/
│   │   ├── useEventStreamStore.ts
│   │   └── camerasStore.ts
│   ├── adapters/
│   │   └── exampleAdapter.ts       # Data transformation example
│   ├── map/
│   │   └── MapInteraction.tsx     # Map popup/marker logic
│   ├── examples/                   # Custom widget examples (reference)
│   │   ├── CustomChartWidget.tsx
│   │   ├── CustomStatsWidget.tsx
│   │   └── CustomCompositeWidget.tsx
│   ├── types/                      # Type definitions
│   └── utils/                      # Utility functions
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Examples

### Using Premade SDK Widgets

```typescript
import { AlertSeverityChart, TopCamerasList } from '@twinmatrix/ui-sdk';

// Transform your data using adapter
const widgetData = fromAilyticsEvents(events, { timezone: 'UTC' });

// Use with SDK widgets
<AlertSeverityChart data={widgetData.chartBySeverity} variant="dark" />
<TopCamerasList items={widgetData.sourceStats} onItemClick={handleClick} />
```

### Creating Custom Widgets

See `src/examples/` directory for examples:

- **CustomChartWidget.tsx**: Chart widget using WidgetContainer + Chart
- **CustomStatsWidget.tsx**: Stats widget with indicators
- **CustomCompositeWidget.tsx**: Composite widget with multiple elements

### Using Map SDK Hooks

```typescript
import { useFocus, useSearch } from '@twinmatrix/spatialverse-sdk-web/react';

function MyComponent() {
  const { getSites, focusTo, isReady } = useFocus();
  const { getMapObjectsByWhatTaxonomy } = useSearch();
  
  // Use SDK hooks...
}
```

### Adapter Implementation

See `src/adapters/exampleAdapter.ts` for a complete adapter implementation showing:

- Input: Client-specific alert format
- Output: SDK widget data formats
- Transformation functions for each widget type

## Responsive Design

The app supports both desktop and mobile:

- **Desktop**: Side panels on left/right
- **Mobile**: Drawer-based navigation

Breakpoint: 1024px

## Modes

### Dummy Mode (Default)

Generates mock alerts for testing. Automatically starts when cameras are loaded.

### Realtime Mode

Connects to WebSocket server for live alerts. Configure in `app.config.ts`:

```typescript
dataSources: {
  realtime: {
    enabled: true,
    url: 'ws://your-websocket-url',
  },
}
```

## Key Features Demonstrated

1. **Dashboard Layout**: Using `DashboardShell`, `DashboardMain`, `DashboardSidePanel`
2. **Focus Tree**: Site/building/level navigation using `useFocus` hook
3. **Layer Selector**: Taxonomy filtering using `filterByWhatTaxonomy`
4. **Camera Loading**: Loading cameras from Map SDK and syncing to stores
5. **Event Stream**: Managing events in dummy and realtime modes
6. **Map Interactions**: Centralized popup/marker creation
7. **Data Transformation**: Adapter pattern for converting data formats
8. **Custom Widgets**: Examples of building custom widgets

## Dependencies

- **React 18+**: UI framework
- **Zustand**: State management
- **dayjs**: Date/time handling
- **@twinmatrix/ui-sdk**: UI SDK (external package)
- **@twinmatrix/spatialverse-sdk-web**: Map SDK (external package)

## Documentation

- See inline comments in source files for detailed explanations
- Check `src/examples/` for custom widget examples
- Review `src/adapters/exampleAdapter.ts` for adapter pattern

## Notes

- This is a **reference implementation**, not a production app
- SDK packages are **external dependencies** (not included in this repo)
- All SDK imports use **package names**, not local paths
- The app demonstrates **best practices** for SDK integration

## License

This sample app is provided as a reference implementation for SDK users.
