/**
 * Map Image Loader Component
 * 
 * Declaratively loads map images (sprites) defined in config or overrides.
 * Images are registered once per map instance and can then be referenced by id
 * in map layers.
 * 
 * This component demonstrates:
 * - How to load custom images/icons for use in map layers
 * - How to register images with the Map SDK
 * - How to handle async image loading
 * 
 * @example
 * ```tsx
 * <MetaAtlasMap>
 *   <MapImageLoader />
 * </MetaAtlasMap>
 * ```
 * 
 * @example
 * ```tsx
 * <MetaAtlasMap>
 *   <MapImageLoader imagesOverride={customImages} />
 * </MetaAtlasMap>
 * ```
 */

import { useEffect } from 'react';
// Import Map SDK hooks from external package
import {
  useMetaAtlas,
  useMetaAtlasStore,
} from '@twinmatrix/spatialverse-sdk-web/react';
import { mapImages, MapImageConfig } from './config/mapImages';

export interface MapImageLoaderProps {
  /**
   * Optional override for default map images.
   * If provided, uses these images instead of the default mapImages config.
   */
  imagesOverride?: MapImageConfig[];
}

/**
 * MapImageLoader component that loads images for use in map layers
 * 
 * Images are loaded asynchronously and registered with the map instance.
 * Once loaded, they can be referenced by their id in map layer configurations.
 */
export function MapImageLoader({ imagesOverride }: MapImageLoaderProps) {
  const { map } = useMetaAtlas();
  const mapCoreReady = useMetaAtlasStore((state) => state.mapCoreReady);

  useEffect(() => {
    if (!map || !mapCoreReady) return;

    // Avoid addImage before style is ready; rely on the map's ready flag instead of events
    const styleReady =
      typeof (map as any).isStyleLoaded !== 'function' || map.isStyleLoaded();
    // if (!styleReady) return;

    const images = imagesOverride ?? mapImages;
    if (!images.length) return;

    let cancelled = false;

    const loadImageAsync = (
      id: string,
      url: string,
      options?: MapImageConfig['options']
    ) =>
      new Promise<void>((resolve) => {
        if (map.hasImage?.(id)) {
          resolve();
          return;
        }

        map.loadImage(url, (error, image) => {
          if (cancelled) {
            resolve();
            return;
          }

          if (error || !image) {
            console.error(`Error loading image '${id}' from ${url}:`, error);
            resolve();
            return;
          }

          map.addImage(id, image, options);
          console.log(`Loaded image: ${id}`);
          resolve();
        });
      });

    Promise.all(
      images.map(({ id, url, options }) => loadImageAsync(id, url, options))
    ).catch((error) => {
      console.error('Error while loading map images:', error);
    });

    return () => {
      cancelled = true;
    };
  }, [map, imagesOverride, mapCoreReady]);

  // This component doesn't render anything visible
  return null;
}
