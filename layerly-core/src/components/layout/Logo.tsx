'use client';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
  /** When true, only the icon is shown (e.g. collapsed sidebar). */
  iconOnly?: boolean;
}

export const Logo = ({
  className = '',
  variant = 'auto',
  iconOnly = false,
}: LogoProps) => {
  let textColor = '#131522';
  if (variant === 'light') textColor = '#ffffff';
  if (variant === 'dark') textColor = '#131522';

  if (iconOnly) {
    // No shadow or filter – at small size blur would degrade the icon.
    return (
      <div
        role="img"
        className={`flex items-center justify-center ${className}`}
        aria-label="Layerly Logo"
      >
        <svg
          viewBox="0 0 80 80"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <title>Layerly Logo</title>
          <defs>
            <linearGradient id="layerlyIconLg1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#C7C7E2" />
            </linearGradient>
            <linearGradient id="layerlyIconLg2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9494C8" />
              <stop offset="100%" stopColor="#5A5AA8" />
            </linearGradient>
            <linearGradient id="layerlyIconLg3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B3B8A" />
              <stop offset="100%" stopColor="#0D0D2B" />
            </linearGradient>
          </defs>
          <g transform="scale(0.9459) translate(1.29, -33.68)">
            <polygon points="16,90 70,90 58,106 4,106" fill="url(#layerlyIconLg3)"/>
            <polygon points="20,68 74,68 62,84 8,84" fill="url(#layerlyIconLg2)"/>
            <polygon points="24,46 78,46 66,62 12,62" fill="url(#layerlyIconLg1)"/>
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div
      role="img"
      className={`flex items-center ${className}`}
      aria-label="Layerly Logo"
    >
      <svg
        viewBox="0 0 420 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <title>Layerly Logo</title>
        <defs>
          <linearGradient id="layerlyLogoLg1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#C7C7E2" />
          </linearGradient>
          <linearGradient id="layerlyLogoLg2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9494C8" />
            <stop offset="100%" stopColor="#5A5AA8" />
          </linearGradient>
          <linearGradient id="layerlyLogoLg3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B3B8A" />
            <stop offset="100%" stopColor="#0D0D2B" />
          </linearGradient>
        </defs>
        {/* Icon group – translate(20,20) positions the icon in the logo */}
        <g transform="translate(20, 20) scale(0.9459) translate(1.29, -33.68)">
          <polygon points="16,90 70,90 58,106 4,106" fill="url(#layerlyLogoLg3)"/>
          <polygon points="20,68 74,68 62,84 8,84" fill="url(#layerlyLogoLg2)"/>
          <polygon points="24,46 78,46 66,62 12,62" fill="url(#layerlyLogoLg1)"/>
        </g>

        {/* Text signature – y=84 for vertical alignment with icon */}
        <text
          x="120"
          y="84"
          fontFamily="'Inter', system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="54"
          fill={textColor}
          letterSpacing="-0.04em"
        >
          Layerly<tspan fill="#5C3DE6" fontSize="58">.</tspan>
        </text>
      </svg>
    </div>
  );
};
