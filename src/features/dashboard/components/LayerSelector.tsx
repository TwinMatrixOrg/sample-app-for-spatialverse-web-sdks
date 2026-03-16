/**
 * Layer Selector Component
 * 
 * A wrapper around WhatTaxonomyFilter that provides layer filtering functionality.
 * Uses the Map SDK's useFocus hook to filter map objects by taxonomy.
 * 
 * This component demonstrates:
 * - How to use Map SDK's filterByWhatTaxonomy function
 * - How to create a checkbox-based filter UI
 * - How to show/hide map layers based on taxonomy
 * 
 * Usage:
 * ```tsx
 * <LayerSelector
 *   name="Security"
 *   whatTaxonomies={{
 *     'Cameras': ['what.security.cctv'],
 *     'Access Points': ['what.security.access'],
 *   }}
 * />
 * ```
 */

import React, { useState, useMemo, useEffect } from 'react';
// Import Dropdown component from external UI SDK package
import { Dropdown } from '@twinmatrix/ui-sdk';
// Import useFocus hook from external Map SDK package
import { useFocus } from '@twinmatrix/spatialverse-sdk-web/react';

export interface LayerSelectorProps {
  /** Display name for the dropdown */
  name: string;
  /** Object mapping category names to arrays of taxonomy paths */
  whatTaxonomies: Record<string, string[]>;
  /** Optional className for styling */
  className?: string;
  /** Optional style for the root container */
  style?: React.CSSProperties;
}

/**
 * Layer Selector Component
 * 
 * A dropdown component that displays a checkbox list of what taxonomies.
 * All items are checked (visible) by default. Toggling checkboxes shows/hides
 * items on the map by filtering taxonomies using the Map SDK.
 */
export const LayerSelector: React.FC<LayerSelectorProps> = ({
  name,
  whatTaxonomies,
  className = '',
  style,
}) => {
  // Get filterByWhatTaxonomy function from Map SDK
  const { filterByWhatTaxonomy, isReady } = useFocus();

  // Track which categories are checked (visible)
  // All are checked by default
  const [checkedCategories, setCheckedCategories] = useState<Set<string>>(() => {
    return new Set(Object.keys(whatTaxonomies));
  });

  // Reset to all checked when whatTaxonomies change
  useEffect(() => {
    setCheckedCategories(new Set(Object.keys(whatTaxonomies)));
  }, [whatTaxonomies]);

  // Compute all taxonomy paths that should be hidden (unchecked categories)
  const hiddenTaxonomyPaths = useMemo(() => {
    const hidden: string[] = [];
    Object.entries(whatTaxonomies).forEach(([category, paths]) => {
      if (!checkedCategories.has(category)) {
        hidden.push(...paths);
      }
    });
    return hidden;
  }, [whatTaxonomies, checkedCategories]);

  // Apply filter whenever hidden taxonomies change, but only when map core is ready
  useEffect(() => {
    if (isReady && filterByWhatTaxonomy) {
      try {
        // Filter map objects by hiding unchecked taxonomies
        filterByWhatTaxonomy(hiddenTaxonomyPaths);
      } catch (error) {
        // Silently ignore errors if map core becomes unavailable
        console.warn('Failed to apply taxonomy filter:', error);
      }
    }
  }, [hiddenTaxonomyPaths, filterByWhatTaxonomy, isReady]);

  // Toggle a category's checked state
  const toggleCategory = (category: string) => {
    setCheckedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Count of checked items for display
  const checkedCount = checkedCategories.size;
  const totalCount = Object.keys(whatTaxonomies).length;

  return (
    <div className={className} style={style}>
      {/* Use Dropdown component from UI SDK */}
      <Dropdown.Root value="" onChange={() => { }}>
        <Dropdown.Trigger>
          <span>{name}</span>
          <span style={{ fontSize: '12px', color: '#666' }}>
            ({checkedCount}/{totalCount})
          </span>
        </Dropdown.Trigger>
        <Dropdown.Menu>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '300px', overflowY: 'auto' }}
          >
            {Object.entries(whatTaxonomies).map(([category, paths]) => {
              const isChecked = checkedCategories.has(category);
              return (
                <div
                  key={category}
                  style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    backgroundColor: isChecked ? 'transparent' : '#f5f5f5',
                    transition: 'background-color 0.15s',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategory(category);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isChecked ? '#f0f0f0' : '#e8e8e8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isChecked ? 'transparent' : '#f5f5f5';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(category)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      cursor: 'pointer',
                      width: '16px',
                      height: '16px',
                      margin: 0,
                    }}
                  />
                  <label
                    style={{
                      cursor: 'pointer',
                      fontSize: '14px',
                      flex: 1,
                      userSelect: 'none',
                      margin: 0,
                    }}
                  >
                    {category}
                  </label>
                </div>
              );
            })}
          </div>
        </Dropdown.Menu>
      </Dropdown.Root>
    </div>
  );
};
