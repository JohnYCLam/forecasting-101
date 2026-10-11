import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

export default function ZoomableChartWrapper({ defaultDomain, maxTime, children }) {
  const [zoomDomain, setZoomDomain] = useState(defaultDomain);
  
  useEffect(() => {
    setZoomDomain(defaultDomain);
  }, [defaultDomain[0], defaultDomain[1]]);

  const chartRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastClientX, setLastClientX] = useState(0);

  const clampDomain = (left, right, range) => {
    let newLeft = left;
    let newRight = right;
    if (newLeft < 0) {
      newLeft = 0;
      newRight = range;
    }
    if (newRight > maxTime) {
      newRight = maxTime;
      newLeft = maxTime - range;
    }
    return [Math.max(0, newLeft), Math.min(maxTime, newRight)];
  };

  const handleZoomIn = (focalFraction = 0.5) => {
    setZoomDomain(prev => {
      const range = prev[1] - prev[0];
      if (range <= 15) return prev;
      const newRange = range * 0.85;
      const focal = prev[0] + range * focalFraction;
      const newLeft = focal - newRange * focalFraction;
      const newRight = newLeft + newRange;
      return clampDomain(newLeft, newRight, newRange);
    });
  };

  const handleZoomOut = (focalFraction = 0.5) => {
    setZoomDomain(prev => {
      const range = prev[1] - prev[0];
      if (range >= maxTime) return [0, maxTime];
      const newRange = Math.min(maxTime, range * 1.15);
      const focal = prev[0] + range * focalFraction;
      const newLeft = focal - newRange * focalFraction;
      const newRight = newLeft + newRange;
      return clampDomain(newLeft, newRight, newRange);
    });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastClientX(e.clientX);
    document.body.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    if (isDragging && chartRef.current) {
      const deltaX = e.clientX - lastClientX;
      const width = chartRef.current.getBoundingClientRect().width;
      const range = zoomDomain[1] - zoomDomain[0];
      const pixelsPerUnit = width / range;
      const domainShift = -(deltaX / pixelsPerUnit);
      setZoomDomain(prev => {
        let newLeft = prev[0] + domainShift;
        let newRight = prev[1] + domainShift;
        if (newLeft < 0) { newRight -= newLeft; newLeft = 0; }
        if (newRight > maxTime) { newLeft -= (newRight - maxTime); newRight = maxTime; }
        return [Math.max(0, newLeft), Math.min(maxTime, newRight)];
      });
      setLastClientX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleZoomInRef = useRef();
  const handleZoomOutRef = useRef();

  useEffect(() => {
    handleZoomInRef.current = handleZoomIn;
    handleZoomOutRef.current = handleZoomOut;
  });

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    
    const touchStartDistRef = { current: 0 };
    
    const handleNativeWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const focalFraction = Math.max(0, Math.min(1, rect.width > 0 ? x / rect.width : 0.5));
      if (Math.abs(e.deltaY) > 0) {
        if (e.deltaY < 0) {
          handleZoomInRef.current && handleZoomInRef.current(focalFraction);
        } else {
          handleZoomOutRef.current && handleZoomOutRef.current(focalFraction);
        }
      }
    };
    
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        touchStartDistRef.current = dist;
      }
    };
    
    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        const delta = touchStartDistRef.current - dist;
        if (Math.abs(delta) > 10) {
          if (delta > 0) {
            handleZoomOutRef.current && handleZoomOutRef.current();
          } else {
            handleZoomInRef.current && handleZoomInRef.current();
          }
          touchStartDistRef.current = dist;
        }
      }
    };
    
    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div 
      ref={chartRef}
      style={{ width: '100%', height: '100%', position: 'relative', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      <div style={{ position: 'absolute', top: 5, right: 10, zIndex: 10, display: 'flex', gap: '0.25rem', opacity: 0.7 }}>
        <button onClick={handleZoomOut} title="Zoom Out" style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}>
          <ZoomOut size={18} />
        </button>
        <button onClick={handleZoomIn} title="Zoom In" style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}>
          <ZoomIn size={18} />
        </button>
      </div>
      {children(zoomDomain)}
    </div>
  );
}
