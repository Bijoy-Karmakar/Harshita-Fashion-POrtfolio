import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMarqueeOffset,
  calculateMarqueeTransforms,
  calculateMagnetOffset,
  calculateCharacterOpacityRange,
  calculateCardTargetScale,
  calculateCardTopOffset,
  formatBadgeSerial,
  getLanyardPendulumConfig,
  getDefaultProjectDocumentation,
  PROJECT_1_PORTRAIT_DIMENSIONS,
  PROJECT_2_PORTRAIT_DIMENSIONS,
  PROJECT_3_PORTRAIT_DIMENSIONS,
  PROJECT_4_PORTRAIT_DIMENSIONS,
  PROJECT_5_PORTRAIT_DIMENSIONS,
  getProjectPortraitAspectRatio,
  HARSHITA_GMAIL,
  buildGmailComposeUrl,
  calculateHeadingCharDelay,
  computeLiquidRibbonSample,
  isDevHostEnvironment,
  isOwnerEditEnvironment,
  normalizeLegacyAssetUrl,
  isCustomUploadedAsset,
  isCorruptedOrDeletedAssetUrl,
} from './portfolioMath';
import { mergeProjectDocsRecord, mergeMarqueeImages } from './persistentStorage';

test('calculateMarqueeOffset computes (scrollY - sectionTop + innerHeight) * 0.3', () => {
  const offset = calculateMarqueeOffset(500, 800, 1000);
  // (500 - 800 + 1000) * 0.3 = 700 * 0.3 = 210
  assert.equal(offset, 210);
});

test('calculateMarqueeTransforms generates opposite translateX strings', () => {
  const { row1Transform, row2Transform } = calculateMarqueeTransforms(250);
  assert.equal(row1Transform, 'translateX(50px)');
  assert.equal(row2Transform, 'translateX(-50px)');
});

test('calculateMagnetOffset activates within padding and divides delta by strength', () => {
  const rect = { left: 100, top: 100, width: 200, height: 200 }; // center = (200, 200)
  const active = calculateMagnetOffset(230, 170, rect, 150, 3);
  assert.equal(active.isActive, true);
  assert.equal(active.x, 10);
  assert.equal(active.y, -10);

  const inactive = calculateMagnetOffset(600, 600, rect, 150, 3);
  assert.equal(inactive.isActive, false);
  assert.equal(inactive.x, 0);
  assert.equal(inactive.y, 0);
});

test('calculateCharacterOpacityRange returns normalized start and end bounds', () => {
  const [start, end] = calculateCharacterOpacityRange(2, 10);
  assert.equal(start, 0.2);
  assert.equal(end, 0.3);
});

test('calculateCardTargetScale and calculateCardTopOffset match specification for 5 cards', () => {
  assert.equal(calculateCardTargetScale(0, 5), 0.88);
  assert.equal(calculateCardTargetScale(1, 5), 0.91);
  assert.equal(calculateCardTargetScale(2, 5), 0.94);
  assert.equal(calculateCardTargetScale(3, 5), 0.97);
  assert.equal(calculateCardTargetScale(4, 5), 1);

  assert.equal(calculateCardTopOffset(0), 0);
  assert.equal(calculateCardTopOffset(1), 28);
  assert.equal(calculateCardTopOffset(2), 56);
  assert.equal(calculateCardTopOffset(3), 84);
  assert.equal(calculateCardTopOffset(4), 112);
});

test('formatBadgeSerial sanitizes and uppercases badge IDs', () => {
  assert.equal(formatBadgeSerial('jk-2026-01'), 'JK-2026-01');
  assert.equal(formatBadgeSerial('   '), 'ID-0000');
});

test('getLanyardPendulumConfig returns 3s damped pendulum and drop keyframes', () => {
  const cfg = getLanyardPendulumConfig();
  assert.equal(cfg.duration, 3);
  assert.equal(cfg.rotateKeyframes.length, cfg.times.length);
  assert.equal(cfg.yKeyframes.length, cfg.times.length);
  assert.equal(cfg.rotateKeyframes[cfg.rotateKeyframes.length - 1], 0);
  assert.equal(cfg.yKeyframes[cfg.yKeyframes.length - 1], 0);
});

test('getDefaultProjectDocumentation returns distinct rich documentation and local /assets/portfolio/ image paths for all 5 projects', () => {
  const doc1 = getDefaultProjectDocumentation('01');
  const doc2 = getDefaultProjectDocumentation('02');
  const doc3 = getDefaultProjectDocumentation('03');
  const doc4 = getDefaultProjectDocumentation('04');
  const doc5 = getDefaultProjectDocumentation('05');

  assert.ok(doc1.overview.includes('Chehre'));
  assert.ok(doc2.overview.includes('The Silent Witness'));
  assert.ok(doc3.overview.includes('Engineered in Denim'));
  assert.ok(doc4.overview.includes('Enchanted Garden'));
  assert.ok(doc5.overview.includes('Deep Under the Sea'));
  assert.equal(doc1.docImage1, '/assets/portfolio/project-01-docImage1-d6278f11.jpg');
  assert.equal(doc1.docImage2, '/assets/portfolio/project-01-docImage2-4603d56c.jpg');
  assert.equal(doc1.docImage3, '');
  assert.equal(doc2.docImage1, '/assets/portfolio/project-02-docImage1-7d07c750.jpg');
  assert.equal(doc3.docImage1, '/assets/portfolio/project-03-docImage1-6b219256.jpg');
  assert.equal(doc4.docImage1, '/assets/portfolio/project-04-docImage1-9818aee8.jpg');
  assert.equal(doc5.docImage1, '/assets/portfolio/project-05-docImage1-8cd235a1.webp');
  assert.equal(PROJECT_1_PORTRAIT_DIMENSIONS.width, 524);
  assert.equal(PROJECT_1_PORTRAIT_DIMENSIONS.height, 1536);
  assert.equal(PROJECT_1_PORTRAIT_DIMENSIONS.aspectRatioCss, '524 / 1536');
  assert.equal(PROJECT_1_PORTRAIT_DIMENSIONS.ratio, 2.93);
  assert.equal(PROJECT_2_PORTRAIT_DIMENSIONS.width, 473);
  assert.equal(PROJECT_2_PORTRAIT_DIMENSIONS.height, 1536);
  assert.equal(PROJECT_2_PORTRAIT_DIMENSIONS.aspectRatioCss, '473 / 1536');
  assert.equal(PROJECT_2_PORTRAIT_DIMENSIONS.ratio, 3.25);
  assert.equal(PROJECT_3_PORTRAIT_DIMENSIONS.width, 365);
  assert.equal(PROJECT_3_PORTRAIT_DIMENSIONS.height, 1536);
  assert.equal(PROJECT_3_PORTRAIT_DIMENSIONS.aspectRatioCss, '365 / 1536');
  assert.equal(PROJECT_3_PORTRAIT_DIMENSIONS.ratio, 4.21);
  assert.equal(PROJECT_4_PORTRAIT_DIMENSIONS.width, 1080);
  assert.equal(PROJECT_4_PORTRAIT_DIMENSIONS.height, 3988);
  assert.equal(PROJECT_4_PORTRAIT_DIMENSIONS.aspectRatioCss, '1080 / 3988');
  assert.equal(PROJECT_4_PORTRAIT_DIMENSIONS.ratio, 3.69);
  assert.equal(PROJECT_5_PORTRAIT_DIMENSIONS.width, 1080);
  assert.equal(PROJECT_5_PORTRAIT_DIMENSIONS.height, 3712);
  assert.equal(PROJECT_5_PORTRAIT_DIMENSIONS.aspectRatioCss, '1080 / 3712');
  assert.equal(PROJECT_5_PORTRAIT_DIMENSIONS.ratio, 3.44);
  assert.equal(getProjectPortraitAspectRatio('01'), '524 / 1536');
  assert.equal(getProjectPortraitAspectRatio('02'), '473 / 1536');
  assert.equal(getProjectPortraitAspectRatio('03'), '365 / 1536');
  assert.equal(getProjectPortraitAspectRatio('04'), '1080 / 3988');
  assert.equal(getProjectPortraitAspectRatio('05'), '1080 / 3712');
});

test('normalizeLegacyAssetUrl and isCustomUploadedAsset map external and placeholder URLs to real uploaded /assets/portfolio/ files', () => {
  assert.equal(
    normalizeLegacyAssetUrl(
      'https://shrug-person-78902957.figma.site/_components/v2/d24c01ad3a56fc65e942a1f501eb73db42d7cf9a/Rectangle_40443.81459862.png'
    ),
    '/assets/portfolio/hero-portrait-a865a84b.png'
  );
  assert.equal(
    normalizeLegacyAssetUrl('/assets/portfolio/marquee-slot-0.svg'),
    '/assets/portfolio/marquee-slot-0-e5af14aa.jpg'
  );
  assert.equal(
    normalizeLegacyAssetUrl(
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055654_911201c5-36d9-4bc6-bac7-331adfce159f.png&w=1280&q=85',
      '/assets/portfolio/project-02-col1Image1.webp'
    ),
    '/assets/portfolio/project-02-col1Image1-feeb3782.jpg'
  );
  assert.equal(
    isCustomUploadedAsset('/assets/portfolio/project-02-docImage1.webp'),
    false
  );
  assert.equal(
    isCustomUploadedAsset('/assets/portfolio/marquee-slot-0.svg'),
    false
  );
  assert.equal(
    isCustomUploadedAsset('/assets/portfolio/project-02-docImage1-a1b2c3d4.webp'),
    true
  );
  assert.equal(
    isCustomUploadedAsset('data:image/jpeg;base64,customFashionPhoto'),
    true
  );
});

test('mergeProjectDocsRecord preserves uploaded images and master text across Projects 01 through 05 and rejects legacy template or stale v2 strings', () => {
  const masterSaved = {
    '01': {
      docImage1: 'data:image/webp;base64,proj1img',
      subtitle: "CASUAL MEN'S WEAR",
      timeline: 'ss 2026',
      overview: getDefaultProjectDocumentation('01').overview,
    },
    '02': {
      docImage1: '/assets/portfolio/project-02-docImage1-8f9e0a1b.webp',
      subtitle: 'traditional wear',
      timeline: 'SS 2027 ',
    },
    '03': {
      docImage1: 'data:image/webp;base64,proj3img',
      subtitle: "women's denim wear",
      timeline: 'ss 2027',
    },
    '04': { docImage1: 'data:image/webp;base64,proj4img' },
    '05': { docImage1: 'data:image/webp;base64,proj5img' },
  };
  const staleCacheOrTemplate = {
    '01': {
      subtitle: 'AVANT-GARDE COUTURE & SCULPTURAL VISAGE ARCHIVE', // legacy template must be rejected
      timeline: 'AW 2026 ·', // stale v2 string must be rejected
    },
    '02': {
      docImage1: '/assets/portfolio/project-02-docImage1.webp', // unhashed default must NOT overwrite custom hashed upload
      subtitle: "women's indian wear", // stale v2 string must be rejected
      timeline: 'SS 2026 · 10 WEEKS', // legacy template must be rejected
    },
    '03': {
      docImage1: '',
      subtitle: 'denim wear', // stale v2 string must be rejected
    },
    '04': {
      subtitle: 'ARCHITECTURAL PLEATING & MOTION CAPTURE COUTURE', // legacy template must be rejected
    },
    '05': {
      subtitle: 'ARTISANAL HERITAGE WEAVES & VIRTUAL ATELIER EXHIBITION', // legacy template must be rejected
    },
  };

  const merged = mergeProjectDocsRecord(masterSaved, staleCacheOrTemplate);
  assert.equal(merged['01'].docImage1, 'data:image/webp;base64,proj1img');
  assert.equal(merged['01'].subtitle, "CASUAL MEN'S WEAR");
  assert.equal(merged['01'].timeline, 'ss 2026');
  assert.equal(merged['02'].docImage1, '/assets/portfolio/project-02-docImage1-8f9e0a1b.webp');
  assert.equal(merged['02'].subtitle, 'traditional wear');
  assert.equal(merged['02'].timeline, 'SS 2027 ');
  assert.equal(merged['03'].docImage1, 'data:image/webp;base64,proj3img');
  assert.equal(merged['03'].subtitle, "women's denim wear");
  assert.equal(merged['03'].timeline, 'ss 2027');
  assert.equal(merged['04'].docImage1, 'data:image/webp;base64,proj4img');
  assert.equal(merged['04'].subtitle, 'evening gown');
  assert.equal(merged['05'].docImage1, 'data:image/webp;base64,proj5img');
  assert.equal(merged['05'].subtitle, "women's wear");
});


test('mergeMarqueeImages preserves custom uploaded lookbook images across localStorage and IndexedDB without reverting to default plates', () => {
  const defaults = [
    '/assets/portfolio/marquee-slot-0-e5af14aa.jpg',
    '/assets/portfolio/marquee-slot-1-7bfe9726.jpg',
    '/assets/portfolio/marquee-slot-2-b5e00efd.jpg',
    '/assets/portfolio/marquee-slot-3-05ab67d9.jpg',
    '/assets/portfolio/marquee-slot-4-00ac0e9f.jpg',
    '/assets/portfolio/marquee-slot-5-1ff5d94d.jpg',
  ];
  const staleLocalArray = [
    'custom0',
    '/assets/portfolio/marquee-slot-1.svg',
    '/assets/portfolio/marquee-slot-2.svg',
    '/assets/portfolio/marquee-slot-3.svg',
    '/assets/portfolio/marquee-slot-4.svg',
    '/assets/portfolio/marquee-slot-5.svg',
  ];
  const idbOverrides = { 5: 'data:image/jpeg;base64,customItem6' };
  const idbPerSlot = [null, null, 'data:image/png;base64,customItem3', null, null, null];

  const merged = mergeMarqueeImages(defaults, idbOverrides, idbPerSlot, staleLocalArray);
  assert.equal(merged[0], 'custom0');
  assert.equal(merged[1], '/assets/portfolio/marquee-slot-1-7bfe9726.jpg');
  assert.equal(merged[2], 'data:image/png;base64,customItem3');
  assert.equal(merged[5], 'data:image/jpeg;base64,customItem6');
});

test('buildGmailComposeUrl generates direct Gmail compose links for harshita.fashion2917@gmail.com', () => {
  assert.equal(HARSHITA_GMAIL, 'harshita.fashion2917@gmail.com');
  assert.equal(
    buildGmailComposeUrl(),
    'https://mail.google.com/mail/?view=cm&fs=1&to=harshita.fashion2917%40gmail.com'
  );
  assert.equal(
    buildGmailComposeUrl('Request for Similar Project — 01: CHEHRE'),
    'https://mail.google.com/mail/?view=cm&fs=1&to=harshita.fashion2917%40gmail.com&su=Request%20for%20Similar%20Project%20%E2%80%94%2001%3A%20CHEHRE'
  );
});

test('calculateHeadingCharDelay computes staggered delays for project heading animations', () => {
  assert.equal(calculateHeadingCharDelay(0), 0);
  assert.equal(calculateHeadingCharDelay(5), 0.06);
  assert.equal(calculateHeadingCharDelay(0, 0.14, 0.028), 0.14);
  assert.equal(calculateHeadingCharDelay(5, 0.14, 0.028), 0.28);
  assert.equal(calculateHeadingCharDelay(-3, 0.12, 0.03), 0.12);
});

test('computeLiquidRibbonSample computes smooth organic wave coordinates and bounded specular highlights', () => {
  const sampleT0 = computeLiquidRibbonSample(0.5, 0, 1);
  const sampleT2 = computeLiquidRibbonSample(0.5, 2.5, 1);

  assert.ok(sampleT0.centerYNorm > 0 && sampleT0.centerYNorm < 1);
  assert.ok(sampleT0.halfWidthNorm >= 0.004);
  assert.ok(sampleT0.specularIntensity >= 0.08 && sampleT0.specularIntensity <= 1);
  assert.notEqual(sampleT0.centerYNorm, sampleT2.centerYNorm);
});

test('isDevHostEnvironment and isOwnerEditEnvironment strictly lock deployed and shared links to read-only viewer mode', () => {
  // Owner dev environments allow editing by default
  assert.equal(isDevHostEnvironment('localhost'), true);
  assert.equal(isDevHostEnvironment('127.0.0.1'), true);
  assert.equal(
    isDevHostEnvironment('ais-dev-bp7cvrqs2gpav2uq7pq5wg-385815530155.asia-northeast1.run.app'),
    true
  );
  assert.equal(
    isOwnerEditEnvironment('ais-dev-bp7cvrqs2gpav2uq7pq5wg-385815530155.asia-northeast1.run.app', ''),
    true
  );

  // Shared preview link (ais-pre-*) and deployed Cloud Run links are strictly read-only for visitors
  assert.equal(
    isDevHostEnvironment('ais-pre-bp7cvrqs2gpav2uq7pq5wg-385815530155.asia-northeast1.run.app'),
    false
  );
  assert.equal(
    isOwnerEditEnvironment('ais-pre-bp7cvrqs2gpav2uq7pq5wg-385815530155.asia-northeast1.run.app', ''),
    false
  );
  assert.equal(
    isOwnerEditEnvironment('harshita-portfolio-385815530155.asia-northeast1.run.app', ''),
    false
  );
  assert.equal(isOwnerEditEnvironment('harshitafashion.com', '?edit=1'), false);

  // Owner can preview read-only visitor mode in dev using ?view=public or ?readonly=1
  assert.equal(isOwnerEditEnvironment('localhost', '?view=public'), false);
  assert.equal(isOwnerEditEnvironment('localhost', '?readonly=1'), false);
});

test('isCorruptedOrDeletedAssetUrl rejects 0-byte -da39a3ee paths, .svg placeholders, and demo images while preserving valid uploads', () => {
  assert.equal(isCorruptedOrDeletedAssetUrl('/assets/portfolio/marquee-slot-5-da39a3ee.jpg'), true);
  assert.equal(isCorruptedOrDeletedAssetUrl('/assets/portfolio/hero-portrait-da39a3ee.jpg'), true);
  assert.equal(isCorruptedOrDeletedAssetUrl('/assets/portfolio/identity-skills-default.svg'), true);
  assert.equal(isCorruptedOrDeletedAssetUrl('/assets/portfolio/marquee-slot-0.svg'), true);
  assert.equal(isCorruptedOrDeletedAssetUrl('/assets/portfolio/hero-default.png'), true);
  assert.equal(isCorruptedOrDeletedAssetUrl('/assets/portfolio/project-shared-1.webp'), true);
  assert.equal(isCorruptedOrDeletedAssetUrl('/assets/portfolio/marquee-slot-5.jpg'), true);

  assert.equal(isCorruptedOrDeletedAssetUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg=='), false);
  assert.equal(isCorruptedOrDeletedAssetUrl('/assets/portfolio/marquee-slot-5-1ff5d94d.jpg'), false);
  assert.equal(isCorruptedOrDeletedAssetUrl('/assets/portfolio/hero-portrait-a865a84b.png'), false);

  // Corrupted -da39a3ee paths fall back cleanly and are never treated as custom uploads
  assert.equal(
    normalizeLegacyAssetUrl(
      '/assets/portfolio/marquee-slot-5-da39a3ee.jpg',
      '/assets/portfolio/marquee-slot-5-1ff5d94d.jpg'
    ),
    '/assets/portfolio/marquee-slot-5-1ff5d94d.jpg'
  );
  assert.equal(
    isCustomUploadedAsset(
      '/assets/portfolio/marquee-slot-5-da39a3ee.jpg',
      '/assets/portfolio/marquee-slot-5-1ff5d94d.jpg'
    ),
    false
  );

  // mergeMarqueeImages ignores poisoned -da39a3ee entries and restores earlier data:image/ uploads
  const defaults = [
    '/assets/portfolio/marquee-slot-0-e5af14aa.jpg',
    '/assets/portfolio/marquee-slot-1-7bfe9726.jpg',
  ];
  const poisonedPerSlot = ['/assets/portfolio/marquee-slot-0-da39a3ee.jpg', null];
  const recoveredLegacyArray = ['data:image/png;base64,recoveredSlot0Image', null];
  const merged = mergeMarqueeImages(defaults, poisonedPerSlot, recoveredLegacyArray);
  assert.equal(merged[0], 'data:image/png;base64,recoveredSlot0Image');
  assert.equal(merged[1], '/assets/portfolio/marquee-slot-1-7bfe9726.jpg');
});


