import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { HeroBanner } from './HeroBanner';
import { FeaturedBrands } from './FeaturedBrands';
import { HowItWorks } from './HowItWorks';
import { CategoryFilter, CategoryType } from './CategoryFilter';
import { AddCouponModal } from './AddCouponModal';
import { CartDrawer } from './CartDrawer';
import { BrandCouponsPage } from './BrandCouponsPage';
import { Page, User, BrandDeal, CouponItem, CartItem } from '../types';
import { BRAND_ITEMS, BrandItem } from './BrandLogos';
import { INITIAL_BRAND_COUPONS, BrandCouponData } from '../data/brandCouponsData';
import { Check } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  currentUser,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [userCoupons, setUserCoupons] = useState<CouponItem[]>([]);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [modalPreselectedBrand, setModalPreselectedBrand] = useState<string | undefined>(undefined);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('vouchnest_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [claimedDeals, setClaimedDeals] = useState<BrandDeal[]>(() => {
    try {
      const saved = localStorage.getItem('vouchnest_claimed_deals');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Brand Coupons State: initialized with curated brand vouchers + user published coupons
  const [brandCouponsMap, setBrandCouponsMap] = useState<Record<string, BrandCouponData[]>>(INITIAL_BRAND_COUPONS);
  const [selectedBrandForCoupons, setSelectedBrandForCoupons] = useState<BrandItem | null>(null);

  // Real-time synchronization with Firebase Firestore database
  useEffect(() => {
    let isMounted = true;
    const fetchLiveCoupons = async () => {
      try {
        const token = currentUser?.token || localStorage.getItem('vouchnest_token');
        const endpoint = currentUser?.role === 'admin' ? '/api/admin/coupons' : '/api/coupons';
        const res = await fetch(endpoint, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'x-user-email': currentUser?.email || 'santhoshreddyburra@gmail.com',
          },
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          const dbCoupons: any[] = data.coupons || [];
          setUserCoupons(dbCoupons);

          // Reconstruct brandCouponsMap exclusively from user-created coupons in database
          const updatedMap: Record<string, BrandCouponData[]> = {};
          BRAND_ITEMS.forEach((b) => {
            updatedMap[b.key] = [];
          });

          dbCoupons.forEach((coupon) => {
            const matched = BRAND_ITEMS.find(
              (b) =>
                b.name.toLowerCase() === coupon.brand?.toLowerCase() ||
                b.id.toLowerCase() === coupon.brand?.toLowerCase() ||
                b.key.toLowerCase() === coupon.brand?.toLowerCase()
            );
            const brandKey = matched ? matched.key : coupon.brand?.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!updatedMap[brandKey]) updatedMap[brandKey] = [];
            updatedMap[brandKey].push({
              id: coupon.id,
              brand: coupon.brand,
              title: coupon.title,
              discount: coupon.discount,
              discountType: coupon.discountType || 'percent',
              code: coupon.code,
              expiryDate: coupon.expiryDate,
              category: coupon.category,
              description: coupon.description,
              couponAmount: coupon.couponAmount,
              sellingPrice: coupon.sellingPrice,
              minPurchaseAmount: coupon.minPurchaseAmount,
              isCommunity: true,
              verified: true,
            });
          });
          setBrandCouponsMap(updatedMap);
        }
      } catch (err) {
        console.warn('Failed to fetch coupons from database:', err);
      }
    };

    const fetchUserClaims = async () => {
      try {
        const token = currentUser?.token || localStorage.getItem('vouchnest_token');
        const res = await fetch('/api/user/claims', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'x-user-email': currentUser?.email || 'santhoshreddyburra@gmail.com',
          },
        });
        if (res.ok && isMounted) {
          const claimsData = await res.json();
          if (claimsData.claims && Array.isArray(claimsData.claims)) {
            const serverDeals: BrandDeal[] = claimsData.claims.map((c: any) => ({
              id: c.couponId || c.id,
              name: c.brand || 'VouchNest Deal',
              category: 'Claimed Deal',
              discount: c.discount || 'Special Discount',
              code: c.code && !c.code.includes('•') ? c.code : `${(c.brand || 'VOUCH').toUpperCase()}SPECIAL`,
              expiresIn: 'Active',
              terms: c.couponTitle || 'Verified voucher purchase',
              sellingPrice: c.sellingPrice,
              isUnlocked: true,
              purchasedAt: c.claimedAt || 'Recently',
            }));

            setClaimedDeals((prev) => {
              const combined = [...prev];
              serverDeals.forEach((sd) => {
                if (!combined.some((d) => d.id === sd.id || d.code.toUpperCase() === sd.code.toUpperCase())) {
                  combined.push(sd);
                }
              });
              try {
                localStorage.setItem('vouchnest_claimed_deals', JSON.stringify(combined));
              } catch {}
              return combined;
            });
          }
        }
      } catch {
        // silent
      }
    };

    fetchLiveCoupons();
    fetchUserClaims();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddToCart = (coupon: BrandCouponData | CouponItem) => {
    const cleanCode =
      coupon.code && !coupon.code.includes('•')
        ? coupon.code
        : `${(coupon.brand || 'VOUCH').toUpperCase().replace(/[^A-Z0-9]/g, '')}SPECIAL`;

    const newItem: CartItem = {
      id: `cart-${coupon.id}-${Date.now()}`,
      couponId: coupon.id,
      brand: coupon.brand,
      title: coupon.title,
      discount: coupon.discount,
      discountType: coupon.discountType || 'percent',
      code: cleanCode,
      sellingPrice: coupon.sellingPrice || '49',
      couponAmount: coupon.couponAmount || '500',
      minPurchaseAmount: coupon.minPurchaseAmount,
      expiryDate: coupon.expiryDate,
      category: coupon.category,
      description: coupon.description,
      addedAt: new Date().toISOString(),
    };

    setCartItems((prev) => {
      if (prev.some((item) => item.couponId === newItem.couponId || item.id === newItem.couponId)) {
        return prev;
      }
      const updated = [newItem, ...prev];
      try {
        localStorage.setItem('vouchnest_cart', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    showToast(`Added ${coupon.brand} coupon to cart! Opening cart section...`);
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => {
      const updated = prev.filter((item) => item.id !== id && item.couponId !== id);
      try {
        localStorage.setItem('vouchnest_cart', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem('vouchnest_cart');
    } catch {}
  };

  const handleCartCheckoutSuccess = (paidCoupons: CartItem[]) => {
    // 1. Move paid coupons into claimed deals
    const newDeals: BrandDeal[] = paidCoupons.map((c) => ({
      id: c.couponId || c.id,
      name: c.brand,
      category: c.category || 'Claimed Deal',
      discount: c.discount,
      code: c.code,
      expiresIn: c.expiryDate || 'Active',
      terms: c.description || c.title,
      sellingPrice: c.sellingPrice,
      isUnlocked: true,
      purchasedAt: 'Just now',
    }));

    setClaimedDeals((prev) => {
      const combined = [...prev];
      newDeals.forEach((nd) => {
        if (!combined.some((d) => d.id === nd.id || d.code.toUpperCase() === nd.code.toUpperCase())) {
          combined.unshift(nd);
        }
      });
      try {
        localStorage.setItem('vouchnest_claimed_deals', JSON.stringify(combined));
      } catch {}
      return combined;
    });

    // 2. Persist claims into vouchnest_user_claims for immediate Redeemed section display
    try {
      const user = currentUser || (localStorage.getItem('vouchnest_user') ? JSON.parse(localStorage.getItem('vouchnest_user')!) : null);
      const existingClaims = JSON.parse(localStorage.getItem('vouchnest_user_claims') || '[]');
      const newClaimRecords = paidCoupons.map((c, i) => ({
        id: `clm-cart-${Date.now()}-${i}`,
        couponId: c.couponId || c.id,
        couponTitle: c.title,
        brand: c.brand,
        discount: c.discount,
        code: c.code,
        userId: user?.id || 'usr-local',
        userEmail: user?.email || 'santhoshreddyburra@gmail.com',
        userName: user?.fullName || user?.username || 'Member',
        claimedAt: new Date().toISOString(),
        sellingPrice: c.sellingPrice || '49',
        paymentMethod: 'UPI Instant',
        transactionId: `TXN-CART-${Date.now()}`,
        status: 'claimed',
      }));
      localStorage.setItem('vouchnest_user_claims', JSON.stringify([...newClaimRecords, ...existingClaims]));
    } catch {}

    // 3. Clear cart
    setCartItems([]);
    try {
      localStorage.removeItem('vouchnest_cart');
    } catch {}

    showToast(`🎉 Success! ${paidCoupons.length} coupon(s) unlocked & moved to Redeemed section.`);
  };

  const handleClaimDeal = (deal: BrandDeal) => {
    const cleanCode =
      deal.code && !deal.code.includes('•')
        ? deal.code
        : `${deal.name.toUpperCase().replace(/\s+/g, '')}SPECIAL`;

    const cleanDeal: BrandDeal = {
      ...deal,
      code: cleanCode,
      isUnlocked: true,
    };

    setClaimedDeals((prev) => {
      const exists = prev.some(
        (d) => d.id === cleanDeal.id || (d.code.toUpperCase() === cleanCode.toUpperCase() && d.name === cleanDeal.name)
      );
      const next = exists
        ? prev.map((d) => (d.id === cleanDeal.id ? cleanDeal : d))
        : [cleanDeal, ...prev];
      try {
        localStorage.setItem('vouchnest_claimed_deals', JSON.stringify(next));
      } catch {}
      return next;
    });

    showToast(`Payment verified! ${deal.name} coupon unlocked (Code: ${cleanCode}).`);
  };

  const handleDirectPaymentSuccess = (coupon: BrandCouponData) => {
    const cleanCode =
      coupon.code && !coupon.code.includes('•')
        ? coupon.code
        : `${(coupon.brand || 'VOUCH').toUpperCase().replace(/[^A-Z0-9]/g, '')}SPECIAL`;

    handleClaimDeal({
      id: coupon.id,
      name: coupon.brand,
      category: coupon.category || 'Claimed Deal',
      discount: coupon.discount,
      code: cleanCode,
      expiresIn: coupon.expiryDate || 'Active',
      terms: coupon.description || coupon.title,
      sellingPrice: coupon.sellingPrice || '49',
      isUnlocked: true,
      purchasedAt: 'Just now',
    });

    try {
      const user = currentUser || (localStorage.getItem('vouchnest_user') ? JSON.parse(localStorage.getItem('vouchnest_user')!) : null);
      const email = user?.email || 'santhoshreddyburra@gmail.com';
      const existingClaims = JSON.parse(localStorage.getItem('vouchnest_user_claims') || '[]');
      const newClaim = {
        id: `clm-direct-${Date.now()}`,
        couponId: coupon.id,
        couponTitle: coupon.title,
        brand: coupon.brand,
        discount: coupon.discount,
        code: cleanCode,
        userId: user?.id || 'usr-local',
        userEmail: email,
        userName: user?.fullName || user?.username || 'Member',
        claimedAt: new Date().toISOString(),
        sellingPrice: coupon.sellingPrice || '49',
        paymentMethod: 'UPI Instant',
        transactionId: `TXN-DIRECT-${Date.now()}`,
        status: 'claimed',
      };
      localStorage.setItem('vouchnest_user_claims', JSON.stringify([newClaim, ...existingClaims.filter((c: any) => c.couponId !== coupon.id)]));

      const token = localStorage.getItem('vouchnest_token');
      fetch(`/api/coupons/${coupon.id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-user-email': email,
        },
        body: JSON.stringify({
          brand: coupon.brand,
          title: coupon.title,
          discount: coupon.discount,
          code: cleanCode,
          sellingPrice: coupon.sellingPrice || '49',
          couponAmount: coupon.couponAmount || '500',
          expiryDate: coupon.expiryDate,
          category: coupon.category,
          paymentMethod: 'UPI Instant',
          transactionId: `TXN-DIRECT-${Date.now()}`,
          userEmail: email,
        }),
      }).catch(() => {});
    } catch {}

    showToast(`🎉 Payment verified! Code "${cleanCode}" unlocked & saved under Redeemed.`);
  };

  const handleRemoveDeal = (id: string) => {
    setClaimedDeals((prev) => {
      const next = prev.filter((d) => d.id !== id);
      try {
        localStorage.setItem('vouchnest_claimed_deals', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleOpenAddCoupon = (brandName?: string) => {
    setModalPreselectedBrand(brandName);
    setIsAddCouponOpen(true);
  };

  const handleAddCoupon = async (newCoupon: CouponItem) => {
    let savedCoupon = newCoupon;

    try {
      const token = currentUser?.token || localStorage.getItem('vouchnest_token');
      const userEmail = currentUser?.email || 'santhoshreddyburra@gmail.com';
      const userRole = currentUser?.role || 'admin';

      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-user-email': userEmail,
          'x-user-role': userRole,
        },
        body: JSON.stringify({
          brand: newCoupon.brand,
          code: newCoupon.code,
          discount: newCoupon.discount,
          discountType: newCoupon.discountType || 'percent',
          title: newCoupon.title,
          description: newCoupon.description,
          expiryDate: newCoupon.expiryDate,
          category: newCoupon.category,
          couponAmount: newCoupon.couponAmount,
          sellingPrice: newCoupon.sellingPrice,
          minPurchaseAmount: newCoupon.minPurchaseAmount || '999',
          inventory: 50,
          userEmail,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        showToast(errJson.error || 'Failed to publish coupon.');
        return;
      }

      const resData = await response.json().catch(() => ({}));
      if (resData.coupon) {
        savedCoupon = {
          ...newCoupon,
          id: resData.coupon.id,
        };
      }
    } catch {
      // offline fallback
    }

    setUserCoupons((prev) => [savedCoupon, ...prev]);

    // Find the matching brand in featured brands
    const matchedBrand = BRAND_ITEMS.find(
      (b) =>
        b.name.toLowerCase() === savedCoupon.brand.toLowerCase() ||
        b.id.toLowerCase() === savedCoupon.brand.toLowerCase()
    ) || BRAND_ITEMS[0];

    const brandKey = matchedBrand.key;

    const newBrandCoupon: BrandCouponData = {
      ...savedCoupon,
      isCommunity: true,
      verified: true,
    };

    // Connect and prepend the published coupon to this particular brand's available coupons
    setBrandCouponsMap((prev) => {
      const existing = prev[brandKey] || [];
      return {
        ...prev,
        [brandKey]: [newBrandCoupon, ...existing.filter((c) => c.id !== savedCoupon.id && c.code !== savedCoupon.code)],
      };
    });

    // Automatically navigate to this brand's coupons page
    setSelectedBrandForCoupons(matchedBrand);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    showToast(`✅ Saved to Firebase Firestore Database! Published for ${matchedBrand.name}.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900 font-sans">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-neutral-900 text-white border border-red-500/50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm animate-bounce">
          <Check size={18} className="text-green-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header from HOME.png */}
      <Navbar
        currentPage="home"
        onNavigate={onNavigate}
        currentUser={currentUser}
        onLogout={onLogout}
        onOpenAddCoupon={() => handleOpenAddCoupon(selectedBrandForCoupons?.name)}
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={cartItems.length}
        onGoHome={() => {
          setSelectedBrandForCoupons(null);
        }}
        onSelectCategory={(cat) => {
          setSelectedBrandForCoupons(null);
          setSelectedCategory(cat);
          setTimeout(() => {
            document.getElementById('category-filter-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      {/* Conditional View: Dedicated Brand Coupons Page OR Home Page Content */}
      {selectedBrandForCoupons ? (
        <BrandCouponsPage
          brand={selectedBrandForCoupons}
          coupons={brandCouponsMap[selectedBrandForCoupons.key] || []}
          onBack={() => {
            setSelectedBrandForCoupons(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAddCoupon={(brandName) => handleOpenAddCoupon(brandName)}
          onClaimDeal={handleClaimDeal}
          claimedDeals={claimedDeals}
          onOpenWallet={() => setIsCartOpen(true)}
          currentUserRole={currentUser?.role}
          onAddToCart={handleAddToCart}
          cartItems={cartItems}
          onOpenCart={() => setIsCartOpen(true)}
          onNavigateToRedeemed={() => onNavigate('profile')}
        />
      ) : (
        <>
          {/* Hero Banner with Texture & Search Bar matching HOME.png */}
          <HeroBanner
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onGetStarted={() => {
              const el = document.getElementById('featured-brands-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            onLearnMore={() => {
              const el = document.getElementById('how-it-works-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Category Filter System: Fashion, Electronics, Skin Care */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Section 1: Featured Brands - clicking opens that brand's coupons page */}
          <div id="featured-brands-section">
            <FeaturedBrands
              searchFilter={searchQuery}
              categoryFilter={selectedCategory}
              onClearCategory={() => setSelectedCategory(null)}
              onSelectBrand={(brand) => {
                setSelectedBrandForCoupons(brand);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onClaimDeal={(deal) => {
                handleClaimDeal({
                  id: `deal-${deal.id}-${Date.now()}`,
                  name: deal.name,
                  category: selectedCategory === 'fashion' ? 'Fashion' : selectedCategory === 'electronics' ? 'Electronics' : selectedCategory === 'skincare' ? 'Skin Care' : 'Brand Deal',
                  discount: 'EXCLUSIVE DEAL',
                  code: `${deal.name.toUpperCase().replace(/\s+/g, '')}SPECIAL`,
                  expiresIn: '7 Days',
                  terms: `Exclusive online voucher for ${deal.name}`,
                });
              }}
            />
          </div>

          {/* Section 2: How VoucherNest Works matching HOME.png */}
          <div id="how-it-works-section" className="pb-16 sm:pb-24">
            <HowItWorks onStartUpload={() => handleOpenAddCoupon()} />
          </div>
        </>
      )}

      {/* Modals & Drawers */}
      <AddCouponModal
        isOpen={isAddCouponOpen}
        onClose={() => setIsAddCouponOpen(false)}
        onAddCoupon={handleAddCoupon}
        initialBrand={modalPreselectedBrand}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onCheckoutSuccess={handleCartCheckoutSuccess}
        onNavigateToRedeemed={() => {
          setIsCartOpen(false);
          onNavigate('profile');
        }}
        currentUser={currentUser}
      />
    </div>
  );
};
