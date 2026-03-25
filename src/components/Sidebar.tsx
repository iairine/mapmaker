import React from 'react';
import type { AppState, RegionType, ClassificationMethod, ColorScheme } from '../types';
import { DEFAULT_DATA } from '../utils/geoData';
import { Map, UploadCloud, Download, Palette, Settings2, FileBarChart } from 'lucide-react';
import shp from 'shpjs';

interface SidebarProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const COLOR_SCHEME_OPTIONS: ColorScheme[] = [
  'Blues', 'Reds', 'Greens', 'Purples', 'Oranges', 'RdYlBu', 'Spectral', 'Viridis'
];

const Sidebar: React.FC<SidebarProps> = ({ state, setState }) => {
  
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const region = e.target.value as RegionType;
    setState(prev => ({
      ...prev,
      region,
      customGeoJSON: region !== 'custom' ? null : prev.customGeoJSON,
      rawCsvData: DEFAULT_DATA[region as keyof typeof DEFAULT_DATA] || prev.rawCsvData
    }));
  };

  const handleShapefileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const geojson = await shp(buffer);
      const featureCollection = Array.isArray(geojson) ? geojson[0] : geojson;
      setState(prev => ({
        ...prev,
        region: 'custom',
        customGeoJSON: featureCollection as any
      }));
    } catch (err) {
      alert("Error parsing shapefile. Please upload a valid .zip containing .shp files.");
    }
  };

  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <h1 className="sidebar-title"><Map size={24} /> 面量圖繪製工具</h1>
      </div>

      <div className="section">
        <h2 className="section-title">🗺️ 地圖區域 (Region)</h2>
        <div className="control-group">
          <select className="control-input" value={state.region} onChange={handleRegionChange}>
            <option value="world">全世界 (World)</option>
            <option value="taiwan">台灣縣市 (Taiwan County)</option>
            <option value="taiwan-town">台灣鄉鎮市區 (Taiwan Town)</option>
            <option value="custom">自訂上傳 (Custom Shapefile)</option>
          </select>
        </div>
        
        {state.region === 'world' && (
          <div className="control-group" style={{ marginTop: '10px' }}>
             <label className="control-label">投影方式 (Projection)</label>
             <select 
               className="control-input" 
               value={state.worldProjection}
               onChange={e => setState(p => ({ ...p, worldProjection: e.target.value as any }))}
             >
               <option value="mollweide">莫爾威投影 (Mollweide)</option>
               <option value="mercator">麥卡托投影 (Mercator)</option>
               <option value="robinson">羅賓森投影 (Robinson)</option>
             </select>
          </div>
        )}
        
        {state.region === 'custom' && (
          <div className="control-group">
            <label className="btn-primary" style={{ cursor: 'pointer', background: 'rgba(59, 130, 246, 0.2)' }}>
              <UploadCloud size={18} />
              上傳 Shapefile (.zip)
              <input type="file" accept=".zip" style={{ display: 'none' }} onChange={handleShapefileUpload} />
            </label>
          </div>
        )}
      </div>

      <div className="section">
        <h2 className="section-title"><FileBarChart size={16} style={{display:'inline', verticalAlign:'middle'}}/> 數據輸入 (Data)</h2>
        <div className="control-group">
           <p className="control-label" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>請貼上 CSV 格式 (例如: 地區名稱, 數值)</p>
           <textarea 
             className="control-input data-textarea"
             value={state.rawCsvData}
             onChange={e => setState(p => ({ ...p, rawCsvData: e.target.value }))}
           />
        </div>
      </div>

      <div className="section">
        <h2 className="section-title"><Settings2 size={16} style={{display:'inline', verticalAlign:'middle'}}/> 分級設定 (Classification)</h2>
        
        <div className="control-group">
          <label className="control-label">分級方法</label>
          <select 
            className="control-input" 
            value={state.classification}
            onChange={e => setState(p => ({ ...p, classification: e.target.value as ClassificationMethod }))}
          >
            <option value="equal-interval">等距法 (Equal Interval) - 數值範圍均分</option>
            <option value="quantile">分位數法 (Quantile) - 資料筆數均分</option>
          </select>
        </div>

        <div className="control-group">
          <label className="control-label">級距數量: {state.classesCount}</label>
          <input 
            type="range" 
            min="2" max="20" 
            value={state.classesCount}
            onChange={e => setState(p => ({ ...p, classesCount: parseInt(e.target.value) }))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>
      </div>

      <div className="section">
        <h2 className="section-title"><Palette size={16} style={{display:'inline', verticalAlign:'middle'}}/> 色階選擇 (Color Scheme)</h2>
        <div className="control-group">
          <select 
            className="control-input"
            value={state.colorScheme}
            onChange={e => setState(p => ({ ...p, colorScheme: e.target.value as ColorScheme }))}
          >
            {COLOR_SCHEME_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">✨ 地圖元件 (Elements)</h2>
        <div className="control-group" style={{ marginBottom: '10px' }}>
           <label className="control-label">地圖大標題 (Map Title)</label>
           <input 
             type="text" 
             className="control-input" 
             value={state.mapTitle} 
             onChange={e => setState(p => ({ ...p, mapTitle: e.target.value }))} 
             placeholder="請輸入地圖標題"
           />
        </div>
        <div className="control-group" style={{ marginBottom: '10px' }}>
           <label className="control-label">微調地圖大小 (Map Scale: {state.mapScale.toFixed(1)}x)</label>
           <input 
             type="range" 
             className="control-input" 
             min="0.5" 
             max="5" 
             step="0.1" 
             value={state.mapScale} 
             onChange={e => setState(p => ({ ...p, mapScale: parseFloat(e.target.value) }))} 
             style={{ width: '100%', cursor: 'pointer' }}
           />
        </div>
        <div className="control-group" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', color: 'white' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input type="checkbox" checked={state.showLegend} onChange={e => setState(p => ({ ...p, showLegend: e.target.checked }))} />
            圖例
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input type="checkbox" checked={state.showScale} onChange={e => setState(p => ({ ...p, showScale: e.target.checked }))} />
            比例尺
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input type="checkbox" checked={state.showCompass} onChange={e => setState(p => ({ ...p, showCompass: e.target.checked }))} />
            方向標
          </label>
        </div>
        {state.showLegend && (
          <div className="control-group" style={{ marginTop: '10px' }}>
             <label className="control-label">圖例標題 (Legend Title)</label>
             <input 
               type="text" 
               className="control-input" 
               value={state.legendTitle} 
               onChange={e => setState(p => ({ ...p, legendTitle: e.target.value }))} 
               placeholder="請輸入圖例標題"
             />
          </div>
        )}
      </div>

      <div className="export-btn-container">
        <button className="btn-primary" style={{width: '100%'}} onClick={() => {
          document.dispatchEvent(new CustomEvent('export-map'));
        }}>
          <Download size={18} /> 匯出成圖片 (PNG)
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
