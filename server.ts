import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_STATE_PATH = path.resolve(__dirname, 'public', 'portfolio-published-state.json');
const SRC_STATE_PATH = path.resolve(__dirname, 'src', 'data', 'publishedPortfolioState.json');
const DIST_STATE_PATH = path.resolve(__dirname, 'dist', 'portfolio-published-state.json');
const RUNTIME_BACKUP_STATE_PATH = path.resolve(
  __dirname,
  'public',
  'assets',
  'portfolio',
  'portfolio-state-backup.json'
);

const PUBLIC_ASSETS_DIR = path.resolve(__dirname, 'public', 'assets', 'portfolio');
const DIST_ASSETS_DIR = path.resolve(__dirname, 'dist', 'assets', 'portfolio');

interface PublishedPortfolioState {
  heroPortraitUrl?: string;
  marqueeOverrides?: Record<string, string>;
  identityProfile?: Record<string, unknown>;
  projectImagesOverrides?: Record<string, Record<string, string>>;
  projectDocs?: Record<string, Record<string, unknown>>;
}

const DEFAULT_IDENTITY_TEXT: Record<string, string> = {
  fullName: 'HARSHITA ARYA',
  role: 'NIFT SHILLONG (FASHION DESIGN)',
  badgeId: 'BATCH 2023-2027',
  location: 'india/shillong',
  specialty: 'fashion designer [nift]',
  email: 'harshita.fashion2917@gmail.com',
  customHeading: 'CREATIVE MANIFEST0',
  customBodyText:
    'I believe fashion is more than the creation of garments; it is a language of expression, identity, and individuality. My design philosophy revolves around the balance between creativity, craftsmanship, and functionality. I find inspiration in art, culture, nature, and the constantly evolving world around me, translating observations into distinctive visual narratives. I approach every design with curiosity and an experimental mindset, exploring silhouettes, textures, fabric manipulation, and construction techniques. I believe in challenging conventional boundaries while respecting the fundamentals of design. My vision is to create meaningful, expressive, and thoughtfully constructed designs that communicate individuality and leave a lasting impression.',
  skillsHeading: 'SKILLS',
};

const DEFAULT_PROJECT_DOCS_TEXT: Record<string, Record<string, string>> = {
  '01': {
    subtitle: "CASUAL MEN'S WEAR",
    timeline: 'ss 2026',
    role: 'LEAD FASHION DESIGNER & 3D CREATIVE DIRECTOR',
    toolsAndMediums: 'DENIM, PATCH WORK',
    deliverables:
      '12 COUTURE SILHOUETTES, SCULPTURAL FACE JEWELRY, 3D DIGITAL LOOKBOOK & SHOWROOM INSTALLATION',
    overview:
      'Chehre is a contemporary men\'s wear fashion collection that explores identity, individuality, and self-expression through clothing. Inspired by the many faces, emotions, and stories that shape who we are, the brand blends creativity with thoughtful design to create pieces that reflect personal style and inner character. Chehre celebrates the idea that fashion is more than appearance—it is a reflection of personality, culture, and the unique stories we carry. Chehre" is a menswear fashion collection inspired by the many faces a man embodies in his everyday life. A face is not just a physical identity-it reflects emotions, roles, and hidden layers of personality. In a constantly evolving world, individuals shift between different "chehre" depending on situations, expectations, and inner states. This collection explores these transitions and the duality between the seen and the unseen self and focusing on the use of waste fabric scraps to craft intricate and expressive faces, visually engaging fabric patchwork that portray a range of human emotions and characteristics and the "ART OF SELF LOVE".',
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
  },
  '04': {
    subtitle: 'evening gown',
    timeline: 'ss 2027',
    role: 'FASHION DESIGNER & 3D MOTION SPECIALIST',
    toolsAndMediums: 'satin and tulle',
    deliverables: '10 KINETIC GARMENTS, 3D CLOTH SIMULATION ARCHIVE & EDITORIAL LOOKBOOK',
    overview:
      'Inspired by the magical beauty of a secret garden,\nEnchanted Garden captures the harmony between nature\nand elegance. The collection draws inspiration from\ndelicate leaves, blooming flowers, morning dew, and\ngolden sunlight filtering through lush greenery. Soft\nsage-green tones and lustrous satin reflect the\nfreshness of nature, while structured corsetry and\nflowing silhouettes represent the balance between\nstrength and feminini.\n\nWhere emerald leaves meet morning dew,\nAnd golden sunlight dances through,\nA gown of grace, in sage-green hue,\nBlooms like a dream, serene and true.\nSoft petals sway, the wildflowers sing,\nWhile satin flows like the breath of spring.\nA secret garden, a world unseen,\nWhere elegance whispers in shades of green.',
  },
  '05': {
    subtitle: "women's wear",
    timeline: 'ss 2027',
    role: 'LEAD TEXTILE & 3D GARMENT DESIGNER',
    toolsAndMediums: 'cotton,  batik technique',
    deliverables: 'BESPOKE CAPSULE COLLECTION, DIGITAL TWIN ARCHIVE & SHOWROOM EXHIBITION',
    overview:
      'Deep Under the Sea explores the fascinating and mysterious world hidden beneath the ocean’s surface. It is a journey into the depths of the sea, where every movement, colour, and living creature tells a unique story. The concept focuses on discovering the extraordinary marine ecosystem and understanding how different species coexist, interact, and survive together in their natural habitat. From vibrant coral reefs and delicate underwater plants to exotic fish and fascinating sea creatures, the underwater world is filled with endless wonders waiting to be explored. Beneath the calm and silent waters lies a lively universe full of colours, textures, patterns, and movement. This concept celebrates the beauty of marine life, the diversity of underwater species, and the magical relationship between nature and its surroundings. It invites us to look beyond the surface and discover a world that is mysterious, peaceful, vibrant, and full of life.',
  },
};

const LEGACY_TEMPLATE_PROJECT_DOCS_TEXT: Record<string, Record<string, string[]>> = {
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

function isLegacyOrStaleProjectText(
  projectNumber: string,
  field: string,
  value: unknown
): boolean {
  if (!value || typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  const legacyList = LEGACY_TEMPLATE_PROJECT_DOCS_TEXT[projectNumber]?.[field];
  if (!legacyList) return false;
  return legacyList.some((legacyStr) => legacyStr.trim() === trimmed);
}

function pickBestTextField(
  existingVal: unknown,
  incomingVal: unknown,
  defaultVal: string = '',
  forceReset = false
): string {
  const existingStr = typeof existingVal === 'string' ? existingVal : '';
  const incomingStr = typeof incomingVal === 'string' ? incomingVal : '';

  if (forceReset) {
    return incomingStr || existingStr || defaultVal;
  }
  if (!incomingStr.trim()) {
    return existingStr || defaultVal;
  }
  return incomingStr;
}

function pickBestProjectTextField(
  projectNumber: string,
  field: string,
  existingVal: unknown,
  incomingVal: unknown,
  defaultVal: string = '',
  forceReset = false
): string {
  const existingStr =
    typeof existingVal === 'string' && !isLegacyOrStaleProjectText(projectNumber, field, existingVal)
      ? existingVal
      : '';
  const incomingStr =
    typeof incomingVal === 'string' && !isLegacyOrStaleProjectText(projectNumber, field, incomingVal)
      ? incomingVal
      : '';

  if (forceReset) {
    return incomingStr || existingStr || defaultVal;
  }
  if (!incomingStr.trim()) {
    return existingStr || defaultVal;
  }
  return incomingStr;
}

/**
 * Scans public/assets/portfolio/ for all valid custom hashed files (<slotKey>-<hash8>.<ext>)
 * and returns a map of slotKey -> "/assets/portfolio/<filename>" (picking the newest file if multiple exist).
 */
function discoverHashedAssetsOnDisk(): Record<string, string> {
  const slotToBestFile: Record<string, { path: string; mtimeMs: number }> = {};
  try {
    if (!fs.existsSync(PUBLIC_ASSETS_DIR)) return {};
    const files = fs.readdirSync(PUBLIC_ASSETS_DIR);
    for (const file of files) {
      const match = file.match(/^([a-zA-Z0-9_-]+)-([0-9a-f]{8})\.([a-z0-9]+)$/i);
      if (!match) continue;
      const [, slotKey, hash8] = match;
      if (hash8.toLowerCase() === 'da39a3ee') continue;

      const fullPath = path.join(PUBLIC_ASSETS_DIR, file);
      try {
        const stat = fs.statSync(fullPath);
        if (!stat.isFile() || stat.size < 64) continue;
        const assetUrl = `/assets/portfolio/${file}`;
        const prev = slotToBestFile[slotKey];
        if (!prev || stat.mtimeMs >= prev.mtimeMs) {
          slotToBestFile[slotKey] = { path: assetUrl, mtimeMs: stat.mtimeMs };
        }
      } catch {
        // Ignore stat error
      }
    }
  } catch {
    // Ignore read error
  }

  const result: Record<string, string> = {};
  for (const [slotKey, info] of Object.entries(slotToBestFile)) {
    result[slotKey] = info.path;
  }
  return result;
}

function reconcileStateWithDiskAssets(
  baseState: PublishedPortfolioState
): PublishedPortfolioState {
  const diskAssets = discoverHashedAssetsOnDisk();
  const next: PublishedPortfolioState = { ...baseState };

  if (diskAssets['hero-portrait']) {
    next.heroPortraitUrl = pickBestAssetPath(
      next.heroPortraitUrl,
      diskAssets['hero-portrait']
    );
  }

  const nextIdentity: Record<string, unknown> = { ...(next.identityProfile || {}) };
  if (diskAssets['identity-photo']) {
    nextIdentity.photoUrl = pickBestAssetPath(
      nextIdentity.photoUrl,
      diskAssets['identity-photo']
    );
  }
  if (diskAssets['identity-skills']) {
    nextIdentity.manifestoImageUrl = pickBestAssetPath(
      nextIdentity.manifestoImageUrl,
      diskAssets['identity-skills']
    );
  }
  if (Object.keys(nextIdentity).length > 0) {
    next.identityProfile = nextIdentity;
  }

  const nextMarquee: Record<string, string> = { ...(next.marqueeOverrides || {}) };
  for (let i = 0; i <= 20; i++) {
    const slotKey = `marquee-slot-${i}`;
    if (diskAssets[slotKey]) {
      nextMarquee[String(i)] = pickBestAssetPath(
        nextMarquee[String(i)],
        diskAssets[slotKey]
      );
    }
  }
  if (Object.keys(nextMarquee).length > 0) {
    next.marqueeOverrides = nextMarquee;
  }

  const nextProjects: Record<string, Record<string, string>> = {
    ...(next.projectImagesOverrides || {}),
  };
  const nextDocs: Record<string, Record<string, unknown>> = {
    ...(next.projectDocs || {}),
  };

  for (const projNum of ['01', '02', '03', '04', '05']) {
    const projSlots: Record<string, string> = { ...(nextProjects[projNum] || {}) };
    for (const colSlot of ['col1Image1', 'col1Image2', 'col2Image']) {
      const slotKey = `project-${projNum}-${colSlot}`;
      if (diskAssets[slotKey]) {
        projSlots[colSlot] = pickBestAssetPath(projSlots[colSlot], diskAssets[slotKey]);
      }
    }
    if (Object.keys(projSlots).length > 0) {
      nextProjects[projNum] = projSlots;
    }

    const docSlots: Record<string, unknown> = { ...(nextDocs[projNum] || {}) };
    const defaultsForProj = DEFAULT_PROJECT_DOCS_TEXT[projNum] || {};
    for (const [field, defVal] of Object.entries(defaultsForProj)) {
      docSlots[field] = pickBestProjectTextField(
        projNum,
        field,
        docSlots[field],
        docSlots[field],
        defVal
      );
    }
    if (typeof docSlots.technicalDocumentation !== 'string') {
      docSlots.technicalDocumentation = '';
    }
    if (typeof docSlots.outcomeAndNotes !== 'string') {
      docSlots.outcomeAndNotes = '';
    }
    for (const docSlot of ['docImage1', 'docImage2', 'docImage3']) {
      const slotKey = `project-${projNum}-${docSlot}`;
      if (diskAssets[slotKey]) {
        docSlots[docSlot] = pickBestAssetPath(docSlots[docSlot], diskAssets[slotKey]);
      } else if (typeof docSlots[docSlot] !== 'string') {
        docSlots[docSlot] = '';
      }
    }
    if (Object.keys(docSlots).length > 0) {
      nextDocs[projNum] = docSlots;
    }
  }

  next.projectImagesOverrides = nextProjects;
  next.projectDocs = nextDocs;
  return next;
}

function mergeTwoPublishedStates(
  base: PublishedPortfolioState,
  incoming: PublishedPortfolioState
): PublishedPortfolioState {
  const merged: PublishedPortfolioState = { ...base };

  if (incoming.heroPortraitUrl) {
    merged.heroPortraitUrl = pickBestAssetPath(
      base.heroPortraitUrl,
      incoming.heroPortraitUrl
    );
  }

  if (incoming.marqueeOverrides) {
    const nextMarquee: Record<string, string> = { ...(base.marqueeOverrides || {}) };
    for (const [k, v] of Object.entries(incoming.marqueeOverrides)) {
      nextMarquee[k] = pickBestAssetPath(nextMarquee[k], v);
    }
    merged.marqueeOverrides = nextMarquee;
  }

  if (incoming.identityProfile) {
    const prevId = (base.identityProfile || {}) as Record<string, unknown>;
    const incId = incoming.identityProfile;
    const nextId: Record<string, unknown> = { ...prevId, ...incId };
    for (const [field, defVal] of Object.entries(DEFAULT_IDENTITY_TEXT)) {
      if (field in prevId || field in incId) {
        nextId[field] = pickBestTextField(prevId[field], incId[field], defVal);
      }
    }
    nextId.photoUrl = pickBestAssetPath(prevId.photoUrl, incId.photoUrl);
    nextId.manifestoImageUrl = pickBestAssetPath(
      prevId.manifestoImageUrl,
      incId.manifestoImageUrl
    );
    merged.identityProfile = nextId;
  }

  if (incoming.projectImagesOverrides) {
    const nextProj: Record<string, Record<string, string>> = {
      ...(base.projectImagesOverrides || {}),
    };
    for (const [projNum, slots] of Object.entries(incoming.projectImagesOverrides)) {
      const prevSlots = nextProj[projNum] || {};
      const mergedSlots: Record<string, string> = { ...prevSlots };
      for (const [slotName, url] of Object.entries(slots || {})) {
        mergedSlots[slotName] = pickBestAssetPath(prevSlots[slotName], url);
      }
      nextProj[projNum] = mergedSlots;
    }
    merged.projectImagesOverrides = nextProj;
  }

  if (incoming.projectDocs) {
    const nextDocs: Record<string, Record<string, unknown>> = {
      ...(base.projectDocs || {}),
    };
    for (const [projNum, docObj] of Object.entries(incoming.projectDocs)) {
      const prevDoc = nextDocs[projNum] || {};
      const mergedDoc: Record<string, unknown> = { ...prevDoc, ...docObj };
      const defaultsForProj = DEFAULT_PROJECT_DOCS_TEXT[projNum] || {};
      for (const [field, defVal] of Object.entries(defaultsForProj)) {
        if (field in prevDoc || field in docObj) {
          mergedDoc[field] = pickBestProjectTextField(
            projNum,
            field,
            prevDoc[field],
            docObj[field],
            defVal
          );
        }
      }
      for (const imgField of ['docImage1', 'docImage2', 'docImage3']) {
        mergedDoc[imgField] = pickBestAssetPath(prevDoc[imgField], docObj[imgField]);
      }
      nextDocs[projNum] = mergedDoc;
    }
    merged.projectDocs = nextDocs;
  }

  return merged;
}

function readPublishedState(): PublishedPortfolioState {
  const candidates = [
    PUBLIC_STATE_PATH,
    SRC_STATE_PATH,
    RUNTIME_BACKUP_STATE_PATH,
    DIST_STATE_PATH,
  ];
  let combined: PublishedPortfolioState = {};
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        if (raw && raw.trim()) {
          const parsed = JSON.parse(raw) as PublishedPortfolioState;
          combined = mergeTwoPublishedStates(combined, parsed);
        }
      }
    } catch {
      // Continue to next candidate
    }
  }
  return reconcileStateWithDiskAssets(combined);
}

function writePublishedState(nextState: PublishedPortfolioState): void {
  const reconciled = reconcileStateWithDiskAssets(nextState);
  const serialized = JSON.stringify(reconciled, null, 2) + '\n';

  for (const targetPath of [
    PUBLIC_STATE_PATH,
    SRC_STATE_PATH,
    RUNTIME_BACKUP_STATE_PATH,
  ]) {
    try {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(targetPath, serialized, 'utf-8');
    } catch {
      // Ignore write error if read-only in production container
    }
  }

  const distDir = path.dirname(DIST_STATE_PATH);
  if (fs.existsSync(distDir)) {
    try {
      fs.writeFileSync(DIST_STATE_PATH, serialized, 'utf-8');
    } catch {
      // Ignore dist write error if read-only in container
    }
  }
}

function isRequestFromOwnerDevEnv(req: express.Request): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  const forwardedHost = (req.headers['x-forwarded-host'] as string) || '';
  const hostHeader = req.headers.host || '';
  const originHeader = req.headers.origin || '';
  const refererHeader = req.headers.referer || '';
  const clientHostHeader = (req.headers['x-portfolio-client-host'] as string) || '';

  const combined =
    `${forwardedHost} ${hostHeader} ${originHeader} ${refererHeader} ${clientHostHeader}`.toLowerCase();

  // Strictly block shared preview host (ais-pre-*)
  if (combined.includes('ais-pre-')) {
    return false;
  }

  // In non-production dev server (AI Studio Builder & local dev), allow owner writes
  return true;
}

function getExtensionFromMime(mimeType: string): string {
  const clean = (mimeType || '').toLowerCase().trim();
  if (clean.includes('png')) return 'png';
  if (clean.includes('webp')) return 'webp';
  if (clean.includes('gif')) return 'gif';
  if (clean.includes('svg')) return 'svg';
  if (clean.includes('avif')) return 'avif';
  return 'jpg';
}

function sanitizeSlotKey(rawSlotKey: string): string {
  return rawSlotKey.replace(/[^a-zA-Z0-9_-]/g, '');
}

function isCorruptedAssetPath(val: unknown): boolean {
  if (typeof val !== 'string') return true;
  const trimmed = val.trim();
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
  if (trimmed.startsWith('/assets/portfolio/')) {
    const diskPath = path.join(PUBLIC_ASSETS_DIR, path.basename(trimmed));
    try {
      if (!fs.existsSync(diskPath) || fs.statSync(diskPath).size < 64) {
        return true;
      }
    } catch {
      return true;
    }
  }
  return false;
}

function cleanupCorruptedAssetsOnDisk(): void {
  try {
    if (!fs.existsSync(PUBLIC_ASSETS_DIR)) return;
    const files = fs.readdirSync(PUBLIC_ASSETS_DIR);
    for (const file of files) {
      const fullPath = path.join(PUBLIC_ASSETS_DIR, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile() && (stat.size < 64 || file.includes('-da39a3ee.'))) {
          fs.unlinkSync(fullPath);
        }
      } catch {
        // Ignore individual file errors
      }
    }
  } catch {
    // Ignore directory read errors
  }
}

/**
 * Decodes a base64 payload (or full data:image/... URL), writes it as a permanent file
 * in public/assets/portfolio/, and returns its local "/assets/portfolio/..." path.
 */
function saveBinaryAssetToPublic(
  slotKey: string,
  buffer: Buffer,
  ext: string
): string {
  if (!buffer || buffer.length < 64) {
    throw new Error('Refusing to write empty or corrupted image buffer');
  }
  const safeSlot = sanitizeSlotKey(slotKey) || 'portfolio-asset';
  const hash8 = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 8);
  if (hash8 === 'da39a3ee') {
    throw new Error('Refusing to write empty SHA-1 image buffer');
  }
  const hashedFilename = `${safeSlot}-${hash8}.${ext}`;
  const canonicalFilename = `${safeSlot}.${ext}`;

  if (!fs.existsSync(PUBLIC_ASSETS_DIR)) {
    fs.mkdirSync(PUBLIC_ASSETS_DIR, { recursive: true });
  }

  // Remove any older hashed files for this same slotKey so repository stays clean
  try {
    const existingFiles = fs.readdirSync(PUBLIC_ASSETS_DIR);
    for (const file of existingFiles) {
      if (file.startsWith(`${safeSlot}-`) && file !== hashedFilename) {
        try {
          fs.unlinkSync(path.join(PUBLIC_ASSETS_DIR, file));
        } catch {
          // Ignore
        }
      }
    }
  } catch {
    // Ignore
  }

  fs.writeFileSync(path.join(PUBLIC_ASSETS_DIR, hashedFilename), buffer);
  fs.writeFileSync(path.join(PUBLIC_ASSETS_DIR, canonicalFilename), buffer);

  if (fs.existsSync(path.resolve(__dirname, 'dist'))) {
    try {
      if (!fs.existsSync(DIST_ASSETS_DIR)) {
        fs.mkdirSync(DIST_ASSETS_DIR, { recursive: true });
      }
      fs.writeFileSync(path.join(DIST_ASSETS_DIR, hashedFilename), buffer);
      fs.writeFileSync(path.join(DIST_ASSETS_DIR, canonicalFilename), buffer);
    } catch {
      // Ignore dist write error
    }
  }

  return `/assets/portfolio/${hashedFilename}`;
}

function saveDataUrlToPublic(slotKey: string, dataUrl: string): string {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return dataUrl;

  const header = dataUrl.slice(0, commaIdx);
  const payload = dataUrl.slice(commaIdx + 1);
  const mimeMatch = header.match(/^data:(image\/[a-zA-Z0-9.+-]+)/i);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const ext = getExtensionFromMime(mimeType);

  const buf = header.includes(';base64')
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload), 'utf-8');

  if (!buf || buf.length < 64) {
    return '';
  }
  return saveBinaryAssetToPublic(slotKey, buf, ext);
}

function isHashedCustomLocalPath(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  if (isCorruptedAssetPath(val)) return false;
  if (!/^\/assets\/portfolio\/[a-zA-Z0-9_-]+-[0-9a-f]{8}\.[a-z0-9]+$/i.test(val)) {
    return false;
  }
  const diskPath = path.join(PUBLIC_ASSETS_DIR, path.basename(val));
  try {
    return fs.existsSync(diskPath) && fs.statSync(diskPath).size >= 64;
  } catch {
    return false;
  }
}

function isDefaultUnhashedLocalPath(val: unknown): boolean {
  return (
    typeof val === 'string' &&
    val.startsWith('/assets/portfolio/') &&
    !isHashedCustomLocalPath(val)
  );
}

/**
 * Prevents a default unhashed asset path (from a fresh browser or test session)
 * from overwriting a custom uploaded hashed asset path already saved on the server.
 */
function pickBestAssetPath(
  existingVal: unknown,
  incomingVal: unknown,
  forceReset = false
): string {
  const existingStr =
    typeof existingVal === 'string' && !isCorruptedAssetPath(existingVal)
      ? existingVal.trim()
      : '';
  const incomingStr =
    typeof incomingVal === 'string' && !isCorruptedAssetPath(incomingVal)
      ? incomingVal.trim()
      : '';

  if (forceReset) {
    return incomingStr || existingStr;
  }
  if (!incomingStr) {
    return existingStr;
  }
  if (isHashedCustomLocalPath(existingStr) && isDefaultUnhashedLocalPath(incomingStr)) {
    return existingStr;
  }
  return incomingStr;
}

function applySlotAssetToPublishedState(slotKey: string, assetPath: string): void {
  if (!assetPath || isCorruptedAssetPath(assetPath)) {
    return;
  }
  const current = readPublishedState();
  const updated: PublishedPortfolioState = { ...current };

  if (slotKey === 'hero-portrait') {
    updated.heroPortraitUrl = assetPath;
  } else if (slotKey === 'identity-photo') {
    updated.identityProfile = {
      ...(current.identityProfile || {}),
      photoUrl: assetPath,
    };
  } else if (slotKey === 'identity-skills') {
    updated.identityProfile = {
      ...(current.identityProfile || {}),
      manifestoImageUrl: assetPath,
    };
  } else if (slotKey.startsWith('marquee-slot-')) {
    const idx = slotKey.replace('marquee-slot-', '');
    updated.marqueeOverrides = {
      ...(current.marqueeOverrides || {}),
      [idx]: assetPath,
    };
  } else {
    const projCardMatch = slotKey.match(/^project-(0[1-5])-(col1Image1|col1Image2|col2Image)$/);
    if (projCardMatch) {
      const [, projNum, colSlot] = projCardMatch;
      const mergedProjects: Record<string, Record<string, string>> = {
        ...(current.projectImagesOverrides || {}),
      };
      mergedProjects[projNum] = {
        ...(mergedProjects[projNum] || {}),
        [colSlot]: assetPath,
      };
      updated.projectImagesOverrides = mergedProjects;
    } else {
      const projDocMatch = slotKey.match(/^project-(0[1-5])-(docImage1|docImage2|docImage3)$/);
      if (projDocMatch) {
        const [, projNum, docSlot] = projDocMatch;
        const mergedDocs: Record<string, Record<string, unknown>> = {
          ...(current.projectDocs || {}),
        };
        mergedDocs[projNum] = {
          ...(mergedDocs[projNum] || {}),
          [docSlot]: assetPath,
        };
        updated.projectDocs = mergedDocs;
      }
    }
  }

  writePublishedState(updated);
}

async function startServer() {
  cleanupCorruptedAssetsOnDisk();
  // Immediately synchronize published state files with all custom hashed assets on disk
  writePublishedState(readPublishedState());

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Support large uncompressed full-resolution portfolio images
  app.use(express.json({ limit: '250mb' }));

  app.get('/api/portfolio-state', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(readPublishedState());
  });

  // Chunked per-image upload endpoint so large base64 images in IndexedDB are materialized
  // into physical files under /public/assets/portfolio/ without hitting proxy body limits
  app.post('/api/portfolio-upload-asset', (req, res) => {
    if (!isRequestFromOwnerDevEnv(req)) {
      res.status(403).json({
        error: 'Portfolio is in read-only viewer mode. Only the owner can upload assets.',
      });
      return;
    }

    const {
      uploadId,
      slotKey,
      mimeType = 'image/jpeg',
      chunkIndex = 0,
      totalChunks = 1,
      chunkData,
      chunk,
    } = (req.body || {}) as {
      uploadId?: string;
      slotKey?: string;
      mimeType?: string;
      chunkIndex?: number;
      totalChunks?: number;
      chunkData?: string;
      chunk?: string;
    };

    const rawChunk =
      typeof chunkData === 'string' && chunkData.length > 0
        ? chunkData
        : typeof chunk === 'string'
          ? chunk
          : '';

    if (!slotKey || !rawChunk) {
      res.status(400).json({ error: 'Missing slotKey or non-empty image chunk data' });
      return;
    }

    const safeSlot = sanitizeSlotKey(slotKey);
    const safeUploadId = sanitizeSlotKey(uploadId || slotKey) || safeSlot;
    const tmpFile = path.join(os.tmpdir(), `portfolio-upload-${safeUploadId}.b64`);

    try {
      if (chunkIndex === 0) {
        fs.writeFileSync(tmpFile, rawChunk, 'utf-8');
      } else {
        fs.appendFileSync(tmpFile, rawChunk, 'utf-8');
      }

      if (chunkIndex + 1 < totalChunks) {
        res.json({ ok: true, partial: true, chunkIndex });
        return;
      }

      const assembled = fs.readFileSync(tmpFile, 'utf-8');
      try {
        fs.unlinkSync(tmpFile);
      } catch {
        // Ignore
      }

      let resolvedMime = mimeType;
      let base64Payload = assembled;

      if (assembled.startsWith('data:image/')) {
        const commaIdx = assembled.indexOf(',');
        if (commaIdx !== -1) {
          const header = assembled.slice(0, commaIdx);
          base64Payload = assembled.slice(commaIdx + 1);
          const mimeMatch = header.match(/^data:(image\/[a-zA-Z0-9.+-]+)/i);
          if (mimeMatch) {
            resolvedMime = mimeMatch[1];
          }
        }
      }

      const buffer = Buffer.from(base64Payload, 'base64');
      if (!buffer || buffer.length < 64) {
        res.status(400).json({ error: 'Decoded image buffer is empty or corrupted' });
        return;
      }

      const ext = getExtensionFromMime(resolvedMime);
      const assetPath = saveBinaryAssetToPublic(safeSlot, buffer, ext);
      applySlotAssetToPublishedState(safeSlot, assetPath);

      res.json({ ok: true, assetPath });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to write asset',
      });
    }
  });

  app.post('/api/portfolio-state', (req, res) => {
    if (!isRequestFromOwnerDevEnv(req)) {
      res.status(403).json({
        error: 'Portfolio is in read-only viewer mode. Only the owner can make changes.',
      });
      return;
    }

    const patch = (req.body || {}) as Partial<PublishedPortfolioState>;
    const current = readPublishedState();

    const updated: PublishedPortfolioState = {
      ...current,
    };

    if (typeof patch.heroPortraitUrl === 'string' && patch.heroPortraitUrl.trim()) {
      const materialized = patch.heroPortraitUrl.startsWith('data:image/')
        ? saveDataUrlToPublic('hero-portrait', patch.heroPortraitUrl)
        : patch.heroPortraitUrl;
      updated.heroPortraitUrl = pickBestAssetPath(current.heroPortraitUrl, materialized);
    }

    if (patch.marqueeOverrides && typeof patch.marqueeOverrides === 'object') {
      const nextMarquee: Record<string, string> = {
        ...(current.marqueeOverrides || {}),
      };
      for (const [idxKey, rawVal] of Object.entries(patch.marqueeOverrides)) {
        if (typeof rawVal === 'string' && rawVal.trim()) {
          const materialized = rawVal.startsWith('data:image/')
            ? saveDataUrlToPublic(`marquee-slot-${idxKey}`, rawVal)
            : rawVal;
          nextMarquee[idxKey] = pickBestAssetPath(nextMarquee[idxKey], materialized);
        }
      }
      updated.marqueeOverrides = nextMarquee;
    }

    if (patch.identityProfile && typeof patch.identityProfile === 'object') {
      const prevIdentity = (current.identityProfile || {}) as Record<string, unknown>;
      const incIdentity = patch.identityProfile as Record<string, unknown>;
      const nextIdentity: Record<string, unknown> = {
        ...prevIdentity,
        ...incIdentity,
      };

      for (const [field, defVal] of Object.entries(DEFAULT_IDENTITY_TEXT)) {
        if (field in prevIdentity || field in incIdentity) {
          nextIdentity[field] = pickBestTextField(
            prevIdentity[field],
            incIdentity[field],
            defVal
          );
        }
      }

      if (typeof nextIdentity.photoUrl === 'string' && nextIdentity.photoUrl.startsWith('data:image/')) {
        nextIdentity.photoUrl = saveDataUrlToPublic('identity-photo', nextIdentity.photoUrl);
      }
      nextIdentity.photoUrl = pickBestAssetPath(prevIdentity.photoUrl, nextIdentity.photoUrl);

      if (
        typeof nextIdentity.manifestoImageUrl === 'string' &&
        nextIdentity.manifestoImageUrl.startsWith('data:image/')
      ) {
        nextIdentity.manifestoImageUrl = saveDataUrlToPublic(
          'identity-skills',
          nextIdentity.manifestoImageUrl
        );
      }
      nextIdentity.manifestoImageUrl = pickBestAssetPath(
        prevIdentity.manifestoImageUrl,
        nextIdentity.manifestoImageUrl
      );

      updated.identityProfile = nextIdentity;
    }

    if (patch.projectImagesOverrides && typeof patch.projectImagesOverrides === 'object') {
      const mergedProjects: Record<string, Record<string, string>> = {
        ...(current.projectImagesOverrides || {}),
      };
      for (const [projNum, slots] of Object.entries(patch.projectImagesOverrides)) {
        if (slots && typeof slots === 'object') {
          const prevSlots = mergedProjects[projNum] || {};
          const nextSlots: Record<string, string> = { ...prevSlots };
          for (const [slotName, rawUrl] of Object.entries(slots)) {
            if (typeof rawUrl === 'string' && rawUrl.trim()) {
              const materialized = rawUrl.startsWith('data:image/')
                ? saveDataUrlToPublic(`project-${projNum}-${slotName}`, rawUrl)
                : rawUrl;
              nextSlots[slotName] = pickBestAssetPath(prevSlots[slotName], materialized);
            }
          }
          mergedProjects[projNum] = nextSlots;
        }
      }
      updated.projectImagesOverrides = mergedProjects;
    }

    if (patch.projectDocs && typeof patch.projectDocs === 'object') {
      const mergedDocs: Record<string, Record<string, unknown>> = {
        ...(current.projectDocs || {}),
      };
      for (const [projNum, docPatch] of Object.entries(patch.projectDocs)) {
        if (docPatch && typeof docPatch === 'object') {
          const prevDoc = mergedDocs[projNum] || {};
          const incDoc = docPatch as Record<string, unknown>;
          const forceReset = Boolean(incDoc.__forceReset);
          const nextDoc: Record<string, unknown> = { ...prevDoc, ...incDoc };

          const defaultsForProj = DEFAULT_PROJECT_DOCS_TEXT[projNum] || {};
          for (const [field, defVal] of Object.entries(defaultsForProj)) {
            if (field in prevDoc || field in incDoc) {
              nextDoc[field] = pickBestProjectTextField(
                projNum,
                field,
                prevDoc[field],
                incDoc[field],
                defVal,
                forceReset
              );
            }
          }

          for (const imgField of ['docImage1', 'docImage2', 'docImage3']) {
            const rawImg = nextDoc[imgField];
            const materialized =
              typeof rawImg === 'string' && rawImg.startsWith('data:image/')
                ? saveDataUrlToPublic(`project-${projNum}-${imgField}`, rawImg)
                : rawImg;
            nextDoc[imgField] = pickBestAssetPath(prevDoc[imgField], materialized, forceReset);
          }

          delete nextDoc.__forceReset;
          mergedDocs[projNum] = nextDoc;
        }
      }
      updated.projectDocs = mergedDocs;
    }

    writePublishedState(updated);
    res.json({ ok: true, state: updated });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            '**/public/portfolio-published-state.json',
            '**/public/assets/portfolio/**',
            '**/src/data/publishedPortfolioState.json',
            '**/dist/**',
          ],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    const publicPath = path.join(__dirname, 'public');
    app.use(express.static(distPath));
    app.use(express.static(publicPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
