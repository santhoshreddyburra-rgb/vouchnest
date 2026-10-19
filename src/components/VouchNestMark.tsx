import React from 'react';

interface VouchNestMarkProps {
  className?: string;
  size?: number | string;
  variant?: 'light' | 'dark';
  color?: string;
  ticketFillColor?: string;
  onClick?: () => void;
}

/**
 * VouchNestMark: The exact standalone V-Nest icon from reference Screenshot 2026-09-17 192351.png
 * Features:
 * - Solid slanted left arm with crisp horizontal flat top
 * - Layered coupon/voucher booklet tilted to the right:
 *   - Foreground ticket with rounded border & horizontal tear-off stub line
 *   - Background ticket outline offset to the top-right
 * - Interwoven bird's nest twig cradle supporting the base of the V
 */
export const VouchNestMark: React.FC<VouchNestMarkProps> = ({
  className = '',
  size = 36,
  variant = 'dark',
  color,
  ticketFillColor,
  onClick,
}) => {
  const isLight = variant === 'light';
  const mainColor = color || (isLight ? '#000000' : '#FFFFFF');
  const ticketFill = ticketFillColor || (isLight ? '#FFFFFF' : '#000000');

  const dimensionStyle =
    typeof size === 'number'
      ? { width: `${size}px`, height: `${size}px` }
      : { width: size, height: size };

  return (
    <div
      onClick={onClick}
      style={dimensionStyle}
      className={`inline-flex items-center justify-center shrink-0 select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      title="VouchNest"
    >
      <svg
        viewBox="0 0 114 114"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full block overflow-visible"
      >
        {/* Left Arm: Solid Slanted Bar with Horizontal Flat Top */}
        <path
          d="M 16 34 H 38 L 64 80 H 42 Z"
          fill={mainColor}
        />

        {/* Right Arm: Back Ticket (Secondary Layer peeking behind on top right) */}
        <g transform="translate(68, 10) rotate(33)">
          <path
            d="M 8 0 H 22 C 25.5 0, 28 2.5, 28 5.5 V 42"
            stroke={mainColor}
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* Right Arm: Front Ticket Body (Tilted rounded voucher) */}
        <g transform="translate(60, 14) rotate(33)">
          <rect
            x="0"
            y="0"
            width="28"
            height="58"
            rx="5"
            stroke={mainColor}
            strokeWidth="4.2"
            fill={ticketFill}
          />
          {/* Stub tear-off line across upper ticket */}
          <line
            x1="0"
            y1="15"
            x2="28"
            y2="15"
            stroke={mainColor}
            strokeWidth="3.8"
            strokeLinecap="round"
          />
        </g>

        {/* Interwoven Nest Cradle Twigs */}
        {/* Top Outer Rim / Lip */}
        <path
          d="M 15 56 C 11 90, 64 104, 110 55"
          stroke={mainColor}
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Second Curved Band */}
        <path
          d="M 20 66 C 24 93, 88 97, 106 66"
          stroke={mainColor}
          strokeWidth="3.8"
          strokeLinecap="round"
          fill="none"
        />
        {/* Third Curved Band */}
        <path
          d="M 26 76 C 36 97, 85 99, 99 78"
          stroke={mainColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Bottom Base Band */}
        <path
          d="M 33 85 C 49 101, 80 102, 92 88"
          stroke={mainColor}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Authentic Interwoven Crossing Twigs */}
        {/* Lower-left protruding twig end */}
        <path d="M 24 76 L 16 80" stroke={mainColor} strokeWidth="2.8" strokeLinecap="round" />
        {/* Diagonal weave strokes */}
        <path d="M 28 78 L 64 97" stroke={mainColor} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M 37 87 L 74 99" stroke={mainColor} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M 58 97 L 95 80" stroke={mainColor} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M 68 98 L 102 75" stroke={mainColor} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M 46 101 L 86 101" stroke={mainColor} strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </div>
  );
};
export default VouchNestMark;
