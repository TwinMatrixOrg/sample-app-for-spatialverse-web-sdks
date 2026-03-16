/**
 * Map Images Configuration
 * 
 * Declarative list of map images to register with the MetaAtlas map.
 * Add new assets here (id + url, optional options) to make them
 * available to any layer that references the image id.
 * 
 * These images are loaded by MapImageLoader and can be used in map layers
 * to display icons for different object types (e.g., escalators, cameras).
 */

export interface MapImageConfig {
  id: string;
  url: string;
  options?: {
    sdf?: boolean;
    pixelRatio?: number;
  };
}

export const mapImages: MapImageConfig[] = [
  {
    id: 'what.infra.escalator',
    url: '/icons/escalator.png',
  },
  {
    id: 'what.security.cctv',
    url: '/icons/cctv.png',
  },
];
