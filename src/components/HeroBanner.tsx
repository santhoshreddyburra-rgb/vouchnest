import React from 'react';

interface HeroBannerProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onGetStarted: () => void;
  onLearnMore: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  searchQuery,
  onSearchChange,
  onGetStarted,
  onLearnMore,
}) => {
  return (
    <div className="relative w-full bg-white select-none">
      
      {/* Red Graphic Hero Banner Canvas from HOME.png */}
      <div className="relative w-full bg-[#E01E27] text-white overflow-hidden py-16 sm:py-24 md:py-28 px-4 sm:px-8">
        
        {/* 3D Geometric Collage Background Elements matching HOME.png */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Halftone dot matrix pattern from HOME.png */}
          <div className="absolute top-1/4 left-1/4 w-56 h-56 rounded-full bg-[radial-gradient(#000000_2.5px,transparent_2.5px)] [background-size:12px_12px] opacity-35" />
          <div className="absolute -bottom-8 right-1/4 w-72 h-72 rounded-full bg-[radial-gradient(#000000_2.5px,transparent_2.5px)] [background-size:12px_12px] opacity-30" />

          {/* 3D Curved Red Cylinders & Spheres from screenshot */}
          <div className="absolute -top-12 left-10 w-44 h-44 rounded-full border-[22px] border-[#9B0A11] opacity-70 transform -rotate-12 shadow-2xl" />
          <div className="absolute top-1/2 -left-10 w-36 h-36 rounded-full bg-[#B7111A] opacity-80" />
          <div className="absolute -top-16 right-16 w-60 h-60 rounded-3xl bg-gradient-to-br from-[#FF4D55] via-[#D7131D] to-[#7A040A] transform rotate-45 opacity-50 shadow-2xl" />
          <div className="absolute bottom-4 right-12 w-40 h-24 rounded-2xl bg-[#8A070E] transform rotate-12 opacity-60" />
          <div className="absolute top-10 right-1/3 w-10 h-10 rounded-full bg-black/30" />
        </div>

        {/* Center Content from HOME.png */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Main Headline */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[52px] font-black tracking-tight uppercase leading-[1.15] font-sans">
            <span className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              WELCOME TO VOUCHERNEST —
            </span>
            <br />
            <span className="text-black font-black">
              YOUR SAVINGS HUB.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-3 sm:mt-4 text-xs sm:text-base md:text-lg font-normal text-white/95 max-w-2xl leading-relaxed">
            Discover the <strong className="font-bold">best vouchers</strong> and <strong className="font-bold">deals</strong> across all your favorite brands.
          </p>

          {/* Action Buttons: [GET STARTED] [LEARN MORE] */}
          <div className="mt-5 sm:mt-7 flex items-center justify-center gap-6">
            {/* GET STARTED Pill Button */}
            <button
              onClick={onGetStarted}
              className="bg-[#000000] text-white hover:bg-neutral-900 active:scale-95 font-extrabold text-xs sm:text-sm tracking-wider uppercase px-7 py-2.5 rounded-full border border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition cursor-pointer"
            >
              GET STARTED
            </button>

            {/* LEARN MORE Underlined Link */}
            <button
              onClick={onLearnMore}
              className="text-white hover:text-white/80 active:scale-95 font-bold text-xs sm:text-sm tracking-wider uppercase underline underline-offset-4 decoration-2 transition cursor-pointer"
            >
              LEARN MORE
            </button>
          </div>
        </div>

      </div>

      {/* Floating Pill Search Bar Overlapping Banner Edge from HOME.png */}
      <div className="relative z-20 max-w-lg mx-auto px-4 -mt-5 sm:-mt-6">
        <div className="relative flex items-center bg-white rounded-full border-[3px] sm:border-[3.5px] border-black shadow-md overflow-hidden">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-neutral-900 placeholder-neutral-700 font-normal text-sm sm:text-base py-2 sm:py-2.5 px-6 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="mr-3 text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full"
            >
              ✕
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
