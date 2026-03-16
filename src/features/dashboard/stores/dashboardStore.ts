/**
 * Dashboard Store
 * 
 * Manages dashboard-specific UI state, particularly camera selection.
 * 
 * When a camera is selected in the dashboard, this store:
 * 1. Updates the selectedCameraId state
 * 2. Syncs the selection to the Map SDK's activeObject
 *    (which triggers popup/marker display on the map)
 * 
 * This demonstrates how to integrate dashboard UI state with Map SDK state.
 * 
 * Usage:
 * ```tsx
 * const selectedCameraId = useDashboardStore(state => state.selectedCameraId);
 * const setSelectedCameraId = useDashboardStore(state => state.setSelectedCameraId);
 * setSelectedCameraId('camera-123');
 * ```
 */

import { create } from 'zustand';
import { useEventStreamStore } from '../../../stores/useEventStreamStore';
// Import useMapDataStore from external Map SDK package
import { useMapDataStore } from '@twinmatrix/spatialverse-sdk-web/react';

interface DashboardState {
  selectedCameraId: string | null;
  setSelectedCameraId: (id: string | null) => void;
  isMetricsPanelOpen: boolean;
  setIsMetricsPanelOpen: (isOpen: boolean) => void;
  isAlertsPanelOpen: boolean;
  setIsAlertsPanelOpen: (isOpen: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedCameraId: null,

  /**
   * Set the selected camera ID
   * 
   * This also syncs the selection to the Map SDK's activeObject,
   * which will trigger popup/marker display on the map.
   */
  setSelectedCameraId: (id) => {
    // Update dashboard selection state
    set({ selectedCameraId: id });

    // Sync to map SDK activeObject using metaFeatures from event stream store
    // This demonstrates how to integrate dashboard state with Map SDK state
    const setActiveObject = useMapDataStore.getState().setActiveObject;
    const cameraMetaFeatures = useEventStreamStore.getState().cameras;

    // If no camera is selected, clear active object
    if (!id) {
      setActiveObject(null);
      return;
    }

    // Find the metaFeature for the selected camera
    // Cameras are stored with id = metaFeature.mapObjectId
    const metaFeatureForCamera = cameraMetaFeatures.find(
      (mf) => mf.mapObjectId === id
    );

    if (metaFeatureForCamera) {
      // Set the active object in Map SDK, which will trigger popup/marker display
      setActiveObject(metaFeatureForCamera);
    } else {
      console.warn('No metaFeature found for selectedCameraId:', id);
    }
  },

  isMetricsPanelOpen: true,
  setIsMetricsPanelOpen: (isOpen) => set({ isMetricsPanelOpen: isOpen }),
  isAlertsPanelOpen: true,
  setIsAlertsPanelOpen: (isOpen) => set({ isAlertsPanelOpen: isOpen }),
}));
