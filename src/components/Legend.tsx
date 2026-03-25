import React, { useMemo } from 'react';
import type { AppState } from '../types';
import { getLegendData } from '../utils/classification';
import DraggableItem from './DraggableItem';

interface LegendProps {
  state: AppState;
}

const Legend: React.FC<LegendProps> = ({ state }) => {
  const legendItems = useMemo(() => {
    return getLegendData(state.parsedData, state.classification, state.classesCount, state.colorScheme);
  }, [state.parsedData, state.classification, state.classesCount, state.colorScheme]);

  if (legendItems.length === 0) return null;

  return (
    <DraggableItem 
      className="glass-panel"
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        padding: '8px 12px',
        zIndex: 1000,
        minWidth: '120px'
      }}
    >
      <h3 style={{ fontSize: '0.8rem', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: 600 }}>{state.legendTitle}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {legendItems.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: item.color,
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '2px'
              }} 
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {item.min === item.max 
                ? `${Number(item.min).toFixed(0)}` 
                : `${Number(item.min).toFixed(0)} - ${Number(item.max).toFixed(0)}`}
            </span>
          </div>
        ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <div 
              style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: '#cbd5e1',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '2px'
              }} 
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>無數據</span>
          </div>
      </div>
    </DraggableItem>
  );
};

export default Legend;
