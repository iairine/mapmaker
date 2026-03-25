import React, { useState, useEffect, useRef } from 'react';

interface DraggableItemProps {
  children: React.ReactNode;
  isSvg?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ children, isSvg = false, style, className }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.stopPropagation();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const baseStyle = {
    cursor: isDragging ? 'grabbing' : 'grab',
    pointerEvents: 'auto' as const
  };

  if (isSvg) {
    return (
      <g 
        transform={`translate(${position.x}, ${position.y})`} 
        style={{ ...baseStyle, ...style }}
        onMouseDown={handleMouseDown}
      >
        {children}
      </g>
    );
  }

  return (
    <div 
      className={className}
      style={{
        ...baseStyle,
        ...style,
        transform: style?.transform ? `${style.transform} translate(${position.x}px, ${position.y}px)` : `translate(${position.x}px, ${position.y}px)`
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
};

export default DraggableItem;
