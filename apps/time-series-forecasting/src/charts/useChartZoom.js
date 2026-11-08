import { useCallback, useEffect, useRef, useState } from 'react';
import {
  normalizeDomain,
  zoomInDomain,
  zoomOutDomain,
} from './zoomMath';

/**
 * Shared pan / zoom state for single and dual charts.
 * Zoom changes by a fixed factor per step so one click never jumps to the limit.
 */
export default function useChartZoom({
  defaultDomain,
  minTime = 0,
  maxTime,
  minRange = 4,
}) {
  const safeMax = Number.isFinite(maxTime) ? maxTime : minTime + 1;

  const [zoomDomain, setZoomDomain] = useState(() =>
    normalizeDomain(defaultDomain ?? [minTime, safeMax], minTime, safeMax)
  );

  const defaultLeft = Array.isArray(defaultDomain) ? defaultDomain[0] : minTime;
  const defaultRight = Array.isArray(defaultDomain) ? defaultDomain[1] : safeMax;

  useEffect(() => {
    setZoomDomain(normalizeDomain([defaultLeft, defaultRight], minTime, safeMax));
  }, [defaultLeft, defaultRight, minTime, safeMax]);

  const handleZoomIn = useCallback(
    (focalFraction = 0.5) => {
      setZoomDomain((prev) => zoomInDomain(prev, focalFraction, minTime, safeMax, minRange));
    },
    [minTime, safeMax, minRange]
  );

  const handleZoomOut = useCallback(
    (focalFraction = 0.5) => {
      setZoomDomain((prev) => zoomOutDomain(prev, focalFraction, minTime, safeMax, minRange));
    },
    [minTime, safeMax, minRange]
  );

  const handleResetZoom = useCallback(() => {
    setZoomDomain(normalizeDomain(defaultDomain ?? [minTime, safeMax], minTime, safeMax));
  }, [defaultDomain, minTime, safeMax]);

  const chartRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastClientXRef = useRef(0);
  const zoomInRef = useRef(handleZoomIn);
  const zoomOutRef = useRef(handleZoomOut);

  useEffect(() => {
    zoomInRef.current = handleZoomIn;
    zoomOutRef.current = handleZoomOut;
  }, [handleZoomIn, handleZoomOut]);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (e.target?.closest?.('[data-chart-zoom-controls]')) return;
    setIsDragging(true);
    lastClientXRef.current = e.clientX;
    document.body.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !chartRef.current) return;
      const deltaX = e.clientX - lastClientXRef.current;
      const width = chartRef.current.getBoundingClientRect().width || 1;
      setZoomDomain((prev) => {
        const range = prev[1] - prev[0];
        if (!Number.isFinite(range) || range <= 0) return [minTime, safeMax];
        const domainShift = -(deltaX / width) * range;
        let newLeft = prev[0] + domainShift;
        let newRight = prev[1] + domainShift;
        if (newLeft < minTime) {
          newRight += minTime - newLeft;
          newLeft = minTime;
        }
        if (newRight > safeMax) {
          newLeft -= newRight - safeMax;
          newRight = safeMax;
        }
        return [Math.max(minTime, newLeft), Math.min(safeMax, newRight)];
      });
      lastClientXRef.current = e.clientX;
    },
    [isDragging, minTime, safeMax]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return undefined;

    const touchStartDistRef = { current: 0 };

    const handleNativeWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const focalFraction = Math.max(0, Math.min(1, rect.width > 0 ? x / rect.width : 0.5));
      if (e.deltaY < 0) zoomInRef.current(focalFraction);
      else if (e.deltaY > 0) zoomOutRef.current(focalFraction);
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        touchStartDistRef.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = touchStartDistRef.current - dist;
      if (Math.abs(delta) > 12) {
        if (delta > 0) zoomOutRef.current(0.5);
        else zoomInRef.current(0.5);
        touchStartDistRef.current = dist;
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

  return {
    zoomDomain,
    chartRef,
    isDragging,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleMouseDown,
    handleMouseMove,
  };
}
