import React, { useEffect, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hoverType, setHoverType] = useState<'default' | 'link' | 'cta'>('default');

  useEffect(() => {
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isFinePointer || prefersReducedMotion) {
      setEnabled(false);
      return;
    }

    setEnabled(true);

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const ctaEl = target.closest('[data-cursor="cta"]');
      const linkEl = target.closest('a, button, [role="button"], input, textarea, select');

      if (ctaEl) {
        setHoverType('cta');
      } else if (linkEl) {
        setHoverType('link');
      } else {
        setHoverType('default');
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  if (!enabled) return null;

  const sizeClass =
    hoverType === 'cta'
      ? 'w-7 h-7 border-[#C6FF00] bg-[#C6FF00]/20'
      : hoverType === 'link'
      ? 'w-5 h-5 border-[#F4F4F1]/60 bg-[#F4F4F1]/5'
      : 'w-2.5 h-2.5 border-[#C6FF00]/80 bg-[#C6FF00]';

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 z-[9999] pointer-events-none hidden lg:block transition-transform duration-75 ease-out"
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`,
      }}
    >
      <div
        className={`rounded-full border transition-all duration-150 ease-out ${sizeClass}`}
      />
    </div>
  );
};
