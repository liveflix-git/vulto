import React from 'react';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  showWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Marca Oficial VULTO LAB
 * Monograma Geométrico V + L com o triângulo Lime Acid (#C6FF00) no quadrante superior.
 * Exatamente igual à imagem enviada (Monograma geométrico V e L neon.png).
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'light',
  showWordmark = true,
  size = 'md',
  className = '',
}) => {
  const textColor = variant === 'light' ? 'text-[#F4F4F1]' : 'text-[#0A0A0A]';
  const fillPrimary = variant === 'light' ? '#F4F4F1' : '#0A0A0A';

  const dimensions = {
    sm: {
      box: 34,
      vultoText: 'text-xs font-black tracking-[-0.03em]',
      labText: 'text-[8px] font-bold tracking-[0.18em]',
    },
    md: {
      box: 45,
      vultoText: 'text-base sm:text-lg font-black tracking-[-0.04em]',
      labText: 'text-[9px] sm:text-[10px] font-bold tracking-[0.2em]',
    },
    lg: {
      box: 60,
      vultoText: 'text-xl sm:text-2xl font-black tracking-[-0.05em]',
      labText: 'text-[10px] sm:text-[11px] font-bold tracking-[0.22em]',
    },
  }[size];

  return (
    <span className={`inline-flex items-center gap-1 sm:gap-1.5 select-none ${className}`}>
      {/* Monograma Geométrico V + L sem espaço vago lateral */}
      <svg
        width={dimensions.box}
        height={dimensions.box * (44 / 69)}
        viewBox="16 28 69 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
      >
        {/* Haste Esquerda do V */}
        <path
          d="M18 30H35L48 56.5V70H42.5L18 30Z"
          fill={fillPrimary}
        />

        {/* Triângulo Neon Lime Superior Direito (#C6FF00) */}
        <path
          d="M50.5 30H66.5L50.5 48V30Z"
          fill="#C6FF00"
        />

        {/* Base Horizontal do L Inferior Direito */}
        <path
          d="M50.5 56.5H74.5L83 70H50.5V56.5Z"
          fill={fillPrimary}
        />
      </svg>

      {/* Tipografia: VULTO em tamanho grande + LAB menor imediatamente ao lado */}
      {showWordmark && (
        <span className="inline-flex items-baseline gap-1 leading-none">
          <span className={`font-display uppercase ${dimensions.vultoText} ${textColor}`}>
            VULTO
          </span>
          <span
            className={`font-mono-tabular uppercase ${dimensions.labText} text-[#C6FF00] font-semibold self-baseline`}
          >
            LAB
          </span>
        </span>
      )}
    </span>
  );
};

export const VultoArchitecturalMonogram: React.FC<{
  className?: string;
  strokeColor?: string;
  showLimeSlit?: boolean;
}> = ({ className = 'w-64 h-64', strokeColor = 'rgba(244,244,241,0.12)' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <line x1="0" y1="20" x2="100" y2="20" stroke={strokeColor} strokeWidth="0.5" />
      <line x1="0" y1="80" x2="100" y2="80" stroke={strokeColor} strokeWidth="0.5" />
      <line x1="20" y1="0" x2="20" y2="100" stroke={strokeColor} strokeWidth="0.5" />
      <line x1="80" y1="0" x2="80" y2="100" stroke={strokeColor} strokeWidth="0.5" />

      {/* Monograma V + L em grande escala */}
      <path
        d="M18 30H35L48 56.5V70H42.5L18 30Z"
        fill="rgba(244,244,241,0.85)"
      />
      <path
        d="M50.5 30H66.5L50.5 48V30Z"
        fill="#C6FF00"
      />
      <path
        d="M50.5 56.5H74.5L83 70H50.5V56.5Z"
        fill="rgba(244,244,241,0.85)"
      />
    </svg>
  );
};
