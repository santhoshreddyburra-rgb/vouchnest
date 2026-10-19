import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  onStartUpload?: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartUpload }) => {
  return (
    <section className="w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto select-none bg-white">
      {/* Title from HOME.png */}
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight font-sans">
          How VoucherNest Works
        </h2>
      </div>

      {/* 3 Steps with Connected Arrows */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 relative">
        
        {/* STEP 1: 1. UPLOAD */}
        <div className="flex-1 flex flex-col items-center text-center max-w-[240px]">
          {/* Graphic matching HOME.png: Phones + Cloud + Coupon */}
          <div className="w-24 h-24 mb-4 flex items-center justify-center relative">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
              {/* Cloud in background */}
              <path
                d="M 25 50 A 12 12 0 0 1 45 40 A 18 18 0 0 1 75 48 A 12 12 0 0 1 70 70 L 25 70 A 10 10 0 0 1 25 50 Z"
                fill="#E2E8F0"
              />
              {/* Back Phone */}
              <rect x="25" y="28" width="28" height="48" rx="4" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
              <circle cx="39" cy="34" r="2.5" fill="#D7131D" />
              <line x1="30" y1="44" x2="48" y2="44" stroke="#71717A" strokeWidth="2" strokeLinecap="round" />
              <line x1="30" y1="52" x2="44" y2="52" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" />

              {/* Front Phone */}
              <rect x="42" y="38" width="28" height="48" rx="4" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
              <circle cx="56" cy="44" r="3.5" fill="#D7131D" />
              <line x1="48" y1="56" x2="64" y2="56" stroke="#D7131D" strokeWidth="2" strokeLinecap="round" />
              <line x1="48" y1="64" x2="60" y2="64" stroke="#71717A" strokeWidth="2" strokeLinecap="round" />
              
              {/* Red Ticket Icon */}
              <rect x="52" y="16" width="20" height="12" rx="2" fill="#D7131D" stroke="#FFFFFF" strokeWidth="1.5" transform="rotate(-15 52 16)" />
            </svg>
          </div>

          <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 tracking-wide uppercase">
            1. UPLOAD
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-medium">
            Share your unused coupons
          </p>
        </div>

        {/* Arrow 1 */}
        <div className="hidden md:flex text-neutral-800 shrink-0 mb-8">
          <ArrowRight size={28} strokeWidth={2.5} />
        </div>

        {/* STEP 2: 2. DISCOVER */}
        <div className="flex-1 flex flex-col items-center text-center max-w-[240px]">
          {/* Graphic matching HOME.png: Laptop screen with deals */}
          <div className="w-24 h-24 mb-4 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
              {/* Laptop Display */}
              <rect x="20" y="28" width="60" height="38" rx="3" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
              {/* Screen Content */}
              <rect x="25" y="33" width="50" height="28" fill="#18181B" rx="1" />
              <line x1="30" y1="40" x2="52" y2="40" stroke="#D7131D" strokeWidth="2" strokeLinecap="round" />
              <line x1="30" y1="46" x2="62" y2="46" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="30" y1="52" x2="45" y2="52" stroke="#A1A1AA" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="64" cy="50" r="4" fill="#D7131D" />

              {/* Laptop Base */}
              <path
                d="M 12 66 L 88 66 L 82 72 L 18 72 Z"
                fill="#D4D4D8"
                stroke="#000000"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <rect x="42" y="66" width="16" height="2" rx="1" fill="#71717A" />
            </svg>
          </div>

          <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 tracking-wide uppercase">
            2. DISCOVER
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-medium">
            Find deals from other users
          </p>
        </div>

        {/* Arrow 2 */}
        <div className="hidden md:flex text-neutral-800 shrink-0 mb-8">
          <ArrowRight size={28} strokeWidth={2.5} />
        </div>

        {/* STEP 3: 3. REDEEM & SAVE */}
        <div className="flex-1 flex flex-col items-center text-center max-w-[240px]">
          {/* Graphic matching HOME.png: Speaker / Sound and coupons */}
          <div className="w-24 h-24 mb-4 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
              {/* Speaker Tower */}
              <rect x="22" y="24" width="30" height="52" rx="4" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
              <circle cx="37" cy="36" r="6" fill="#D7131D" stroke="#000000" strokeWidth="1.5" />
              <circle cx="37" cy="56" r="10" fill="#18181B" stroke="#000000" strokeWidth="1.5" />
              <circle cx="37" cy="56" r="4" fill="#FFFFFF" />

              {/* Red Ticket / Device beside it */}
              <rect x="56" y="38" width="22" height="38" rx="3" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
              <circle cx="67" cy="46" r="3.5" fill="#D7131D" />
              <line x1="60" y1="56" x2="74" y2="56" stroke="#D7131D" strokeWidth="2" strokeLinecap="round" />
              <line x1="60" y1="62" x2="70" y2="62" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" />
              
              {/* Sound / celebration rays */}
              <path d="M 80 40 Q 86 45 80 50" stroke="#D7131D" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M 84 35 Q 92 45 84 55" stroke="#D7131D" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 tracking-wide uppercase">
            3. REDEEM & SAVE
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-medium">
            Use a coupon and enjoy the savings
          </p>
        </div>

      </div>
    </section>
  );
};
