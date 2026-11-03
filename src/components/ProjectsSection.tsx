import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Upload } from 'lucide-react';
import LiveProjectButton from './LiveProjectButton';
import {
  calculateCardTargetScale,
  calculateCardTopOffset,
  calculateHeadingCharDelay,
  normalizeLegacyAssetUrl,
  isCustomUploadedAsset,
} from '../utils/portfolioMath';
import { CHEHRE_IMAGE_1, CHEHRE_IMAGE_2, CHEHRE_IMAGE_MAIN } from '../utils/chehreArtworks';
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

export interface ProjectItem {
  number: string;
  name: string;
  category: string;
  col1Image1: string;
  col1Image2: string;
  col2Image: string;
}

export const PROJECTS_DATA: ProjectItem[] = [
  {
    number: '01',
    name: 'CHEHRE',
    category: 'Personal',
    col1Image1: CHEHRE_IMAGE_1,
    col1Image2: CHEHRE_IMAGE_2,
    col2Image: CHEHRE_IMAGE_MAIN,
  },
  {
    number: '02',
    name: 'THE TALE OF THE WALL',
    category: 'Personal',
    col1Image1: '/assets/portfolio/project-02-col1Image1-feeb3782.jpg',
    col1Image2: '/assets/portfolio/project-02-col1Image2-05a073b8.jpg',
    col2Image: '/assets/portfolio/project-02-col2Image-dffa6b9f.jpg',
  },
  {
    number: '03',
    name: 'ENGINEERED IN DENIM',
    category: 'Personal',
    col1Image1: '/assets/portfolio/project-03-col1Image1-1900c502.png',
    col1Image2: '/assets/portfolio/project-03-col1Image2-bf62e2f4.png',
    col2Image: '/assets/portfolio/project-03-col2Image-ef547fc4.jpg',
  },
  {
    number: '04',
    name: 'ENCHANTED GARDEN',
    category: 'Personal',
    col1Image1: '/assets/portfolio/project-04-col1Image1-006cbf00.png',
    col1Image2: '/assets/portfolio/project-04-col1Image2-52482636.png',
    col2Image: '/assets/portfolio/project-04-col2Image-1ff5d94d.jpg',
  },
  {
    number: '05',
    name: 'DEEP UNDER THE SEA',
    category: 'Personal',
    col1Image1: '/assets/portfolio/project-05-col1Image1-c0405f55.png',
    col1Image2: '/assets/portfolio/project-05-col1Image2-3f0d2134.png',
    col2Image: '/assets/portfolio/project-05-col2Image-3198c777.jpg',
  },
];

const PROJECT_IMAGES_STORAGE_KEY = 'harshita_portfolio_project_images_v2';

interface StickyProjectCardProps {
  project: ProjectItem;
  index: number;
  totalCards: number;
  canEdit: boolean;
  onSelectProject: (project: ProjectItem) => void;
  onUpdateProjectImage: (
    projectNumber: string,
    slot: 'col1Image1' | 'col1Image2' | 'col2Image',
    dataUrl: string
  ) => void;
}

interface ProjectHeadingRowProps {
  project: ProjectItem;
  onSelectProject: (project: ProjectItem) => void;
}

const ProjectHeadingRow: React.FC<ProjectHeadingRowProps> = React.memo(
  ({ project, onSelectProject }) => {
    const headingRowRef = useRef<HTMLDivElement>(null);
    const isHeadingInView = useInView(headingRowRef, {
      once: false,
      amount: 0.05,
      margin: '40px 0px -2% 0px',
    });

    return (
      <div
        ref={headingRowRef}
        className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 px-1 sm:px-4"
      >
        <div className="flex items-center gap-3 sm:gap-8 md:gap-12 min-w-0">
          {/* Animated Giant Project Number (01 - 05) */}
          <span
            aria-label={project.number}
            className="font-black text-[#D7E2EA] leading-none tabular-nums inline-flex overflow-hidden py-1 shrink-0"
            style={{ fontSize: 'clamp(2.5rem, 10vw, 140px)' }}
          >
            {project.number.split('').map((digit, digitIdx) => (
              <motion.span
                key={digitIdx}
                aria-hidden="true"
                initial={{ y: '85%', opacity: 0 }}
                animate={
                  isHeadingInView
                    ? { y: '0%', opacity: 1 }
                    : { y: '85%', opacity: 0 }
                }
                transition={
                  isHeadingInView
                    ? {
                        duration: 0.54,
                        delay: calculateHeadingCharDelay(digitIdx, 0, 0.025),
                        ease: [0.16, 1, 0.3, 1],
                      }
                    : { duration: 0.12, delay: 0, ease: 'easeOut' }
                }
                style={{ willChange: 'transform, opacity' }}
                className="inline-block"
              >
                {digit}
              </motion.span>
            ))}
          </span>

          <div className="flex flex-col gap-1">
            {/* Animated Category Label */}
            <div className="overflow-hidden">
              <motion.span
                initial={{ y: '85%', opacity: 0 }}
                animate={
                  isHeadingInView ? { y: '0%', opacity: 1 } : { y: '85%', opacity: 0 }
                }
                transition={
                  isHeadingInView
                    ? {
                        duration: 0.48,
                        delay: 0,
                        ease: [0.16, 1, 0.3, 1],
                      }
                    : { duration: 0.12, delay: 0, ease: 'easeOut' }
                }
                style={{ willChange: 'transform, opacity' }}
                className="text-[#D7E2EA]/60 font-light uppercase tracking-widest text-xs sm:text-sm md:text-base inline-block"
              >
                {project.category}
              </motion.span>
            </div>

            {/* Animated Project Heading Title (Applies to all 5 Projects) */}
            <div className="relative inline-flex flex-col">
              <h3
                aria-label={project.name}
                className="text-[#D7E2EA] font-medium uppercase tracking-wide leading-tight flex flex-wrap gap-x-[0.28em]"
                style={{ fontSize: 'clamp(1.1rem, 2.4vw, 2.25rem)' }}
              >
                {(() => {
                  let runningCharIdx = 0;
                  return project.name.split(' ').map((word, wordIdx) => (
                    <span
                      key={wordIdx}
                      aria-hidden="true"
                      className="inline-flex overflow-hidden py-0.5"
                    >
                      {word.split('').map((char, charIdx) => {
                        const delay = calculateHeadingCharDelay(
                          runningCharIdx++,
                          0,
                          0.012
                        );
                        return (
                          <motion.span
                            key={charIdx}
                            initial={{ y: '85%', opacity: 0 }}
                            animate={
                              isHeadingInView
                                ? { y: '0%', opacity: 1 }
                                : { y: '85%', opacity: 0 }
                            }
                            transition={
                              isHeadingInView
                                ? {
                                    duration: 0.54,
                                    delay,
                                    ease: [0.16, 1, 0.3, 1],
                                  }
                                : { duration: 0.12, delay: 0, ease: 'easeOut' }
                            }
                            style={{ willChange: 'transform, opacity' }}
                            className="inline-block"
                          >
                            {char}
                          </motion.span>
                        );
                      })}
                    </span>
                  ));
                })()}
              </h3>
              <motion.span
                aria-hidden="true"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={
                  isHeadingInView
                    ? { scaleX: 1, opacity: 0.45 }
                    : { scaleX: 0, opacity: 0 }
                }
                transition={
                  isHeadingInView
                    ? {
                        duration: 0.6,
                        delay: 0.03,
                        ease: [0.16, 1, 0.3, 1],
                      }
                    : { duration: 0.12, delay: 0, ease: 'easeOut' }
                }
                style={{ willChange: 'transform, opacity' }}
                className="h-[1.5px] w-full bg-gradient-to-r from-[#D7E2EA] via-[#BBCCD7] to-transparent origin-left mt-1 block"
              />
            </div>
          </div>
        </div>

        <LiveProjectButton
          ariaLabel={`Live Project: ${project.name}`}
          onClick={() => onSelectProject(project)}
        />
      </div>
    );
  }
);

const StickyProjectCard: React.FC<StickyProjectCardProps> = ({
  project,
  index,
  totalCards,
  canEdit,
  onSelectProject,
  onUpdateProjectImage,
}) => {
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);
  const fileInput3Ref = useRef<HTMLInputElement>(null);

  const { scrollYProgress } = useScroll({
    target: cardContainerRef,
    offset: ['start start', 'end start'],
  });

  const targetScale = calculateCardTargetScale(index, totalCards);
  const topOffset = calculateCardTopOffset(index);
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);

  const handleImageFileChange = (
    slot: 'col1Image1' | 'col1Image2' | 'col2Image',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (!file) return;
    readAndOptimizeImageFile(file)
      .then((optimizedDataUrl) => {
        onUpdateProjectImage(project.number, slot, optimizedDataUrl);
      })
      .catch(() => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onUpdateProjectImage(project.number, slot, reader.result);
          }
        };
        reader.readAsDataURL(file);
      });
    e.target.value = '';
  };

  return (
    <div
      ref={cardContainerRef}
      className="min-h-[78vh] md:h-[85vh] flex items-start justify-center sticky top-12 sm:top-20 md:top-28"
    >
      <motion.div
        style={{
          scale,
          top: `${topOffset}px`,
          transformOrigin: 'top center',
          willChange: 'transform',
        }}
        className="relative w-full max-w-6xl rounded-[32px] sm:rounded-[48px] md:rounded-[60px] border-2 border-[#D7E2EA] bg-[#060709] p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6 md:gap-8 shadow-2xl"
      >
        {/* Top Row: Animated Number, Category + Name Heading, and Live Project Ghost Button */}
        <ProjectHeadingRow project={project} onSelectProject={onSelectProject} />

        {/* Bottom Row: Two-Column Image Grid (40% left stacked on md+, side-by-side on mobile; 60% right tall) */}
        <div className="flex flex-col md:flex-row gap-2.5 sm:gap-4 w-full">
          {/* Left Column (40% on md+, 2-col grid on mobile) */}
          <div className="w-full md:w-[40%] grid grid-cols-2 md:flex md:flex-col gap-2.5 sm:gap-4">
            <div
              onClick={canEdit ? () => fileInput1Ref.current?.click() : undefined}
              title={canEdit ? `Click to upload or replace ${project.name} image 1` : undefined}
              className={`group relative w-full overflow-hidden rounded-[24px] sm:rounded-[40px] md:rounded-[60px] bg-[#16181C] h-[135px] sm:h-[165px] md:h-[clamp(130px,16vw,230px)] ${
                canEdit ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <img
                src={project.col1Image1}
                alt={`${project.name} preview 1`}
                referrerPolicy="no-referrer"
                loading="eager"
                decoding="sync"
                onError={(e) => {
                  const defaultImg = PROJECTS_DATA[index]?.col1Image1;
                  if (defaultImg && e.currentTarget.src !== window.location.origin + defaultImg) {
                    e.currentTarget.src = defaultImg;
                  }
                }}
                className="w-full h-full object-cover rounded-[24px] sm:rounded-[40px] md:rounded-[60px] block"
              />
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInput1Ref.current?.click();
                    }}
                    className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-4 z-10 rounded-full bg-black/75 border border-[#D7E2EA]/40 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-[#D7E2EA] opacity-85 group-hover:opacity-100 hover:bg-white hover:text-[#0C0C0C] flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Change Image</span>
                  </button>
                  <input
                    ref={fileInput1Ref}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange('col1Image1', e)}
                    aria-label={`Upload ${project.name} image 1`}
                    className="hidden"
                  />
                </>
              )}
            </div>

            <div
              onClick={canEdit ? () => fileInput2Ref.current?.click() : undefined}
              title={canEdit ? `Click to upload or replace ${project.name} image 2` : undefined}
              className={`group relative w-full overflow-hidden rounded-[24px] sm:rounded-[40px] md:rounded-[60px] bg-[#16181C] h-[135px] sm:h-[165px] md:h-[clamp(160px,22vw,340px)] ${
                canEdit ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <img
                src={project.col1Image2}
                alt={`${project.name} preview 2`}
                referrerPolicy="no-referrer"
                loading="eager"
                decoding="sync"
                onError={(e) => {
                  const defaultImg = PROJECTS_DATA[index]?.col1Image2;
                  if (defaultImg && e.currentTarget.src !== window.location.origin + defaultImg) {
                    e.currentTarget.src = defaultImg;
                  }
                }}
                className="w-full h-full object-cover rounded-[24px] sm:rounded-[40px] md:rounded-[60px] block"
              />
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInput2Ref.current?.click();
                    }}
                    className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-4 z-10 rounded-full bg-black/75 border border-[#D7E2EA]/40 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-[#D7E2EA] opacity-85 group-hover:opacity-100 hover:bg-white hover:text-[#0C0C0C] flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Change Image</span>
                  </button>
                  <input
                    ref={fileInput2Ref}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange('col1Image2', e)}
                    aria-label={`Upload ${project.name} image 2`}
                    className="hidden"
                  />
                </>
              )}
            </div>
          </div>

          {/* Right Column (60%) */}
          <div
            onClick={canEdit ? () => fileInput3Ref.current?.click() : undefined}
            title={canEdit ? `Click to upload or replace ${project.name} main image` : undefined}
            className={`group relative w-full md:w-[60%] overflow-hidden rounded-[24px] sm:rounded-[40px] md:rounded-[60px] bg-[#16181C] h-[210px] sm:h-[260px] md:h-[calc(clamp(130px,16vw,230px)+clamp(160px,22vw,340px)+1rem)] ${
              canEdit ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            <img
              src={project.col2Image}
              alt={`${project.name} main showcase`}
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="sync"
              onError={(e) => {
                const defaultImg = PROJECTS_DATA[index]?.col2Image;
                if (defaultImg && e.currentTarget.src !== window.location.origin + defaultImg) {
                  e.currentTarget.src = defaultImg;
                }
              }}
              className="w-full h-full object-cover rounded-[24px] sm:rounded-[40px] md:rounded-[60px] block"
            />
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInput3Ref.current?.click();
                  }}
                  className="absolute bottom-3 right-3 sm:bottom-4 sm:right-5 z-10 rounded-full bg-black/75 border border-[#D7E2EA]/40 px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium uppercase tracking-wider text-[#D7E2EA] opacity-85 group-hover:opacity-100 hover:bg-white hover:text-[#0C0C0C] flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Change Image</span>
                </button>
                <input
                  ref={fileInput3Ref}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileChange('col2Image', e)}
                  aria-label={`Upload ${project.name} main showcase image`}
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export interface ProjectsSectionProps {
  onSelectProject: (project: ProjectItem) => void;
  canEdit?: boolean;
}

type ProjectSlotKey = 'col1Image1' | 'col1Image2' | 'col2Image';
const PROJECT_SLOTS: ProjectSlotKey[] = ['col1Image1', 'col1Image2', 'col2Image'];
const LEGACY_PROJECT_IMAGES_V1_KEY = 'harshita_portfolio_project_images_v1';

function resolveProjectSlotValue(
  defaultVal: string,
  ...candidates: Array<string | undefined | null>
): string {
  let resolved = defaultVal;
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string' || !candidate.trim()) continue;
    const normalized = normalizeLegacyAssetUrl(candidate, defaultVal);
    if (!normalized) continue;
    const currentIsCustom = isCustomUploadedAsset(resolved, defaultVal);
    const candidateIsCustom = isCustomUploadedAsset(normalized, defaultVal);
    const candidateIsDataUrl =
      normalized.startsWith('data:image/') &&
      !normalized.startsWith('data:image/svg+xml;utf8,');
    if (!currentIsCustom || candidateIsCustom) {
      if (
        resolved.startsWith('data:image/') &&
        !resolved.startsWith('data:image/svg+xml;utf8,') &&
        !candidateIsDataUrl
      ) {
        continue;
      }
      resolved = normalized;
    }
  }
  return resolved;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  onSelectProject,
  canEdit = false,
}) => {
  const userEditedSlotsRef = useRef<
    Record<string, Partial<Record<ProjectSlotKey, string>>>
  >({});

  const [projects, setProjects] = React.useState<ProjectItem[]>(() => {
    let parsedLocal: Record<
      string,
      Partial<Pick<ProjectItem, 'col1Image1' | 'col1Image2' | 'col2Image'>>
    > | null = null;
    try {
      const saved =
        localStorage.getItem(PROJECT_IMAGES_STORAGE_KEY) ||
        localStorage.getItem(LEGACY_PROJECT_IMAGES_V1_KEY);
      if (saved) {
        parsedLocal = JSON.parse(saved);
      }
    } catch {
      // Fallback to default
    }

    return PROJECTS_DATA.map((item) => {
      const bundledOverride = BUNDLED_PUBLISHED_STATE.projectImagesOverrides?.[item.number];
      const localOverride = parsedLocal?.[item.number];
      return {
        ...item,
        col1Image1: resolveProjectSlotValue(
          item.col1Image1,
          bundledOverride?.col1Image1,
          localOverride?.col1Image1
        ),
        col1Image2: resolveProjectSlotValue(
          item.col1Image2,
          bundledOverride?.col1Image2,
          localOverride?.col1Image2
        ),
        col2Image: resolveProjectSlotValue(
          item.col2Image,
          bundledOverride?.col2Image,
          localOverride?.col2Image
        ),
      };
    });
  });

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchPublishedPortfolioState(),
      idbGet<Record<string, Partial<Pick<ProjectItem, 'col1Image1' | 'col1Image2' | 'col2Image'>>>>(
        PROJECT_IMAGES_STORAGE_KEY
      ),
      idbGet<Record<string, Partial<Pick<ProjectItem, 'col1Image1' | 'col1Image2' | 'col2Image'>>>>(
        LEGACY_PROJECT_IMAGES_V1_KEY
      ),
      ...PROJECTS_DATA.map((p) =>
        idbGet<Partial<Pick<ProjectItem, 'col1Image1' | 'col1Image2' | 'col2Image'>>>(
          `${PROJECT_IMAGES_STORAGE_KEY}_${p.number}`
        )
      ),
    ]).then(
      async ([
        publishedState,
        legacyOverrides,
        legacyV1Overrides,
        ...perProjectOverrides
      ]) => {
        if (!isMounted) return;

        let latestProjectsSnapshot: ProjectItem[] = [];

        setProjects((prev) => {
          const nextProjects = PROJECTS_DATA.map((defaultItem, idx) => {
            const currentItem = prev[idx] || defaultItem;
            const bundledOverride =
              BUNDLED_PUBLISHED_STATE.projectImagesOverrides?.[defaultItem.number];
            const pubOverride =
              publishedState?.projectImagesOverrides?.[defaultItem.number];
            const legV1Override = legacyV1Overrides?.[defaultItem.number];
            const legOverride = legacyOverrides?.[defaultItem.number];
            const perOverride = perProjectOverrides[idx];
            const userEdited = userEditedSlotsRef.current[defaultItem.number];

            return {
              ...defaultItem,
              col1Image1:
                userEdited?.col1Image1 ||
                resolveProjectSlotValue(
                  defaultItem.col1Image1,
                  bundledOverride?.col1Image1,
                  pubOverride?.col1Image1,
                  legV1Override?.col1Image1,
                  legOverride?.col1Image1,
                  perOverride?.col1Image1,
                  currentItem.col1Image1
                ),
              col1Image2:
                userEdited?.col1Image2 ||
                resolveProjectSlotValue(
                  defaultItem.col1Image2,
                  bundledOverride?.col1Image2,
                  pubOverride?.col1Image2,
                  legV1Override?.col1Image2,
                  legOverride?.col1Image2,
                  perOverride?.col1Image2,
                  currentItem.col1Image2
                ),
              col2Image:
                userEdited?.col2Image ||
                resolveProjectSlotValue(
                  defaultItem.col2Image,
                  bundledOverride?.col2Image,
                  pubOverride?.col2Image,
                  legV1Override?.col2Image,
                  legOverride?.col2Image,
                  perOverride?.col2Image,
                  currentItem.col2Image
                ),
            };
          });
          latestProjectsSnapshot = nextProjects;
          return nextProjects;
        });

        // In owner dev mode, materialize any `data:image/` custom uploads to `/public/assets/portfolio/`
        // in the background WITHOUT replacing React state or overwriting IndexedDB's raw dataUrl!
        if (canCurrentUserEditPortfolio() && latestProjectsSnapshot.length > 0) {
          let hasChangesToSync = false;
          const idbOverrides: Record<
            string,
            Partial<Pick<ProjectItem, 'col1Image1' | 'col1Image2' | 'col2Image'>>
          > = {};
          const serverOverrides: Record<
            string,
            Partial<Pick<ProjectItem, 'col1Image1' | 'col1Image2' | 'col2Image'>>
          > = {};

          for (let i = 0; i < latestProjectsSnapshot.length; i++) {
            const item = latestProjectsSnapshot[i];
            const defaultItem = PROJECTS_DATA[i];
            const pubOverride = publishedState?.projectImagesOverrides?.[item.number];
            const itemIdbSlots: Partial<
              Pick<ProjectItem, 'col1Image1' | 'col1Image2' | 'col2Image'>
            > = {};
            const itemServerSlots: Partial<
              Pick<ProjectItem, 'col1Image1' | 'col1Image2' | 'col2Image'>
            > = {};

            for (const slot of PROJECT_SLOTS) {
              const val = item[slot];
              itemIdbSlots[slot] = val;
              let serverVal = val;

              if (
                val &&
                val.startsWith('data:image/') &&
                !val.startsWith('data:image/svg+xml;utf8,')
              ) {
                serverVal = await uploadDataUrlAsLocalAsset(
                  `project-${item.number}-${slot}`,
                  val
                );
                hasChangesToSync = true;
              } else if (
                isCustomUploadedAsset(val, defaultItem[slot]) &&
                val !== pubOverride?.[slot]
              ) {
                hasChangesToSync = true;
              }
              itemServerSlots[slot] = serverVal;
            }

            idbOverrides[item.number] = itemIdbSlots;
            serverOverrides[item.number] = itemServerSlots;
            await idbSet(`${PROJECT_IMAGES_STORAGE_KEY}_${item.number}`, itemIdbSlots);
          }

          await idbSet(PROJECT_IMAGES_STORAGE_KEY, idbOverrides);
          if (hasChangesToSync) {
            void syncPublishedPortfolioState({ projectImagesOverrides: serverOverrides });
          }
        }
      }
    );
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateProjectImage = (
    projectNumber: string,
    slot: 'col1Image1' | 'col1Image2' | 'col2Image',
    dataUrl: string
  ) => {
    if (!canEdit) return;

    userEditedSlotsRef.current[projectNumber] = {
      ...(userEditedSlotsRef.current[projectNumber] || {}),
      [slot]: dataUrl,
    };

    // 1. Update React state & IndexedDB immediately with full dataUrl (never replaced later)
    setProjects((prev) => {
      const updated = prev.map((item) =>
        item.number === projectNumber ? { ...item, [slot]: dataUrl } : item
      );
      const idbOverrides: Record<
        string,
        Partial<Pick<ProjectItem, 'col1Image1' | 'col1Image2' | 'col2Image'>>
      > = {};
      updated.forEach((item) => {
        idbOverrides[item.number] = {
          col1Image1: item.col1Image1,
          col1Image2: item.col1Image2,
          col2Image: item.col2Image,
        };
      });
      if (idbOverrides[projectNumber]) {
        void idbSet(
          `${PROJECT_IMAGES_STORAGE_KEY}_${projectNumber}`,
          idbOverrides[projectNumber]
        );
      }
      void idbSet(PROJECT_IMAGES_STORAGE_KEY, idbOverrides);
      return updated;
    });

    // 2. Upload physical file to `/public/assets/portfolio/` and sync server state in background
    void uploadDataUrlAsLocalAsset(`project-${projectNumber}-${slot}`, dataUrl).then(
      (serverPath) => {
        void syncPublishedPortfolioState({
          projectImagesOverrides: {
            [projectNumber]: {
              [slot]: serverPath || dataUrl,
            },
          },
        });
        try {
          const existingLocal = localStorage.getItem(PROJECT_IMAGES_STORAGE_KEY);
          const parsedLocal = existingLocal ? JSON.parse(existingLocal) : {};
          parsedLocal[projectNumber] = {
            ...(parsedLocal[projectNumber] || {}),
            [slot]: serverPath,
          };
          localStorage.setItem(PROJECT_IMAGES_STORAGE_KEY, JSON.stringify(parsedLocal));
        } catch {
          // Ignore quota errors
        }
      }
    );
  };

  const sectionHeadingRef = useRef<HTMLHeadingElement>(null);
  const isSectionHeadingInView = useInView(sectionHeadingRef, {
    once: false,
    amount: 0.1,
    margin: '0px 0px -4% 0px',
  });

  return (
    <section
      id="projects"
      className="bg-transparent relative z-10 px-4 sm:px-8 md:px-10 pt-20 sm:pt-24 md:pt-32 pb-28 sm:pb-36"
    >
      <h2
        ref={sectionHeadingRef}
        aria-label="Project"
        className="relative z-10 font-black uppercase leading-none tracking-tight text-center mb-16 sm:mb-20 md:mb-28 flex justify-center overflow-hidden py-2"
        style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
      >
        {'PROJECT'.split('').map((char, idx) => (
          <motion.span
            key={idx}
            aria-hidden="true"
            initial={{ y: '100%', opacity: 0 }}
            animate={
              isSectionHeadingInView
                ? { y: '0%', opacity: 1 }
                : { y: '100%', opacity: 0 }
            }
            transition={
              isSectionHeadingInView
                ? {
                    duration: 0.52,
                    delay: calculateHeadingCharDelay(idx, 0, 0.022),
                    ease: [0.22, 1, 0.36, 1],
                  }
                : { duration: 0.12, delay: 0, ease: 'easeOut' }
            }
            style={{ willChange: 'transform, opacity' }}
            className="hero-heading inline-block"
          >
            {char}
          </motion.span>
        ))}
      </h2>

      <div className="relative flex flex-col gap-8">
        {projects.map((project, index) => (
          <StickyProjectCard
            key={project.number}
            project={project}
            index={index}
            totalCards={projects.length}
            canEdit={canEdit}
            onSelectProject={onSelectProject}
            onUpdateProjectImage={handleUpdateProjectImage}
          />
        ))}
      </div>
    </section>
  );
};

export default ProjectsSection;
