export interface RectBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface MagnetComputation {
  isActive: boolean;
  x: number;
  y: number;
}

/**
 * Calculates scroll offset for MarqueeSection:
 * (scrollY - sectionTop + innerHeight) * 0.3
 */
export function calculateMarqueeOffset(
  scrollY: number,
  sectionTop: number,
  innerHeight: number
): number {
  return (scrollY - sectionTop + innerHeight) * 0.3;
}

/**
 * Calculates horizontal CSS transform strings for the two marquee rows.
 * Row 1 moves right: translateX(offset - 200)
 * Row 2 moves left: translateX(-(offset - 200))
 */
export function calculateMarqueeTransforms(offset: number): {
  row1Transform: string;
  row2Transform: string;
} {
  const shifted = offset - 200;
  return {
    row1Transform: `translateX(${shifted}px)`,
    row2Transform: `translateX(${-shifted}px)`,
  };
}

/**
 * Calculates whether the cursor is within the magnetic activation zone
 * and the resulting 2D translation divided by strength.
 */
export function calculateMagnetOffset(
  clientX: number,
  clientY: number,
  rect: RectBounds,
  padding: number = 150,
  strength: number = 3
): MagnetComputation {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const distX = Math.abs(clientX - centerX);
  const distY = Math.abs(clientY - centerY);

  const isWithinX = distX < rect.width / 2 + padding;
  const isWithinY = distY < rect.height / 2 + padding;

  if (isWithinX && isWithinY && strength > 0) {
    return {
      isActive: true,
      x: (clientX - centerX) / strength,
      y: (clientY - centerY) / strength,
    };
  }

  return {
    isActive: false,
    x: 0,
    y: 0,
  };
}

/**
 * Calculates the scroll progress [start, end] range for a single character at charIndex.
 */
export function calculateCharacterOpacityRange(
  charIndex: number,
  totalChars: number
): [number, number] {
  if (totalChars <= 0) return [0, 1];
  const start = charIndex / totalChars;
  const end = (charIndex + 1) / totalChars;
  return [start, end];
}

/**
 * Calculates the target scale for sticky-stacking project cards:
 * targetScale = 1 - (totalCards - 1 - index) * 0.03
 */
export function calculateCardTargetScale(index: number, totalCards: number): number {
  return Number((1 - (totalCards - 1 - index) * 0.03).toFixed(4));
}

/**
 * Calculates the top pixel offset for sticky-stacking project cards:
 * index * 28
 */
export function calculateCardTopOffset(index: number): number {
  return index * 28;
}

export interface IdentityProfile {
  fullName: string;
  role: string;
  badgeId: string;
  location: string;
  specialty: string;
  email: string;
  photoUrl: string;
  customHeading: string;
  customBodyText: string;
  skillsHeading?: string;
  manifestoImageUrl?: string;
}

export function formatBadgeSerial(badgeId: string): string {
  const cleaned = badgeId.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  return cleaned || 'ID-0000';
}

export interface LanyardPendulumConfig {
  duration: number;
  rotateKeyframes: number[];
  yKeyframes: number[];
  times: number[];
}

/**
 * Returns the 3-second drop-down and damped pendulum swing keyframes
 * anchored at top-center of the lanyard ribbon.
 */
export function getLanyardPendulumConfig(): LanyardPendulumConfig {
  return {
    duration: 3,
    rotateKeyframes: [15, -12, 8.5, -5.5, 3.5, -2, 0.8, 0],
    yKeyframes: [-220, 14, -5, 0, 0, 0, 0, 0],
    times: [0, 0.16, 0.32, 0.48, 0.64, 0.78, 0.9, 1],
  };
}

export interface ProjectDocumentation {
  subtitle: string;
  timeline: string;
  role: string;
  toolsAndMediums: string;
  deliverables: string;
  overview: string;
  technicalDocumentation: string;
  outcomeAndNotes: string;
  docImage1: string;
  docImage2: string;
  docImage3: string;
}

export const DEFAULT_PROJECT_DOCS: Record<string, ProjectDocumentation> = {
  '01': {
    subtitle: "CASUAL MEN'S WEAR",
    timeline: 'ss 2026',
    role: 'LEAD FASHION DESIGNER & 3D CREATIVE DIRECTOR',
    toolsAndMediums: 'DENIM, PATCH WORK',
    deliverables:
      '12 COUTURE SILHOUETTES, SCULPTURAL FACE JEWELRY, 3D DIGITAL LOOKBOOK & SHOWROOM INSTALLATION',
    overview:
      'Chehre is a contemporary men\'s wear fashion collection that explores identity, individuality, and self-expression through clothing. Inspired by the many faces, emotions, and stories that shape who we are, the brand blends creativity with thoughtful design to create pieces that reflect personal style and inner character. Chehre celebrates the idea that fashion is more than appearance—it is a reflection of personality, culture, and the unique stories we carry. Chehre" is a menswear fashion collection inspired by the many faces a man embodies in his everyday life. A face is not just a physical identity-it reflects emotions, roles, and hidden layers of personality. In a constantly evolving world, individuals shift between different "chehre" depending on situations, expectations, and inner states. This collection explores these transitions and the duality between the seen and the unseen self and focusing on the use of waste fabric scraps to craft intricate and expressive faces, visually engaging fabric patchwork that portray a range of human emotions and characteristics and the "ART OF SELF LOVE".',
    technicalDocumentation: '',
    outcomeAndNotes: '',
    docImage1: '/assets/portfolio/project-01-docImage1-d6278f11.jpg',
    docImage2: '/assets/portfolio/project-01-docImage2-4603d56c.jpg',
    docImage3: '',
  },
  '02': {
    subtitle: 'traditional wear',
    timeline: 'SS 2027 ',
    role: 'BRAND ARCHITECT & VISUAL DIRECTOR',
    toolsAndMediums: 'Glass satin,  sangtung silk,  Embroidery,  Bead work',
    deliverables:
      'FULL VISUAL IDENTITY SYSTEM, 3D MOTION FILMS, ATELIER PACKAGING & LOOKBOOK MONOGRAPH',
    overview:
      'The Silent Witness Every palace wall is a vault of unwritten history. While the history books record the wars and the kings, the walls themselves—the lime-plastered surfaces and the mineral-stained frescoes—remember the smaller, human moments. They are the silent observers of royal whispers, the warmth of a passing silk sleeve, and the echoes of hidden romances that never left the courtyard. This garment is not just a costume; it is an attempt to translate that "memory of stone" into the language of textile.',
    technicalDocumentation: '',
    outcomeAndNotes: '',
    docImage1: '/assets/portfolio/project-02-docImage1-7d07c750.jpg',
    docImage2: '',
    docImage3: '',
  },
  '03': {
    subtitle: "women's denim wear",
    timeline: 'ss 2027',
    role: 'CREATIVE TECHNOLOGIST & COUTURE DESIGNER',
    toolsAndMediums: 'denim',
    deliverables:
      'INTERACTIVE RUNWAY VISUALS, 8 CAPSULE GARMENTS & TECHNICAL FABRICATION MANUAL',
    overview:
      '“Engineered in Denim” explores denim as a material of structure rather than utility. Inspired by the precision of construction, the garment manipulates panels, seams and contrasting elements to create a strong architectural silhouette. Deep indigo denim provides the foundation, while bold red inserts interrupt the structure, creating rhythm, depth and movement. The design reimagines denim beyond its casual identity, presenting it as refined, powerful and contemporary.',
    technicalDocumentation: '',
    outcomeAndNotes: '',
    docImage1: '/assets/portfolio/project-03-docImage1-6b219256.jpg',
    docImage2: '',
    docImage3: '',
  },
  '04': {
    subtitle: 'evening gown',
    timeline: 'ss 2027',
    role: 'FASHION DESIGNER & 3D MOTION SPECIALIST',
    toolsAndMediums: 'satin and tulle',
    deliverables: '10 KINETIC GARMENTS, 3D CLOTH SIMULATION ARCHIVE & EDITORIAL LOOKBOOK',
    overview:
      'Inspired by the magical beauty of a secret garden,\nEnchanted Garden captures the harmony between nature\nand elegance. The collection draws inspiration from\ndelicate leaves, blooming flowers, morning dew, and\ngolden sunlight filtering through lush greenery. Soft\nsage-green tones and lustrous satin reflect the\nfreshness of nature, while structured corsetry and\nflowing silhouettes represent the balance between\nstrength and feminini.\n\nWhere emerald leaves meet morning dew,\nAnd golden sunlight dances through,\nA gown of grace, in sage-green hue,\nBlooms like a dream, serene and true.\nSoft petals sway, the wildflowers sing,\nWhile satin flows like the breath of spring.\nA secret garden, a world unseen,\nWhere elegance whispers in shades of green.',
    technicalDocumentation: '',
    outcomeAndNotes: '',
    docImage1: '/assets/portfolio/project-04-docImage1-9818aee8.jpg',
    docImage2: '',
    docImage3: '',
  },
  '05': {
    subtitle: "women's wear",
    timeline: 'ss 2027',
    role: 'LEAD TEXTILE & 3D GARMENT DESIGNER',
    toolsAndMediums: 'cotton,  batik technique',
    deliverables: 'BESPOKE CAPSULE COLLECTION, DIGITAL TWIN ARCHIVE & SHOWROOM EXHIBITION',
    overview:
      'Deep Under the Sea explores the fascinating and mysterious world hidden beneath the ocean’s surface. It is a journey into the depths of the sea, where every movement, colour, and living creature tells a unique story. The concept focuses on discovering the extraordinary marine ecosystem and understanding how different species coexist, interact, and survive together in their natural habitat. From vibrant coral reefs and delicate underwater plants to exotic fish and fascinating sea creatures, the underwater world is filled with endless wonders waiting to be explored. Beneath the calm and silent waters lies a lively universe full of colours, textures, patterns, and movement. This concept celebrates the beauty of marine life, the diversity of underwater species, and the magical relationship between nature and its surroundings. It invites us to look beyond the surface and discover a world that is mysterious, peaceful, vibrant, and full of life.',
    technicalDocumentation: '',
    outcomeAndNotes: '',
    docImage1: '/assets/portfolio/project-05-docImage1-8cd235a1.webp',
    docImage2: '',
    docImage3: '',
  },
};

export const LEGACY_TEMPLATE_PROJECT_DOCS_TEXT: Record<string, Record<string, string[]>> = {
  '01': {
    subtitle: ['AVANT-GARDE COUTURE & SCULPTURAL VISAGE ARCHIVE'],
    timeline: ['AW 2026 · 16 WEEKS', 'AW 2026 ·'],
    toolsAndMediums: [
      'CLO3D, BLENDER CYCLES, HAND-EMBROIDERED ORGANZA, BRASS WIRE & METALLIC BONING',
    ],
    overview: [
      'CHEHRE ("Faces") is an exploration of identity, duality, and emotional armor through haute couture and 3D sculptural forms. The collection examines how layers of sheer organza, geometric metallic contours, and structured tailoring frame the human visage.\n\nEach garment was first drafted as a digital 3D twin to test light refraction across metallic threads before being hand-draped and constructed in the atelier.',
      'Chehre is a contemporary fashion brand that explores identity, individuality, and self-expression through clothing. Inspired by the many faces, emotions, and stories that shape who we are, the brand blends creativity with thoughtful design to create pieces that reflect personal style and inner character. Chehre celebrates the idea that fashion is more than appearance—it is a reflection of personality, culture, and the unique stories we carry.\nChehre" is a menswear fashion collection inspired by the many faces a man embodies in his everyday life. A face is not just a physical identity-it reflects emotions, roles, and hidden layers of personality. In a constantly evolving world, individuals shift between different "chehre" depending on situations, expectations, and inner states. This collection explores these transitions and the duality between the seen and the unseen self and focusing on the use of waste fabric scraps to craft intricate and expressive faces, visually engaging fabric patchwork that portray a range of human emotions and characteristics and the "ART OF SELF LOVE".',
    ],
  },
  '02': {
    subtitle: [
      'SENSORY LUXURY BRANDING & DIGITAL COUTURE IDENTITY',
      "women's indian wear",
    ],
    timeline: ['SS 2026 · 10 WEEKS', 'SS 2027'],
    toolsAndMediums: [
      'MARVELLOUS DESIGNER, CINEMA 4D, OCTANE RENDER, CUSTOM TYPOGRAPHY & PACKAGING',
      'Glass satin , sangtung silk, Embroidery,  Bead work',
    ],
    overview: [
      'Aura Brand Identity translates the tactile softness of botanical silk dyeing and atmospheric light into a cohesive luxury fashion house identity. Designed as a personal research project into sensory minimalism.\n\nThe visual language bridges physical garment labels, woven jacquard tags, and immersive digital showroom environments.',
    ],
  },
  '03': {
    subtitle: [
      'SOLAR-REACTIVE TEXTILE LAB & DIGITAL RUNWAY EXPERIENCE',
      'denim wear',
    ],
    timeline: ['2026 · 12 WEEKS', 'SS 2027'],
    toolsAndMediums: [
      'HOUDINI PROCEDURAL WEAVE, UNREAL ENGINE 5, PHOTOCHROMIC YARNS & LASER-CUT SILK',
    ],
    overview: [
      'Solaris Digital merges haute couture craftsmanship with reactive textile engineering. Commissioned to showcase garments that shift hue and structural tension under changing studio lighting conditions.\n\nThe project required simultaneous development of physical laser-cut garments and real-time 3D projection mapping.',
    ],
  },
  '04': {
    subtitle: ['ARCHITECTURAL PLEATING & MOTION CAPTURE COUTURE'],
    timeline: ['2026 · 14 WEEKS'],
    toolsAndMediums: [
      'CLO3D, BLENDER, HEAT-SET PLISSÉ ORGANZA & STRUCTURAL CARBON BONING',
    ],
    overview: [
      'Kinetic Silhouettes investigates the choreography of fabric in motion, pairing traditional hand-pleated organza with parametric 3D cloth simulations.\n\nEvery silhouette was engineered to expand and contract dynamically with the wearer, translating architectural geometry into fluid wearable sculpture.',
    ],
  },
  '05': {
    subtitle: ['ARTISANAL HERITAGE WEAVES & VIRTUAL ATELIER EXHIBITION'],
    timeline: ['2026 · 12 WEEKS'],
    toolsAndMediums: [
      'SUBSTANCE 3D DESIGNER, MARVELLOUS DESIGNER, HANDWOVEN SILK BROCADE & METALLIC ZARI',
    ],
    overview: [
      'Aetheria Archive bridges heirloom handloom craftsmanship with high-resolution digital preservation. Custom silk brocades and metallic weaves were digitized at micro-thread scale and sculpted into contemporary avant-garde forms.\n\nThe resulting collection celebrates both tactile heritage craft and futuristic spatial presentation.',
    ],
  },
};

/**
 * Returns true if the given project text value is an obsolete initial template placeholder
 * or stale v2 draft string that should never overwrite the published master project text.
 */
export function isLegacyOrStaleProjectText(
  projectNumber: string,
  field: string,
  value: string | undefined | null
): boolean {
  if (!value || typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  const legacyList = LEGACY_TEMPLATE_PROJECT_DOCS_TEXT[projectNumber]?.[field];
  if (!legacyList) return false;
  return legacyList.some((legacyStr) => legacyStr.trim() === trimmed);
}


export const LEGACY_PLACEHOLDER_TO_UPLOADED_MAP: Record<string, string> = {
  '/assets/portfolio/hero-default.png': '/assets/portfolio/hero-portrait-a865a84b.png',
  '/assets/portfolio/marquee-slot-0.svg': '/assets/portfolio/marquee-slot-0-e5af14aa.jpg',
  '/assets/portfolio/marquee-slot-1.svg': '/assets/portfolio/marquee-slot-1-7bfe9726.jpg',
  '/assets/portfolio/marquee-slot-2.svg': '/assets/portfolio/marquee-slot-2-b5e00efd.jpg',
  '/assets/portfolio/marquee-slot-3.svg': '/assets/portfolio/marquee-slot-3-05ab67d9.jpg',
  '/assets/portfolio/marquee-slot-4.svg': '/assets/portfolio/marquee-slot-4-00ac0e9f.jpg',
  '/assets/portfolio/marquee-slot-5.svg': '/assets/portfolio/marquee-slot-5-1ff5d94d.jpg',
  '/assets/portfolio/marquee-slot-6.svg': '/assets/portfolio/marquee-slot-6-ee6e27b6.jpg',
  '/assets/portfolio/marquee-slot-7.svg': '/assets/portfolio/marquee-slot-7-0e4b78c0.jpg',
  '/assets/portfolio/marquee-slot-8.svg': '/assets/portfolio/marquee-slot-8-0e4b78c0.jpg',
  '/assets/portfolio/marquee-slot-9.svg': '/assets/portfolio/marquee-slot-9-4dfd2ee3.jpg',
  '/assets/portfolio/marquee-slot-10.svg': '/assets/portfolio/marquee-slot-10-ee6e27b6.jpg',
  '/assets/portfolio/marquee-slot-11.svg': '/assets/portfolio/marquee-slot-11-0e4b78c0.jpg',
  '/assets/portfolio/marquee-slot-12.svg': '/assets/portfolio/marquee-slot-12-4dfd2ee3.jpg',
  '/assets/portfolio/marquee-slot-13.svg': '/assets/portfolio/marquee-slot-13-a40baa49.jpg',
  '/assets/portfolio/marquee-slot-14.svg': '/assets/portfolio/marquee-slot-14-ec320bef.jpg',
  '/assets/portfolio/marquee-slot-15.svg': '/assets/portfolio/marquee-slot-15-e43ae86c.jpg',
  '/assets/portfolio/marquee-slot-16.svg': '/assets/portfolio/marquee-slot-16-4b84bfc1.jpg',
  '/assets/portfolio/marquee-slot-17.svg': '/assets/portfolio/marquee-slot-17-ef547fc4.jpg',
  '/assets/portfolio/marquee-slot-18.svg': '/assets/portfolio/marquee-slot-18-ee6e27b6.jpg',
  '/assets/portfolio/marquee-slot-19.svg': '/assets/portfolio/marquee-slot-19-ef547fc4.jpg',
  '/assets/portfolio/marquee-slot-20.svg': '/assets/portfolio/marquee-slot-20-1ff5d94d.jpg',
  '/assets/portfolio/project-01-col1Image1.svg': '/assets/portfolio/project-01-col1Image1-33e4d9ab.png',
  '/assets/portfolio/project-01-col1Image2.svg': '/assets/portfolio/project-01-col1Image2-6c815534.png',
  '/assets/portfolio/project-01-col2Image.svg': '/assets/portfolio/project-01-col2Image-05ab67d9.jpg',
  '/assets/portfolio/project-01-docImage1.svg': '/assets/portfolio/project-01-docImage1-d6278f11.jpg',
  '/assets/portfolio/project-01-docImage2.svg': '/assets/portfolio/project-01-docImage2-4603d56c.jpg',
  '/assets/portfolio/project-01-docImage3.svg': '',
  '/assets/portfolio/project-02-col1Image1.webp': '/assets/portfolio/project-02-col1Image1-feeb3782.jpg',
  '/assets/portfolio/project-02-col1Image2.webp': '/assets/portfolio/project-02-col1Image2-05a073b8.jpg',
  '/assets/portfolio/project-02-col2Image.webp': '/assets/portfolio/project-02-col2Image-dffa6b9f.jpg',
  '/assets/portfolio/project-02-docImage1.webp': '/assets/portfolio/project-02-docImage1-7d07c750.jpg',
  '/assets/portfolio/project-02-docImage2.webp': '',
  '/assets/portfolio/project-02-docImage3.webp': '',
  '/assets/portfolio/project-03-col1Image1.webp': '/assets/portfolio/project-03-col1Image1-1900c502.png',
  '/assets/portfolio/project-03-col1Image2.webp': '/assets/portfolio/project-03-col1Image2-bf62e2f4.png',
  '/assets/portfolio/project-03-col2Image.webp': '/assets/portfolio/project-03-col2Image-ef547fc4.jpg',
  '/assets/portfolio/project-03-docImage1.webp': '/assets/portfolio/project-03-docImage1-6b219256.jpg',
  '/assets/portfolio/project-03-docImage2.webp': '',
  '/assets/portfolio/project-03-docImage3.webp': '',
  '/assets/portfolio/project-04-col1Image1.webp': '/assets/portfolio/project-04-col1Image1-006cbf00.png',
  '/assets/portfolio/project-04-col1Image2.webp': '/assets/portfolio/project-04-col1Image2-52482636.png',
  '/assets/portfolio/project-04-col2Image.webp': '/assets/portfolio/project-04-col2Image-1ff5d94d.jpg',
  '/assets/portfolio/project-04-docImage1.webp': '/assets/portfolio/project-04-docImage1-9818aee8.jpg',
  '/assets/portfolio/project-04-docImage2.webp': '',
  '/assets/portfolio/project-04-docImage3.webp': '',
  '/assets/portfolio/project-05-col1Image1.webp': '/assets/portfolio/project-05-col1Image1-c0405f55.png',
  '/assets/portfolio/project-05-col1Image2.webp': '/assets/portfolio/project-05-col1Image2-3f0d2134.png',
  '/assets/portfolio/project-05-col2Image.webp': '/assets/portfolio/project-05-col2Image-3198c777.jpg',
  '/assets/portfolio/project-05-docImage1.webp': '/assets/portfolio/project-05-docImage1-8cd235a1.webp',
  '/assets/portfolio/project-05-docImage2.webp': '',
  '/assets/portfolio/project-05-docImage3.webp': '',
};

export const LEGACY_EXTERNAL_URL_MAP: Record<string, string> = {
  'https://shrug-person-78902957.figma.site/_components/v2/d24c01ad3a56fc65e942a1f501eb73db42d7cf9a/Rectangle_40443.81459862.png':
    '/assets/portfolio/hero-portrait-a865a84b.png',
  'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/moon_icon.11395d36.png':
    '/assets/portfolio/about-moon.png',
  'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/p59_1.4659672e.png':
    '/assets/portfolio/about-object.png',
  'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/lego_icon-1.703bb594.png':
    '/assets/portfolio/about-lego.png',
  'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/Group_134-1.2e04f3ce.png':
    '/assets/portfolio/about-sculpture.png',
};

/**
 * Returns true if the URL is empty, points to a 0-byte `-da39a3ee` file produced by an interrupted
 * chunk upload, or points to a removed placeholder/demo asset.
 */
export function isCorruptedOrDeletedAssetUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.includes('-da39a3ee.')) return true;
  if (trimmed === '/assets/portfolio/identity-skills-default.svg') return true;
  if (trimmed === '/assets/portfolio/hero-default.png') return true;
  if (/^\/assets\/portfolio\/project-shared-[1-6]\.webp$/i.test(trimmed)) return true;
  if (
    /^\/assets\/portfolio\/(hero-portrait|identity-photo|identity-skills|marquee-slot-\d+|project-0[1-5]-(col1Image1|col1Image2|col2Image|docImage1|docImage2|docImage3))\.(jpg|svg|webp)$/i.test(
      trimmed
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Normalizes any legacy external URL (figma.site, images.higgs.ai, or old placeholder/demo path)
 * to its permanent uploaded asset path under /assets/portfolio/, and strips any corrupted 0-byte paths.
 */
export function normalizeLegacyAssetUrl(
  url: string | undefined | null,
  fallbackUrl: string = ''
): string {
  const mappedFallback =
    fallbackUrl && LEGACY_PLACEHOLDER_TO_UPLOADED_MAP[fallbackUrl.trim()] !== undefined
      ? LEGACY_PLACEHOLDER_TO_UPLOADED_MAP[fallbackUrl.trim()]
      : fallbackUrl;
  const safeFallback = isCorruptedOrDeletedAssetUrl(mappedFallback)
    ? ''
    : (mappedFallback || '').trim();

  if (!url || typeof url !== 'string') return safeFallback;
  const trimmed = url.trim();
  if (!trimmed) return safeFallback;

  if (LEGACY_PLACEHOLDER_TO_UPLOADED_MAP[trimmed] !== undefined) {
    return LEGACY_PLACEHOLDER_TO_UPLOADED_MAP[trimmed] || safeFallback;
  }

  if (isCorruptedOrDeletedAssetUrl(trimmed)) return safeFallback;

  if (LEGACY_EXTERNAL_URL_MAP[trimmed]) {
    return safeFallback && safeFallback.startsWith('/assets/portfolio/project-0')
      ? safeFallback
      : LEGACY_EXTERNAL_URL_MAP[trimmed];
  }

  if (trimmed.includes('Rectangle_40443.81459862.png')) {
    return '/assets/portfolio/hero-portrait-a865a84b.png';
  }
  if (trimmed.includes('moon_icon.11395d36.png')) {
    return '/assets/portfolio/about-moon.png';
  }
  if (trimmed.includes('p59_1.4659672e.png')) {
    return '/assets/portfolio/about-object.png';
  }
  if (trimmed.includes('lego_icon-1.703bb594.png')) {
    return '/assets/portfolio/about-lego.png';
  }
  if (trimmed.includes('Group_134-1.2e04f3ce.png')) {
    return '/assets/portfolio/about-sculpture.png';
  }
  if (
    trimmed.includes('911201c5-36d9-4bc6-bac7-331adfce159f') ||
    trimmed.includes('5ceda0b8-d9c2-4665-b2e3-83ba19ba76d1') ||
    trimmed.includes('adc5dcbd-a8e6-49c0-b43a-9b030d835cea') ||
    trimmed.includes('963cfb0b-4bd1-4b0f-9d0a-09bd6cf95b2f') ||
    trimmed.includes('438f781a-9846-4dcc-89ab-c4e6cb830f5b') ||
    trimmed.includes('9d062121-ad7e-46b9-999a-1a6a692ef1ee')
  ) {
    return safeFallback;
  }

  // Legacy built-in SVG data URLs (CHEHRE or Marquee templates)
  if (trimmed.startsWith('data:image/svg+xml;utf8,')) {
    return safeFallback;
  }

  return trimmed;
}

/**
 * Returns true if the given URL represents a custom user-uploaded image
 * (either a `data:image/...` base64 upload or a valid hashed `/assets/portfolio/<slot>-<hash8>.<ext>` file),
 * and false if it is empty, corrupted, or a built-in default template/placeholder path.
 */
export function isCustomUploadedAsset(
  url: string | undefined | null,
  defaultUrl?: string
): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || isCorruptedOrDeletedAssetUrl(trimmed)) return false;
  if (trimmed.startsWith('data:image/svg+xml;utf8,')) return false;

  // Any raw raster data URL is a custom user upload
  if (trimmed.startsWith('data:image/')) return true;

  // Any content-addressed hashed file in /assets/portfolio/<slot>-<hash8>.<ext> is a real custom upload
  if (
    /^\/assets\/portfolio\/[a-zA-Z0-9_-]+-[0-9a-f]{8}\.(jpg|jpeg|png|webp|gif|avif)$/i.test(
      trimmed
    )
  ) {
    return true;
  }

  if (defaultUrl && trimmed === defaultUrl) return false;
  return true;
}

export const PROJECT_1_PORTRAIT_DIMENSIONS = {
  width: 524,
  height: 1536,
  aspectRatioCss: '524 / 1536',
  ratio: Number((1536 / 524).toFixed(2)),
} as const;

export const PROJECT_2_PORTRAIT_DIMENSIONS = {
  width: 473,
  height: 1536,
  aspectRatioCss: '473 / 1536',
  ratio: Number((1536 / 473).toFixed(2)),
} as const;

export const PROJECT_3_PORTRAIT_DIMENSIONS = {
  width: 365,
  height: 1536,
  aspectRatioCss: '365 / 1536',
  ratio: Number((1536 / 365).toFixed(2)),
} as const;

export const PROJECT_4_PORTRAIT_DIMENSIONS = {
  width: 1080,
  height: 3988,
  aspectRatioCss: '1080 / 3988',
  ratio: Number((3988 / 1080).toFixed(2)),
} as const;

export const PROJECT_5_PORTRAIT_DIMENSIONS = {
  width: 1080,
  height: 3712,
  aspectRatioCss: '1080 / 3712',
  ratio: Number((3712 / 1080).toFixed(2)),
} as const;

export function getProjectPortraitAspectRatio(projectNumber: string): string {
  if (projectNumber === '01') return PROJECT_1_PORTRAIT_DIMENSIONS.aspectRatioCss;
  if (projectNumber === '02') return PROJECT_2_PORTRAIT_DIMENSIONS.aspectRatioCss;
  if (projectNumber === '03') return PROJECT_3_PORTRAIT_DIMENSIONS.aspectRatioCss;
  if (projectNumber === '04') return PROJECT_4_PORTRAIT_DIMENSIONS.aspectRatioCss;
  if (projectNumber === '05') return PROJECT_5_PORTRAIT_DIMENSIONS.aspectRatioCss;
  return PROJECT_5_PORTRAIT_DIMENSIONS.aspectRatioCss;
}

export function getDefaultProjectDocumentation(projectNumber: string): ProjectDocumentation {
  return (
    DEFAULT_PROJECT_DOCS[projectNumber] || {
      subtitle: 'BESPOKE ATELIER & 3D CASE STUDY',
      timeline: '2026',
      role: 'CREATIVE DIRECTOR',
      toolsAndMediums: '3D DESIGN, COUTURE TAILORING & ART DIRECTION',
      deliverables: 'FULL PROJECT ARCHIVE & DOCUMENTATION',
      overview: 'Detailed project explanation and creative concept overview.',
      technicalDocumentation: '',
      outcomeAndNotes: '',
      docImage1: '/assets/portfolio/project-01-docImage1-d6278f11.jpg',
      docImage2: '',
      docImage3: '',
    }
  );
}

export const HARSHITA_GMAIL = 'harshita.fashion2917@gmail.com';

/**
 * Builds a direct Gmail web compose URL addressed to harshita.fashion2917@gmail.com
 */
export function buildGmailComposeUrl(subject?: string, body?: string): string {
  const baseUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(HARSHITA_GMAIL)}`;
  const params: string[] = [];
  if (subject && subject.trim()) {
    params.push(`su=${encodeURIComponent(subject.trim())}`);
  }
  if (body && body.trim()) {
    params.push(`body=${encodeURIComponent(body.trim())}`);
  }
  return params.length > 0 ? `${baseUrl}&${params.join('&')}` : baseUrl;
}

/**
 * Computes a deterministic staggered animation delay (in seconds) for each character
 * in a project heading when scrolling into view.
 */
export function calculateHeadingCharDelay(
  charIndex: number,
  baseDelay = 0,
  step = 0.012
): number {
  const safeIndex = Math.max(0, charIndex);
  return Number((baseDelay + safeIndex * step).toFixed(4));
}

export interface LiquidRibbonSample {
  centerYNorm: number;
  halfWidthNorm: number;
  slope: number;
  specularIntensity: number;
}

/**
 * Computes the organic 3D-projected centerline, ribbon twist thickness,
 * slope, and studio specular reflection intensity for a flowing liquid chrome ribbon.
 */
export function computeLiquidRibbonSample(
  xNorm: number,
  timeSec: number,
  ribbonIndex: number
): LiquidRibbonSample {
  const clampedX = Math.max(0, Math.min(1, xNorm));
  const idx = Math.max(0, ribbonIndex);

  const baseAnchors = [0.22, 0.38, 0.54, 0.71, 0.85];
  const baseY = baseAnchors[idx % baseAnchors.length];

  const speed = 0.22 + (idx % 3) * 0.045;
  const phase = idx * 1.35 + timeSec * speed;

  // Multi-harmonic organic wave displacement
  const primaryWave = Math.sin(clampedX * Math.PI * 2.1 + phase) * (0.065 + (idx % 2) * 0.018);
  const secondaryWave =
    Math.cos(clampedX * Math.PI * 3.4 - phase * 0.72 + idx) * 0.028;
  const tertiaryWave =
    Math.sin(clampedX * Math.PI * 1.1 + timeSec * 0.14 + idx * 2.1) * 0.022;

  const centerYNorm = baseY + primaryWave + secondaryWave + tertiaryWave;

  // 3D ribbon twist / torsion modulates apparent ribbon thickness smoothly
  const twistWave = Math.cos(clampedX * Math.PI * 2.6 + phase * 0.85 + idx * 0.9);
  const baseHalfWidth = 0.026 + (idx % 3) * 0.009;
  const halfWidthNorm = Math.max(0.004, baseHalfWidth * (0.58 + 0.42 * twistWave));

  // Analytical derivative dy/dx for normal & specular highlight computation
  const dPrimary =
    Math.cos(clampedX * Math.PI * 2.1 + phase) *
    (Math.PI * 2.1) *
    (0.065 + (idx % 2) * 0.018);
  const dSecondary =
    -Math.sin(clampedX * Math.PI * 3.4 - phase * 0.72 + idx) *
    (Math.PI * 3.4) *
    0.028;
  const slope = dPrimary + dSecondary;

  // Specular intensity peaks when the ribbon catches the overhead angled studio light
  const lightAngleMatch = Math.cos(slope * 1.8 - 0.35 + Math.sin(timeSec * 0.3 + idx) * 0.25);
  const specularIntensity = Number(
    Math.max(0.08, Math.min(1, Math.pow((lightAngleMatch + 1) * 0.5, 2.2))).toFixed(4)
  );

  return {
    centerYNorm: Number(centerYNorm.toFixed(5)),
    halfWidthNorm: Number(halfWidthNorm.toFixed(5)),
    slope: Number(slope.toFixed(5)),
    specularIntensity,
  };
}

/**
 * Determines whether the current hostname is the portfolio owner's development/builder environment.
 * Returns true ONLY for the AI Studio Builder preview (`ais-dev-*`) or local development (`localhost` / `127.0.0.1`).
 * Returns false for shared preview links (`ais-pre-*`), deployed Cloud Run URLs, and all public visitor domains.
 */
export function isDevHostEnvironment(hostname: string): boolean {
  const cleanHost = (hostname || '').trim().toLowerCase();
  if (!cleanHost) return false;
  return (
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost.startsWith('ais-dev-')
  );
}

/**
 * Determines whether the current session has owner edit/upload privileges.
 * External visitors on shared or deployed URLs NEVER have edit access (even if query params are added).
 * The owner in the dev environment has edit access by default, and can pass `?view=public`,
 * `?view=visitor`, or `?readonly=1` to preview the exact read-only visitor experience.
 */
export function isOwnerEditEnvironment(hostname: string, search: string = ''): boolean {
  if (!isDevHostEnvironment(hostname)) {
    return false;
  }
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const viewMode = (params.get('view') || '').toLowerCase();
  const readOnlyFlag = (params.get('readonly') || '').toLowerCase();
  if (
    viewMode === 'public' ||
    viewMode === 'visitor' ||
    readOnlyFlag === '1' ||
    readOnlyFlag === 'true'
  ) {
    return false;
  }
  return true;
}
