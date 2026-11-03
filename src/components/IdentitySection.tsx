import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Upload, Edit3, Check } from 'lucide-react';
import FadeIn from './FadeIn';
import Magnet from './Magnet';
import {
  IdentityProfile,
  getLanyardPendulumConfig,
  buildGmailComposeUrl,
  HARSHITA_GMAIL,
  normalizeLegacyAssetUrl,
  isCustomUploadedAsset,
} from '../utils/portfolioMath';
import {
  idbGet,
  idbSet,
  readAndOptimizeImageFile,
  fetchPublishedPortfolioState,
  syncPublishedPortfolioState,
  canCurrentUserEditPortfolio,
  uploadDataUrlAsLocalAsset,
  BUNDLED_PUBLISHED_STATE,
} from '../utils/persistentStorage';

const DEFAULT_OWNER_PHOTO = '/assets/portfolio/identity-photo-f45c044b.jpg';
const DEFAULT_SKILLS_IMAGE = '/assets/portfolio/identity-skills-25ffe5f3.webp';

const STORAGE_KEY = 'harshita_portfolio_identity_v2';
const LEGACY_STORAGE_KEY_V1 = 'harshita_portfolio_identity_v1';

const LEGACY_DEFAULT_NAME = 'HARSHITA';
const LEGACY_DEFAULT_ROLE = 'FASHION & 3D CREATIVE DIRECTOR';
const LEGACY_DEFAULT_BADGE_ID = 'HR-2026-089';

const DEFAULT_PROFILE: IdentityProfile = {
  fullName: 'HARSHITA ARYA',
  role: 'NIFT SHILLONG (FASHION DESIGN)',
  badgeId: 'BATCH 2023-2027',
  location: 'india/shillong',
  specialty: 'fashion designer [nift]',
  email: HARSHITA_GMAIL,
  photoUrl: DEFAULT_OWNER_PHOTO,
  customHeading: 'CREATIVE MANIFEST0',
  customBodyText:
    'I believe fashion is more than the creation of garments; it is a language of expression, identity, and individuality. My design philosophy revolves around the balance between creativity, craftsmanship, and functionality. I find inspiration in art, culture, nature, and the constantly evolving world around me, translating observations into distinctive visual narratives. I approach every design with curiosity and an experimental mindset, exploring silhouettes, textures, fabric manipulation, and construction techniques. I believe in challenging conventional boundaries while respecting the fundamentals of design. My vision is to create meaningful, expressive, and thoughtfully constructed designs that communicate individuality and leave a lasting impression.',
  skillsHeading: 'SKILLS',
  manifestoImageUrl: DEFAULT_SKILLS_IMAGE,
};

const normalizeLoadedProfile = (
  base: IdentityProfile,
  loaded?: Partial<IdentityProfile> | null
): IdentityProfile => {
  if (!loaded) return base;
  const merged: IdentityProfile = { ...base };
  const textKeys: Array<
    | 'fullName'
    | 'role'
    | 'badgeId'
    | 'location'
    | 'specialty'
    | 'email'
    | 'customHeading'
    | 'customBodyText'
    | 'skillsHeading'
  > = [
    'fullName',
    'role',
    'badgeId',
    'location',
    'specialty',
    'email',
    'customHeading',
    'customBodyText',
    'skillsHeading',
  ];

  for (const key of textKeys) {
    const incomingVal = loaded[key];
    if (typeof incomingVal === 'string' && incomingVal.trim().length > 0) {
      if (key === 'fullName' && incomingVal === LEGACY_DEFAULT_NAME) continue;
      if (key === 'role' && incomingVal === LEGACY_DEFAULT_ROLE) continue;
      if (key === 'badgeId' && incomingVal === LEGACY_DEFAULT_BADGE_ID) continue;

      const defaultVal = (DEFAULT_PROFILE[key] || '').trim();
      const baseVal = (base[key] || '').trim();
      const baseIsCustom = Boolean(baseVal && baseVal !== defaultVal);
      const incomingIsCustom = incomingVal.trim() !== defaultVal;

      if (!baseIsCustom || incomingIsCustom) {
        merged[key] = incomingVal;
      }
    }
  }

  merged.photoUrl = normalizeLegacyAssetUrl(
    loaded.photoUrl || base.photoUrl,
    base.photoUrl || DEFAULT_OWNER_PHOTO
  );
  merged.manifestoImageUrl = normalizeLegacyAssetUrl(
    loaded.manifestoImageUrl !== undefined
      ? loaded.manifestoImageUrl
      : base.manifestoImageUrl,
    base.manifestoImageUrl || DEFAULT_SKILLS_IMAGE
  );
  return merged;
};

export interface IdentitySectionProps {
  canEdit?: boolean;
}

export const IdentitySection: React.FC<IdentitySectionProps> = ({ canEdit = false }) => {
  const [profile, setProfile] = useState<IdentityProfile>(() => {
    const baseFromBundled = normalizeLoadedProfile(
      DEFAULT_PROFILE,
      BUNDLED_PUBLISHED_STATE.identityProfile
    );
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY_V1);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<IdentityProfile>;
        const normalized = normalizeLoadedProfile(baseFromBundled, parsed);
        if (
          !isCustomUploadedAsset(normalized.photoUrl, DEFAULT_OWNER_PHOTO) &&
          isCustomUploadedAsset(baseFromBundled.photoUrl, DEFAULT_OWNER_PHOTO)
        ) {
          normalized.photoUrl = baseFromBundled.photoUrl;
        }
        if (
          !isCustomUploadedAsset(normalized.manifestoImageUrl, DEFAULT_SKILLS_IMAGE) &&
          isCustomUploadedAsset(baseFromBundled.manifestoImageUrl, DEFAULT_SKILLS_IMAGE)
        ) {
          normalized.manifestoImageUrl = baseFromBundled.manifestoImageUrl;
        }
        return normalized;
      }
    } catch {
      // Fallback to default
    }
    return baseFromBundled;
  });

  const [isEditingCard, setIsEditingCard] = useState(false);
  const effectiveIsEditingCard = Boolean(canEdit && isEditingCard);
  const [swingKey, setSwingKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const manifestoFileInputRef = useRef<HTMLInputElement>(null);
  const lanyardAnchorRef = useRef<HTMLDivElement>(null);
  const userEditedFieldsRef = useRef<Partial<IdentityProfile>>({});

  // Trigger drop-down + 3s pendulum every time the user scrolls down into this section
  const isInView = useInView(lanyardAnchorRef, {
    once: false,
    amount: 0.2,
  });

  const pendulumConfig = getLanyardPendulumConfig();

  const persistProfileToStorageAndServer = (
    nextProfile: IdentityProfile,
    serverPhotoOverride?: string,
    serverManifestoOverride?: string
  ) => {
    if (!canCurrentUserEditPortfolio()) return;
    void idbSet(STORAGE_KEY, nextProfile);
    if (
      nextProfile.photoUrl &&
      isCustomUploadedAsset(nextProfile.photoUrl, DEFAULT_OWNER_PHOTO)
    ) {
      void idbSet(`${STORAGE_KEY}_photoUrl`, nextProfile.photoUrl);
    }
    if (
      nextProfile.manifestoImageUrl &&
      isCustomUploadedAsset(nextProfile.manifestoImageUrl, DEFAULT_SKILLS_IMAGE)
    ) {
      void idbSet(`${STORAGE_KEY}_manifestoImageUrl`, nextProfile.manifestoImageUrl);
    }

    const serverProfile: IdentityProfile = {
      ...nextProfile,
      photoUrl: serverPhotoOverride || nextProfile.photoUrl,
      manifestoImageUrl:
        serverManifestoOverride !== undefined
          ? serverManifestoOverride
          : nextProfile.manifestoImageUrl,
    };

    void syncPublishedPortfolioState({ identityProfile: serverProfile });

    try {
      const localProfile: IdentityProfile = {
        ...serverProfile,
        photoUrl:
          serverProfile.photoUrl && serverProfile.photoUrl.startsWith('data:')
            ? DEFAULT_OWNER_PHOTO
            : serverProfile.photoUrl,
        manifestoImageUrl:
          serverProfile.manifestoImageUrl &&
          serverProfile.manifestoImageUrl.startsWith('data:')
            ? DEFAULT_SKILLS_IMAGE
            : serverProfile.manifestoImageUrl,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localProfile));
    } catch {
      // Ignore storage quota errors
    }
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchPublishedPortfolioState(),
      idbGet<IdentityProfile>(STORAGE_KEY),
      idbGet<IdentityProfile>(LEGACY_STORAGE_KEY_V1),
      idbGet<string>(`${STORAGE_KEY}_photoUrl`),
      idbGet<string>(`${STORAGE_KEY}_manifestoImageUrl`),
    ]).then(
      async ([
        publishedState,
        savedProfile,
        savedLegacyV1,
        savedPhotoUrl,
        savedManifestoImg,
      ]) => {
        if (!isMounted) return;
        const fromBundled = normalizeLoadedProfile(
          DEFAULT_PROFILE,
          BUNDLED_PUBLISHED_STATE.identityProfile
        );
        const fromPublished = normalizeLoadedProfile(
          fromBundled,
          publishedState?.identityProfile
        );
        const normalized = normalizeLoadedProfile(
          normalizeLoadedProfile(
            normalizeLoadedProfile(fromPublished, savedLegacyV1),
            profile
          ),
          savedProfile
        );

        const candidatePhotos = [
          userEditedFieldsRef.current.photoUrl,
          savedPhotoUrl,
          savedProfile?.photoUrl,
          savedLegacyV1?.photoUrl,
          profile.photoUrl,
          fromPublished.photoUrl,
          DEFAULT_OWNER_PHOTO,
        ].map((u) => normalizeLegacyAssetUrl(u, ''));

        const resolvedPhoto =
          candidatePhotos.find((u) => isCustomUploadedAsset(u, DEFAULT_OWNER_PHOTO)) ||
          fromPublished.photoUrl ||
          DEFAULT_OWNER_PHOTO;

        const candidateManifestos = [
          userEditedFieldsRef.current.manifestoImageUrl,
          savedManifestoImg,
          savedProfile?.manifestoImageUrl,
          savedLegacyV1?.manifestoImageUrl,
          profile.manifestoImageUrl,
          fromPublished.manifestoImageUrl,
          DEFAULT_SKILLS_IMAGE,
        ].map((u) => normalizeLegacyAssetUrl(u, ''));

        const resolvedManifesto =
          candidateManifestos.find((u) =>
            isCustomUploadedAsset(u, DEFAULT_SKILLS_IMAGE)
          ) ||
          fromPublished.manifestoImageUrl ||
          DEFAULT_SKILLS_IMAGE;

        const mergedProfile: IdentityProfile = {
          ...normalized,
          ...userEditedFieldsRef.current,
          photoUrl: userEditedFieldsRef.current.photoUrl || resolvedPhoto,
          skillsHeading:
            userEditedFieldsRef.current.skillsHeading ||
            savedProfile?.skillsHeading ||
            profile.skillsHeading ||
            fromPublished.skillsHeading ||
            'SKILLS',
          manifestoImageUrl:
            userEditedFieldsRef.current.manifestoImageUrl !== undefined
              ? userEditedFieldsRef.current.manifestoImageUrl
              : resolvedManifesto,
        };

        setProfile(mergedProfile);
        await idbSet(STORAGE_KEY, mergedProfile);

        // Materialize any data:image/ URLs on the server in the background without overwriting React state
        if (canCurrentUserEditPortfolio()) {
          let serverPhoto = mergedProfile.photoUrl;
          let serverManifesto = mergedProfile.manifestoImageUrl || '';
          let hasCustomUploadsToSync = false;

          if (
            serverPhoto.startsWith('data:image/') &&
            !serverPhoto.startsWith('data:image/svg+xml;utf8,')
          ) {
            serverPhoto = await uploadDataUrlAsLocalAsset('identity-photo', serverPhoto);
            hasCustomUploadsToSync = true;
          }

          if (
            serverManifesto.startsWith('data:image/') &&
            !serverManifesto.startsWith('data:image/svg+xml;utf8,')
          ) {
            serverManifesto = await uploadDataUrlAsLocalAsset(
              'identity-skills',
              serverManifesto
            );
            hasCustomUploadsToSync = true;
          }

          if (
            hasCustomUploadsToSync ||
            serverPhoto !== publishedState?.identityProfile?.photoUrl ||
            serverManifesto !== publishedState?.identityProfile?.manifestoImageUrl ||
            mergedProfile.fullName !== publishedState?.identityProfile?.fullName ||
            mergedProfile.role !== publishedState?.identityProfile?.role ||
            mergedProfile.badgeId !== publishedState?.identityProfile?.badgeId ||
            mergedProfile.customBodyText !==
              publishedState?.identityProfile?.customBodyText
          ) {
            void syncPublishedPortfolioState({
              identityProfile: {
                ...mergedProfile,
                photoUrl: serverPhoto,
                manifestoImageUrl: serverManifesto,
              },
            });
          }
        }
      }
    );
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const applyPhoto = async (dataUrl: string) => {
      userEditedFieldsRef.current.photoUrl = dataUrl;
      let latestSnapshot: IdentityProfile | null = null;
      setProfile((prev) => {
        const next = { ...prev, photoUrl: dataUrl };
        latestSnapshot = next;
        void idbSet(STORAGE_KEY, next);
        void idbSet(`${STORAGE_KEY}_photoUrl`, dataUrl);
        return next;
      });
      const serverPhotoUrl = await uploadDataUrlAsLocalAsset('identity-photo', dataUrl);
      if (latestSnapshot) {
        persistProfileToStorageAndServer(latestSnapshot, serverPhotoUrl, undefined);
      }
    };

    readAndOptimizeImageFile(file)
      .then((optimizedDataUrl) => {
        void applyPhoto(optimizedDataUrl);
      })
      .catch(() => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            void applyPhoto(reader.result);
          }
        };
        reader.readAsDataURL(file);
      });
    e.target.value = '';
  };

  const handleManifestoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const applySkillsImage = async (dataUrl: string) => {
      userEditedFieldsRef.current.manifestoImageUrl = dataUrl;
      let latestSnapshot: IdentityProfile | null = null;
      setProfile((prev) => {
        const next = { ...prev, manifestoImageUrl: dataUrl };
        latestSnapshot = next;
        void idbSet(STORAGE_KEY, next);
        void idbSet(`${STORAGE_KEY}_manifestoImageUrl`, dataUrl);
        return next;
      });
      const serverSkillsUrl = await uploadDataUrlAsLocalAsset(
        'identity-skills',
        dataUrl
      );
      if (latestSnapshot) {
        persistProfileToStorageAndServer(latestSnapshot, undefined, serverSkillsUrl);
      }
    };

    readAndOptimizeImageFile(file)
      .then((optimizedDataUrl) => {
        void applySkillsImage(optimizedDataUrl);
      })
      .catch(() => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            void applySkillsImage(reader.result);
          }
        };
        reader.readAsDataURL(file);
      });
    e.target.value = '';
  };

  const handleFieldChange = (field: keyof IdentityProfile, value: string) => {
    if (!canEdit) return;
    const cleanVal = field === 'badgeId' ? value.toUpperCase() : value;
    userEditedFieldsRef.current[field] = cleanVal;
    setProfile((prev) => {
      const updated = {
        ...prev,
        [field]: cleanVal,
      };
      persistProfileToStorageAndServer(updated);
      return updated;
    });
  };

  return (
    <section
      id="identity"
      aria-label="Creator Statement and Identity Card"
      className="bg-[#FFFFFF] text-[#0C0C0C] rounded-[32px] sm:rounded-[48px] md:rounded-[60px] px-4 sm:px-8 md:px-12 pt-10 sm:pt-16 md:pt-20 pb-16 sm:pb-28 md:pb-32 relative z-10 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16 items-start">
        {/* LEFT SIDE: 1) CREATIVE MANIFESTO + Box, 2) SKILLS + Upload Image Box */}
        <FadeIn
          delay={0.1}
          y={30}
          className="lg:col-span-7 flex flex-col justify-start gap-7 sm:gap-8 pt-4 sm:pt-8 lg:pt-16"
        >
          {/* TOP BLOCK: CREATIVE MANIFESTO Heading + Immediate Manifesto Box */}
          <div className="flex flex-col gap-3">
            {canEdit ? (
              <>
                <label htmlFor="creator-heading-input" className="sr-only">
                  Section Heading Text
                </label>
                <input
                  id="creator-heading-input"
                  type="text"
                  value={profile.customHeading}
                  onChange={(e) => handleFieldChange('customHeading', e.target.value)}
                  placeholder="CREATIVE MANIFESTO"
                  className="w-full bg-transparent text-[#0C0C0C] font-black uppercase tracking-tight leading-none border-b border-transparent focus:border-[#0C0C0C]/30 focus:outline-none py-1 transition-colors"
                  style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.75rem)' }}
                />

                <label htmlFor="creator-body-textarea" className="sr-only">
                  Portfolio Owner Statement and Notes
                </label>
                <textarea
                  id="creator-body-textarea"
                  rows={7}
                  value={profile.customBodyText}
                  onChange={(e) => handleFieldChange('customBodyText', e.target.value)}
                  placeholder="Write your fashion design statement, biography, atelier notes, or custom text here..."
                  className="w-full min-h-[230px] sm:min-h-[250px] rounded-[28px] bg-[#F5F7F9] border-2 border-[#0C0C0C]/15 focus:border-[#0C0C0C] p-6 sm:p-7 text-[#0C0C0C] font-light leading-relaxed focus:outline-none transition-colors resize-y"
                  style={{ fontSize: 'clamp(1rem, 1.4vw, 1.2rem)' }}
                />
              </>
            ) : (
              <>
                <h2
                  className="w-full text-[#0C0C0C] font-black uppercase tracking-tight leading-none py-1"
                  style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.75rem)' }}
                >
                  {profile.customHeading}
                </h2>
                <div
                  className="w-full min-h-[230px] sm:min-h-[250px] rounded-[28px] bg-[#F5F7F9] border-2 border-[#0C0C0C]/15 p-6 sm:p-7 text-[#0C0C0C] font-light leading-relaxed whitespace-pre-line"
                  style={{ fontSize: 'clamp(1rem, 1.4vw, 1.2rem)' }}
                >
                  {profile.customBodyText}
                </div>
              </>
            )}
          </div>

          {/* BOTTOM BLOCK: SKILLS Heading + Upload Image Box Directly Below */}
          <div className="flex flex-col gap-3">
            {canEdit ? (
              <label htmlFor="creator-skills-heading-input" className="sr-only">
                Skills Section Heading
              </label>
            ) : null}
            {canEdit ? (
              <input
                id="creator-skills-heading-input"
                type="text"
                value={profile.skillsHeading || 'SKILLS'}
                onChange={(e) => handleFieldChange('skillsHeading', e.target.value)}
                placeholder="SKILLS"
                className="w-full bg-transparent text-[#0C0C0C] font-black uppercase tracking-tight leading-none border-b border-transparent focus:border-[#0C0C0C]/30 focus:outline-none py-1 transition-colors"
                style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.75rem)' }}
              />
            ) : (
              <h2
                className="w-full text-[#0C0C0C] font-black uppercase tracking-tight leading-none py-1"
                style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.75rem)' }}
              >
                {profile.skillsHeading || 'SKILLS'}
              </h2>
            )}

            {canEdit && (
              <input
                ref={manifestoFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleManifestoImageUpload}
                aria-label="Upload Creative Manifesto Image"
                className="hidden"
              />
            )}

            {canEdit ? (
              <div
                onClick={() => manifestoFileInputRef.current?.click()}
                title="Click to upload or replace Skills image"
                className={
                  profile.manifestoImageUrl
                    ? 'group relative w-full rounded-[28px] bg-[#F5F7F9] border-2 border-[#0C0C0C]/15 hover:border-[#0C0C0C] overflow-hidden block cursor-pointer transition-colors'
                    : 'group relative w-full min-h-[230px] sm:min-h-[250px] rounded-[28px] bg-[#F5F7F9] border-2 border-dashed border-[#0C0C0C]/20 hover:border-[#0C0C0C] overflow-hidden flex items-center justify-center cursor-pointer transition-colors'
                }
              >
                {profile.manifestoImageUrl ? (
                  <>
                    <img
                      src={profile.manifestoImageUrl}
                      alt="Skills Visual"
                      loading="eager"
                      decoding="sync"
                      onError={() => {
                        setProfile((prev) => ({ ...prev, manifestoImageUrl: '' }));
                      }}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        objectFit: 'contain',
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        manifestoFileInputRef.current?.click();
                      }}
                      className="absolute bottom-3 right-4 z-10 rounded-full bg-[#0C0C0C]/80 border border-white/30 px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-white opacity-90 group-hover:opacity-100 hover:bg-[#0C0C0C] flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Change Image</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2.5 p-6 text-center">
                    <div className="w-11 h-11 rounded-full bg-[#0C0C0C]/5 border border-[#0C0C0C]/15 flex items-center justify-center text-[#0C0C0C] group-hover:bg-[#0C0C0C] group-hover:text-white transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-[#0C0C0C]">
                      UPLOAD IMAGE
                    </span>
                    <span className="text-xs text-[#0C0C0C]/55 font-light">
                      Click to upload your Skills image
                    </span>
                  </div>
                )}
              </div>
            ) : profile.manifestoImageUrl ? (
              <div className="relative w-full rounded-[28px] bg-[#F5F7F9] border-2 border-[#0C0C0C]/15 overflow-hidden block">
                <img
                  src={profile.manifestoImageUrl}
                  alt="Skills Visual"
                  loading="eager"
                  decoding="sync"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain',
                  }}
                />
              </div>
            ) : (
              <div className="w-full min-h-[230px] sm:min-h-[250px] rounded-[28px] bg-[#F5F7F9] border-2 border-[#0C0C0C]/15 overflow-hidden" />
            )}
          </div>
        </FadeIn>

        {/* RIGHT SIDE: Hanging Ribbon Lanyard + Owner Identity Card with 3s Pendulum Motion */}
        <div
          ref={lanyardAnchorRef}
          className="lg:col-span-5 flex flex-col items-center w-full relative pt-2"
        >
          {/* Fixed Top Ceiling Mount Pin */}
          <div
            aria-hidden="true"
            className="w-8 h-3 rounded-full bg-[#0C0C0C] border-2 border-[#646973] shadow-md z-20 -mb-1"
          />

          {/* Pendulum Assembly (Ribbon + Metal Clasp + ID Card) pivoting from top center */}
          <motion.div
            key={swingKey}
            initial={{ y: -220, rotate: 15, opacity: 0 }}
            animate={
              isInView
                ? {
                    y: pendulumConfig.yKeyframes,
                    rotate: pendulumConfig.rotateKeyframes,
                    opacity: 1,
                  }
                : { y: -220, rotate: 15, opacity: 0 }
            }
            transition={{
              duration: pendulumConfig.duration,
              times: pendulumConfig.times,
              ease: 'easeInOut',
              opacity: { duration: 0.35 },
            }}
            style={{
              transformOrigin: 'top center',
            }}
            className="w-full max-w-[420px] flex flex-col items-center"
          >
            {/* LANYARD RIBBON STRAP + METALLIC CLASP */}
            <div
              onClick={() => setSwingKey((prev) => prev + 1)}
              title="Click ribbon to replay 3s pendulum swing"
              className="flex flex-col items-center cursor-pointer select-none group"
            >
              {/* Woven Satin V-Strap Ribbon */}
              <div className="relative w-14 h-32 sm:h-36 flex justify-center">
                {/* Left Strap Leg */}
                <div
                  className="w-7 h-full rounded-t-sm border-x border-white/15 shadow-lg"
                  style={{
                    background:
                      'linear-gradient(180deg, #0C0C0C 0%, #2B0938 45%, #7621B0 85%, #18011F 100%)',
                    transform: 'skewX(5deg) translateX(4px)',
                  }}
                />
                {/* Right Strap Leg */}
                <div
                  className="w-7 h-full rounded-t-sm border-x border-white/20 shadow-xl flex items-center justify-center overflow-hidden"
                  style={{
                    background:
                      'linear-gradient(180deg, #141418 0%, #B600A8 40%, #7621B0 80%, #18011F 100%)',
                    transform: 'skewX(-5deg) translateX(-4px)',
                  }}
                >
                  <span
                    className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/85 whitespace-nowrap"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    NIFT SHILLONG
                  </span>
                </div>

                {/* Stitched Metal Crimp Clamp at Bottom of Ribbon */}
                <div
                  className="absolute -bottom-2 w-10 h-4 rounded-sm border border-white/40 shadow-md flex items-center justify-center"
                  style={{
                    background:
                      'linear-gradient(90deg, #646973 0%, #D7E2EA 50%, #646973 100%)',
                  }}
                >
                  <div className="w-6 h-[2px] bg-[#0C0C0C]/50 rounded-full" />
                </div>
              </div>

              {/* Metallic Swivel D-Ring & Lobster Clasp Hook */}
              <div className="flex flex-col items-center mt-1.5 -mb-5 z-20">
                <div className="w-5 h-4 rounded-full border-[3px] border-[#BBCCD7] bg-transparent shadow-sm" />
                <div
                  className="w-3.5 h-7 rounded-full border border-white/40 shadow-md"
                  style={{
                    background:
                      'linear-gradient(90deg, #646973 0%, #FFFFFF 50%, #4A5058 100%)',
                  }}
                />
              </div>
            </div>

            {/* Articulated Secondary Swing on the ID Card at the Clasp Joint */}
            <motion.div
              animate={
                isInView
                  ? {
                      rotate: [-7, 6, -4.5, 3, -1.8, 0.9, -0.3, 0],
                    }
                  : { rotate: -7 }
              }
              transition={{
                duration: pendulumConfig.duration,
                times: pendulumConfig.times,
                ease: 'easeInOut',
              }}
              style={{
                transformOrigin: 'top center',
              }}
              className="w-full"
            >
              <Magnet
                padding={80}
                strength={8}
                activeTransition="transform 0.25s ease-out"
                inactiveTransition="transform 0.5s ease-in-out"
                className="w-full"
              >
                <div className="w-full rounded-[28px] sm:rounded-[36px] bg-[#0C0C0C] text-[#D7E2EA] border-2 border-[#0C0C0C] p-5 sm:p-7 shadow-2xl relative overflow-hidden">
                  {/* Lanyard Punched Slot Header (Clasp hooks directly into this slot) */}
                  <div className="flex flex-col items-center mb-5">
                    <div className="w-20 h-3.5 rounded-full bg-[#FFFFFF] border-2 border-[#646973]/50 mb-4 shadow-inner" />
                    <div className="w-full flex items-center justify-between gap-2 border-b border-[#D7E2EA]/20 pb-3">
                      <div className="min-w-0">
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.22em] text-[#BBCCD7] block font-semibold truncate">
                          NIFT SHILLONG
                        </span>
                        <span className="text-xs font-mono tracking-widest text-[#D7E2EA]/60 tabular-nums">
                          {profile.badgeId}
                        </span>
                      </div>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setIsEditingCard((prev) => !prev)}
                          aria-label={
                            effectiveIsEditingCard
                              ? 'Save Identity Card Details'
                              : 'Edit Identity Card Details'
                          }
                          className="rounded-full border border-[#D7E2EA]/40 px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#D7E2EA] hover:bg-[#D7E2EA]/15 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {effectiveIsEditingCard ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Done</span>
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Details</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hidden File Input for Owner Image Upload */}
                  {canEdit && (
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      aria-label="Upload Portfolio Owner Image"
                      className="hidden"
                    />
                  )}

                  {/* ID Portrait Frame with Upload Trigger */}
                  <div className="relative group w-full aspect-[4/4.2] rounded-[24px] overflow-hidden bg-[#16181C] border border-[#D7E2EA]/25 mb-5">
                    <img
                      src={profile.photoUrl}
                      alt={`Identity Card Portrait of ${profile.fullName}`}
                      referrerPolicy="no-referrer"
                      loading="eager"
                      decoding="sync"
                      onError={() => {
                        if (profile.photoUrl !== DEFAULT_OWNER_PHOTO) {
                          setProfile((prev) => ({ ...prev, photoUrl: DEFAULT_OWNER_PHOTO }));
                        }
                      }}
                      className="w-full h-full object-cover object-top block"
                    />

                    {canEdit && (
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-widest text-[#D7E2EA]/80 font-light">
                          OWNER PORTRAIT
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-full bg-white text-[#0C0C0C] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#D7E2EA] transition-colors cursor-pointer shadow-md"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Owner Details Section (View vs Edit Mode) */}
                  {effectiveIsEditingCard ? (
                    <div className="flex flex-col gap-3 text-left">
                      <div>
                        <label
                          htmlFor="id-full-name"
                          className="text-[10px] uppercase tracking-widest text-[#D7E2EA]/60 block mb-1"
                        >
                          Owner Name
                        </label>
                        <input
                          id="id-full-name"
                          type="text"
                          value={profile.fullName}
                          onChange={(e) => handleFieldChange('fullName', e.target.value)}
                          className="w-full rounded-xl bg-[#16181C] border border-[#D7E2EA]/30 px-3 py-2 text-sm text-white uppercase font-semibold focus:outline-none focus:border-white"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="id-role"
                          className="text-[10px] uppercase tracking-widest text-[#D7E2EA]/60 block mb-1"
                        >
                          Title / Role
                        </label>
                        <input
                          id="id-role"
                          type="text"
                          value={profile.role}
                          onChange={(e) => handleFieldChange('role', e.target.value)}
                          className="w-full rounded-xl bg-[#16181C] border border-[#D7E2EA]/30 px-3 py-2 text-xs text-[#D7E2EA] uppercase focus:outline-none focus:border-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label
                            htmlFor="id-badge-code"
                            className="text-[10px] uppercase tracking-widest text-[#D7E2EA]/60 block mb-1"
                          >
                            ID Serial
                          </label>
                          <input
                            id="id-badge-code"
                            type="text"
                            value={profile.badgeId}
                            onChange={(e) => handleFieldChange('badgeId', e.target.value)}
                            className="w-full rounded-xl bg-[#16181C] border border-[#D7E2EA]/30 px-3 py-2 text-xs text-[#D7E2EA] uppercase font-mono focus:outline-none focus:border-white"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="id-location"
                            className="text-[10px] uppercase tracking-widest text-[#D7E2EA]/60 block mb-1"
                          >
                            Base / Studio
                          </label>
                          <input
                            id="id-location"
                            type="text"
                            value={profile.location}
                            onChange={(e) => handleFieldChange('location', e.target.value)}
                            className="w-full rounded-xl bg-[#16181C] border border-[#D7E2EA]/30 px-3 py-2 text-xs text-[#D7E2EA] uppercase focus:outline-none focus:border-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="id-specialty"
                          className="text-[10px] uppercase tracking-widest text-[#D7E2EA]/60 block mb-1"
                        >
                          Specialization
                        </label>
                        <input
                          id="id-specialty"
                          type="text"
                          value={profile.specialty}
                          onChange={(e) => handleFieldChange('specialty', e.target.value)}
                          className="w-full rounded-xl bg-[#16181C] border border-[#D7E2EA]/30 px-3 py-2 text-xs text-[#D7E2EA] uppercase focus:outline-none focus:border-white"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="id-email"
                          className="text-[10px] uppercase tracking-widest text-[#D7E2EA]/60 block mb-1"
                        >
                          Direct Contact
                        </label>
                        <input
                          id="id-email"
                          type="text"
                          value={profile.email}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          className="w-full rounded-xl bg-[#16181C] border border-[#D7E2EA]/30 px-3 py-2 text-xs text-[#D7E2EA] uppercase focus:outline-none focus:border-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3.5">
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-none">
                          {profile.fullName}
                        </h3>
                        <p className="text-xs sm:text-sm font-medium uppercase tracking-widest text-[#BBCCD7] mt-1">
                          {profile.role}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#D7E2EA]/15 text-xs">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-[#D7E2EA]/50 block">
                            STUDIO BASE
                          </span>
                          <span className="font-medium uppercase text-[#D7E2EA] mt-0.5 block">
                            {profile.location}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-[#D7E2EA]/50 block">
                            DIRECT CONTACT
                          </span>
                          <a
                            href={buildGmailComposeUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Send a message to ${HARSHITA_GMAIL} on Gmail`}
                            className="font-medium text-[#D7E2EA] hover:text-white underline-offset-2 hover:underline mt-0.5 block truncate"
                          >
                            {profile.email === 'HARSHITA@ATELIER-CHEHRE.COM'
                              ? HARSHITA_GMAIL
                              : profile.email}
                          </a>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-[#D7E2EA]/15 text-xs">
                        <span className="text-[10px] uppercase tracking-widest text-[#D7E2EA]/50 block">
                          DISCIPLINE &amp; FOCUS
                        </span>
                        <span className="font-light uppercase text-[#D7E2EA]/90 mt-0.5 block">
                          {profile.specialty}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Bottom Barcode / Verification Strip */}
                  <div className="mt-5 pt-4 border-t border-[#D7E2EA]/20 flex items-center justify-between gap-4">
                    <div
                      aria-hidden="true"
                      className="flex items-center gap-[3px] h-6 opacity-75"
                    >
                      {[2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 2, 1, 3, 2].map((w, idx) => (
                        <span
                          key={idx}
                          className="h-full bg-[#D7E2EA] inline-block"
                          style={{ width: `${w * 2}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Magnet>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default IdentitySection;
