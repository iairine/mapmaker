import { scaleQuantize, scaleQuantile } from 'd3-scale';
import { extent } from 'd3-array';
import type { ClassificationMethod, ColorScheme, MapData } from '../types';

export const COLOR_SCALES: Record<ColorScheme, string[]> = {
  Blues: ['#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594'],
  Reds: ['#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#99000d'],
  Greens: ['#a1d99b', '#74c476', '#41ab5d', '#238b45', '#005a32'],
  Purples: ['#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#4a1486'],
  Oranges: ['#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#8c2d04'],
  RdYlBu: ['#d73027', '#fc8d59', '#fee090', '#e0f3f8', '#91bfdb', '#4575b4'].reverse(),
  Spectral: ['#d53e4f', '#fc8d59', '#fee08b', '#ffffbf', '#e6f598', '#99d594', '#3288bd'].reverse(),
  Viridis: ['#440154', '#414487', '#2a788e', '#22a884', '#7ad151', '#fde725']
};

function hexToRgb(hex: string) {
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

function interpolateColor(color1: string, color2: string, factor: number) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1[0] + factor * (c2[0] - c1[0]));
  const g = Math.round(c1[1] + factor * (c2[1] - c1[1]));
  const b = Math.round(c1[2] + factor * (c2[2] - c1[2]));
  return rgbToHex(r, g, b);
}

export function generateColors(scheme: ColorScheme, count: number): string[] {
  const anchors = COLOR_SCALES[scheme];
  if (count === 1) return [anchors[anchors.length - 1]];
  if (count === anchors.length) return anchors;
  
  const result = [];
  const maxIndex = anchors.length - 1;
  for (let i = 0; i < count; i++) {
    const factor = i / (count - 1);
    const mappedIndex = factor * maxIndex;
    const lowIndex = Math.floor(mappedIndex);
    const highIndex = Math.ceil(mappedIndex);
    if (lowIndex === highIndex) {
      result.push(anchors[lowIndex]);
    } else {
      const segmentFactor = mappedIndex - lowIndex;
      result.push(interpolateColor(anchors[lowIndex], anchors[highIndex], segmentFactor));
    }
  }
  return result;
}

export function createColorScale(
  data: MapData[], 
  method: ClassificationMethod, 
  classesCount: number, 
  colorScheme: ColorScheme
) {
  const values = data.map(d => d.value).filter(v => !isNaN(v));
  if (values.length === 0) return () => '#ccc';
  
  const colors = generateColors(colorScheme, classesCount);
  const [min, max] = extent(values) as [number, number];

  if (min === max) return () => colors[colors.length - 1];

  let scaleFunction;

  if (method === 'equal-interval') {
    scaleFunction = scaleQuantize<string>()
      .domain([min, max])
      .range(colors);
  } else {
    scaleFunction = scaleQuantile<string>()
      .domain(values)
      .range(colors);
  }

  return (v: number) => {
    if (isNaN(v)) return '#ccc';
    return scaleFunction(v); // d3 handles out of bounds / quantiles correctly
  };
}

export interface LegendItem {
  color: string;
  min: number;
  max: number;
}

export function getLegendData(
  data: MapData[], 
  method: ClassificationMethod, 
  classesCount: number, 
  colorScheme: ColorScheme
): LegendItem[] {
  const values = data.map(d => d.value).filter(v => !isNaN(v));
  if (values.length === 0) return [];

  const colors = generateColors(colorScheme, classesCount);
  const [min, max] = extent(values) as [number, number];
  
  if (min === max) {
    return [{ color: colors[colors.length - 1], min, max }];
  }
  
  const result: LegendItem[] = [];
  
  if (method === 'equal-interval') {
    const scale = scaleQuantize<string>()
      .domain([min, max])
      .range(colors);
      
    // Provide explicit threshold bounds for equal interval
    let prev = min;
    const thresholds = scale.thresholds();
    for (let i = 0; i < colors.length; i++) {
      const next = i === colors.length - 1 ? max : thresholds[i];
      result.push({ color: colors[i], min: prev, max: next });
      prev = next;
    }
  } else {
    const scale = scaleQuantile<string>()
      .domain(values)
      .range(colors);
      
    let prev = min;
    const thresholds = scale.quantiles();
    for (let i = 0; i < colors.length; i++) {
        const next = i === colors.length - 1 ? max : thresholds[i];
        
        // 當分位數法遇到大量重複數值（如一堆 0 時），會產生重疊的切分點。
        // D3 實作中這些重複切分點對應的顏色區間實際上完全吃不到任何數據，可以隱藏以避免圖例重複。
        if (prev === next && i < colors.length - 1) {
          prev = next;
          continue;
        }

        result.push({ color: colors[i], min: prev, max: next });
        prev = next;
    }
  }
  
  return result;
}
