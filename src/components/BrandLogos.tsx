import React from 'react';

export interface BrandItem {
  id: string;
  name: string;
  key: 'amazon' | 'boat' | 'flipkart' | 'lenskart' | 'myntra' | 'nike' | 'noise' | 'redtape' | 'chemistatplay' | 'dotandkey' | 'dermaco' | 'puma';
  categories: ('fashion' | 'electronics' | 'skincare')[];
}

export const BRAND_ITEMS: BrandItem[] = [
  { id: 'amazon', name: 'Amazon', key: 'amazon', categories: ['fashion', 'electronics', 'skincare'] },
  { id: 'boat', name: 'boAt', key: 'boat', categories: ['electronics'] },
  { id: 'flipkart', name: 'Flipkart', key: 'flipkart', categories: ['fashion', 'electronics', 'skincare'] },
  { id: 'lenskart', name: 'Lenskart', key: 'lenskart', categories: ['fashion'] },
  { id: 'myntra', name: 'Myntra', key: 'myntra', categories: ['fashion'] },
  { id: 'nike', name: 'Nike', key: 'nike', categories: ['fashion'] },
  { id: 'puma', name: 'Puma', key: 'puma', categories: ['fashion'] },
  { id: 'noise', name: 'Noise', key: 'noise', categories: ['electronics'] },
  { id: 'redtape', name: 'Red Tape', key: 'redtape', categories: ['fashion'] },
  { id: 'chemistatplay', name: 'Chemist at Play', key: 'chemistatplay', categories: ['skincare'] },
  { id: 'dotandkey', name: 'Dot & Key', key: 'dotandkey', categories: ['skincare'] },
  { id: 'dermaco', name: 'The Derma Co', key: 'dermaco', categories: ['skincare'] },
];

/**
 * 1. Amazon Logo - exact official vector matching uploaded AMAZON 1.png
 */
export const AmazonLogo: React.FC<{ className?: string }> = ({ className = 'w-full h-auto max-h-16' }) => (
  <img
    src="/amazon_logo.svg"
    alt="Amazon"
    className={`${className} object-contain`}
    loading="eager"
  />
);

/**
 * 2. boAt Logo - exact official asset matching uploaded BOAT1.png
 */
export const BoatLogo: React.FC<{ className?: string }> = ({ className = 'w-full h-auto max-h-16' }) => (
  <img
    src="/boat_logo.png"
    alt="boAt"
    className={`${className} object-contain`}
    loading="eager"
  />
);

/**
 * 3. Flipkart Logo - exact official circular badge matching uploaded FLIPCART 1.png
 */
export const FlipkartLogo: React.FC<{ className?: string }> = ({ className = 'w-full h-auto max-h-24' }) => (
  <img
    src="/flipkart_icon.svg"
    alt="Flipkart"
    className={`${className} object-contain`}
    loading="eager"
  />
);

/**
 * 4. Lenskart Logo - exact official stacked vector logo matching uploaded LENS CART 1.png
 */
export const LenskartLogo: React.FC<{ className?: string }> = ({ className = 'w-full h-auto max-h-24' }) => (
  <img
    src="/lenskart_stacked.svg"
    alt="Lenskart"
    className={`${className} object-contain`}
    loading="eager"
  />
);

/**
 * 5. Myntra Logo matching uploaded MYNTRA 1.png
 */
export const MyntraLogo: React.FC<{ className?: string }> = ({ className = 'w-full h-auto max-h-20' }) => (
  <img
    src="/myntra_official.svg"
    alt="Myntra"
    className={`${className} object-contain`}
    loading="eager"
  />
);

/**
 * 6. Nike Logo matching uploaded NIKE 1.png
 */
export const NikeLogo: React.FC<{ className?: string }> = ({ className = 'w-full h-auto max-h-18' }) => (
  <img
    src="/nike_logo.svg"
    alt="Nike"
    className={`${className} object-contain`}
    loading="eager"
  />
);

/**
 * 7. Noise Logo matching uploaded NOISE 1.png
 */
export const NoiseLogo: React.FC<{ className?: string }> = ({ className = 'w-full h-auto max-h-20' }) => (
  <img
    src="/my-new-logo.png.jpeg"
    alt="Noise"
    className={`${className} object-contain`}
    loading="eager"
  />
);

/**
 * 8. Red Tape Logo matching uploaded REDTAPE 1.png
 */
export const RedTapeLogo: React.FC<{ className?: string }> = ({ className = 'w-full h-auto max-h-18' }) => (
  <img
    src="/redtape_logo.png"
    alt="Red Tape"
    className={`${className} object-contain`}
    loading="eager"
  />
);

/**
 * 9. Chemist at Play Logo - matching uploaded chemist at play logo.png
 */
export const ChemistAtPlayLogo: React.FC<{ className?: string }> = ({ className = 'w-full h-auto max-h-24' }) => (
  <div className={`${className} flex flex-col items-center justify-center select-none text-neutral-950 py-1`}>
    <div className="transform -rotate-6 origin-center text-center">
      <div
        className="text-2xl sm:text-3xl font-bold tracking-tight leading-none text-neutral-950"
        style={{ fontFamily: "'Pacifico', 'Playball', 'Brush Script MT', cursive" }}
      >
        Chemist
      </div>
      <div
        className="text-xl sm:text-2xl font-bold tracking-tight leading-none ml-4 mt-1 relative text-neutral-950 inline-block"
        style={{ fontFamily: "'Pacifico', 'Playball', 'Brush Script MT', cursive" }}
      >
        at Play
        <svg className="w-16 h-3 absolute -bottom-1 -right-3 text-neutral-950 pointer-events-none" viewBox="0 0 70 16" fill="none">
          <path d="M 4 3 C 24 16, 50 18, 66 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  </div>
);

/**
 * 10. Dot & Key Skincare Logo - matching uploaded dot & key logo.png
 */
export const DotAndKeyLogo: React.FC<{ className?: string }> = ({ className = 'w-full h-auto max-h-20' }) => (
  <div className={`${className} flex flex-col items-center justify-center select-none text-neutral-950 py-1`}>
    <div className="flex items-center gap-1 sm:gap-2 leading-none">
      <span
        className="text-xl sm:text-2xl font-black tracking-wider text-black"
        style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
      >
        DOT
      </span>
      <span
        className="text-2xl sm:text-3xl font-serif italic text-black px-0.5 leading-none"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        &amp;
      </span>
      <span
        className="text-xl sm:text-2xl font-black tracking-wider text-black"
        style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
      >
        KEY
      </span>
    </div>
    <span
      className="text-[9px] sm:text-[10px] font-bold tracking-[0.26em] text-neutral-800 mt-1 uppercase"
      style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      SKINCARE
    </span>
  </div>
);

/**
 * 11. The Derma Co Logo - matching uploaded the dermaco logo.png
 */
export const TheDermaCoLogo: React.FC<{ className?: string }> = ({ className = 'w-full h-auto max-h-20' }) => (
  <img
    src="/the_derma_co_logo.svg"
    alt="The Derma Co"
    className={`${className} object-contain`}
    loading="eager"
  />
);

/**
 * 12. Puma Logo - matching uploaded puma logo.png
 */
export const PumaLogo: React.FC<{ className?: string }> = ({ className = 'w-full h-auto max-h-20' }) => (
  <img
    src="/puma_logo.svg"
    alt="Puma"
    className={`${className} object-contain`}
    loading="eager"
  />
);

/**
 * Universal Brand Logo Dispatcher
 */
export const BrandLogo: React.FC<{ brandKey: BrandItem['key']; className?: string }> = ({
  brandKey,
  className,
}) => {
  switch (brandKey) {
    case 'amazon':
      return <AmazonLogo className={className} />;
    case 'boat':
      return <BoatLogo className={className} />;
    case 'flipkart':
      return <FlipkartLogo className={className} />;
    case 'lenskart':
      return <LenskartLogo className={className} />;
    case 'myntra':
      return <MyntraLogo className={className} />;
    case 'nike':
      return <NikeLogo className={className} />;
    case 'puma':
      return <PumaLogo className={className} />;
    case 'noise':
      return <NoiseLogo className={className} />;
    case 'redtape':
      return <RedTapeLogo className={className} />;
    case 'chemistatplay':
      return <ChemistAtPlayLogo className={className} />;
    case 'dotandkey':
      return <DotAndKeyLogo className={className} />;
    case 'dermaco':
      return <TheDermaCoLogo className={className} />;
    default:
      return null;
  }
};
