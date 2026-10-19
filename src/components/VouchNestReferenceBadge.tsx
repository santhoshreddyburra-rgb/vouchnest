import React from 'react';

interface VouchNestReferenceBadgeProps {
  className?: string;
  height?: number;
  onClick?: () => void;
  title?: string;
}

/**
 * VouchNestReferenceBadge
 * Exactly reproduces the uploaded reference photo (file_00000000a364820b86c9901fcca1c51e.png)
 * positioned at spot #2 in the top bar as circled in editables.png.
 *
 * ViewBox 0 0 450 96 provides ample horizontal clearance so "Nest" never clips or goes outside.
 */
export const VouchNestReferenceBadge: React.FC<VouchNestReferenceBadgeProps> = ({
  className = '',
  height = 28,
  onClick,
  title = 'VouchNest Profile & Account',
}) => {
  return (
    <div
      onClick={onClick}
      title={title}
      className={`inline-flex items-center select-none bg-transparent hover:opacity-90 transition-opacity cursor-pointer shrink-0 ${className}`}
      style={{ height: `${height}px` }}
    >
      <svg
        style={{ height: `${height}px`, width: 'auto' }}
        viewBox="0 0 470 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 block"
      >
        {/* ============================================================ */}
        {/* 1. LEFT: Rounded Profile Box with Red Border & Gray Silhouette*/}
        {/* ============================================================ */}
        <g id="refAvatarBox">
          <rect
            x="4"
            y="4"
            width="88"
            height="88"
            rx="10"
            fill="#FFFFFF"
            stroke="#D7131D"
            strokeWidth="4"
          />
          {/* Silhouette Avatar Head */}
          <circle cx="48" cy="38" r="17" fill="#6B7280" />
          {/* Silhouette Avatar Torso / Shoulders */}
          <path
            d="M 20 78 C 20 56, 76 56, 76 78 Z"
            fill="#6B7280"
          />
        </g>

        {/* ============================================================ */}
        {/* 2. CENTER: Stylized V-Nest Mark from reference photo        */}
        {/* ============================================================ */}
        <g id="refVNestMark">
          {/* Left Arm of the V (Solid black wing with horizontal top spur) */}
          <path
            d="M 104 28 C 108 28, 117 28, 125 31 C 130 37, 138 50, 150 70 C 145 73, 139 73, 133 66 L 118 43 C 113 36, 108 33, 104 31 Z"
            fill="#000000"
          />
          <path
            d="M 104 28 H 125 C 130 36, 138 50, 150 70"
            stroke="#000000"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Right Arm: Angled Red Coupon Ticket with Notch Cutout */}
          <path
            d="M 142 67 L 165 24 C 166 22, 169 21, 172 23 L 187 33 C 189 35, 189 38, 187 40 L 181 45 L 188 50 C 190 52, 189 55, 187 57 L 164 74"
            stroke="#D7131D"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Interwoven Nest (Black Organic Twigs Cradle) */}
          <path
            d="M 106 50 C 118 75, 168 75, 184 50"
            stroke="#000000"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 109 60 C 122 83, 162 83, 178 60"
            stroke="#000000"
            strokeWidth="3.6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 115 69 C 126 88, 154 88, 168 69"
            stroke="#000000"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* Crossing twig accents */}
          <path
            d="M 112 55 L 134 71"
            stroke="#000000"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M 152 71 L 174 57"
            stroke="#000000"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M 122 77 L 160 77"
            stroke="#000000"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </g>

        {/* ============================================================ */}
        {/* 3. RIGHT: Typography "ouchNest" using contiguous tspan      */}
        {/* Guaranteed to flow without overflowing the 470px viewBox    */}
        {/* ============================================================ */}
        <text
          x="196"
          y="66"
          fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="48"
          letterSpacing="-1.2"
        >
          <tspan fill="#000000">ouch</tspan>
          <tspan fill="#D7131D">Nest</tspan>
        </text>
      </svg>
    </div>
  );
};
