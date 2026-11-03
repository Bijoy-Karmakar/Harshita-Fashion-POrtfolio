import React, { useEffect, useRef } from 'react';
import { computeLiquidRibbonSample } from '../utils/portfolioMath';

export interface LiquidMetalBackgroundProps {
  variant?: 'fixed' | 'section';
  className?: string;
}

interface RibbonPoint {
  x: number;
  yCenter: number;
  halfWidth: number;
  specular: number;
}

interface RibbonLayerBand {
  topFactor: number;
  bottomFactor: number;
  colorLeft: string;
  colorMid1: string;
  colorCenter: string;
  colorMid2: string;
  colorRight: string;
}

/**
 * Cross-sectional studio chrome reflection bands that follow the exact 3D contour
 * of each twisting ribbon from top edge (-1.0) to bottom edge (+1.0).
 */
const CHROME_CONTOUR_BANDS: RibbonLayerBand[] = [
  // 1. Full ribbon base: deep obsidian-gunmetal metallic body
  {
    topFactor: -1.0,
    bottomFactor: 1.0,
    colorLeft: 'rgba(14, 18, 24, 0.85)',
    colorMid1: 'rgba(38, 46, 58, 0.92)',
    colorCenter: 'rgba(10, 13, 18, 0.9)',
    colorMid2: 'rgba(44, 53, 66, 0.92)',
    colorRight: 'rgba(14, 18, 24, 0.85)',
  },
  // 2. Upper brushed silver bevel (-0.96 to -0.28)
  {
    topFactor: -0.96,
    bottomFactor: -0.28,
    colorLeft: 'rgba(90, 104, 120, 0.35)',
    colorMid1: 'rgba(205, 220, 232, 0.85)',
    colorCenter: 'rgba(120, 136, 154, 0.55)',
    colorMid2: 'rgba(218, 230, 240, 0.9)',
    colorRight: 'rgba(85, 98, 114, 0.35)',
  },
  // 3. Upper intense studio softbox specular ridge (-0.82 to -0.48)
  {
    topFactor: -0.82,
    bottomFactor: -0.48,
    colorLeft: 'rgba(180, 198, 214, 0.25)',
    colorMid1: 'rgba(255, 255, 255, 0.96)',
    colorCenter: 'rgba(195, 212, 226, 0.62)',
    colorMid2: 'rgba(255, 255, 255, 0.98)',
    colorRight: 'rgba(175, 192, 208, 0.25)',
  },
  // 4. Central dark horizon reflection core (-0.26 to +0.26) — essential for authentic chrome
  {
    topFactor: -0.26,
    bottomFactor: 0.26,
    colorLeft: 'rgba(3, 4, 6, 0.95)',
    colorMid1: 'rgba(7, 9, 13, 0.96)',
    colorCenter: 'rgba(2, 3, 5, 0.98)',
    colorMid2: 'rgba(8, 11, 16, 0.96)',
    colorRight: 'rgba(3, 4, 6, 0.95)',
  },
  // 5. Lower liquid platinum counter-reflection (+0.28 to +0.92)
  {
    topFactor: 0.28,
    bottomFactor: 0.92,
    colorLeft: 'rgba(64, 76, 90, 0.3)',
    colorMid1: 'rgba(168, 186, 204, 0.76)',
    colorCenter: 'rgba(92, 106, 122, 0.45)',
    colorMid2: 'rgba(184, 202, 218, 0.82)',
    colorRight: 'rgba(64, 76, 90, 0.3)',
  },
  // 6. Lower secondary specular highlight (+0.52 to +0.78)
  {
    topFactor: 0.52,
    bottomFactor: 0.78,
    colorLeft: 'rgba(140, 158, 176, 0.18)',
    colorMid1: 'rgba(240, 247, 255, 0.85)',
    colorCenter: 'rgba(150, 168, 184, 0.42)',
    colorMid2: 'rgba(245, 250, 255, 0.88)',
    colorRight: 'rgba(140, 158, 176, 0.18)',
  },
];

const RIBBON_CONFIGS = [
  {
    index: 0,
    opacity: 0.48,
    scaleWidth: 1.18,
  },
  {
    index: 1,
    opacity: 0.78,
    scaleWidth: 1.48,
  },
  {
    index: 2,
    opacity: 0.54,
    scaleWidth: 1.08,
  },
  {
    index: 3,
    opacity: 0.82,
    scaleWidth: 1.56,
  },
  {
    index: 4,
    opacity: 0.52,
    scaleWidth: 1.2,
  },
] as const;

function detectSoftwareOrNoGpu(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const testCanvas = document.createElement('canvas');
    const gl =
      testCanvas.getContext('webgl') ||
      testCanvas.getContext('experimental-webgl');
    if (!gl) return true;
    const debugInfo = (gl as WebGLRenderingContext).getExtension(
      'WEBGL_debug_renderer_info'
    );
    if (debugInfo) {
      const renderer = String(
        (gl as WebGLRenderingContext).getParameter(
          debugInfo.UNMASKED_RENDERER_WEBGL
        ) || ''
      );
      if (/SwiftShader|llvmpipe|Software|Basic Render/i.test(renderer)) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

export const LiquidMetalBackground: React.FC<LiquidMetalBackgroundProps> = ({
  variant = 'fixed',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    const startTime = performance.now();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isSoftwareRenderer = detectSoftwareOrNoGpu();
    const dpr = isSoftwareRenderer
      ? 1
      : Math.min(window.devicePixelRatio || 1, 1.5);

    const updateSize = () => {
      if (!canvas) return;
      width = Math.max(1, window.innerWidth || 1440);
      height = Math.max(1, window.innerHeight || 900);

      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();

    const traceSmoothCurve = (
      points: { x: number; y: number }[],
      moveToFirst: boolean
    ) => {
      if (points.length === 0) return;
      if (moveToFirst) {
        ctx.moveTo(points[0].x, points[0].y);
      } else {
        ctx.lineTo(points[0].x, points[0].y);
      }
      for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const midX = (curr.x + next.x) * 0.5;
        const midY = (curr.y + next.y) * 0.5;
        ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
      }
      const last = points[points.length - 1];
      ctx.lineTo(last.x, last.y);
    };

    const renderFrame = (now: number) => {
      const scrollPhase =
        typeof window !== 'undefined' ? window.scrollY * 0.0022 : 0;
      const elapsedSec =
        prefersReducedMotion || isSoftwareRenderer
          ? 4.2 + scrollPhase
          : 4.2 + (now - startTime) * 0.001 + scrollPhase * 0.35;

      // 1. Pure black luxury background
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const numSamples = width < 640 ? 44 : 64;
      const minHeightRef = Math.max(560, Math.min(height, 1080));

      // 2. Render each sculpted 3D liquid chrome ribbon with contour-following reflection bands
      for (const cfg of RIBBON_CONFIGS) {
        const points: RibbonPoint[] = [];

        for (let i = 0; i <= numSamples; i++) {
          const xNorm = -0.06 + (i / numSamples) * 1.12;
          const sample = computeLiquidRibbonSample(xNorm, elapsedSec, cfg.index);

          const x = xNorm * width;
          const yCenter = sample.centerYNorm * height;
          const halfWidth =
            sample.halfWidthNorm * minHeightRef * cfg.scaleWidth;

          points.push({
            x,
            yCenter,
            halfWidth,
            specular: sample.specularIntensity,
          });
        }

        // Shifting horizontal specular phase so light travels smoothly along the ribbon
        const shimmerShift =
          Math.sin(elapsedSec * 0.35 + cfg.index * 1.2) * 0.12;
        const pMid1 = Math.max(0.12, Math.min(0.42, 0.26 + shimmerShift));
        const pCenter = Math.max(0.38, Math.min(0.62, 0.5 + shimmerShift * 0.5));
        const pMid2 = Math.max(0.58, Math.min(0.88, 0.74 - shimmerShift));

        ctx.save();
        ctx.globalAlpha = cfg.opacity;

        // Draw each contour-following chrome band from [-1, +1] across the ribbon thickness
        for (const band of CHROME_CONTOUR_BANDS) {
          const bandTop = points.map((p) => ({
            x: p.x,
            y: p.yCenter + band.topFactor * p.halfWidth,
          }));
          const bandBottomReversed = [...points].reverse().map((p) => ({
            x: p.x,
            y: p.yCenter + band.bottomFactor * p.halfWidth,
          }));

          const horizGrad = ctx.createLinearGradient(0, 0, width, 0);
          horizGrad.addColorStop(0, band.colorLeft);
          horizGrad.addColorStop(pMid1, band.colorMid1);
          horizGrad.addColorStop(pCenter, band.colorCenter);
          horizGrad.addColorStop(pMid2, band.colorMid2);
          horizGrad.addColorStop(1, band.colorRight);

          ctx.beginPath();
          traceSmoothCurve(bandTop, true);
          traceSmoothCurve(bandBottomReversed, false);
          ctx.closePath();

          ctx.fillStyle = horizGrad;
          ctx.fill();
        }
        ctx.restore();

        // Upper & lower razor-sharp specular chrome rim catchlights
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const rimGrad = ctx.createLinearGradient(0, 0, width, 0);
        rimGrad.addColorStop(0, 'rgba(215, 226, 234, 0.08)');
        rimGrad.addColorStop(pMid1, 'rgba(255, 255, 255, 0.95)');
        rimGrad.addColorStop(pCenter, 'rgba(140, 158, 176, 0.25)');
        rimGrad.addColorStop(pMid2, 'rgba(255, 255, 255, 0.95)');
        rimGrad.addColorStop(1, 'rgba(215, 226, 234, 0.08)');

        const topEdge = points.map((p) => ({
          x: p.x,
          y: p.yCenter - p.halfWidth,
        }));
        const bottomEdge = points.map((p) => ({
          x: p.x,
          y: p.yCenter + p.halfWidth,
        }));

        // Upper specular crest
        ctx.globalAlpha = Math.min(0.95, cfg.opacity * 1.25);
        ctx.beginPath();
        traceSmoothCurve(topEdge, true);
        ctx.strokeStyle = rimGrad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Lower counter-reflection rim
        ctx.globalAlpha = Math.min(0.7, cfg.opacity * 0.9);
        ctx.beginPath();
        traceSmoothCurve(bottomEdge, true);
        ctx.strokeStyle = rimGrad;
        ctx.lineWidth = 1.05;
        ctx.stroke();

        // Delicate intertwined couture silver filament thread
        if (cfg.index % 2 === 1) {
          const filamentPoints = points.map((p, idx) => {
            const offset =
              Math.sin(
                (idx / numSamples) * Math.PI * 4 + elapsedSec * 0.45 + cfg.index
              ) *
              (p.halfWidth * 1.38);
            return {
              x: p.x,
              y: p.yCenter + offset,
            };
          });
          ctx.globalAlpha = cfg.opacity * 0.48;
          ctx.beginPath();
          traceSmoothCurve(filamentPoints, true);
          ctx.strokeStyle = rimGrad;
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Balanced editorial contrast scrim so central typography & cards remain 100% legible
      ctx.globalCompositeOperation = 'source-over';
      const centerReadabilityScrim = ctx.createRadialGradient(
        width * 0.5,
        height * 0.48,
        Math.min(width, height) * 0.08,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      centerReadabilityScrim.addColorStop(0, 'rgba(0, 0, 0, 0.34)');
      centerReadabilityScrim.addColorStop(0.5, 'rgba(0, 0, 0, 0.18)');
      centerReadabilityScrim.addColorStop(1, 'rgba(0, 0, 0, 0.58)');
      ctx.fillStyle = centerReadabilityScrim;
      ctx.fillRect(0, 0, width, height);

      if (!prefersReducedMotion && !isSoftwareRenderer && !document.hidden) {
        animationFrameId = window.requestAnimationFrame(renderFrame);
      }
    };

    const handleResize = () => {
      const nextWidth = Math.max(1, window.innerWidth || 1440);
      const nextHeight = Math.max(1, window.innerHeight || 900);
      // Avoid unnecessary canvas buffer reallocation on minor mobile address-bar height shifts
      if (
        nextWidth === width &&
        nextWidth < 768 &&
        Math.abs(nextHeight - height) < 120
      ) {
        return;
      }
      updateSize();
      if (prefersReducedMotion || isSoftwareRenderer) {
        renderFrame(performance.now());
      }
    };

    const handleScroll = () => {
      if (isSoftwareRenderer && !prefersReducedMotion) {
        renderFrame(performance.now());
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrameId) {
          window.cancelAnimationFrame(animationFrameId);
          animationFrameId = 0;
        }
      } else if (!prefersReducedMotion && !isSoftwareRenderer && !animationFrameId) {
        animationFrameId = window.requestAnimationFrame(renderFrame);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    renderFrame(performance.now());

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [variant]);

  const positioningClass =
    variant === 'fixed'
      ? 'fixed inset-0 w-full h-full z-0 pointer-events-none select-none'
      : 'sticky top-0 left-0 w-full h-screen -mb-[100vh] z-0 pointer-events-none select-none block';

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid={`liquid-metal-bg-${variant}`}
      className={`${positioningClass} ${className}`}
    />
  );
};

export default LiquidMetalBackground;
