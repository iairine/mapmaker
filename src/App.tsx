import React, { useState, useEffect } from 'react';
import type { AppState, MapData } from './types';
import Sidebar from './components/Sidebar';
import MapArea from './components/MapArea';
import './App.css';
import { DEFAULT_DATA } from './utils/geoData';
import * as Papa from 'papaparse';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    region: 'world',
    customGeoJSON: null,
    rawCsvData: DEFAULT_DATA.world,
    parsedData: [],
    classification: 'quantile',
    classesCount: 5,
    colorScheme: 'Blues',
    worldProjection: 'mollweide',
    showLegend: true,
    showScale: true,
    showCompass: true,
    legendTitle: '圖例',
    mapTitle: '',
    mapScale: 1
  });

  useEffect(() => {
    // Parse CSV dynamically
    const results = Papa.parse(state.rawCsvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    const data: MapData[] = results.data.map((row: any) => {
      // Find the key corresponding to Region/Identifier
      const keys = Object.keys(row);
      const regionKey = keys[0]; // first column as region identifier
      const valKey = keys[1]; // second column as value

      const regionId = String(row[regionKey] || '');
      const value = Number(row[valKey]);
      
      return { regionId, value };
    });

    setState(prev => ({ ...prev, parsedData: data }));
  }, [state.rawCsvData]);

  return (
    <div className="app-container">
      <Sidebar state={state} setState={setState} />
      <MapArea state={state} />
    </div>
  );
};

export default App;
