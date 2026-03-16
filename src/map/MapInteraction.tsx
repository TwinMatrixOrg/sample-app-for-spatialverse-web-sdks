/**
 * Map Interaction Component
 * 
 * This component listens to activeObject changes from the Map SDK
 * and creates popups/markers on the map when cameras or other objects are selected.
 * 
 * Key Features:
 * - Listens to activeObject changes (from useMapDataStore)
 * - Creates popups with object information
 * - Creates markers at selected locations
 * - Handles camera selection (syncs to dashboardStore)
 * 
 * This demonstrates the centralized popup/marker pattern:
 * Instead of handling map clicks in multiple places, all popup/marker
 * creation is centralized here, triggered by activeObject changes.
 * 
 * Usage:
 * ```tsx
 * <MetaAtlasMap>
 *   <MapInteraction enabled={true} onRoute={handleRoute} />
 * </MetaAtlasMap>
 * ```
 */

import React, { useEffect, useCallback } from 'react';
// Import Map SDK hooks from external package
import {
  useMapEvents,
  useMapOverlays,
  useMetaAtlas,
  useMapDataStore,
} from '@twinmatrix/spatialverse-sdk-web/react';
import type {
  clickedMetaFeature,
  metaFeature,
} from '@twinmatrix/spatialverse-sdk-web';
import { EventSource } from '@twinmatrix/spatialverse-sdk-web';
import { useDashboardStore } from '../features/dashboard/stores/dashboardStore';

export interface MapInteractionProps {
  /**
   * Whether the interaction is enabled. Defaults to true.
   */
  enabled?: boolean;
  /**
   * Callback when route action is triggered
   */
  onRoute: (feature: metaFeature, eventSource: EventSource) => void;
}

/**
 * MapInteraction component that listens to activeObject changes and creates popups/markers
 * 
 * When enabled, changes to activeObject will display a popup with the location's information.
 * This centralizes all popup/marker creation logic in one place.
 */
export function MapInteraction({
  enabled = true,
  onRoute,
}: MapInteractionProps) {
  const { onMapClick, isReady: mapEventsReady } = useMapEvents();
  const { createReactPopup, createMarker, isReady } = useMapOverlays();
  const { map, getCurrentFocusBuilding } = useMetaAtlas();
  const setMarker = useMapDataStore((state) => state.setMarker);
  const setPopup = useMapDataStore((state) => state.setPopup);
  const activeObject = useMapDataStore((state) => state.activeObject);

  const handleRoute = useCallback(
    (feature: metaFeature) => {
      console.log('Route Here clicked', feature);
      onRoute(feature, EventSource.MapClick);
    },
    [onRoute]
  );

  // Register empty onMapClick callback to prevent default map click behavior
  // Map clicks are handled via activeObject changes
  useEffect(() => {
    if (!enabled || !mapEventsReady) {
      return;
    }

    const unsubscribe = onMapClick((feature: clickedMetaFeature) => {
      // Empty callback - map clicks are handled via activeObject changes
      console.log('Map click', feature);
    });

    return unsubscribe;
  }, [enabled, mapEventsReady, onMapClick]);

  // Listen to activeObject changes and create popup/marker
  useEffect(() => {
    if (!enabled || !isReady || !map) {
      return;
    }

    // If activeObject is null, clear existing marker/popup
    if (!activeObject) {
      return;
    }

    // If no feature data, skip
    if (activeObject.name === null || activeObject.properties === null) {
      return;
    }

    // Get coordinates from metaFeature
    const coordinates = activeObject.coordinates ?? activeObject.geometry?.coordinates;
    if (!coordinates || coordinates.length < 2) {
      console.log('Coordinates are invalid', activeObject, coordinates);
      return;
    }

    const center: [number, number] = [coordinates[0], coordinates[1]];

    // Check if feature is a camera
    const isCamera =
      activeObject.name?.toLowerCase().includes('camera') ||
      activeObject.whatDimension?.includes('what.security.insta360');
    
    if (isCamera) {
      const cameraId =
        activeObject.mapObjectId ||
        (activeObject.properties?.myMapObjectId
          ? String(activeObject.properties.myMapObjectId)
          : null);

      if (cameraId) {
        // Sync camera selection to dashboard store
        const dashboardStore = useDashboardStore.getState();
        if (
          dashboardStore.selectedCameraId !== cameraId ||
          !dashboardStore.isMetricsPanelOpen
        ) {
          dashboardStore.setSelectedCameraId(cameraId);
          dashboardStore.setIsMetricsPanelOpen(true);
        }
      }
    }

    // Get selected building for taxonomy comparison
    const selectedBuilding = getCurrentFocusBuilding() || {
      taxonomyPath: '',
    };
    
    // Check if similar taxonomy for flyTo duration
    const isSimilarTaxonomy =
      activeObject.whereDimension?.includes(selectedBuilding.taxonomyPath || '') ||
      false;
    
    // Fly to location
    if (map) {
      map.flyTo({
        center,
        zoom: 20,
        duration: isSimilarTaxonomy ? 1000 : 3000,
      });
    }

    // Create a simple popup content as React element
    const popupContent = React.createElement('div', {
      style: { padding: '12px' },
    }, [
      React.createElement('div', {
        key: 'title',
        style: { fontWeight: 600, marginBottom: '4px' },
      }, activeObject.name || 'Unknown'),
      React.createElement('div', {
        key: 'dimension',
        style: { fontSize: '12px', color: '#666' },
      }, activeObject.whatDimension || ''),
    ]);

    // Create popup
    const popup = createReactPopup(
      center,
      popupContent,
      {
        closeButton: false,
        maxWidth: '380px',
        anchor: 'bottom',
        offset: 40,
      }
    );

    setPopup(popup);

    // Create marker with pin image
    const el = document.createElement('img');
    el.src = '/icons/marker.png';
    el.alt = 'Marker';
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.objectFit = 'contain';
    el.style.cursor = 'pointer';

    const newMarker = createMarker(center, {
      element: el,
    });

    setMarker(newMarker);

    // Return cleanup function to remove previous marker/popup
    // This ensures cleanup happens after render completes, avoiding React unmount race condition
    return () => {
      newMarker?.remove();
      popup?.remove();
    };
  }, [
    enabled,
    isReady,
    map,
    activeObject,
  ]);

  // This component doesn't render anything visible
  return null;
}
