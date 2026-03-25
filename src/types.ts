import type { FeatureCollection } from 'geojson';

export type RegionType = 'world' | 'taiwan' | 'taiwan-town' | 'custom';

export type ClassificationMethod = 'equal-interval' | 'quantile';

export type ColorScheme = 
  | 'Blues'   // Light Blue to Dark Blue
  | 'Reds'    // Light Red to Dark Red
  | 'Greens'
  | 'Purples'
  | 'Oranges'
  | 'RdYlBu'  // Diverging Red-Yellow-Blue
  | 'Spectral'
  | 'Viridis'; 

export interface MapData {
  regionId: string;
  value: number;
}

export interface AppState {
  region: RegionType;
  customGeoJSON: FeatureCollection | null;
  rawCsvData: string;
  parsedData: MapData[];
  classification: ClassificationMethod;
  classesCount: number;
  colorScheme: ColorScheme;
  worldProjection: 'mollweide' | 'mercator' | 'robinson';
  showLegend: boolean;
  showScale: boolean;
  showCompass: boolean;
  legendTitle: string;
  mapTitle: string;
  mapScale: number;
}
