import React, { useEffect, useState, useRef, useMemo } from 'react';
import type { AppState } from '../types';
import { fetchGeoJSON } from '../utils/geoData';
import { createColorScale } from '../utils/classification';
import type { FeatureCollection, Feature } from 'geojson';
import Legend from './Legend';
import { toPng } from 'html-to-image';
import { geoPath, geoMercator, geoTransverseMercator, geoGraticule } from 'd3-geo';
import { geoMollweide, geoRobinson } from 'd3-geo-projection';
import { zoom, zoomIdentity } from 'd3-zoom';
import { select } from 'd3-selection';
import DraggableItem from './DraggableItem';

interface MapAreaProps {
  state: AppState;
}

const MapArea: React.FC<MapAreaProps> = ({ state }) => {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [tooltip, setTooltip] = useState<{name: string, value: number, x: number, y: number} | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (state.region === 'custom') {
      setGeoData(state.customGeoJSON);
    } else {
      fetchGeoJSON(state.region).then(data => {
        setGeoData(data);
      }).catch(err => {
        console.error("Failed to load geojson", err);
      });
    }
  }, [state.region, state.customGeoJSON]);

  // Setup D3 Zoom
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = select(svgRef.current);
    const g = select(gRef.current);
    
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 20])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform);
      });
      
    svg.call(zoomBehavior);
    // Reset zoom when data changes
    svg.call(zoomBehavior.transform, zoomIdentity);
  }, [geoData]);

  // Handle export
  useEffect(() => {
    const handleExport = () => {
      if (containerRef.current) {
        toPng(containerRef.current, { cacheBust: true })
          .then((dataUrl) => {
            const link = document.createElement('a');
            link.download = `choropleth-map-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
          })
          .catch((err) => {
             console.error('Error exporting image', err);
             alert('匯出圖片失敗。');
          });
      }
    };
    
    document.addEventListener('export-map', handleExport);
    return () => document.removeEventListener('export-map', handleExport);
  }, []);

  const colorScale = useMemo(() => {
    return createColorScale(state.parsedData, state.classification, state.classesCount, state.colorScheme);
  }, [state.parsedData, state.classification, state.classesCount, state.colorScheme]);

  const getRegionValue = (feature: Feature): number | undefined => {
    const properties = feature.properties || {};
    const candidates = [
      feature.id,
      properties.name,
      properties.NAME,
      properties.NAME_1,
      properties.NAME_0,
      properties.iso_a3,
      properties.ISO_A3,
      properties.ADM0_A3,
      properties.COUNTYNAME,
      properties.CONTINENT
    ];
    for (const cand of candidates) {
      if (!cand) continue;
      const match = state.parsedData.find(d => String(d.regionId).toLowerCase() === String(cand).toLowerCase());
      if (match) return match.value;
    }
    return undefined;
  };
  
  const getRegionName = (feature: Feature): string => {
    const properties = feature.properties || {};
    return String(properties.NAME || properties.name || properties.NAME_1 || properties.COUNTYNAME || properties.CONTINENT || feature.id || 'Unknown');
  };

  // Setup Projection
  const { pathGenerator } = useMemo(() => {
    if (!geoData) return { pathGenerator: geoPath() };
    const width = 800;
    const height = 500;
    
    let proj;
    if (state.region === 'world') {
      if (state.worldProjection === 'mercator') {
        proj = geoMercator().translate([width / 2, height / 2]).scale(120);
      } else if (state.worldProjection === 'robinson') {
        proj = geoRobinson().translate([width / 2, height / 2]).scale(130);
      } else {
        proj = geoMollweide().translate([width / 2, height / 2]).scale(130);
      }
    } else if (state.region === 'taiwan' || state.region === 'taiwan-town') {
      // EPSG:3826 (TWD97 TM2)
      proj = geoTransverseMercator()
             .rotate([-121, 0, 0])
             .fitSize([width, height], geoData);
    } else {
      proj = geoMercator().fitSize([width, height], geoData);
    }
    
    return { pathGenerator: geoPath().projection(proj) };
  }, [geoData, state.region, state.worldProjection]);

  return (
    <div className="map-container" ref={containerRef} style={{ position: 'relative', overflow: 'hidden', background: 'transparent', borderRadius: '12px', margin: '12px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)' }}>
      {state.mapTitle && (
        <DraggableItem style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'inline-block' }}>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            {state.mapTitle}
          </h2>
        </DraggableItem>
      )}
      <svg 
        ref={svgRef}
        viewBox="0 0 800 500" 
        style={{ width: '100%', height: '100%', cursor: 'grab', display: 'block' }}
      >
        <g transform={`translate(${400 * (1 - state.mapScale)}, ${250 * (1 - state.mapScale)}) scale(${state.mapScale})`}>
          <g ref={gRef}>
          {state.region === 'world' && (
            <path 
              d={pathGenerator(geoGraticule().outline() as any) || ''} 
              fill="rgba(255, 255, 255, 0.03)" 
              stroke="rgba(255, 255, 255, 0.2)" 
              strokeWidth="0.5" 
            />
          )}
          {geoData && geoData.features.map((feature, i) => {
            const value = getRegionValue(feature);
            const fillColor = value !== undefined ? colorScale(value) : '#cbd5e1';
            
            return (
              <path
                key={i}
                d={pathGenerator(feature) || ''}
                fill={fillColor}
                stroke="#ffffff"
                strokeWidth={0.5}
                style={{ transition: 'fill 0.3s ease' }}
                onMouseEnter={(e) => {
                   const target = e.target as SVGPathElement;
                   target.setAttribute('stroke', '#000');
                   target.setAttribute('stroke-width', '1.5');
                   
                   setTooltip({
                     name: getRegionName(feature),
                     value: value !== undefined ? value : NaN,
                     x: e.pageX,
                     y: e.pageY
                   });
                }}
                onMouseMove={(e) => {
                   setTooltip(prev => prev ? { ...prev, x: e.pageX, y: e.pageY } : null);
                }}
                onMouseLeave={(e) => {
                   const target = e.target as SVGPathElement;
                   target.setAttribute('stroke', '#ffffff');
                   target.setAttribute('stroke-width', '0.5');
                   setTooltip(null);
                }}
              />
            );
          })}
          </g>
        </g>
      </svg>

      {state.showScale && (
        <DraggableItem style={{ position: 'absolute', bottom: '40px', left: '40px', zIndex: 10, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}>
          <svg width="120" height="30" style={{ overflow: 'visible' }}>
            <g transform="translate(10, 20)">
              <line x1="0" y1="0" x2="100" y2="0" stroke="white" strokeWidth="2" />
              <line x1="0" y1="-5" x2="0" y2="5" stroke="white" strokeWidth="2" />
              <line x1="50" y1="-5" x2="50" y2="5" stroke="white" strokeWidth="2" />
              <line x1="100" y1="-5" x2="100" y2="5" stroke="white" strokeWidth="2" />
              <text x="0" y="-10" fill="white" fontSize="10" textAnchor="middle">0</text>
              <text x="50" y="-10" fill="white" fontSize="10" textAnchor="middle">50km</text>
              <text x="100" y="-10" fill="white" fontSize="10" textAnchor="middle">100km</text>
            </g>
          </svg>
        </DraggableItem>
      )}

      {state.showCompass && (
        <DraggableItem style={{ position: 'absolute', top: '40px', left: '40px', zIndex: 10, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}>
          <svg width="40" height="60" style={{ overflow: 'visible' }}>
            <g transform="translate(20, 35)">
              <polygon points="0,-20 8,12 -8,12" fill="#ef4444" />
              <polygon points="0,20 8,12 -8,12" fill="#e2e8f0" />
              <circle cx="0" cy="0" r="2" fill="white" />
              <text x="0" y="-25" fill="white" fontSize="14" fontWeight="bold" textAnchor="middle">N</text>
            </g>
          </svg>
        </DraggableItem>
      )}

      {state.showLegend && <Legend state={state} />}

      {tooltip && (
        <div 
          style={{
            position: 'fixed',
            left: tooltip.x + 15,
            top: tooltip.y + 15,
            background: 'rgba(15, 23, 42, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            fontSize: '0.9rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ fontWeight: 'bold' }}>{tooltip.name}</div>
          <div>數值: {isNaN(tooltip.value) ? '無數據' : tooltip.value}</div>
        </div>
      )}
    </div>
  );
};

export default MapArea;
