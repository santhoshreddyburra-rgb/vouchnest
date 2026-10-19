import React from 'react';
import { motion } from 'motion/react';
import { LogoDesign } from './VouchNestLogo';

interface LeatherTagProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  design?: LogoDesign;
}

export const LeatherTag: React.FC<LeatherTagProps> = ({
  className = '',
  size = 'md',
  design = 'ticket',
}) => {
  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.25 : 1;

  return (
    <motion.div
      initial={{ rotate: -18, opacity: 0 }}
      animate={{ rotate: -16, opacity: 1 }}
      whileHover={{ rotate: -12, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className={`relative inline-block select-none max-w-full ${className}`}
      style={{ transformOrigin: '20% 50%' }}
    >
      {/* 1:1 Precise SVG Representation of 1789489855840.png */}
      <svg
        style={{ width: `${460 * scale}px`, maxWidth: '100%', height: 'auto' }}
        viewBox="0 0 460 210"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)]"
      >
        <defs>
          {/* Subtle Leather Texture Pattern */}
          <pattern id="leatherGrain" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#141416" />
            <circle cx="2" cy="2" r="0.6" fill="#202024" />
            <circle cx="6" cy="6" r="0.6" fill="#202024" />
            <circle cx="2" cy="6" r="0.4" fill="#0C0C0E" />
            <circle cx="6" cy="2" r="0.4" fill="#0C0C0E" />
          </pattern>

          {/* Red Grommet Gradient for LOGIN1.jpg */}
          <radialGradient id="redGrommetGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FF4D55" />
            <stop offset="40%" stopColor="#D7131D" />
            <stop offset="80%" stopColor="#8A0308" />
            <stop offset="100%" stopColor="#4A0105" />
          </radialGradient>

          {/* Silver Chrome Metallic Gradient for Grommet */}
          <radialGradient id="silverGrommet" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#D1D5DB" />
            <stop offset="70%" stopColor="#9CA3AF" />
            <stop offset="90%" stopColor="#4B5563" />
            <stop offset="100%" stopColor="#1F2937" />
          </radialGradient>

          {/* Inner shadow for grommet hole */}
          <radialGradient id="holeShadow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#08080A" />
            <stop offset="100%" stopColor="#252528" />
          </radialGradient>

          {/* Red Ticket Gradient */}
          <linearGradient id="ticketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5232A" />
            <stop offset="100%" stopColor="#B71118" />
          </linearGradient>
        </defs>

        {/* 1. Red Looped Cord extending to the left from Grommet matching Screenshot 222106 */}
        <g id="redCord">
          {/* Back drop-shadow of the cord */}
          <path
            d="M 148 100 C 105 106, 40 120, 15 95 C 4 82, 10 60, 35 55 C 80 48, 120 86, 148 97"
            stroke="#2A0003"
            strokeWidth="5.5"
            strokeLinecap="round"
            opacity="0.45"
            fill="none"
          />
          {/* Main Red Elastic Cord Outer Strand */}
          <path
            d="M 147 99 C 104 105, 39 119, 16 94 C 5 81, 11 59, 36 54 C 81 47, 119 85, 147 96"
            stroke="#D31A21"
            strokeWidth="3.8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Top highlight line on cord */}
          <path
            d="M 147 98 C 104 104, 40 118, 17 94 C 7 82, 12 60, 37 55 C 81 48, 118 84, 146 95"
            stroke="#FF555D"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Red Knot / cinch wrap around grommet from Screenshot 222106 */}
          <ellipse cx="147" cy="98" rx="5.5" ry="7.5" fill="#B31218" stroke="#FF4D55" strokeWidth="1" />
        </g>

        {/* 2. Classic Chamfered Black Leather Tag Body - extended width to comfortably contain entire logo and Nest */}
        <g id="tagBody">
          <path
            d="
              M 175 32
              L 485 32
              A 18 18 0 0 1 503 50
              L 503 150
              A 18 18 0 0 1 485 168
              L 175 168
              L 125 100
              Z
            "
            fill="url(#leatherGrain)"
            stroke="#2A2A2E"
            strokeWidth="1.5"
          />

          {/* 3. Perimeter Dashed White Stitching running inset along all edges */}
          <path
            d="
              M 177 40
              L 483 40
              A 12 12 0 0 1 495 52
              L 495 148
              A 12 12 0 0 1 483 160
              L 177 160
              L 133 100
              Z
            "
            fill="none"
            stroke="#E4E4E7"
            strokeWidth="1.8"
            strokeDasharray="5 3.5"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* 4. Silver Chrome Eyelet / Grommet matching Screenshot 222106 */}
          <g id="silverGrommetGroup">
            {/* Outer chrome ring */}
            <circle cx="152" cy="100" r="14" fill="url(#silverGrommet)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))" />
            <circle cx="152" cy="100" r="14" stroke="#8E9299" strokeWidth="0.8" fill="none" />
            <circle cx="152" cy="100" r="11" stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.75" />
            {/* Punched-through center hole */}
            <circle cx="152" cy="100" r="7.5" fill="url(#holeShadow)" />
          </g>

          {/* 5. VouchNest Logo positioned strictly INSIDE the tag and inside stitching */}
          <g id="logoContent" transform="translate(182, 55)">
            
            {/* V-Nest Icon on the left */}
            {design === 'minimal' ? (
              <g id="vNestMinimalIcon">
                {/* Top V */}
                <path
                  d="M 12 18 L 32 42 L 52 18"
                  stroke="#FFFFFF"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {/* Middle Arc */}
                <path
                  d="M 10 36 C 20 48, 44 48, 54 36"
                  stroke="#FFFFFF"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Bottom Red Smile Arc */}
                <path
                  d="M 8 50 C 18 64, 46 64, 56 50"
                  stroke="#E5232A"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            ) : (
              <g id="vNestTicketIcon">
                {/* Left diagonal arm of the "V" (Solid White Bar) */}
                <path
                  d="M 14 18 L 31 60"
                  stroke="#FFFFFF"
                  strokeWidth="7"
                  strokeLinecap="round"
                />

                {/* Right diagonal arm of the "V" (Angled Red Coupon Ticket) */}
                <g transform="rotate(34 50 36)">
                  {/* Red Ticket Base */}
                  <rect
                    x="30"
                    y="10"
                    width="28"
                    height="45"
                    rx="3"
                    fill="url(#ticketGradient)"
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                  />
                  {/* Top Notch Cutout */}
                  <circle cx="44" cy="10" r="4.5" fill="#141416" />
                  {/* Bottom Notch Cutout */}
                  <circle cx="44" cy="55" r="4.5" fill="#141416" />
                  {/* Perforated dashed line across ticket */}
                  <line
                    x1="32"
                    y1="28"
                    x2="56"
                    y2="28"
                    stroke="#FFFFFF"
                    strokeWidth="1.8"
                    strokeDasharray="2.5 2"
                  />
                  {/* Coupon inner mini bar */}
                  <rect x="36" y="16" width="16" height="3" rx="1" fill="#FFFFFF" opacity="0.9" />
                </g>

                {/* White curved strokes forming the Nest Bowl at base of V matching Screenshot 222106 */}
                <path
                  d="M 10 50 C 18 76, 76 76, 86 50"
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 14 58 C 24 82, 70 82, 80 58"
                  stroke="#FFFFFF"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 20 65 C 28 86, 64 86, 74 65"
                  stroke="#FFFFFF"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 26 71 C 32 89, 58 89, 66 71"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            )}

            {/* Typography: "ouchNest" + "Your Savings Hub" sitting completely inside the tag */}
            <g id="logoText" transform="translate(86, 0)">
              {/* "ouch" in crisp bold white + "Nest" in bold red, sized so Nest is completely inside the tag */}
              <text x="0" y="55" className="select-none">
                <tspan
                  fill="#FFFFFF"
                  fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
                  fontWeight="800"
                  fontSize="38"
                  letterSpacing="-1.2"
                >
                  ouch
                </tspan>
                <tspan
                  fill="#E5232A"
                  fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
                  fontWeight="800"
                  fontSize="38"
                  letterSpacing="-1.2"
                >
                  Nest
                </tspan>
              </text>

              {/* Tagline: "Your Savings Hub" */}
              <text
                x="2"
                y="80"
                fill="#FFFFFF"
                fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
                fontWeight="400"
                fontSize="15"
                letterSpacing="0.4"
                opacity="0.95"
                className="select-none"
              >
                Your Savings Hub
              </text>
            </g>
          </g>
        </g>
      </svg>
    </motion.div>
  );
};
