import React from 'react';
import { buildGmailComposeUrl, HARSHITA_GMAIL } from '../utils/portfolioMath';

export interface ContactButtonProps {
  onClick?: () => void;
  className?: string;
  label?: string;
  subject?: string;
}

export const ContactButton: React.FC<ContactButtonProps> = ({
  className = '',
  label = 'Contact Me',
  subject,
}) => {
  return (
    <a
      href={buildGmailComposeUrl(subject)}
      target="_blank"
      rel="noopener noreferrer"
      title={`Send a message to ${HARSHITA_GMAIL} on Gmail`}
      className={`inline-flex items-center justify-center rounded-full text-white font-medium uppercase tracking-widest px-6 py-2.5 sm:px-10 sm:py-3.5 md:px-12 md:py-4 text-xs sm:text-sm md:text-base transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap shrink-0 no-underline ${className}`}
      style={{
        background: 'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)',
        boxShadow: '0px 4px 4px rgba(181, 1, 167, 0.25), 4px 4px 12px #7721B1 inset',
        outline: '2px solid #FFFFFF',
        outlineOffset: '-3px',
      }}
    >
      {label}
    </a>
  );
};

export default ContactButton;

