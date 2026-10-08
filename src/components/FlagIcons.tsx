import React from 'react';

export const BrazilFlag: React.FC<{ className?: string }> = ({
  className = 'w-5 h-3.5',
}) => {
  return (
    <svg
      viewBox="0 0 720 504"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 rounded-[2px] overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <rect width="720" height="504" fill="#009B3A" />
      <polygon points="360,50 670,252 360,454 50,252" fill="#FEDF00" />
      <circle cx="360" cy="252" r="126" fill="#002776" />
      <path
        d="M 235 260 C 290 210, 420 210, 485 260 C 420 225, 290 225, 235 260 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
};

export const PortugalFlag: React.FC<{ className?: string }> = ({
  className = 'w-5 h-3.5',
}) => {
  return (
    <svg
      viewBox="0 0 600 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 rounded-[2px] overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <rect width="240" height="400" fill="#046A38" />
      <rect x="240" width="360" height="400" fill="#DA291C" />
      {/* Esfera Armilar */}
      <circle cx="240" cy="200" r="75" stroke="#FEDF00" strokeWidth="12" fill="none" />
      <circle cx="240" cy="200" r="50" stroke="#FEDF00" strokeWidth="8" fill="none" />
      <line x1="240" y1="110" x2="240" y2="290" stroke="#FEDF00" strokeWidth="10" />
      <line x1="150" y1="200" x2="330" y2="200" stroke="#FEDF00" strokeWidth="10" />
      {/* Escudo Português */}
      <rect x="210" y="160" width="60" height="75" rx="5" fill="#DA291C" stroke="#FEDF00" strokeWidth="4" />
      <rect x="220" y="170" width="40" height="55" rx="3" fill="#FFFFFF" />
      {/* Quinas de Portugal */}
      <rect x="235" y="175" width="10" height="12" fill="#002776" />
      <rect x="225" y="190" width="10" height="12" fill="#002776" />
      <rect x="235" y="190" width="10" height="12" fill="#002776" />
      <rect x="245" y="190" width="10" height="12" fill="#002776" />
      <rect x="235" y="205" width="10" height="12" fill="#002776" />
    </svg>
  );
};
