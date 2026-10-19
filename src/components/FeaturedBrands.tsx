import React, { useState } from 'react';
import { BRAND_ITEMS, BrandLogo, BrandItem } from './BrandLogos';

interface FeaturedBrandsProps {
  onSelectBrand?: (brand: BrandItem) => void;
  onClaimDeal?: (deal: any) => void;
  searchFilter?: string;
  categoryFilter?: 'fashion' | 'electronics' | 'skincare' | null;
  onClearCategory?: () => void;
}

export const FeaturedBrands: React.FC<FeaturedBrandsProps> = ({
  onSelectBrand,
  onClaimDeal,
  searchFilter = '',
  categoryFilter = null,
  onClearCategory,
}) => {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  const filter = (searchFilter || '').toLowerCase().trim();

  // Filter by search query AND active category (fashion / electronics)
  const filteredBrands = BRAND_ITEMS.filter((brand) => {
    const matchesSearch = !filter || brand.name.toLowerCase().includes(filter);
    const matchesCategory = !categoryFilter || brand.categories.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const handleCardClick = (brand: BrandItem) => {
    setSelectedBrandId(brand.id);
    if (onSelectBrand) {
      onSelectBrand(brand);
    }
  };

  return (
    <section
      id="featured-brands"
      className="w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto select-none bg-white scroll-mt-24"
    >
      {/* Serif Didone Title from HOME.png */}
      <div className="text-center mb-6 sm:mb-8">
        <h2
          className="text-2xl sm:text-3xl md:text-4xl font-black tracking-wider uppercase text-neutral-950"
          style={{ fontFamily: "'Playfair Display', Didot, 'Bodoni MT', Georgia, serif" }}
        >
          FEATURED BRANDS
        </h2>
        {categoryFilter && (
          <div className="mt-2 inline-flex items-center gap-2 bg-neutral-100 border border-neutral-300 px-3 py-1 rounded-full text-xs text-neutral-800">
            <span>
              Showing <strong>{categoryFilter === 'fashion' ? 'Fashion' : categoryFilter === 'electronics' ? 'Electronics' : 'Skin Care'}</strong> Brands ({filteredBrands.length})
            </span>
            {onClearCategory && (
              <button
                type="button"
                onClick={onClearCategory}
                className="text-[#D7131D] hover:underline font-bold cursor-pointer ml-1"
              >
                Show All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid of Square Bordered Brand Cards - ONLY user's 8 brand logos, NO external data */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
        {filteredBrands.map((brand) => {
          const isSelected = selectedBrandId === brand.id;
          return (
            <div
              key={brand.id}
              onClick={() => handleCardClick(brand)}
              title={brand.name}
              className={`group relative aspect-square bg-[#FBFBFA] hover:bg-white rounded-2xl sm:rounded-3xl border-[3.5px] sm:border-[4px] ${
                isSelected ? 'border-[#D7131D] shadow-md scale-[1.02]' : 'border-black shadow-xs'
              } hover:border-[#D7131D] hover:shadow-md hover:scale-[1.02] transition-all duration-200 flex items-center justify-center p-4 sm:p-6 cursor-pointer active:scale-[0.98]`}
            >
              {/* Pure Brand Logo - accurately representing uploaded brand image */}
              <div className="w-full h-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                <BrandLogo brandKey={brand.key} className="w-full h-full max-h-24 sm:max-h-28 object-contain" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedBrands;
