/**
 * Focus Control Component
 * 
 * Provides UI controls for navigating the focus tree (site/building/level).
 * Uses the Map SDK's useFocus hook to interact with the map's focus system.
 * 
 * This component demonstrates:
 * - How to use Map SDK hooks (useFocus)
 * - How to navigate the focus tree hierarchy
 * - How to sync UI state with Map SDK state
 * 
 * Usage:
 * ```tsx
 * <FocusControl />
 * ```
 */

import React, { useEffect, useState, useMemo } from 'react';
// Import TopBar component from external UI SDK package
import { TopBar } from '@twinmatrix/ui-sdk';
// Import useFocus hook from external Map SDK package
import { useFocus } from '@twinmatrix/spatialverse-sdk-web/react';

export const FocusControl: React.FC = () => {
  // Get functions from Map SDK
  const { getSites, getBuildingList, getLevelList, focusTo, isReady } = useFocus();
  
  // Local state for UI
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<{ id: string; name: string } | null>(null);
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [levels, setLevels] = useState<Array<{ id: string; name: string }>>([]);

  // Derive level names array from levels objects
  const levelNames = useMemo(() => levels.map((l) => l.name), [levels]);

  // Initialize sites when Map SDK is ready
  useEffect(() => {
    if (isReady) {
      const siteList = getSites();
      const newSites = siteList.map((site) => ({
        id: site.whereTaxonomy,
        name: site.name,
      }));
      setSites(newSites);
      
      // Set initial site if available and none selected
      if (newSites.length > 0 && !selectedSite) {
        setSelectedSite(newSites[0].id);
      }
    }
  }, [isReady]);

  // Update buildings when site selection changes
  useEffect(() => {
    if (isReady && selectedSite) {
      const buildings = getBuildingList(selectedSite);
      const newLocations = buildings.map((building) => ({
        id: building.whereTaxonomy,
        name: building.name,
      }));
      setLocations(newLocations);
      
      // Reset location when site changes
      setSelectedLocation(null);
      
      // Set initial location if available
      if (newLocations.length > 0) {
        setSelectedLocation(newLocations[0].id);
      }
    } else {
      setLocations([]);
      setSelectedLocation(null);
    }
  }, [isReady, selectedSite]);

  // Update levels when building selection changes
  useEffect(() => {
    if (isReady && selectedLocation) {
      const buildingLevels = getLevelList(selectedLocation);
      const newLevels = buildingLevels.map((level) => ({
        id: level.whereTaxonomy,
        name: level.name,
      }));
      setLevels(newLevels);

      // Reset selected level to first available level if current selection is not in new levels
      if (newLevels.length > 0) {
        setSelectedLevel((prevLevel) => {
          // Only update if current level is not in the new levels list
          if (!prevLevel || !newLevels.find((l) => l.name === prevLevel.name)) {
            return newLevels[0];
          }
          return prevLevel;
        });
      } else {
        setSelectedLevel(null);
      }
    } else {
      setLevels([]);
      setSelectedLevel(null);
    }
  }, [isReady, selectedLocation]);

  // Focus to site when site selection changes
  useEffect(() => {
    if (isReady && selectedSite) {
      focusTo(selectedSite);
    }
  }, [isReady, selectedSite]);

  // Focus to building when building selection changes
  useEffect(() => {
    if (isReady && selectedLocation) {
      focusTo(selectedLocation);
      // Reset level selection when location changes (will be set by levels useEffect)
    }
  }, [isReady, selectedLocation]);

  // Focus to level when level selection changes
  useEffect(() => {
    if (isReady && selectedLevel?.id) {
      focusTo(selectedLevel.id);
    }
  }, [isReady, selectedLevel]);

  return (
    <>
      {/* Site selector - uses TopBar.LocationSelector from UI SDK */}
      <TopBar.LocationSelector
        locations={sites}
        value={selectedSite || ''}
        onChange={setSelectedSite}
        label='Site:'
        disabled={!isReady}
      />
      {/* Building/Location selector */}
      <TopBar.LocationSelector
        locations={locations}
        value={selectedLocation || ''}
        onChange={setSelectedLocation}
        label='Location:'
        disabled={!isReady || !selectedSite || locations.length === 0}
      />
      {/* Level/Floor selector - uses TopBar.LevelSelector from UI SDK */}
      <TopBar.LevelSelector
        levels={levelNames}
        value={selectedLevel?.name ?? ''}
        onChange={(value) => {
          const level = levels.find((l) => l.name === value);
          if (level) {
            setSelectedLevel({ name: level.name, id: level.id });
          }
        }}
        label='Floor:'
        disabled={!isReady || !selectedLocation || levels.length === 0}
      />
    </>
  );
};
