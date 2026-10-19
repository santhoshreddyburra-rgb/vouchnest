import React, { useState } from 'react';
import { Shirt, Headphones, Sparkles, Laptop } from 'lucide-react';

export type CategoryType = 'fashion' | 'electronics' | 'skincare';

interface CategoryFilterProps {
  selectedCategory?: CategoryType | null;
  onSelectCategory?: (category: CategoryType | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory: controlledCategory,
  onSelectCategory,
}) => {
  const [internalCategory, setInternalCategory] = useState<CategoryType | null>(null);

  const activeCategory = controlledCategory !== undefined ? controlledCategory : internalCategory;

  const handleSelect = (category: CategoryType) => {
    const nextCategory = activeCategory === category ? null : category;
    if (controlledCategory === undefined) {
      setInternalCategory(nextCategory);
    }
    if (onSelectCategory) {
      onSelectCategory(nextCategory);
    }
  };

  const categories = [
    {
      id: 'fashion' as CategoryType,
      name: 'Fashion',
      description: 'Apparel, Footwear & Accessories',
      icon: Shirt,
      badgeText: 'Trending Deals',
      activeColor: 'bg-neutral-950 text-white border-neutral-950 shadow-md',
      inactiveColor: 'bg-[#FBFBFA] text-neutral-800 border-neutral-300 hover:border-neutral-900',
    },
    {
      id: 'electronics' as CategoryType,
      name: 'Electronics',
      description: 'Audio, Gadgets & Smart Tech',
      icon: Headphones,
      badgeText: 'Top Savings',
      activeColor: 'bg-[#D7131D] text-white border-[#D7131D] shadow-md',
      inactiveColor: 'bg-[#FBFBFA] text-neutral-800 border-neutral-300 hover:border-neutral-900',
    },
    {
      id: 'skincare' as CategoryType,
      name: 'Skin Care',
      description: 'Serums, Sunscreens & Dermat Formulations',
      icon: Sparkles,
      badgeText: 'Dermat Approved',
      activeColor: 'bg-[#0DBBB9] text-white border-[#0DBBB9] shadow-md',
      inactiveColor: 'bg-[#FBFBFA] text-neutral-800 border-neutral-300 hover:border-neutral-900',
    },
  ];

  const getCategoryLabel = (cat: CategoryType) => {
    switch (cat) {
      case 'fashion':
        return 'Fashion';
      case 'electronics':
        return 'Electronics';
      case 'skincare':
        return 'Skin Care';
    }
  };

  return (
    <section
      id="category-filter-section"
      className="w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto select-none"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3
            className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950 uppercase"
            style={{ fontFamily: "'Playfair Display', Didot, 'Bodoni MT', Georgia, serif" }}
          >
            Explore by Category
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Filter coupons and brand deals by Fashion, Electronics, or Skin Care
          </p>
        </div>

        {activeCategory && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Active Filter:
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-900 border border-neutral-200">
              {getCategoryLabel(activeCategory)}
            </span>
            <button
              type="button"
              onClick={() => {
                if (controlledCategory === undefined) setInternalCategory(null);
                if (onSelectCategory) onSelectCategory(null);
              }}
              className="text-xs text-[#D7131D] hover:underline font-bold ml-1 cursor-pointer"
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      {/* 3 Categories: Fashion, Electronics & Skin Care */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              id={`category-btn-${cat.id}`}
              type="button"
              onClick={() => handleSelect(cat.id)}
              className={`group text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center justify-between ${
                isSelected ? cat.activeColor : cat.inactiveColor
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                    isSelected
                      ? 'bg-white/15 text-white'
                      : 'bg-white text-neutral-900 border border-neutral-200 shadow-2xs'
                  }`}
                >
                  <Icon size={24} className="stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold tracking-wide">
                      {cat.name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {cat.badgeText}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-0.5 ${
                      isSelected ? 'text-white/80' : 'text-neutral-500'
                    }`}
                  >
                    {cat.description}
                  </p>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'border-white bg-white'
                    : 'border-neutral-400 group-hover:border-neutral-700'
                }`}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-neutral-950" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
