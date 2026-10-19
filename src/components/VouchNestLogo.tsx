import React from 'react';
import { VouchNestMark } from './VouchNestMark';

export { VouchNestMark };
export type LogoDesign = 'minimal' | 'ticket' | 'reference';

interface VouchNestLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'onTag';
  design?: LogoDesign;
  inBadge?: boolean;
  nestColor?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export const VouchNestLogo: React.FC<VouchNestLogoProps> = ({
  className = '',
  variant = 'dark',
  design = 'reference',
  inBadge = false,
  nestColor,
  showTagline = false,
  size = 'md',
  onClick,
}) => {
  const sizeMap = {
    sm: { height: 26, text: 'text-lg', subText: 'text-[9px]' },
    md: { height: 36, text: 'text-2xl', subText: 'text-[11px]' },
    lg: { height: 48, text: 'text-3xl', subText: 'text-xs' },
    xl: { height: 60, text: 'text-4xl', subText: 'text-sm' },
  };

  const { height, text, subText } = sizeMap[size];

  // Colors based on variant & design
  const isLight = variant === 'light' || inBadge;
  const textColor = isLight ? '#000000' : '#FFFFFF';
  const effectiveNestColor = nestColor || '#EE1C25';
  const notchFill = isLight ? '#FFFFFF' : '#141416';

  // ============================================================
  // EXACT REFERENCE LOGO from file_00000000ca88820baddb521064c9c17d.png
  // Unified vector artwork: Solid white slanted bar + Angled ticket booklet
  // + Interwoven twig nest cradle + Pure vector glyphs for "ouchNest"
  // Note: Letter 't' has full crossbar and curved foot with generous viewBox margin.
  // ============================================================
  if (design === 'reference') {
    const exactLogo = (
      <div
        onClick={onClick}
        className={`inline-flex items-center select-none ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        <svg
          style={{ height: `${height}px`, width: 'auto' }}
          viewBox="0 0 520 114"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 block overflow-visible"
        >
          {/* Mark V-Nest */}
          <g id="vouchNestMark">
            {/* Left Arm: Solid Slanted Bar with Horizontal Flat Top */}
            <path
              d="M 22 34 H 44 L 70 78 H 48 Z"
              fill={textColor}
            />

            {/* Right Arm: Back Ticket (Secondary Layer peeking behind on top right) */}
            <g transform="translate(75, 10) rotate(32)">
              <path
                d="M 10 0 H 23 C 25.5 0, 28 2.5, 28 5 V 42"
                stroke={textColor}
                strokeWidth="4.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>

            {/* Right Arm: Front Ticket Body (Tilted rounded voucher) */}
            <g transform="translate(68, 14) rotate(32)">
              <rect
                x="0"
                y="0"
                width="28"
                height="58"
                rx="5"
                stroke={textColor}
                strokeWidth="4.2"
                fill={isLight ? '#FFFFFF' : '#000000'}
              />
              {/* Stub tear-off line across upper ticket */}
              <line
                x1="0"
                y1="15"
                x2="28"
                y2="15"
                stroke={textColor}
                strokeWidth="3.8"
                strokeLinecap="round"
              />
            </g>

            {/* Interwoven Nest Cradle Twigs */}
            <path
              d="M 16 56 C 12 90, 68 104, 126 54"
              stroke={textColor}
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 22 66 C 26 94, 98 98, 122 66"
              stroke={textColor}
              strokeWidth="3.8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 28 76 C 40 98, 96 100, 114 78"
              stroke={textColor}
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 36 86 C 54 102, 90 103, 106 88"
              stroke={textColor}
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />

            {/* Crossing twig accents for authentic woven texture */}
            <path d="M 30 78 L 70 98" stroke={textColor} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M 40 88 L 82 100" stroke={textColor} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M 64 98 L 108 80" stroke={textColor} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M 76 99 L 118 74" stroke={textColor} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M 50 102 L 98 102" stroke={textColor} strokeWidth="2.6" strokeLinecap="round" />
          </g>

          {/* Wordmark: "ouch" in Solid White (or dark in light mode) */}
          <path
            id="wordmark-ouch"
            d="M146.41 80.72L146.41 80.72Q139.71 80.72 134.56 78.09Q129.42 75.46 126.46 70.86Q123.51 66.25 123.51 60.27L123.51 60.27Q123.51 54.30 126.46 49.69Q129.42 45.08 134.56 42.49Q139.71 39.90 146.41 39.90L146.41 39.90Q153.10 39.90 158.29 42.49Q163.47 45.08 166.39 49.69Q169.30 54.30 169.30 60.27L169.30 60.27Q169.30 66.25 166.39 70.86Q163.47 75.46 158.29 78.09Q153.10 80.72 146.41 80.72M146.41 68.05L146.41 68.05Q148.21 68.05 149.65 67.18Q151.09 66.32 151.95 64.56Q152.82 62.79 152.82 60.27L152.82 60.27Q152.82 57.68 151.95 55.99Q151.09 54.30 149.65 53.43Q148.21 52.57 146.41 52.57L146.41 52.57Q144.61 52.57 143.17 53.43Q141.73 54.30 140.86 55.99Q140.00 57.68 140.00 60.27L140.00 60.27Q140.00 62.79 140.86 64.56Q141.73 66.32 143.17 67.18Q144.61 68.05 146.41 68.05M190.83 80.72L190.83 80.72Q186.15 80.72 182.37 78.81Q178.59 76.90 176.43 72.84Q174.27 68.77 174.27 62.36L174.27 62.36L174.27 40.62L190.54 40.62L190.54 59.55Q190.54 63.73 191.91 65.38Q193.28 67.04 195.66 67.04L195.66 67.04Q197.10 67.04 198.36 66.28Q199.62 65.53 200.41 63.76Q201.20 62.00 201.20 59.12L201.20 59.12L201.20 40.62L217.47 40.62L217.47 80.00L201.99 80.00L201.99 76.33Q200.70 77.62 199.18 78.49L199.18 78.49Q195.30 80.72 190.83 80.72M245.84 80.72L245.84 80.72Q239.07 80.72 233.82 78.13Q228.56 75.54 225.57 70.89Q222.58 66.25 222.58 60.27L222.58 60.27Q222.58 54.30 225.57 49.69Q228.56 45.08 233.82 42.49Q239.07 39.90 245.84 39.90L245.84 39.90Q253.04 39.90 258.15 42.99Q263.26 46.09 265.21 51.56L265.21 51.56L252.61 57.75Q251.38 55.02 249.62 53.79Q247.86 52.57 245.77 52.57L245.77 52.57Q243.97 52.57 242.42 53.43Q240.87 54.30 239.97 55.99Q239.07 57.68 239.07 60.27L239.07 60.27Q239.07 62.86 239.97 64.59Q240.87 66.32 242.42 67.18Q243.97 68.05 245.77 68.05L245.77 68.05Q247.86 68.05 249.62 66.82Q251.38 65.60 252.61 62.86L252.61 62.86L265.21 69.06Q263.26 74.53 258.15 77.62Q253.04 80.72 245.84 80.72M285.22 80.00L268.95 80.00L268.95 26.58L285.22 26.58L285.22 43.78Q286.30 42.85 287.60 42.13L287.60 42.13Q291.49 39.90 296.31 39.90L296.31 39.90Q300.85 39.90 304.52 41.73Q308.19 43.57 310.32 47.46Q312.44 51.34 312.44 57.54L312.44 57.54L312.44 80.00L296.17 80.00L296.17 60.34Q296.17 56.67 294.87 55.12Q293.58 53.58 291.34 53.58L291.34 53.58Q289.69 53.58 288.28 54.33Q286.88 55.09 286.05 56.82Q285.22 58.54 285.22 61.50L285.22 61.50L285.22 80.00"
            fill={textColor}
          />

          {/* Wordmark: "Nest" in Bold Red with complete, unclipped letter 't' */}
          <path
            id="wordmark-nest"
            d="M332.66 80.00L316.10 80.00L316.10 29.60L330.07 29.60L349.22 52.50L349.22 29.60L365.78 29.60L365.78 80.00L351.82 80.00L332.66 57.10L332.66 80.00M395.23 80.72L395.23 80.72Q388.03 80.72 382.67 78.06Q377.30 75.39 374.35 70.75Q371.40 66.10 371.40 60.27L371.40 60.27Q371.40 54.30 374.32 49.69Q377.23 45.08 382.31 42.49Q387.38 39.90 393.72 39.90L393.72 39.90Q399.55 39.90 404.48 42.20Q409.42 44.50 412.40 49.04Q415.39 53.58 415.39 60.27L415.39 60.27Q415.39 61.14 415.32 62.18Q415.25 63.22 415.18 64.09L415.18 64.09L387.89 64.09Q388.03 64.59 388.32 65.10L388.32 65.10Q389.33 66.90 391.20 67.80Q393.07 68.70 395.74 68.70L395.74 68.70Q398.47 68.70 400.24 67.98Q402.00 67.26 403.94 65.82L403.94 65.82L412.44 74.38Q409.56 77.48 405.35 79.10Q401.14 80.72 395.23 80.72M387.53 56.24L387.53 56.24L400.20 56.24Q399.98 55.23 399.62 54.37L399.62 54.37Q398.76 52.78 397.32 51.88Q395.88 50.98 393.86 50.98Q391.85 50.98 390.37 51.88Q388.90 52.78 388.10 54.37L388.10 54.37Q387.67 55.23 387.53 56.24M435.91 80.72L435.91 80.72Q430.87 80.72 425.98 79.64Q421.08 78.56 418.06 76.83L418.06 76.83L422.52 66.10Q425.33 67.76 429.04 68.70Q432.74 69.63 436.27 69.63L436.27 69.63Q439.22 69.63 440.27 69.13Q441.31 68.62 441.31 67.76L441.31 67.76Q441.31 66.90 440.09 66.50Q438.86 66.10 436.85 65.89Q434.83 65.67 432.42 65.35Q430.01 65.02 427.56 64.38Q425.11 63.73 423.10 62.43Q421.08 61.14 419.86 58.94Q418.63 56.74 418.63 53.36L418.63 53.36Q418.63 49.62 420.90 46.59Q423.17 43.57 427.67 41.73Q432.17 39.90 438.79 39.90L438.79 39.90Q443.11 39.90 447.43 40.69Q451.75 41.48 454.85 43.14L454.85 43.14L450.38 53.86Q447.36 52.21 444.44 51.60Q441.53 50.98 439.01 50.98L439.01 50.98Q435.91 50.98 434.80 51.56Q433.68 52.14 433.68 52.86L433.68 52.86Q433.68 53.72 434.90 54.15Q436.13 54.58 438.14 54.80Q440.16 55.02 442.57 55.34Q444.98 55.66 447.40 56.35Q449.81 57.03 451.82 58.33Q453.84 59.62 455.06 61.82Q456.29 64.02 456.29 67.40L456.29 67.40Q456.29 70.93 454.06 73.99Q451.82 77.05 447.29 78.88Q442.75 80.72 435.91 80.72M480.19 80.72L480.19 80.72Q472.06 80.72 467.52 76.80Q462.98 72.87 462.98 64.74L462.98 64.74L462.98 52.50L457.58 52.50L457.58 40.62L462.98 40.62L462.98 31.76L479.26 31.76L479.26 40.62L487.32 40.62L487.32 52.50L479.26 52.50L479.26 64.59Q479.26 66.39 480.23 67.40Q481.20 68.41 482.64 68.41L482.64 68.41Q484.73 68.41 486.31 67.33L486.31 67.33L490.20 78.63Q488.33 79.71 485.70 80.22Q483.07 80.72 480.19 80.72"
            fill={effectiveNestColor}
          />
        </svg>
      </div>
    );

    if (inBadge) {
      return (
        <div className="inline-flex items-center px-4 py-2 bg-white border border-neutral-200 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          {exactLogo}
        </div>
      );
    }

    return exactLogo;
  }

  const logoContent = (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* ============================================================ */}
      {/* 1. MINIMAL DESIGN from Screenshot 2026-09-16 223801.png      */}
      {/* Symmetrical Black V + Black Middle Arc + Red Smile Arc        */}
      {/* ============================================================ */}
      {design === 'minimal' ? (
        <svg
          style={{ height: `${height}px`, width: 'auto' }}
          viewBox="0 0 68 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          {/* Top V: Two thick diagonal strokes meeting at the bottom center */}
          <path
            d="M 12 12 L 34 33 L 56 12"
            stroke={isLight ? '#000000' : '#FFFFFF'}
            strokeWidth="6.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Middle Arc: Black cradle arc bow */}
          <path
            d="M 11 27 C 20 37, 48 37, 57 27"
            stroke={isLight ? '#000000' : '#FFFFFF'}
            strokeWidth="5.2"
            strokeLinecap="round"
          />

          {/* Bottom Arc: Bright Red Smile Arc from Screenshot 223801 */}
          <path
            d="M 9 39 C 19 50, 49 50, 59 39"
            stroke={effectiveNestColor}
            strokeWidth="5.8"
            strokeLinecap="round"
          />
        </svg>
      ) : design === 'reference' ? (
        /* ============================================================ */
        /* 3. UPLOADED REFERENCE DESIGN (file_00000000ca88820baddb5210) */
        /* Solid white slanted bar + Angled ticket book + Organic nest  */
        /* ============================================================ */
        <svg
          style={{ height: `${height}px`, width: 'auto' }}
          viewBox="0 0 108 88"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          {/* Left Arm of V: Solid Slanted Bar with Horizontal Top */}
          <path
            d="M 14 26 H 32 L 52 62 H 34 Z"
            fill={textColor}
          />

          {/* Right Arm of V: Layered Ticket / Coupon Booklet */}
          {/* Back Layer (secondary ticket visible behind on top-right) */}
          <path
            d="M 82 22 L 91 28 C 93 29.5, 94 32, 93 34 L 79 58"
            stroke={textColor}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Front Ticket with rounded corners */}
          <rect
            x="44"
            y="12"
            width="21"
            height="44"
            rx="3.5"
            transform="rotate(31 44 12)"
            stroke={textColor}
            strokeWidth="3.2"
            fill={isLight ? '#FFFFFF' : '#000000'}
          />
          {/* Inside tear-off header divider line */}
          <line
            x1="71"
            y1="26"
            x2="82"
            y2="33"
            stroke={textColor}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* The Nest: Interwoven twig cradle */}
          <path
            d="M 10 44 C 8 68, 48 82, 95 44"
            stroke={textColor}
            strokeWidth="3.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 12 52 C 16 72, 70 76, 92 53"
            stroke={textColor}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 16 60 C 26 77, 68 78, 86 62"
            stroke={textColor}
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 22 68 C 34 81, 62 82, 78 70"
            stroke={textColor}
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Crossing twig accents */}
          <path
            d="M 18 60 L 46 75"
            stroke={textColor}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M 24 70 L 56 78"
            stroke={textColor}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M 42 76 L 76 62"
            stroke={textColor}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M 54 77 L 85 58"
            stroke={textColor}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        /* ============================================================ */
        /* 2. TICKET NEST DESIGN from Screenshot 2026-09-16 222355.png  */
        /* Maroon Left Bar + Angled Red Ticket + Interwoven Nest Cradles*/
        /* ============================================================ */
        <svg
          style={{ height: `${height}px`, width: 'auto' }}
          viewBox="0 0 105 85"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
        >
          {/* Left Arm of the V (Deep Maroon on light or Solid White on dark) */}
          <path
            d="M 18 18 L 36 62"
            stroke={isLight ? '#5F050B' : '#FFFFFF'}
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Right Arm of the V (Angled Red Coupon Ticket) */}
          <g transform="rotate(32 60 40)">
            {/* Main Red Ticket Body */}
            <rect
              x="36"
              y="11"
              width="28"
              height="46"
              rx="3"
              fill="#D7131D"
              stroke={isLight ? '#FFFFFF' : '#FFFFFF'}
              strokeWidth="2.5"
            />
            {/* Top Hole Punch Cutout */}
            <circle cx="50" cy="11" r="4.5" fill={notchFill} />
            {/* Perforation dashed line across ticket */}
            <line
              x1="38"
              y1="33"
              x2="62"
              y2="33"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeDasharray="3 2"
            />
            {/* Inner Ticket Accent Bar */}
            <rect x="42" y="19" width="16" height="4" rx="1" fill="#FFFFFF" opacity="0.95" />
            {/* Bottom circular punch dot */}
            <circle cx="50" cy="44" r="3" fill="#FFFFFF" />
          </g>

          {/* Interwoven Curved Twigs forming the Nest Bowl below the V */}
          <path
            d="M 10 50 C 18 76, 76 76, 86 50"
            stroke={isLight ? '#6B7280' : '#FFFFFF'}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M 14 58 C 24 82, 70 82, 80 58"
            stroke={isLight ? '#9CA3AF' : '#E5E7EB'}
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M 20 65 C 28 86, 64 86, 74 65"
            stroke={isLight ? '#6B7280' : '#D1D5DB'}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M 26 71 C 32 89, 58 89, 66 71"
            stroke={isLight ? '#9CA3AF' : '#FFFFFF'}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Typography: "ouchNest" + "Your Savings Hub" */}
      <div className="flex flex-col justify-center -ml-0.5 leading-none">
        <div className={`font-extrabold tracking-tight flex items-baseline ${text}`}>
          {/* "ouch" */}
          <span
            style={{
              color: textColor,
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            }}
          >
            ouch
          </span>
          {/* "Nest" in Bold Vibrant Red matching reference images */}
          <span
            style={{
              color: effectiveNestColor,
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            }}
          >
            Nest
          </span>
        </div>

        {showTagline && (
          <span
            className={`font-medium tracking-wide mt-0.5 ${
              isLight ? 'text-neutral-600' : 'text-neutral-300'
            } ${subText}`}
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Your Savings Hub
          </span>
        )}
      </div>
    </div>
  );

  // If inBadge is requested, wrap in the pill container from Screenshot 2026-09-16 223801.png
  if (inBadge) {
    return (
      <div className="inline-flex items-center px-4 py-2 bg-white border border-neutral-200 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        {logoContent}
      </div>
    );
  }

  return logoContent;
};
