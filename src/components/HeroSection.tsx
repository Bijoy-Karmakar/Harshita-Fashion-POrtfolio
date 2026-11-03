import React, { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import FadeIn from './FadeIn';
import Magnet from './Magnet';
import ContactButton from './ContactButton';
import {
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

export interface HeroSectionProps {
  onOpenContact?: () => void;
  canEdit?: boolean;
}

const HERO_PORTRAIT_URL = '/assets/portfolio/hero-portrait-a865a84b.png';

const HERO_PORTRAIT_STORAGE_KEY = 'harshita_portfolio_hero_portrait_v1';

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenContact,
  canEdit = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const [heroPortraitUrl, setHeroPortraitUrl] = useState<string>(() => {
    const bundledDefault = normalizeLegacyAssetUrl(
      BUNDLED_PUBLISHED_STATE.heroPortraitUrl,
      HERO_PORTRAIT_URL
    );
    try {
      const saved = localStorage.getItem(HERO_PORTRAIT_STORAGE_KEY);
      if (saved && saved.trim()) {
        const normalizedSaved = normalizeLegacyAssetUrl(saved, bundledDefault);
        if (isCustomUploadedAsset(normalizedSaved, HERO_PORTRAIT_URL)) {
          return normalizedSaved;
        }
      }
    } catch {
      // Fallback to default
    }
    return bundledDefault || HERO_PORTRAIT_URL;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userUploadedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchPublishedPortfolioState(),
      idbGet<string>(HERO_PORTRAIT_STORAGE_KEY),
    ]).then(async ([publishedState, savedUrl]) => {
      if (!isMounted || userUploadedRef.current) return;
      const pubNormalized = normalizeLegacyAssetUrl(
        publishedState?.heroPortraitUrl || BUNDLED_PUBLISHED_STATE.heroPortraitUrl,
        HERO_PORTRAIT_URL
      );
      const idbNormalized = normalizeLegacyAssetUrl(savedUrl, '');
      const stateNormalized = normalizeLegacyAssetUrl(heroPortraitUrl, '');

      const resolvedUrl =
        (isCustomUploadedAsset(idbNormalized, HERO_PORTRAIT_URL) ? idbNormalized : '') ||
        (isCustomUploadedAsset(stateNormalized, HERO_PORTRAIT_URL)
          ? stateNormalized
          : '') ||
        (isCustomUploadedAsset(pubNormalized, HERO_PORTRAIT_URL) ? pubNormalized : '') ||
        pubNormalized ||
        HERO_PORTRAIT_URL;

      if (!userUploadedRef.current) {
        setHeroPortraitUrl(resolvedUrl);
        setImgError(false);
      }

      if (isCustomUploadedAsset(resolvedUrl, HERO_PORTRAIT_URL)) {
        await idbSet(HERO_PORTRAIT_STORAGE_KEY, resolvedUrl);
        let serverUrl = resolvedUrl;
        if (
          canCurrentUserEditPortfolio() &&
          resolvedUrl.startsWith('data:image/') &&
          !resolvedUrl.startsWith('data:image/svg+xml;utf8,')
        ) {
          serverUrl = await uploadDataUrlAsLocalAsset('hero-portrait', resolvedUrl);
        }
        if (
          canCurrentUserEditPortfolio() &&
          !userUploadedRef.current &&
          serverUrl !== publishedState?.heroPortraitUrl
        ) {
          void syncPublishedPortfolioState({ heroPortraitUrl: serverUrl });
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePortraitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const persistPortrait = async (dataUrl: string) => {
      userUploadedRef.current = true;
      setHeroPortraitUrl(dataUrl);
      setImgError(false);
      await idbSet(HERO_PORTRAIT_STORAGE_KEY, dataUrl);

      const serverUrl = await uploadDataUrlAsLocalAsset('hero-portrait', dataUrl);
      void syncPublishedPortfolioState({ heroPortraitUrl: serverUrl });
      try {
        localStorage.setItem(HERO_PORTRAIT_STORAGE_KEY, serverUrl);
      } catch {
        try {
          localStorage.removeItem(HERO_PORTRAIT_STORAGE_KEY);
        } catch {
          // Ignore
        }
      }
    };

    readAndOptimizeImageFile(file)
      .then((optimizedDataUrl) => {
        void persistPortrait(optimizedDataUrl);
      })
      .catch(() => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            void persistPortrait(reader.result);
          }
        };
        reader.readAsDataURL(file);
      });
    e.target.value = '';
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      className="relative z-10 min-h-[100svh] h-[100svh] w-full flex flex-col justify-between bg-transparent select-none"
      style={{ overflowX: 'clip' }}
    >
      {/* Top Zone: Navbar + Massive Heading */}
      <div className="w-full relative z-20">
        <FadeIn delay={0} y={-20}>
          <nav
            aria-label="Primary Navigation"
            className="flex items-center justify-between px-4 sm:px-6 md:px-10 pt-5 sm:pt-6 md:pt-8"
          >
            <a
              href="#about"
              onClick={(e) => handleNavClick(e, 'about')}
              className="text-[#D7E2EA] font-medium uppercase tracking-wider text-xs sm:text-sm md:text-lg lg:text-[1.4rem] hover:opacity-70 transition-opacity duration-200 whitespace-nowrap py-1"
            >
              About
            </a>
            <a
              href="#projects"
              onClick={(e) => handleNavClick(e, 'projects')}
              className="text-[#D7E2EA] font-medium uppercase tracking-wider text-xs sm:text-sm md:text-lg lg:text-[1.4rem] hover:opacity-70 transition-opacity duration-200 whitespace-nowrap py-1"
            >
              Projects
            </a>
            <a
              href={buildGmailComposeUrl()}
              target="_blank"
              rel="noopener noreferrer"
              title={`Send a message to ${HARSHITA_GMAIL} on Gmail`}
              className="text-[#D7E2EA] font-medium uppercase tracking-wider text-xs sm:text-sm md:text-lg lg:text-[1.4rem] hover:opacity-70 transition-opacity duration-200 whitespace-nowrap py-1"
            >
              Contact
            </a>
          </nav>
        </FadeIn>

        <div className="overflow-hidden w-full px-3 sm:px-6 md:px-10">
          <FadeIn delay={0.15} y={40}>
            <h1 className="hero-heading font-black uppercase tracking-tight leading-none whitespace-nowrap w-full text-center text-[10.2vw] sm:text-[11vw] md:text-[11.5vw] lg:text-[12vw] mt-4 sm:mt-4 md:-mt-2 pb-2 sm:pb-3">
              HI, I&apos;M HARSHITA
            </h1>
          </FadeIn>
        </div>
      </div>

      {/* Centered Absolutely: Hero Portrait with Magnetic Hover */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10 w-[min(68vw,270px)] sm:w-[min(52vw,360px)] md:w-[min(44vw,440px)] lg:w-[min(38vw,520px)] top-[52%] -translate-y-1/2 sm:top-auto sm:translate-y-0 sm:bottom-0 pointer-events-auto">
        <FadeIn delay={0.6} y={30}>
          <Magnet
            padding={150}
            strength={3}
            activeTransition="transform 0.3s ease-out"
            inactiveTransition="transform 0.6s ease-in-out"
            className={`group relative ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {!imgError ? (
              <img
                src={heroPortraitUrl}
                alt="Harshita Atelier — Fashion Design Portrait"
                referrerPolicy="no-referrer"
                loading="eager"
                decoding="sync"
                onClick={canEdit ? () => fileInputRef.current?.click() : undefined}
                onError={() => {
                  if (heroPortraitUrl !== HERO_PORTRAIT_URL) {
                    setHeroPortraitUrl(HERO_PORTRAIT_URL);
                  } else {
                    setImgError(true);
                  }
                }}
                className={`w-full h-auto max-h-[54svh] sm:max-h-[68svh] md:max-h-[74svh] object-contain object-bottom block select-none mx-auto ${
                  canEdit ? 'cursor-pointer' : 'cursor-default'
                }`}
              />
            ) : (
              <div
                onClick={canEdit ? () => fileInputRef.current?.click() : undefined}
                className={`w-full aspect-[4/5] rounded-t-full bg-gradient-to-b from-[#646973]/40 to-[#0C0C0C] border border-[#D7E2EA]/20 flex items-center justify-center ${
                  canEdit ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <span className="text-[#D7E2EA] uppercase tracking-widest text-sm font-medium">
                  Harshita 3D
                </span>
              </div>
            )}
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-full bg-black/75 border border-[#D7E2EA]/40 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-[#D7E2EA] opacity-0 group-hover:opacity-100 hover:bg-white hover:text-[#0C0C0C] flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3 h-3" />
                  <span>Change Image</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePortraitUpload}
                  aria-label="Upload Hero Portrait Image"
                  className="hidden"
                />
              </>
            )}
          </Magnet>
        </FadeIn>
      </div>

      {/* Bottom Bar */}
      <div className="flex justify-between items-end gap-3 px-4 sm:px-6 md:px-10 pb-5 sm:pb-8 md:pb-10 relative z-20">
        <FadeIn delay={0.35} y={20}>
          <p
            className="text-[#D7E2EA] font-light uppercase tracking-wide leading-snug max-w-[150px] sm:max-w-[220px] md:max-w-[260px]"
            style={{ fontSize: 'clamp(0.7rem, 1.4vw, 1.5rem)' }}
          >
            A FASHION DESIGNER DRIVEN BY CRAFTING STRIKING AND UNFORGETTABLE PROJECTS
          </p>
        </FadeIn>

        <FadeIn delay={0.5} y={20}>
          <ContactButton onClick={onOpenContact} />
        </FadeIn>
      </div>
    </section>
  );
};

export default HeroSection;
