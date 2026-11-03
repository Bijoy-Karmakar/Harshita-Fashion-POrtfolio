/**
 * Curated High-Fashion, Couture, Runway & Textile Editorial Lookbook Plates
 * for Harshita's Fashion Design Marquee Showcase (11 Row 1 + 10 Row 2 items).
 * Every slot references Harshita's permanent uploaded fashion image in /public/assets/portfolio/.
 */

export const FASHION_MARQUEE_PLATES: string[] = [
  '/assets/portfolio/marquee-slot-0-e5af14aa.jpg',
  '/assets/portfolio/marquee-slot-1-7bfe9726.jpg',
  '/assets/portfolio/marquee-slot-2-b5e00efd.jpg',
  '/assets/portfolio/marquee-slot-3-05ab67d9.jpg',
  '/assets/portfolio/marquee-slot-4-00ac0e9f.jpg',
  '/assets/portfolio/marquee-slot-5-1ff5d94d.jpg',
  '/assets/portfolio/marquee-slot-6-ee6e27b6.jpg',
  '/assets/portfolio/marquee-slot-7-0e4b78c0.jpg',
  '/assets/portfolio/marquee-slot-8-0e4b78c0.jpg',
  '/assets/portfolio/marquee-slot-9-4dfd2ee3.jpg',
  '/assets/portfolio/marquee-slot-10-ee6e27b6.jpg',
  '/assets/portfolio/marquee-slot-11-0e4b78c0.jpg',
  '/assets/portfolio/marquee-slot-12-4dfd2ee3.jpg',
  '/assets/portfolio/marquee-slot-13-a40baa49.jpg',
  '/assets/portfolio/marquee-slot-14-ec320bef.jpg',
  '/assets/portfolio/marquee-slot-15-e43ae86c.jpg',
  '/assets/portfolio/marquee-slot-16-4b84bfc1.jpg',
  '/assets/portfolio/marquee-slot-17-ef547fc4.jpg',
  '/assets/portfolio/marquee-slot-18-ee6e27b6.jpg',
  '/assets/portfolio/marquee-slot-19-ef547fc4.jpg',
  '/assets/portfolio/marquee-slot-20-1ff5d94d.jpg',
];

export const LEGACY_MARQUEE_SVG_PLATES: string[] = FASHION_MARQUEE_PLATES;

export const LEGACY_MARQUEE_SVG_TO_LOCAL: Record<string, string> = Object.fromEntries(
  FASHION_MARQUEE_PLATES.flatMap((realUrl, idx) => [
    [`/assets/portfolio/marquee-slot-${idx}.svg`, realUrl],
    [`/assets/portfolio/marquee-slot-${idx}.jpg`, realUrl],
  ])
);
