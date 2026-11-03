import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ArrowUpRight,
  Send,
  Edit3,
  Check,
  RotateCcw,
  BookOpen,
  Layers,
} from 'lucide-react';
import { ProjectItem } from './ProjectsSection';
import {
  ProjectDocumentation,
  getDefaultProjectDocumentation,
  getProjectPortraitAspectRatio,
  buildGmailComposeUrl,
  HARSHITA_GMAIL,
} from '../utils/portfolioMath';
import {
  loadProjectDocsFromLocalStorage,
  loadAllProjectDocsPersistent,
  saveSingleProjectDocPersistent,
  mergeProjectDocsRecord,
  readAndOptimizeImageFile,
} from '../utils/persistentStorage';

export interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState('Couture & Fashion Design');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please complete your name, email, and project brief.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setError('');
    setName('');
    setEmail('');
    setMessage('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={handleResetAndClose}
    >
      <div
        className="relative w-full max-w-lg rounded-[36px] border-2 border-[#D7E2EA]/40 bg-[#0C0C0C] p-6 sm:p-8 text-[#D7E2EA] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D7E2EA]/60 font-light">
              Start a Collaboration
            </p>
            <h2
              id="contact-modal-title"
              className="hero-heading text-2xl sm:text-3xl font-black uppercase tracking-tight"
            >
              Contact Harshita
            </h2>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Close Contact Modal"
            className="w-10 h-10 rounded-full border border-[#D7E2EA]/30 flex items-center justify-center text-[#D7E2EA] hover:bg-[#D7E2EA]/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 flex flex-col items-center text-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-[#BBCCD7]" />
            <h3 className="text-xl font-semibold uppercase tracking-wide">
              Inquiry Received
            </h3>
            <p className="text-sm text-[#D7E2EA]/75 max-w-sm font-light leading-relaxed">
              Thanks {name}! Your brief for{' '}
              <span className="text-white font-medium">{service}</span> has been sent to
              Harshita&apos;s atelier. Expect a response within 24 hours.
            </p>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="mt-4 rounded-full border-2 border-[#D7E2EA] px-8 py-2.5 text-sm font-medium uppercase tracking-widest hover:bg-[#D7E2EA]/10 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {error && (
              <p
                role="alert"
                className="text-xs text-rose-400 bg-rose-950/40 border border-rose-500/30 rounded-xl px-3.5 py-2"
              >
                {error}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="contact-name"
                className="text-xs uppercase tracking-wider text-[#D7E2EA]/70"
              >
                Your Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full rounded-2xl bg-[#16181C] border border-[#D7E2EA]/20 px-4 py-3 text-sm text-[#D7E2EA] focus:outline-none focus:border-[#D7E2EA]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="contact-email"
                className="text-xs uppercase tracking-wider text-[#D7E2EA]/70"
              >
                Email Address
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@studio.com"
                className="w-full rounded-2xl bg-[#16181C] border border-[#D7E2EA]/20 px-4 py-3 text-sm text-[#D7E2EA] focus:outline-none focus:border-[#D7E2EA]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="contact-service"
                className="text-xs uppercase tracking-wider text-[#D7E2EA]/70"
              >
                Service Discipline
              </label>
              <select
                id="contact-service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full rounded-2xl bg-[#16181C] border border-[#D7E2EA]/20 px-4 py-3 text-sm text-[#D7E2EA] focus:outline-none focus:border-[#D7E2EA]"
              >
                <option value="Couture & Fashion Design">01 — Couture &amp; Fashion Design</option>
                <option value="3D Digital Garment & Lookbook">02 — 3D Digital Garment &amp; Lookbook</option>
                <option value="Runway Art Direction">03 — Runway Art Direction</option>
                <option value="Brand Identity">04 — Brand Identity</option>
                <option value="Bespoke Commission">05 — Bespoke Commission</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="contact-message"
                className="text-xs uppercase tracking-wider text-[#D7E2EA]/70"
              >
                Project Brief
              </label>
              <textarea
                id="contact-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell Harshita about your timeline, collection goals, and creative vision..."
                className="w-full rounded-2xl bg-[#16181C] border border-[#D7E2EA]/20 px-4 py-3 text-sm text-[#D7E2EA] focus:outline-none focus:border-[#D7E2EA] resize-none"
              />
            </div>

            <button
              type="submit"
              className="mt-2 rounded-full text-white font-medium uppercase tracking-widest px-8 py-3.5 text-sm flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-[1.02] cursor-pointer"
              style={{
                background:
                  'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)',
                boxShadow:
                  '0px 4px 4px rgba(181, 1, 167, 0.25), 4px 4px 12px #7721B1 inset',
                outline: '2px solid #FFFFFF',
                outlineOffset: '-3px',
              }}
            >
              <Send className="w-4 h-4" />
              <span>Send Brief</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export interface ProjectLightboxModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onInquire: (project: ProjectItem) => void;
  canEdit?: boolean;
}

export const ProjectLightboxModal: React.FC<ProjectLightboxModalProps> = ({
  project,
  onClose,
  onInquire,
  canEdit = false,
}) => {
  const userEditedDocsRef = React.useRef<Record<string, Partial<ProjectDocumentation>>>({});
  const [docsByProject, setDocsByProject] = useState<Record<string, ProjectDocumentation>>(() =>
    loadProjectDocsFromLocalStorage()
  );

  const [isEditingDoc, setIsEditingDoc] = useState(true);
  const effectiveIsEditingDoc = Boolean(canEdit && isEditingDoc);

  useEffect(() => {
    let isMounted = true;
    loadAllProjectDocsPersistent().then((loaded) => {
      if (isMounted) {
        setDocsByProject((prev) =>
          mergeProjectDocsRecord(loaded, prev, userEditedDocsRef.current)
        );
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!project) return null;

  const currentDoc =
    docsByProject[project.number] || getDefaultProjectDocumentation(project.number);

  const handleDocFieldChange = (field: keyof ProjectDocumentation, value: string) => {
    if (!canEdit) return;
    const projectNumber = project.number;
    userEditedDocsRef.current[projectNumber] = {
      ...(userEditedDocsRef.current[projectNumber] || {}),
      [field]: value,
    };
    setDocsByProject((prev) => {
      const updatedDoc: ProjectDocumentation = {
        ...(prev[projectNumber] || getDefaultProjectDocumentation(projectNumber)),
        [field]: value,
      };
      void saveSingleProjectDocPersistent(projectNumber, updatedDoc);
      return {
        ...prev,
        [projectNumber]: updatedDoc,
      };
    });
  };

  const handleImageUpload = (
    field: 'docImage1' | 'docImage2' | 'docImage3',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (!file) return;
    readAndOptimizeImageFile(file)
      .then((optimizedDataUrl) => {
        handleDocFieldChange(field, optimizedDataUrl);
      })
      .catch(() => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            handleDocFieldChange(field, reader.result);
          }
        };
        reader.readAsDataURL(file);
      });
    e.target.value = '';
  };

  const handleResetProjectDoc = () => {
    if (!canEdit) return;
    const projectNumber = project.number;
    const defaultDoc = getDefaultProjectDocumentation(projectNumber);
    setDocsByProject((prev) => ({
      ...prev,
      [projectNumber]: defaultDoc,
    }));
    void saveSingleProjectDocPersistent(projectNumber, defaultDoc, true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 md:p-10 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-[28px] sm:rounded-[48px] border-2 border-[#D7E2EA] bg-[#0C0C0C] p-4 sm:p-8 md:p-10 text-[#D7E2EA] shadow-2xl my-auto flex flex-col gap-5 sm:gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER: Project Number, Name, Edit/Reset Controls (Owner only), Close Button */}
        <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-[#D7E2EA]/20">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <span className="text-4xl sm:text-6xl font-black tabular-nums leading-none text-[#D7E2EA] shrink-0">
              {project.number}
            </span>
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#BBCCD7] block mb-1">
                {project.category} · Live Project
              </span>
              <h2
                id="project-modal-title"
                className="text-xl sm:text-4xl font-black uppercase tracking-tight leading-tight text-white break-words"
              >
                {project.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 ml-auto sm:ml-0">
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={handleResetProjectDoc}
                  title="Reset this project's documentation to default"
                  className="rounded-full border border-[#D7E2EA]/30 px-3 sm:px-3.5 py-2 text-xs uppercase tracking-wider text-[#D7E2EA]/75 hover:text-white hover:border-[#D7E2EA] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Default</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditingDoc((prev) => !prev)}
                  className="rounded-full border border-[#D7E2EA]/50 bg-[#16181C] px-3.5 sm:px-4 py-2 text-xs uppercase tracking-wider font-medium text-[#D7E2EA] hover:bg-[#D7E2EA] hover:text-[#0C0C0C] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {effectiveIsEditingDoc ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Preview Mode</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Mode</span>
                    </>
                  )}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Project Preview"
              className="w-10 h-10 rounded-full border border-[#D7E2EA]/30 flex items-center justify-center text-[#D7E2EA] hover:bg-[#D7E2EA]/10 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1. FIRST AT TOP: PROJECT SPECIFICATIONS */}
        <div className="rounded-[28px] bg-[#14161A] border border-[#D7E2EA]/20 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D7E2EA]/15">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#BBCCD7]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#BBCCD7]">
                PROJECT SPECIFICATIONS
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="doc-subtitle"
              className="text-[10px] uppercase tracking-widest text-[#D7E2EA]/50 block mb-1"
            >
              Collection / Project Subtitle
            </label>
            {effectiveIsEditingDoc ? (
              <input
                id="doc-subtitle"
                type="text"
                value={currentDoc.subtitle}
                onChange={(e) => handleDocFieldChange('subtitle', e.target.value)}
                className="w-full rounded-xl bg-[#0C0C0C] border border-[#D7E2EA]/25 px-3.5 py-2 text-sm font-semibold uppercase tracking-wider text-white focus:outline-none focus:border-white"
              />
            ) : (
              <p className="text-sm font-semibold uppercase tracking-wider text-white">
                {currentDoc.subtitle}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="doc-timeline"
                className="text-[10px] uppercase tracking-widest text-[#D7E2EA]/50 block mb-1"
              >
                Season &amp; Timeline
              </label>
              {effectiveIsEditingDoc ? (
                <input
                  id="doc-timeline"
                  type="text"
                  value={currentDoc.timeline}
                  onChange={(e) => handleDocFieldChange('timeline', e.target.value)}
                  className="w-full rounded-xl bg-[#0C0C0C] border border-[#D7E2EA]/25 px-3 py-2 text-xs text-[#D7E2EA] uppercase focus:outline-none focus:border-white"
                />
              ) : (
                <p className="text-xs font-medium uppercase text-[#D7E2EA]">
                  {currentDoc.timeline}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="doc-tools"
                className="text-[10px] uppercase tracking-widest text-[#D7E2EA]/50 block mb-1"
              >
                Materials &amp; Tools
              </label>
              {effectiveIsEditingDoc ? (
                <input
                  id="doc-tools"
                  type="text"
                  value={currentDoc.toolsAndMediums}
                  onChange={(e) => handleDocFieldChange('toolsAndMediums', e.target.value)}
                  className="w-full rounded-xl bg-[#0C0C0C] border border-[#D7E2EA]/25 px-3 py-2 text-xs text-[#D7E2EA] uppercase focus:outline-none focus:border-white"
                />
              ) : (
                <p className="text-xs font-medium uppercase text-[#D7E2EA]">
                  {currentDoc.toolsAndMediums}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 2. SECOND: PROJECT EXPLANATION & CREATIVE CONCEPT */}
        <div className="rounded-[28px] bg-[#14161A] border border-[#D7E2EA]/20 p-5 sm:p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-[#D7E2EA]/15 pb-3">
            <BookOpen className="w-4 h-4 text-[#BBCCD7]" />
            <label
              htmlFor="doc-overview"
              className="text-xs font-semibold uppercase tracking-widest text-[#BBCCD7]"
            >
              PROJECT EXPLANATION &amp; CREATIVE CONCEPT
            </label>
          </div>

          {effectiveIsEditingDoc ? (
            <textarea
              id="doc-overview"
              rows={7}
              value={currentDoc.overview}
              onChange={(e) => handleDocFieldChange('overview', e.target.value)}
              placeholder="Write a comprehensive explanation of this project, its concept, inspiration, and narrative..."
              className="w-full rounded-2xl bg-[#0C0C0C] border border-[#D7E2EA]/25 p-4 text-sm text-[#D7E2EA] font-light leading-relaxed focus:outline-none focus:border-white resize-y"
            />
          ) : (
            <div className="text-sm text-[#D7E2EA]/90 font-light leading-relaxed whitespace-pre-line">
              {currentDoc.overview}
            </div>
          )}
        </div>

        {/* 3. IMAGE SECTION: Owner can click to upload; Visitors see read-only image */}
        {canEdit ? (
          <label
            aria-label={`Upload Project ${project.number} Portfolio Image`}
            className="block w-full m-0 p-0 border-0 rounded-none cursor-pointer"
            style={{
              aspectRatio: getProjectPortraitAspectRatio(project.number),
              width: '100%',
              margin: 0,
              padding: 0,
            }}
          >
            <img
              src={currentDoc.docImage1 || undefined}
              alt=""
              loading="eager"
              decoding="sync"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                objectFit: 'contain',
                opacity: currentDoc.docImage1 ? 1 : 0,
              }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload('docImage1', e)}
              className="hidden"
            />
          </label>
        ) : currentDoc.docImage1 ? (
          <div
            className="block w-full m-0 p-0 border-0 rounded-none"
            style={{
              aspectRatio: getProjectPortraitAspectRatio(project.number),
              width: '100%',
              margin: 0,
              padding: 0,
            }}
          >
            <img
              src={currentDoc.docImage1}
              alt={`${project.name} Portfolio Showcase`}
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
        ) : null}

        {/* BOTTOM BAR: "Request Similar Project" Button */}
        <div className="flex flex-wrap items-center justify-end gap-4 pt-4 border-t border-[#D7E2EA]/20">
          <a
            href={buildGmailComposeUrl(
              `Request for Similar Project — ${project.number}: ${project.name}`
            )}
            target="_blank"
            rel="noopener noreferrer"
            title={`Send a message to ${HARSHITA_GMAIL} on Gmail`}
            className="rounded-full border-2 border-[#D7E2EA] text-[#D7E2EA] font-medium uppercase tracking-widest px-6 py-3 text-xs sm:text-sm hover:bg-[#D7E2EA] hover:text-[#0C0C0C] transition-colors flex items-center gap-2 cursor-pointer shrink-0 no-underline"
          >
            <span>Request Similar Project</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
