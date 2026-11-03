import React from 'react';
import FadeIn from './FadeIn';
import AnimatedText from './AnimatedText';
import ContactButton from './ContactButton';

export interface AboutSectionProps {
  onOpenContact: () => void;
}

const CORNER_IMAGES = {
  topLeft: '/assets/portfolio/about-moon.png',
  bottomLeft: '/assets/portfolio/about-object.png',
  topRight: '/assets/portfolio/about-lego.png',
  bottomRight: '/assets/portfolio/about-sculpture.png',
};

const ABOUT_TEXT =
  'Driven by a sharp eye for detail and a deep curiosity for evolving fashion trends, I approach design as a balance of creativity and construction. With hands-on experience in pattern making and garment development, I transform ideas into structured, wearable concepts. I thrive in collaborative environments, bringing originality and clarity from initial inspiration to final output, while constantly pushing boundaries to create designs that are both relevant and distinctive.';

export const AboutSection: React.FC<AboutSectionProps> = ({ onOpenContact }) => {
  return (
    <section
      id="about"
      className="relative z-10 min-h-[100svh] w-full flex flex-col items-center justify-center px-5 sm:px-8 md:px-10 py-24 sm:py-28 md:py-32 bg-transparent overflow-hidden"
    >
      {/* Top-Left: Moon Icon */}
      <FadeIn
        delay={0.1}
        x={-80}
        y={0}
        duration={0.9}
        className="absolute top-[3%] sm:top-[4%] left-[1%] sm:left-[2%] md:left-[4%] w-[76px] sm:w-[140px] md:w-[210px] opacity-80 sm:opacity-100 pointer-events-none select-none z-0"
      >
        <img
          src={CORNER_IMAGES.topLeft}
          alt="3D Moon Icon"
          referrerPolicy="no-referrer"
          className="w-full h-auto object-contain"
        />
      </FadeIn>

      {/* Bottom-Left: 3D Object */}
      <FadeIn
        delay={0.25}
        x={-80}
        y={0}
        duration={0.9}
        className="absolute bottom-[4%] sm:bottom-[8%] left-[2%] sm:left-[6%] md:left-[10%] w-[68px] sm:w-[130px] md:w-[180px] opacity-80 sm:opacity-100 pointer-events-none select-none z-0"
      >
        <img
          src={CORNER_IMAGES.bottomLeft}
          alt="3D Decorative Object"
          referrerPolicy="no-referrer"
          className="w-full h-auto object-contain"
        />
      </FadeIn>

      {/* Top-Right: Lego Icon */}
      <FadeIn
        delay={0.15}
        x={80}
        y={0}
        duration={0.9}
        className="absolute top-[3%] sm:top-[4%] right-[1%] sm:right-[2%] md:right-[4%] w-[76px] sm:w-[140px] md:w-[210px] opacity-80 sm:opacity-100 pointer-events-none select-none z-0"
      >
        <img
          src={CORNER_IMAGES.topRight}
          alt="3D Lego Icon"
          referrerPolicy="no-referrer"
          className="w-full h-auto object-contain"
        />
      </FadeIn>

      {/* Bottom-Right: 3D Group */}
      <FadeIn
        delay={0.3}
        x={80}
        y={0}
        duration={0.9}
        className="absolute bottom-[4%] sm:bottom-[8%] right-[2%] sm:right-[6%] md:right-[10%] w-[84px] sm:w-[150px] md:w-[220px] opacity-80 sm:opacity-100 pointer-events-none select-none z-0"
      >
        <img
          src={CORNER_IMAGES.bottomRight}
          alt="3D Abstract Sculpture Group"
          referrerPolicy="no-referrer"
          className="w-full h-auto object-contain"
        />
      </FadeIn>

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 sm:gap-18 md:gap-24 max-w-4xl mx-auto">
        <div className="flex flex-col items-center gap-8 sm:gap-12 md:gap-16">
          <FadeIn delay={0} y={40}>
            <h2
              className="hero-heading font-black uppercase leading-none tracking-tight text-center"
              style={{ fontSize: 'clamp(2.75rem, 12vw, 160px)' }}
            >
              About me
            </h2>
          </FadeIn>

          <AnimatedText
            text={ABOUT_TEXT}
            className="text-[#D7E2EA] font-medium text-center leading-relaxed max-w-[600px] px-1 sm:px-0"
            style={{ fontSize: 'clamp(0.95rem, 2vw, 1.35rem)' }}
          />
        </div>

        <FadeIn delay={0.2} y={20}>
          <ContactButton onClick={onOpenContact} />
        </FadeIn>
      </div>
    </section>
  );
};

export default AboutSection;
