import {
  ProjectDocumentation,
  IdentityProfile,
  getDefaultProjectDocumentation,
  isOwnerEditEnvironment,
  normalizeLegacyAssetUrl,
  isCustomUploadedAsset,
  isCorruptedOrDeletedAssetUrl,
  isLegacyOrStaleProjectText,
} from './portfolioMath';
import BUNDLED_PUBLISHED_STATE_RAW from '../data/publishedPortfolioState.json';

const IDB_NAME = 'harshita_portfolio_idb_v1';
const IDB_VERSION = 1;
const STORE_KV = 'portfolio_kv';

const LEGACY_DOCS_KEY = 'harshita_portfolio_project_docs_v2';
const PER_PROJECT_DOC_PREFIX = 'harshita_portfolio_project_doc_v3_';

export const ALL_PROJECT_NUMBERS = ['01', '02', '03', '04', '05'] as const;

export interface ProjectImageSlotsOverride {
  col1Image1?: string;
  col1Image2?: string;
  col2Image?: string;
}

export interface PublishedPortfolioState {
  heroPortraitUrl?: string;
  marqueeOverrides?: Record<number | string, string>;
  identityProfile?: Partial<IdentityProfile>;
  projectImagesOverrides?: Record<string, ProjectImageSlotsOverride>;
  projectDocs?: Record<string, Partial<ProjectDocumentation> & { __forceReset?: boolean }>;
}

export const BUNDLED_PUBLISHED_STATE: PublishedPortfolioState =
  BUNDLED_PUBLISHED_STATE_RAW as unknown as PublishedPortfolioState;

let cachedPublishedStatePromise: Promise<PublishedPortfolioState | null> | null = null;
const uploadedDataUrlCache = new Map<string, Promise<string>>();

/**
 * Checks whether the current browser session is in Owner Edit mode.
 */
export function canCurrentUserEditPortfolio(): boolean {
  if (typeof window === 'undefined') return false;
  return isOwnerEditEnvironment(window.location.hostname, window.location.search);
}

/**
 * Uploads a `data:image/...;base64,...` string in chunks to `/api/portfolio-upload-asset`
 * so the server writes a physical image file inside `/public/assets/portfolio/` and updates
 * `/public/portfolio-published-state.json` and `/src/data/publishedPortfolioState.json` for GitHub & Render.
 */
export function uploadDataUrlAsLocalAsset(
  slotKey: string,
  dataUrl: string
): Promise<string> {
  if (
    !canCurrentUserEditPortfolio() ||
    !dataUrl ||
    typeof dataUrl !== 'string' ||
    !dataUrl.startsWith('data:image/') ||
    dataUrl.startsWith('data:image/svg+xml;utf8,')
  ) {
    return Promise.resolve(dataUrl);
  }

  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) {
    return Promise.resolve(dataUrl);
  }

  const header = dataUrl.slice(0, commaIdx);
  const base64Payload = dataUrl.slice(commaIdx + 1);
  if (!base64Payload || base64Payload.length < 64) {
    return Promise.resolve(dataUrl);
  }

  const mimeMatch = header.match(/^data:(image\/[a-zA-Z0-9.+-]+)/i);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  const cacheKey = `${slotKey}:${base64Payload.length}:${base64Payload.slice(0, 64)}:${base64Payload.slice(-64)}`;
  const existing = uploadedDataUrlCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const uploadPromise = (async () => {
    try {
      const CHUNK_SIZE = 600_000;
      const totalChunks = Math.max(1, Math.ceil(base64Payload.length / CHUNK_SIZE));
      const uploadId = `${slotKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      let finalAssetPath = '';

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const chunkSlice = base64Payload.slice(
          chunkIndex * CHUNK_SIZE,
          (chunkIndex + 1) * CHUNK_SIZE
        );
        const res = await fetch('/api/portfolio-upload-asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadId,
            slotKey,
            mimeType,
            chunkIndex,
            totalChunks,
            chunkData: chunkSlice,
            chunk: chunkSlice,
          }),
        });
        if (!res.ok) {
          uploadedDataUrlCache.delete(cacheKey);
          return dataUrl;
        }
        const json = (await res.json()) as {
          ok?: boolean;
          partial?: boolean;
          assetPath?: string;
        };
        if (json.assetPath && !isCorruptedOrDeletedAssetUrl(json.assetPath)) {
          finalAssetPath = json.assetPath;
        }
      }

      if (!finalAssetPath) {
        uploadedDataUrlCache.delete(cacheKey);
        return dataUrl;
      }

      cachedPublishedStatePromise = null;
      return finalAssetPath;
    } catch {
      uploadedDataUrlCache.delete(cacheKey);
      return dataUrl;
    }
  })();

  uploadedDataUrlCache.set(cacheKey, uploadPromise);
  return uploadPromise;
}

/**
 * Fetches the server-persisted published portfolio state so visitors opening the shared
 * or deployed link (including static GitHub/Render deployments) see all of the owner's
 * uploaded images and text edits.
 */
export function fetchPublishedPortfolioState(
  forceRefresh = false
): Promise<PublishedPortfolioState | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve(BUNDLED_PUBLISHED_STATE);
  }
  if (!cachedPublishedStatePromise || forceRefresh) {
    cachedPublishedStatePromise = fetch('/api/portfolio-state', {
      cache: 'no-store',
    })
      .then(async (res) => {
        if (res.ok) {
          return (await res.json()) as PublishedPortfolioState;
        }
        throw new Error('Fallback to static json');
      })
      .catch(async () => {
        try {
          const fallbackRes = await fetch('/portfolio-published-state.json', {
            cache: 'no-store',
          });
          if (fallbackRes.ok) {
            return (await fallbackRes.json()) as PublishedPortfolioState;
          }
        } catch {
          // Ignore network errors
        }
        return BUNDLED_PUBLISHED_STATE;
      });
  }
  return cachedPublishedStatePromise;
}

/**
 * Syncs partial portfolio state updates to the server when in the owner's dev environment,
 * writing directly to `/public/portfolio-published-state.json` and `/src/data/publishedPortfolioState.json`.
 */
export async function syncPublishedPortfolioState(
  patch: Partial<PublishedPortfolioState>
): Promise<void> {
  if (!canCurrentUserEditPortfolio()) {
    return;
  }
  try {
    await fetch('/api/portfolio-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    cachedPublishedStatePromise = null;
  } catch {
    // Ignore transient network errors during local dev
  }
}

function openPortfolioDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_KV)) {
          db.createObjectStore(STORE_KV);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openPortfolioDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_KV, 'readwrite');
      const store = tx.objectStore(STORE_KV);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openPortfolioDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_KV, 'readonly');
      const store = tx.objectStore(STORE_KV);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Merges saved project documentation records with DEFAULT_PROJECT_DOCS for all 5 projects,
 * ensuring non-empty uploaded images (docImage1, docImage2, docImage3) are preserved and
 * obsolete template placeholders or stale v2 draft strings never overwrite master project text.
 */
export function mergeProjectDocsRecord(
  ...sources: Array<Record<string, Partial<ProjectDocumentation>> | null | undefined>
): Record<string, ProjectDocumentation> {
  const result: Record<string, ProjectDocumentation> = {};
  const textKeys: Array<
    | 'subtitle'
    | 'timeline'
    | 'role'
    | 'toolsAndMediums'
    | 'deliverables'
    | 'overview'
    | 'technicalDocumentation'
    | 'outcomeAndNotes'
  > = [
    'subtitle',
    'timeline',
    'role',
    'toolsAndMediums',
    'deliverables',
    'overview',
    'technicalDocumentation',
    'outcomeAndNotes',
  ];

  for (const num of ALL_PROJECT_NUMBERS) {
    const defaultDoc = getDefaultProjectDocumentation(num);
    const base: ProjectDocumentation = { ...defaultDoc };

    for (const source of sources) {
      const candidate = source?.[num];
      if (!candidate) continue;

      for (const tKey of textKeys) {
        const candVal = candidate[tKey];
        if (typeof candVal === 'string' && candVal.trim().length > 0) {
          if (isLegacyOrStaleProjectText(num, tKey, candVal)) {
            continue;
          }
          base[tKey] = candVal;
        }
      }

      const imageKeys: Array<'docImage1' | 'docImage2' | 'docImage3'> = [
        'docImage1',
        'docImage2',
        'docImage3',
      ];
      for (const imgKey of imageKeys) {
        const rawCandidate = candidate[imgKey];
        if (typeof rawCandidate === 'string' && rawCandidate.trim().length > 0) {
          if (isCorruptedOrDeletedAssetUrl(rawCandidate)) continue;
          const normalized = normalizeLegacyAssetUrl(rawCandidate, defaultDoc[imgKey]);
          if (!normalized || isCorruptedOrDeletedAssetUrl(normalized)) continue;
          const baseIsCustom = isCustomUploadedAsset(base[imgKey], defaultDoc[imgKey]);
          const candidateIsCustom = isCustomUploadedAsset(normalized, defaultDoc[imgKey]);
          const candidateIsDataUrl =
            normalized.startsWith('data:image/') &&
            !normalized.startsWith('data:image/svg+xml;utf8,');
          if (!baseIsCustom || candidateIsCustom) {
            // Prefer keeping raw data:image/ in memory if base already has one and candidate is only a path
            if (
              base[imgKey].startsWith('data:image/') &&
              !base[imgKey].startsWith('data:image/svg+xml;utf8,') &&
              !candidateIsDataUrl
            ) {
              continue;
            }
            base[imgKey] = normalized;
          }
        }
      }
    }
    result[num] = base;
  }

  return result;
}

function readRawProjectDocsFromLocalStorage(): {
  perProjectParsed: Record<string, Partial<ProjectDocumentation>>;
} {
  if (typeof window === 'undefined' || !canCurrentUserEditPortfolio()) {
    return { perProjectParsed: {} };
  }

  try {
    window.localStorage.removeItem(LEGACY_DOCS_KEY);
  } catch {
    // Ignore storage removal errors
  }

  const perProjectParsed: Record<string, Partial<ProjectDocumentation>> = {};
  for (const num of ALL_PROJECT_NUMBERS) {
    try {
      const rawItem = window.localStorage.getItem(`${PER_PROJECT_DOC_PREFIX}${num}`);
      if (rawItem) {
        perProjectParsed[num] = JSON.parse(rawItem);
      }
    } catch {
      // Ignore parse error
    }
  }

  return { perProjectParsed };
}

/**
 * Reads all saved project documentation synchronously from bundled published state
 * (and in Owner Edit mode, isolated per-project v3 keys in localStorage).
 */
export function loadProjectDocsFromLocalStorage(): Record<string, ProjectDocumentation> {
  if (!canCurrentUserEditPortfolio()) {
    return mergeProjectDocsRecord(BUNDLED_PUBLISHED_STATE.projectDocs);
  }
  const { perProjectParsed } = readRawProjectDocsFromLocalStorage();
  return mergeProjectDocsRecord(
    BUNDLED_PUBLISHED_STATE.projectDocs,
    perProjectParsed
  );
}

/**
 * Loads all project documentation.
 * - On deployed/shared production websites (`!canCurrentUserEditPortfolio()`), uses the
 *   published server state (`publishedState.projectDocs` + `BUNDLED_PUBLISHED_STATE.projectDocs`)
 *   exclusively so stale browser cache/IndexedDB can never override live project text.
 * - In the Google AI Studio editor (`canCurrentUserEditPortfolio()`), merges published state
 *   with the owner's latest saved editor state and syncs back to the server.
 */
export async function loadAllProjectDocsPersistent(): Promise<
  Record<string, ProjectDocumentation>
> {
  if (!canCurrentUserEditPortfolio()) {
    const publishedState = await fetchPublishedPortfolioState();
    return mergeProjectDocsRecord(
      BUNDLED_PUBLISHED_STATE.projectDocs,
      publishedState?.projectDocs
    );
  }

  const { perProjectParsed } = readRawProjectDocsFromLocalStorage();
  const idbDocs: Record<string, Partial<ProjectDocumentation>> = {};
  const idbV3Docs: Record<string, Partial<ProjectDocumentation>> = {};

  const [publishedState] = await Promise.all([
    fetchPublishedPortfolioState(),
    ...ALL_PROJECT_NUMBERS.map(async (num) => {
      const [saved, savedV3] = await Promise.all([
        idbGet<ProjectDocumentation>(`project_doc_${num}`),
        idbGet<ProjectDocumentation>(`${PER_PROJECT_DOC_PREFIX}${num}`),
      ]);
      if (saved) {
        idbDocs[num] = saved;
      }
      if (savedV3) {
        idbV3Docs[num] = savedV3;
      }
    }),
  ]);

  const merged = mergeProjectDocsRecord(
    BUNDLED_PUBLISHED_STATE.projectDocs,
    publishedState?.projectDocs,
    perProjectParsed,
    idbV3Docs,
    idbDocs
  );

  // Ensure IndexedDB and localStorage have all current clean merged docs backed up in owner mode
  await Promise.all(
    ALL_PROJECT_NUMBERS.map(async (num) => {
      await idbSet(`project_doc_${num}`, merged[num]);
      await idbSet(`${PER_PROJECT_DOC_PREFIX}${num}`, merged[num]);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(
            `${PER_PROJECT_DOC_PREFIX}${num}`,
            JSON.stringify(merged[num])
          );
        } catch {
          // Ignore quota errors
        }
      }
    })
  );

  // In owner dev mode, materialize any custom `data:image/` uploads to `/public/assets/portfolio/`
  // and keep `/public/portfolio-published-state.json` & `/src/data/publishedPortfolioState.json` in sync
  void (async () => {
    let hasChangesToSync = false;
    const serverDocsToSync: Record<string, ProjectDocumentation> = {};
    const imageFields: Array<'docImage1' | 'docImage2' | 'docImage3'> = [
      'docImage1',
      'docImage2',
      'docImage3',
    ];

    for (const num of ALL_PROJECT_NUMBERS) {
      const doc = { ...merged[num] };
      const pubDoc = publishedState?.projectDocs?.[num];
      if (
        !pubDoc ||
        doc.subtitle !== pubDoc.subtitle ||
        doc.timeline !== pubDoc.timeline ||
        doc.role !== pubDoc.role ||
        doc.toolsAndMediums !== pubDoc.toolsAndMediums ||
        doc.deliverables !== pubDoc.deliverables ||
        doc.overview !== pubDoc.overview
      ) {
        hasChangesToSync = true;
      }

      for (const field of imageFields) {
        const val = doc[field];
        if (
          val &&
          val.startsWith('data:image/') &&
          !val.startsWith('data:image/svg+xml;utf8,')
        ) {
          const uploadedPath = await uploadDataUrlAsLocalAsset(
            `project-${num}-${field}`,
            val
          );
          if (uploadedPath && !isCorruptedOrDeletedAssetUrl(uploadedPath)) {
            doc[field] = uploadedPath;
          }
          hasChangesToSync = true;
        } else if (
          isCustomUploadedAsset(val, getDefaultProjectDocumentation(num)[field]) &&
          val !== pubDoc?.[field]
        ) {
          hasChangesToSync = true;
        }
      }
      serverDocsToSync[num] = doc;
    }

    if (hasChangesToSync) {
      await syncPublishedPortfolioState({ projectDocs: serverDocsToSync });
    }
  })();

  return merged;
}

/**
 * Saves a single project's documentation to IndexedDB, localStorage, and published server state.
 * Preserves the full `data:image/` in IndexedDB while materializing a local asset path for the server.
 */
export async function saveSingleProjectDocPersistent(
  projectNumber: string,
  doc: ProjectDocumentation,
  forceReset = false
): Promise<void> {
  if (!canCurrentUserEditPortfolio()) return;

  // Keep full dataUrl in IndexedDB so it never disappears or breaks
  await idbSet(`project_doc_${projectNumber}`, { ...doc });
  await idbSet(`${PER_PROJECT_DOC_PREFIX}${projectNumber}`, { ...doc });

  const serverDoc: ProjectDocumentation = { ...doc };
  const imageFields: Array<'docImage1' | 'docImage2' | 'docImage3'> = [
    'docImage1',
    'docImage2',
    'docImage3',
  ];

  for (const field of imageFields) {
    const val = serverDoc[field];
    if (
      val &&
      val.startsWith('data:image/') &&
      !val.startsWith('data:image/svg+xml;utf8,')
    ) {
      const uploadedPath = await uploadDataUrlAsLocalAsset(
        `project-${projectNumber}-${field}`,
        val
      );
      if (uploadedPath && !isCorruptedOrDeletedAssetUrl(uploadedPath)) {
        serverDoc[field] = uploadedPath;
      }
    }
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        `${PER_PROJECT_DOC_PREFIX}${projectNumber}`,
        JSON.stringify(serverDoc)
      );
    } catch {
      try {
        const defaultDoc = getDefaultProjectDocumentation(projectNumber);
        const textOnlyDoc: ProjectDocumentation = {
          ...serverDoc,
          docImage1: serverDoc.docImage1.startsWith('data:')
            ? defaultDoc.docImage1
            : serverDoc.docImage1,
          docImage2: serverDoc.docImage2.startsWith('data:')
            ? defaultDoc.docImage2
            : serverDoc.docImage2,
          docImage3: serverDoc.docImage3.startsWith('data:')
            ? defaultDoc.docImage3
            : serverDoc.docImage3,
        };
        window.localStorage.setItem(
          `${PER_PROJECT_DOC_PREFIX}${projectNumber}`,
          JSON.stringify(textOnlyDoc)
        );
      } catch {
        // Ignore
      }
    }
  }

  await syncPublishedPortfolioState({
    projectDocs: {
      [projectNumber]: forceReset ? { ...serverDoc, __forceReset: true } : serverDoc,
    },
  });
}

const MARQUEE_LEGACY_STORAGE_KEY = 'harshita_portfolio_marquee_images_v1';
const MARQUEE_OVERRIDES_IDB_KEY = 'harshita_portfolio_marquee_overrides_v2';
const MARQUEE_SLOT_PREFIX = 'harshita_portfolio_marquee_slot_v2_';

/**
 * Merges custom marquee image sources onto the 21 default lookbook plates.
 * Any non-empty image that differs from the default plate at that index is preserved,
 * and custom user-uploaded images take priority over unhashed default plates.
 */
export function mergeMarqueeImages(
  defaultImages: string[],
  ...sources: Array<
    Array<string | null | undefined> | Record<number | string, string | undefined> | null | undefined
  >
): string[] {
  const result = [...defaultImages];
  for (const source of sources) {
    if (!source) continue;
    for (let i = 0; i < defaultImages.length; i++) {
      const candidate = Array.isArray(source) ? source[i] : source[i] ?? source[String(i)];
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        const normalized = normalizeLegacyAssetUrl(candidate, defaultImages[i]);
        const currentIsCustom = isCustomUploadedAsset(result[i], defaultImages[i]);
        const candidateIsCustom = isCustomUploadedAsset(normalized, defaultImages[i]);
        const candidateIsDataUrl =
          normalized.startsWith('data:image/') &&
          !normalized.startsWith('data:image/svg+xml;utf8,');
        if (
          normalized &&
          normalized !== defaultImages[i] &&
          (!currentIsCustom || candidateIsCustom)
        ) {
          // If result[i] already holds a live data:image/ URL, don't overwrite it with a file path
          if (
            result[i].startsWith('data:image/') &&
            !result[i].startsWith('data:image/svg+xml;utf8,') &&
            !candidateIsDataUrl
          ) {
            continue;
          }
          result[i] = normalized;
        }
      }
    }
  }
  return result;
}

/**
 * Synchronously loads custom marquee images from bundled published state + localStorage
 * (supporting both legacy 21-item array and isolated per-slot keys) so initial render is instant.
 */
export function loadMarqueeImagesFromLocalStorage(defaultImages: string[]): string[] {
  if (typeof window === 'undefined') {
    return mergeMarqueeImages(defaultImages, BUNDLED_PUBLISHED_STATE.marqueeOverrides);
  }

  let legacyArray: string[] | null = null;
  try {
    const rawLegacy = window.localStorage.getItem(MARQUEE_LEGACY_STORAGE_KEY);
    if (rawLegacy) {
      const parsed = JSON.parse(rawLegacy);
      if (Array.isArray(parsed)) {
        legacyArray = parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }

  const perSlotRecord: Record<number, string> = {};
  for (let i = 0; i < defaultImages.length; i++) {
    try {
      const slotVal = window.localStorage.getItem(`${MARQUEE_SLOT_PREFIX}${i}`);
      if (slotVal && slotVal.trim().length > 0) {
        perSlotRecord[i] = slotVal;
      }
    } catch {
      // Ignore storage read errors
    }
  }

  return mergeMarqueeImages(
    defaultImages,
    BUNDLED_PUBLISHED_STATE.marqueeOverrides,
    legacyArray,
    perSlotRecord
  );
}

/**
 * Loads all 21 marquee lookbook images from published server state + IndexedDB + localStorage,
 * ensuring high-resolution uploaded images never vanish across page reloads, rebuilds, or deployments.
 */
export async function loadAllMarqueeImagesPersistent(
  defaultImages: string[]
): Promise<string[]> {
  const localMerged = loadMarqueeImagesFromLocalStorage(defaultImages);

  const [publishedState, idbLegacyArray, idbOverridesMap, ...idbPerSlot] = await Promise.all([
    fetchPublishedPortfolioState(),
    idbGet<string[]>(MARQUEE_LEGACY_STORAGE_KEY),
    idbGet<Record<number, string>>(MARQUEE_OVERRIDES_IDB_KEY),
    ...defaultImages.map((_, i) => idbGet<string>(`${MARQUEE_SLOT_PREFIX}${i}`)),
  ]);

  const merged = mergeMarqueeImages(
    defaultImages,
    BUNDLED_PUBLISHED_STATE.marqueeOverrides,
    publishedState?.marqueeOverrides,
    localMerged,
    idbOverridesMap,
    idbPerSlot,
    idbLegacyArray
  );

  // Back up every custom slot into IndexedDB immediately and materialize files on server in background
  void (async () => {
    const idbBackup: Record<number, string> = {};
    const serverOverrides: Record<number, string> = {};
    let hasNewCustomOverrides = false;

    await Promise.all(
      merged.map(async (imgUrl, idx) => {
        if (imgUrl && isCustomUploadedAsset(imgUrl, defaultImages[idx])) {
          idbBackup[idx] = imgUrl;
          await idbSet(`${MARQUEE_SLOT_PREFIX}${idx}`, imgUrl);

          let serverUrl = imgUrl;
          if (
            canCurrentUserEditPortfolio() &&
            imgUrl.startsWith('data:image/') &&
            !imgUrl.startsWith('data:image/svg+xml;utf8,')
          ) {
            const uploaded = await uploadDataUrlAsLocalAsset(`marquee-slot-${idx}`, imgUrl);
            if (uploaded && !isCorruptedOrDeletedAssetUrl(uploaded)) {
              serverUrl = uploaded;
            }
            hasNewCustomOverrides = true;
          } else if (
            serverUrl !== publishedState?.marqueeOverrides?.[idx] &&
            serverUrl !== publishedState?.marqueeOverrides?.[String(idx)]
          ) {
            hasNewCustomOverrides = true;
          }
          serverOverrides[idx] = serverUrl;
        }
      })
    );

    if (Object.keys(idbBackup).length > 0) {
      await idbSet(MARQUEE_OVERRIDES_IDB_KEY, idbBackup);
      if (canCurrentUserEditPortfolio() && hasNewCustomOverrides) {
        await syncPublishedPortfolioState({ marqueeOverrides: serverOverrides });
      }
    }
  })();

  return merged;
}

/**
 * Persists a single uploaded marquee slot image to IndexedDB, localStorage,
 * `/public/assets/portfolio/`, and the published server state without mutating the in-memory dataUrl.
 */
export async function saveSingleMarqueeImagePersistent(
  baseIndex: number,
  dataUrl: string,
  allCurrentImages?: string[],
  defaultImages?: string[]
): Promise<void> {
  if (!canCurrentUserEditPortfolio()) return;

  // 1. Save full dataUrl immediately to IndexedDB so browser storage never loses raw image data
  await idbSet(`${MARQUEE_SLOT_PREFIX}${baseIndex}`, dataUrl);

  const existingOverrides =
    (await idbGet<Record<number, string>>(MARQUEE_OVERRIDES_IDB_KEY)) || {};
  existingOverrides[baseIndex] = dataUrl;
  await idbSet(MARQUEE_OVERRIDES_IDB_KEY, existingOverrides);

  if (allCurrentImages && defaultImages) {
    const updatedAll = [...allCurrentImages];
    updatedAll[baseIndex] = dataUrl;
    await idbSet(MARQUEE_LEGACY_STORAGE_KEY, updatedAll);
  }

  // 2. Upload as physical file in `/public/assets/portfolio/` so GitHub & Render have the real asset
  const serverAssetUrl = await uploadDataUrlAsLocalAsset(
    `marquee-slot-${baseIndex}`,
    dataUrl
  );

  // 3. Save lightweight asset path to localStorage for instant synchronous initial paint
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(`${MARQUEE_SLOT_PREFIX}${baseIndex}`, serverAssetUrl);
    } catch {
      try {
        window.localStorage.removeItem(`${MARQUEE_SLOT_PREFIX}${baseIndex}`);
      } catch {
        // Ignore
      }
    }
  }

  // 4. Sync to published server state so deployed/shared links show this slot
  await syncPublishedPortfolioState({
    marqueeOverrides: { [baseIndex]: serverAssetUrl },
  });
}

/**
 * Reads an uploaded image File as a 100% original, uncompressed, full-resolution Data URL
 * with zero downscaling and zero lossy re-compression so Live Projects 1, 2, 3, 4, and 5
 * (and all portfolio image slots) display at the highest possible native quality.
 */
export function readAndOptimizeImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const rawDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!rawDataUrl) {
        reject(new Error('Empty file result'));
        return;
      }
      resolve(rawDataUrl);
    };
    reader.readAsDataURL(file);
  });
}


