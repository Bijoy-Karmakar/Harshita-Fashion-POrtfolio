import React from 'react';

export interface LiveProjectButtonProps {
  onClick?: () => void;
  className?: string;
  label?: string;
  ariaLabel?: string;
}

export const LiveProjectButton: React.FC<LiveProjectButtonProps> = ({
  onClick,
  className = '',
  label = 'Live Project',
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || label}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-[#D7E2EA]/70 hover:border-white/95 text-[#EEF4F8] font-medium uppercase tracking-widest px-5 py-2.5 sm:px-9 sm:py-3.5 text-xs sm:text-base backdrop-blur-md bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(215,226,234,0.07)_48%,rgba(182,0,168,0.15)_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.22),0_0_20px_2px_rgba(215,226,234,0.22),0_8px_26px_-4px_rgba(182,0,168,0.28),inset_0_1.5px_2px_rgba(255,255,255,0.78),inset_0_-2px_6px_rgba(187,204,215,0.3),inset_0_0_14px_rgba(215,226,234,0.14)] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.48),0_0_28px_5px_rgba(215,226,234,0.38),0_10px_32px_-4px_rgba(182,0,168,0.42),inset_0_2px_3px_rgba(255,255,255,0.92),inset_0_-2px_8px_rgba(215,226,234,0.42),inset_0_0_18px_rgba(255,255,255,0.22)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${className}`}
    >
      {/* Upper curved liquid-glass specular highlight */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-2.5 top-[2px] h-[46%] rounded-full bg-gradient-to-b from-white/45 via-white/12 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-200"
      />
      {/* Lower internal rim reflection */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 bottom-[2px] h-[24%] rounded-full bg-gradient-to-t from-[#D7E2EA]/25 to-transparent opacity-75 group-hover:opacity-95 transition-opacity duration-200"
      />
      {/* Diagonal glossy light sweep on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-[150%] group-hover:translate-x-[380%] transition-transform duration-700 ease-out"
      />
      <span className="relative z-10 drop-shadow-[0_1px_6px_rgba(215,226,234,0.35)]">
        {label}
      </span>
    </button>
  );
};

export default LiveProjectButton;
