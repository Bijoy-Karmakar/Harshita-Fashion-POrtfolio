import React from 'react';
import { motion } from 'framer-motion';

type IntrinsicElementTag = keyof React.JSX.IntrinsicElements;

const motionComponentCache = new Map<IntrinsicElementTag, React.ComponentType<any>>();

function getMotionComponent(tag: IntrinsicElementTag): React.ComponentType<any> {
  let Comp = motionComponentCache.get(tag);
  if (!Comp) {
    Comp = motion.create(tag as any) as React.ComponentType<any>;
    motionComponentCache.set(tag, Comp);
  }
  return Comp;
}

export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  as?: IntrinsicElementTag;
  className?: string;
  style?: React.CSSProperties;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  as = 'div',
  className = '',
  style,
}) => {
  const MotionTag = getMotionComponent(as);

  return (
    <MotionTag
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '50px', amount: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
      style={style}
    >
      {children}
    </MotionTag>
  );
};

export default FadeIn;
