/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import HeroSection from './components/HeroSection';
import MarqueeSection from './components/MarqueeSection';
import AboutSection from './components/AboutSection';
import IdentitySection from './components/IdentitySection';
import ProjectsSection, { ProjectItem } from './components/ProjectsSection';
import { ContactModal, ProjectLightboxModal } from './components/InteractiveModals';
import LiquidMetalBackground from './components/LiquidMetalBackground';
import { canCurrentUserEditPortfolio } from './utils/persistentStorage';

export default function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);
  const canEdit = canCurrentUserEditPortfolio();

  return (
    <main
      className="relative min-h-screen w-full bg-[#000000] text-[#D7E2EA]"
      style={{
        overflowX: 'clip',
        backgroundColor: '#000000',
        fontFamily: "'Kanit', sans-serif",
      }}
    >
      <LiquidMetalBackground variant="fixed" />
      <HeroSection canEdit={canEdit} onOpenContact={() => setIsContactOpen(true)} />
      <MarqueeSection canEdit={canEdit} />
      <AboutSection onOpenContact={() => setIsContactOpen(true)} />
      <IdentitySection canEdit={canEdit} />
      <ProjectsSection
        canEdit={canEdit}
        onSelectProject={(project) => setActiveProject(project)}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <ProjectLightboxModal
        canEdit={canEdit}
        project={activeProject}
        onClose={() => setActiveProject(null)}
        onInquire={() => {
          setActiveProject(null);
          setIsContactOpen(true);
        }}
      />
    </main>
  );
}

