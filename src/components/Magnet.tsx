import React, { useState, useEffect, useRef } from 'react';
import { calculateMagnetOffset } from '../utils/portfolioMath';

export interface MagnetProps {
  children: React.ReactNode;
  padding?: number;
  strength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  className?: string;
}

export const Magnet: React.FC<MagnetProps> = ({
  children,
  padding = 150,
  strength = 3,
  activeTransition = 'transform 0.3s ease-out',
  inactiveTransition = 'transform 0.6s ease-in-out',
  className = '',
}) => {
  const magnetRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(pointer: coarse)').matches
    ) {
      return;
    }

    let rafId = 0;
    let latestX = 0;
    let latestY = 0;

    const updateMagnet = () => {
      rafId = 0;
      if (!magnetRef.current) return;
      const rect = magnetRef.current.getBoundingClientRect();
      const result = calculateMagnetOffset(
        latestX,
        latestY,
        {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
        padding,
        strength
      );

      const nextX = Math.round(result.x);
      const nextY = Math.round(result.y);

      setIsActive((prev) => (prev === result.isActive ? prev : result.isActive));
      setPosition((prev) =>
        prev.x === nextX && prev.y === nextY ? prev : { x: nextX, y: nextY }
      );
    };

    const handleMouseMove = (e: MouseEvent) => {
      latestX = e.clientX;
      latestY = e.clientY;
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateMagnet);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [padding, strength]);

  const hasOffset = position.x !== 0 || position.y !== 0;

  return (
    <div ref={magnetRef} className={className}>
      <div
        style={{
          transform: hasOffset ? `translate3d(${position.x}px, ${position.y}px, 0)` : 'none',
          transition: isActive ? activeTransition : inactiveTransition,
          willChange: isActive ? 'transform' : 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Magnet;
