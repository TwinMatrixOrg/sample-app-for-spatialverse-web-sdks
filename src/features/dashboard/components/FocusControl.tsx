/**
 * Focus Control Component
 *
 * Generic depth-based focus navigation using Map SDK hooks.
 * Semantic labels (Site / Location / Building / Floor) are assigned here.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { TopBar } from '@twinmatrix/ui-sdk';
import { useFocus } from '@twinmatrix/spatialverse-sdk-web/react';

type TierOption = { id: string; name: string };

const TIER_LABELS: Record<number, string[]> = {
  3: ['Site', 'Location', 'Floor'],
  4: ['Site', 'Location', 'Building', 'Floor'],
};

function getLabelsForTierCount(tierCount: number): string[] {
  if (TIER_LABELS[tierCount]) {
    return TIER_LABELS[tierCount];
  }

  const labels = ['Site'];
  for (let i = 1; i < tierCount - 1; i += 1) {
    labels.push(`Level ${i}`);
  }
  labels.push('Floor');
  return labels;
}

export const FocusControl: React.FC = () => {
  const {
    getRootNodes,
    getChildNodes,
    getSelectorTierCount,
    focusTo,
    isReady,
  } = useFocus();

  const [selections, setSelections] = useState<string[]>([]);

  const selectedRoot = selections[0] ?? null;
  const tierCount = selectedRoot ? getSelectorTierCount(selectedRoot) : 0;
  const labels = useMemo(() => getLabelsForTierCount(tierCount), [tierCount]);

  const tierOptions = useMemo((): TierOption[][] => {
    if (!isReady || !selectedRoot || tierCount === 0) return [];

    const options: TierOption[][] = [
      getRootNodes().map((node) => ({
        id: node.whereTaxonomy,
        name: node.name,
      })),
    ];

    for (let tier = 1; tier < tierCount; tier += 1) {
      const parent = selections[tier - 1];
      if (!parent) {
        options[tier] = [];
        continue;
      }
      options[tier] = getChildNodes(parent).map((node) => ({
        id: node.whereTaxonomy,
        name: node.name,
      }));
    }

    return options;
  }, [getChildNodes, getRootNodes, isReady, selectedRoot, selections, tierCount]);

  useEffect(() => {
    if (!isReady) return;

    const roots = getRootNodes();
    if (roots.length === 0) {
      setSelections([]);
      return;
    }

    setSelections((current) => (current.length > 0 ? current : [roots[0].whereTaxonomy]));
  }, [getRootNodes, isReady]);

  useEffect(() => {
    if (!isReady || !selectedRoot || tierCount === 0) return;

    setSelections((current) => {
      const next = [...current];

      while (next.length < tierCount) {
        const tier = next.length;
        const choices = tierOptions[tier] ?? [];
        if (!choices[0]) break;
        next.push(choices[0].id);
      }

      for (let tier = 1; tier < tierCount; tier += 1) {
        const choices = tierOptions[tier] ?? [];
        if (choices.length === 0) continue;

        const existing = next[tier];
        const isValid = choices.some((choice) => choice.id === existing);
        if (!isValid) {
          next[tier] = choices[0].id;
        }
      }

      if (next.length > tierCount) {
        next.length = tierCount;
      }

      const unchanged =
        next.length === current.length && next.every((value, index) => value === current[index]);
      return unchanged ? current : next;
    });
  }, [isReady, selectedRoot, tierCount, tierOptions]);

  useEffect(() => {
    if (!isReady) return;

    const validSelections = selections.filter(Boolean);
    const activeSelection = validSelections[validSelections.length - 1];
    if (activeSelection) {
      focusTo(activeSelection);
    }
  }, [focusTo, isReady, selections]);

  const handleTierChange = (tierIndex: number, value: string) => {
    setSelections((prev) => {
      const next = [...prev];
      next[tierIndex] = value;
      next.length = tierIndex + 1;
      return next;
    });
  };

  if (!isReady || tierCount === 0) {
    return null;
  }

  const leafTierIndex = tierCount - 1;
  const leafOptions = tierOptions[leafTierIndex] ?? [];
  const selectedLeafId = selections[leafTierIndex] ?? '';
  const selectedLeafName =
    leafOptions.find((option) => option.id === selectedLeafId)?.name ?? '';

  return (
    <>
      {Array.from({ length: leafTierIndex }).map((_, tierIndex) => (
        <TopBar.LocationSelector
          key={labels[tierIndex]}
          locations={tierOptions[tierIndex] ?? []}
          value={selections[tierIndex] ?? ''}
          onChange={(value) => handleTierChange(tierIndex, value)}
          label={`${labels[tierIndex]}:`}
          disabled={!isReady || (tierOptions[tierIndex] ?? []).length === 0}
        />
      ))}
      <TopBar.LevelSelector
        levels={leafOptions.map((option) => option.name)}
        value={selectedLeafName}
        onChange={(value) => {
          const leaf = leafOptions.find((option) => option.name === value);
          if (leaf) {
            handleTierChange(leafTierIndex, leaf.id);
          }
        }}
        label={`${labels[leafTierIndex]}:`}
        disabled={!isReady || leafOptions.length === 0}
      />
    </>
  );
};
