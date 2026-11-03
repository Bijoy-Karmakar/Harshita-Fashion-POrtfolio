import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { calculateCharacterOpacityRange } from '../utils/portfolioMath';

interface CharacterSpanProps {
  char: string;
  scrollYProgress: MotionValue<number>;
  range: [number, number];
}

const CharacterSpan: React.FC<CharacterSpanProps> = ({ char, scrollYProgress, range }) => {
  const opacity = useTransform(scrollYProgress, range, [0.2, 1]);
  const displayChar = char === ' ' ? '\u00A0' : char;

  return (
    <span className="relative inline-block">
      <span className="invisible select-none" aria-hidden="true">
        {displayChar}
      </span>
      <motion.span style={{ opacity }} className="absolute left-0 top-0">
        {displayChar}
      </motion.span>
    </span>
  );
};

export interface AnimatedTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({ text, className = '', style }) => {
  const containerRef = useRef<HTMLParagraphElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  });

  const totalChars = text.length;
  const words = text.split(' ');
  let globalCharIndex = 0;

  return (
    <p
      ref={containerRef}
      aria-label={text}
      className={`flex flex-wrap justify-center ${className}`}
      style={style}
    >
      {words.map((word, wordIdx) => {
        const wordChars = word.split('');
        const isLastWord = wordIdx === words.length - 1;

        return (
          <span key={wordIdx} className="inline-flex whitespace-nowrap">
            {wordChars.map((char, charIdx) => {
              const currentIndex = globalCharIndex++;
              const range = calculateCharacterOpacityRange(currentIndex, totalChars);
              return (
                <CharacterSpan
                  key={charIdx}
                  char={char}
                  scrollYProgress={scrollYProgress}
                  range={range}
                />
              );
            })}
            {!isLastWord && (() => {
              const spaceIndex = globalCharIndex++;
              const spaceRange = calculateCharacterOpacityRange(spaceIndex, totalChars);
              return (
                <CharacterSpan
                  key="space"
                  char=" "
                  scrollYProgress={scrollYProgress}
                  range={spaceRange}
                />
              );
            })()}
          </span>
        );
      })}
    </p>
  );
};

export default AnimatedText;
