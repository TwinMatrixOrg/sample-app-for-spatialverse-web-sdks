/**
 * Dashboard Layout Component
 * 
 * This is the main dashboard layout component that demonstrates:
 * - How to use UI SDK layout components (DashboardShell, DashboardMain, DashboardSidePanel)
 * - How to use UI SDK widgets (AlertsPanel, AlertSeverityChart, etc.)
 * - How to integrate Map SDK (MetaAtlasMap)
 * - How to handle responsive design (desktop/mobile)
 * - How to transform event data using adapters
 * 
 * Key Features:
 * - Responsive layout (desktop and mobile)
 * - Focus tree navigation
 * - Layer selector (taxonomy filtering)
 * - Alerts/cameras mechanism
 * - Dummy and realtime modes
 * 
 * Usage:
 * ```tsx
 * <DashboardLayout />
 * ```
 */

import React, { useEffect, useMemo, useState } from 'react';
// Import UI SDK components from external package
import {
  DashboardShell,
  DashboardMain,
  DashboardSidePanel,
  DashboardMobileDrawer,
  AlertsPanel,
  AIAnalysisPanel,
  AlertTriggerChart,
  AlertCameraChart,
  AlertTimelineChart,
  AlertSeverityChart,
  TopCamerasList,
  RecentActivityFeed,
  TopBar,
  Button,
  useAppTheme,
  useThemeStore,
} from '@twinmatrix/ui-sdk';
// Import Map SDK components from external package
import { MetaAtlasMap } from '@twinmatrix/spatialverse-sdk-web/react';
import { Icon } from '@iconify/react';
import appConfig from '../../config/app.config';
import { useEventStreamStore, useLoadCameras } from '../../stores/useEventStreamStore';
import { useDashboardStore } from './stores/dashboardStore';
import { FocusControl } from './components/FocusControl';
import { LayerSelector } from './components/LayerSelector';
import { MapInteraction } from '../../map/MapInteraction';
import { MapImageLoader } from '../../map/MapImageLoader';
import { fromAilyticsEvents } from '../../adapters/exampleAdapter';
import { getAilyticsAlertsFromEvents } from '../../utils/eventHelpers';
import { AilyticsAlert } from '../../types/alerts';
import { EventSource } from '@twinmatrix/spatialverse-sdk-web';
import type { metaFeature } from '@twinmatrix/spatialverse-sdk-web';
import { AlertDetailModal } from '../../components/alerts/AlertDetailModal';

const DashboardLayoutContent: React.FC = () => {
  // UI State
  const {
    isMetricsPanelOpen,
    setIsMetricsPanelOpen,
    isAlertsPanelOpen,
    setIsAlertsPanelOpen,
    selectedCameraId,
    setSelectedCameraId,
  } = useDashboardStore();
  const [isMobile, setIsMobile] = useState(false);
  
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [drawerSide, setDrawerSide] = useState<'left' | 'right'>('left');
  const [selectedAlert, setSelectedAlert] = useState<AilyticsAlert | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // Theme
  const mode = useThemeStore((state) => state.mode);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const theme = useAppTheme();

  // Load cameras from Map SDK (hook handles loading automatically)
  const camerasReady = useLoadCameras();

  // Event stream state
  const alertMode = useEventStreamStore((state) => state.mode);
  const setAlertMode = useEventStreamStore((state) => state.setMode);
  const startRealtime = useEventStreamStore((state) => state.startRealtime);
  const stopRealtime = useEventStreamStore((state) => state.stopRealtime);
  const startDummy = useEventStreamStore((state) => state.startDummy);
  const stopDummy = useEventStreamStore((state) => state.stopDummy);
  const eventStreamCameras = useEventStreamStore((state) => state.cameras);

  // Enable dummy mode on app load (only after cameras are loaded)
  useEffect(() => {
    if (!camerasReady) return;
    
    // Check that cameras are set in event stream store
    if (eventStreamCameras.length === 0) {
      console.warn('[DashboardLayout] Cameras ready but not in event stream store yet');
      return;
    }
    
    // Set dummy mode on initial load
    const currentMode = useEventStreamStore.getState().mode;
    if (currentMode !== 'dummy') {
      setAlertMode('dummy');
    }
  }, [camerasReady, eventStreamCameras.length, setAlertMode]);

  // Handle mode switching (dummy/realtime)
  useEffect(() => {
    if (alertMode === 'dummy') {
      stopRealtime();
      // Check if cameras are available before starting dummy mode
      if (eventStreamCameras.length > 0) {
        startDummy();
      }
    } else if (alertMode === 'realtime') {
      stopDummy();
      startRealtime();
    }
    
    return () => {
      stopDummy();
      stopRealtime();
    };
  }, [alertMode, eventStreamCameras.length, startDummy, stopDummy, startRealtime, stopRealtime]);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openDrawer = (side: 'left' | 'right') => {
    setDrawerSide(side);
    setIsMobileDrawerOpen(true);
  };

  const closeDrawer = () => setIsMobileDrawerOpen(false);

  // Transform data for SDK widgets using adapter
  const events = useEventStreamStore((state) => state.getVisibleEvents());
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isLoading = useEventStreamStore((state) => state.isLoading);

  // Transform events to widget data using adapter pattern
  // This demonstrates how to convert your event data to SDK widget formats
  const widgetData = useMemo(() => {
    return fromAilyticsEvents(events, { timezone, topN: 5 });
  }, [events, timezone]);

  // Reusable panel content - defined once, used for both desktop and mobile
  const leftPanelContent = (
    <>
      {/* Chart widgets - demonstrate SDK widget usage */}
      <AlertTriggerChart data={widgetData.chartByTrigger} variant={mode} />
      <AlertCameraChart data={widgetData.chartByCamera} variant={mode} />
      <AlertTimelineChart data={widgetData.chartTimeline} variant={mode} />
      <AlertSeverityChart data={widgetData.chartBySeverity} variant={mode} />
      
      {/* Top cameras list */}
      <TopCamerasList
        items={widgetData.sourceStats}
        variant={mode}
        title="Top 5 Cameras"
        onItemClick={(cameraId) => {
          setSelectedCameraId(cameraId);
          setIsMetricsPanelOpen(true);
        }}
      />
      
      {/* Recent activity feed */}
      <RecentActivityFeed
        items={widgetData.alertListItems}
        variant={mode}
        maxItems={5}
        onItemClick={(alertId) => {
          const alerts = getAilyticsAlertsFromEvents(events);
          const alert = alerts.find((a) => a.id === alertId);
          if (alert) {
            setSelectedAlert(alert);
            setIsAlertModalOpen(true);
            if (alert.camera_info) {
              setSelectedCameraId(alert.camera_info.id);
            }
          }
        }}
      />
    </>
  );

  const rightPanelContent = (
    <>
      {/* Alerts panel */}
      <AlertsPanel
        items={widgetData.alertListItems}
        variant={mode}
        onItemClick={(item) => {
          const alerts = getAilyticsAlertsFromEvents(events);
          const fullAlert = alerts.find((a) => a.id === item.id);
          if (fullAlert) {
            setSelectedAlert(fullAlert);
            setIsAlertModalOpen(true);
          }
        }}
      />
      
      {/* AI Analysis panel */}
      <AIAnalysisPanel
        insights={widgetData.insights}
        statistics={widgetData.statistics}
        topCategories={widgetData.topCategories}
        variant={mode}
        isLoading={isLoading}
        emptyHint={
          alertMode === 'dummy'
            ? 'Dummy alerts will appear here'
            : 'Alerts will appear here when detected'
        }
      />
    </>
  );

  // Handle route action (placeholder)
  const handleRoute = (feature: metaFeature, eventSource: EventSource) => {
    console.log('Route requested', feature, eventSource);
  };

  return (
    <DashboardShell>
      {/* TopBar - Navigation and controls */}
      <TopBar.Root variant={mode} height={isMobile ? 'auto' : 72}>
        {isMobile ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              width: '100%',
            }}
          >
            <TopBar.Section align='left' gap={8}>
              <TopBar.Logo src={'/icons/logo.png'} alt={'icons/letter-c.png'} />
              <TopBar.Spacer />
              <Button
                variant='primary'
                size='small'
                onClick={() => {
                  const newMode = alertMode === 'realtime' ? 'dummy' : 'realtime';
                  setAlertMode(newMode);
                }}
                title={
                  alertMode === 'realtime'
                    ? 'Switch to Dummy Mode'
                    : 'Switch to Realtime Mode'
                }
              >
                <Icon
                  icon={
                    alertMode === 'realtime'
                      ? 'mdi:clock-outline'
                      : 'mdi:radio'
                  }
                  width={24}
                  height={24}
                />
              </Button>
              <Button
                onClick={() => openDrawer('left')}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.border.subtle}`,
                  background: theme.accent.primary,
                  color: theme.text.onAccent,
                  cursor: 'pointer',
                }}
              >
                <Icon
                  icon={isMobileDrawerOpen ? 'mdi:menu-open' : 'mdi:menu'}
                  width={24}
                  height={24}
                />
              </Button>
            </TopBar.Section>
            <TopBar.Section align='left' gap={8} wrap>
              <FocusControl />
            </TopBar.Section>
          </div>
        ) : (
          <>
            <TopBar.Logo src={'/icons/logo.png'} alt={'icons/letter-c.png'} />
            <TopBar.Section align='left' gap={8}>
              <FocusControl />
              <LayerSelector
                name="Layers"
                whatTaxonomies={{
                  'Security': ['what.security.cctv', 'what.security.access'],
                  'Facilities': ['what.facilities.restroom', 'what.facilities.elevator'],
                }}
              />
            </TopBar.Section>
            <TopBar.Actions>
              <Button
                variant='primary'
                size='small'
                onClick={() => {
                  const newMode = alertMode === 'realtime' ? 'dummy' : 'realtime';
                  setAlertMode(newMode);
                }}
              >
                {alertMode === 'realtime' ? 'Dummy Mode' : 'Realtime Mode'}
              </Button>
              <button
                onClick={() => setIsAlertsPanelOpen(!isAlertsPanelOpen)}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.border.subtle}`,
                  background: isAlertsPanelOpen ? theme.accent.primary : theme.surface.control,
                  color: isAlertsPanelOpen ? theme.text.onAccent : theme.text.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                title={
                  isAlertsPanelOpen ? 'Close Alerts Panel' : 'Open Alerts Panel'
                }
              >
                <Icon
                  icon={
                    isAlertsPanelOpen
                      ? 'mdi:bell'
                      : 'mdi:bell-off'
                  }
                  width={24}
                  height={24}
                />
              </button>
              <Button variant='outline' size='small' onClick={toggleMode}>
                {mode === 'dark' ? 'Light' : 'Dark'}
              </Button>
            </TopBar.Actions>
          </>
        )}
      </TopBar.Root>

      {/* Main content area with map */}
      <DashboardMain>
        <MetaAtlasMap
          accessToken={appConfig.metaAtlas?.accessToken || ''}
          secretKey={appConfig.metaAtlas?.secretKey || ''}
          role={appConfig.metaAtlas?.role || ''}
        >
          {/* MapImageLoader loads custom icons/images for use in map layers */}
          <MapImageLoader />
          {/* MapInteraction handles popup/marker creation when objects are selected */}
          <MapInteraction enabled={true} onRoute={handleRoute} />
        </MetaAtlasMap>
      </DashboardMain>

      {/* Left Side Panel - Metrics and Charts */}
      <DashboardSidePanel
        side='left'
        isOpen={!isMobile && isMetricsPanelOpen}
        width={289}
        title='Operations'
      >
        {leftPanelContent}
      </DashboardSidePanel>

      {/* Right Side Panel - Alerts and AI Analysis */}
      <DashboardSidePanel
        side='right'
        isOpen={!isMobile && isAlertsPanelOpen}
        width={289}
        title='Alerts & AI'
        // style={{ position: 'fixed', right: '8px', top: '74px', zIndex: 20 }}
      >
        {rightPanelContent}
      </DashboardSidePanel>

      {/* Mobile Drawer */}
      {isMobile && (
        <DashboardMobileDrawer
          isOpen={isMobileDrawerOpen}
          activeSide={drawerSide}
          onSelectSide={setDrawerSide}
          onClose={closeDrawer}
          left={{
            title: 'Operations',
            content: leftPanelContent,
          }}
          right={{
            title: 'Alerts & AI',
            content: rightPanelContent,
          }}
        />
      )}

      {/* Alert Detail Modal */}
      <AlertDetailModal
        isOpen={isAlertModalOpen}
        alert={selectedAlert}
        onClose={() => {
          setIsAlertModalOpen(false);
          setSelectedAlert(null);
        }}
      />
    </DashboardShell>
  );
};

export default DashboardLayoutContent;
