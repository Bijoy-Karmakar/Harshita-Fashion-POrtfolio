import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { calculateMarqueeOffset, calculateMarqueeTransforms } from '../utils/portfolioMath';
import { FASHION_MARQUEE_PLATES } from '../utils/fashionMarqueeArtworks';
import {
  loadMarqueeImagesFromLocalStorage,
  loadAllMarqueeImagesPersistent,
  saveSingleMarqueeImagePersistent,
  mergeMarqueeImages,
  readAndOptimizeImageFile,
} from '../utils/persistentStorage';

export const MARQUEE_IMAGES = FASHION_MARQUEE_PLATES;

interface MarqueeTileProps {
  src: string;
  alt: string;
  baseIdx: number;
  canEdit: boolean;
  onUpload: (baseIndex: number, dataUrl: string) => void;
}

const MarqueeTile: React.FC<MarqueeTileProps> = React.memo(
  ({ src, alt, baseIdx, canEdit, onUpload }) => {
    const [failed, setFailed] = useState(false);
    const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      setFailed(false);
      setFallbackSrc(null);
    }, [src]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!canEdit) return;
      const file = e.target.files?.[0];
      if (!file) return;
      readAndOptimizeImageFile(file)
        .then((optimizedDataUrl) => {
          setFailed(false);
          setFallbackSrc(null);
          onUpload(baseIdx, optimizedDataUrl);
        })
        .catch(() => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              setFailed(false);
              setFallbackSrc(null);
              onUpload(baseIdx, reader.result);
            }
          };
          reader.readAsDataURL(file);
        });
      e.target.value = '';
    };

    const effectiveSrc = fallbackSrc || src || MARQUEE_IMAGES[baseIdx];

    return (
      <div
        onClick={canEdit ? () => fileInputRef.current?.click() : undefined}
        title={canEdit ? 'Click to upload your own fashion lookbook image' : undefined}
        className={`group w-[250px] h-[160px] sm:w-[330px] sm:h-[212px] md:w-[380px] md:h-[244px] lg:w-[420px] lg:h-[270px] shrink-0 rounded-2xl overflow-hidden bg-[#16181C] relative border border-[#D7E2EA]/10 transition-colors ${
          canEdit ? 'cursor-pointer hover:border-[#D7E2EA]/40' : 'cursor-default'
        }`}
      >
        {!failed && effectiveSrc ? (
          <img
            src={effectiveSrc}
            alt={alt}
            loading="eager"
            decoding="sync"
            referrerPolicy="no-referrer"
            onError={() => {
              if (effectiveSrc !== MARQUEE_IMAGES[baseIdx]) {
                setFallbackSrc(MARQUEE_IMAGES[baseIdx]);
              } else {
                setFailed(true);
              }
            }}
            className="w-full h-full rounded-2xl object-cover block transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1A1D24] to-[#0C0C0C] border border-[#D7E2EA]/10 rounded-2xl">
            <span className="text-[#D7E2EA]/50 text-xs uppercase tracking-widest">{alt}</span>
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
              className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 z-10 rounded-full bg-black/75 border border-[#D7E2EA]/40 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-[#D7E2EA] opacity-0 group-hover:opacity-100 hover:bg-white hover:text-[#0C0C0C] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>Change Image</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              aria-label={`Upload custom image for ${alt}`}
              className="hidden"
            />
          </>
        )}
      </div>
    );
  }
);

export interface MarqueeSectionProps {
  canEdit?: boolean;
}

export const MarqueeSection: React.FC<MarqueeSectionProps> = ({ canEdit = false }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const userEditedSlotsRef = useRef<Record<number, string>>({});
  const [images, setImages] = useState<string[]>(() =>
    loadMarqueeImagesFromLocalStorage(MARQUEE_IMAGES)
  );

  useEffect(() => {
    let isMounted = true;
    loadAllMarqueeImagesPersistent(MARQUEE_IMAGES).then((loadedImages) => {
      if (isMounted) {
        setImages((prev) => {
          const merged = mergeMarqueeImages(MARQUEE_IMAGES, loadedImages, prev);
          for (const [idxStr, customUrl] of Object.entries(userEditedSlotsRef.current)) {
            merged[Number(idxStr)] = customUrl;
          }
          return merged;
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let rafId = 0;

    const applyTransforms = () => {
      rafId = 0;
      if (!sectionRef.current) return;
      const sectionTop = sectionRef.current.offsetTop;
      const computed = calculateMarqueeOffset(
        window.scrollY,
        sectionTop,
        window.innerHeight
      );
      const { row1Transform, row2Transform } = calculateMarqueeTransforms(computed);
      if (row1Ref.current) {
        row1Ref.current.style.transform = row1Transform;
      }
      if (row2Ref.current) {
        row2Ref.current.style.transform = row2Transform;
      }
    };

    const onScrollOrResize = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(applyTransforms);
      }
    };

    applyTransforms();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  const handleUpdateImage = useCallback(
    (baseIndex: number, dataUrl: string) => {
      if (!canEdit) return;
      userEditedSlotsRef.current[baseIndex] = dataUrl;
      setImages((prev) => {
        const next = [...prev];
        next[baseIndex] = dataUrl;
        void saveSingleMarqueeImagePersistent(baseIndex, dataUrl, next, MARQUEE_IMAGES);
        return next;
      });
    },
    [canEdit]
  );

  const row1Base = images.slice(0, 11);
  const row2Base = images.slice(11, 21);

  const row1Tripled = [...row1Base, ...row1Base, ...row1Base];
  const row2Tripled = [...row2Base, ...row2Base, ...row2Base];

  const initialTransforms = calculateMarqueeTransforms(0);

  return (
    <section
      ref={sectionRef}
      aria-label="Fashion Lookbook Showcase"
      className="relative z-10 bg-transparent pt-16 sm:pt-28 md:pt-40 pb-10 overflow-hidden"
    >
      <div className="flex flex-col gap-3 items-center">
        {/* Row 1: first 11 images, tripled, moves RIGHT on scroll */}
        <div
          ref={row1Ref}
          className="flex gap-2.5 sm:gap-3"
          style={{
            transform: initialTransforms.row1Transform,
            willChange: 'transform',
          }}
        >
          {row1Tripled.map((url, idx) => {
            const baseIdx = idx % 11;
            return (
              <MarqueeTile
                key={`r1-${idx}`}
                src={url}
                alt={`Fashion Lookbook Row 1 Item ${baseIdx + 1}`}
                baseIdx={baseIdx}
                canEdit={canEdit}
                onUpload={handleUpdateImage}
              />
            );
          })}
        </div>

        {/* Row 2: remaining 10 images, tripled, moves LEFT on scroll */}
        <div
          ref={row2Ref}
          className="flex gap-2.5 sm:gap-3"
          style={{
            transform: initialTransforms.row2Transform,
            willChange: 'transform',
          }}
        >
          {row2Tripled.map((url, idx) => {
            const baseIdx = 11 + (idx % 10);
            return (
              <MarqueeTile
                key={`r2-${idx}`}
                src={url}
                alt={`Fashion Lookbook Row 2 Item ${(idx % 10) + 1}`}
                baseIdx={baseIdx}
                canEdit={canEdit}
                onUpload={handleUpdateImage}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MarqueeSection;
