import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { HeroBanner } from './HeroBanner';
import { FeaturedBrands } from './FeaturedBrands';
import { HowItWorks } from './HowItWorks';
import { CategoryFilter, CategoryType } from './CategoryFilter';
import { AddCouponModal } from './AddCouponModal';
import { CartDrawer } from './CartDrawer';
import { BrandCouponsPage } from './BrandCouponsPage';
import { CouponPaymentModal } from './CouponPaymentModal';
import { Page, User, BrandDeal, CouponItem, CartItem } from '../types';
import { BRAND_ITEMS, BrandItem, BrandLogo } from './BrandLogos';
import { INITIAL_BRAND_COUPONS, BrandCouponData } from '../data/brandCouponsData';
import { Check, Tag, Sparkles, Calendar, ShoppingBag, Plus, ExternalLink, ArrowRight, ShieldCheck, IndianRupee } from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, getDocs, setDoc, onSnapshot } from 'firebase/firestore';

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
  const [userCoupons, setUserCoupons] = useState<CouponItem[]>(() => {
    try {
      const saved = localStorage.getItem('vouchnest_coupons');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [modalPreselectedBrand, setModalPreselectedBrand] = useState<string | undefined>(undefined);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCouponForDirectPay, setSelectedCouponForDirectPay] = useState<BrandCouponData | null>(null);
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

  // Helper to map a list of coupons to the brandCouponsMap
  const applyCouponsToBrandMap = (dbCoupons: any[]) => {
    setUserCoupons(dbCoupons);
    try {
      localStorage.setItem('vouchnest_coupons', JSON.stringify(dbCoupons));
    } catch {}

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
  };

  // Real-time synchronization with Firebase Firestore database
  useEffect(() => {
    let isMounted = true;

    // 1. Direct real-time Firebase Firestore listener on 'coupons' collection
    let unsubscribeFirestore: (() => void) | null = null;
    try {
      unsubscribeFirestore = onSnapshot(
        collection(db, 'coupons'),
        (snapshot) => {
          if (!isMounted) return;
          const liveList: any[] = [];
          snapshot.forEach((docSnap) => {
            liveList.push(docSnap.data());
          });
          if (liveList.length > 0) {
            applyCouponsToBrandMap(liveList);
          }
        },
        (error) => {
          console.warn('[Firestore] Real-time coupons listener notice:', error);
        }
      );
    } catch (fbErr) {
      console.warn('[Firestore] Snapshot attach notice:', fbErr);
    }

    // 2. Fetch live coupons via API endpoint as secondary sync
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
          if (dbCoupons.length > 0) {
            applyCouponsToBrandMap(dbCoupons);
          }
        }
      } catch (err) {
        console.warn('API coupons fetch notice:', err);
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
      if (unsubscribeFirestore) unsubscribeFirestore();
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
    if (currentUser?.role !== 'admin') {
      showToast('Access Denied: Only the Administrator (Santhosh) can add coupons.');
      return;
    }
    setModalPreselectedBrand(brandName);
    setIsAddCouponOpen(true);
  };

  const handleAddCoupon = async (newCoupon: CouponItem) => {
    const couponId = newCoupon.id || `cpn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const cleanBrand = newCoupon.brand.trim();
    const cleanCode = newCoupon.code.trim().toUpperCase();

    const cleanPayload: CouponItem = {
      ...newCoupon,
      id: couponId,
      brand: cleanBrand,
      code: cleanCode,
      discount: newCoupon.discount || '20% OFF',
      discountType: newCoupon.discountType || 'percent',
      title: newCoupon.title || `${newCoupon.discount || '20% OFF'} on ${cleanBrand}`,
      description: newCoupon.description || 'Verified coupon on VoucherNest',
      expiryDate: newCoupon.expiryDate || '30-11-2026',
      category: newCoupon.category || 'Fashion',
      couponAmount: newCoupon.couponAmount || '1000',
      sellingPrice: newCoupon.sellingPrice || '49',
      minPurchaseAmount: newCoupon.minPurchaseAmount || '999',
    };

    // 1. Direct Firebase Firestore Persistence (Guaranteed Database write)
    let firestorePersisted = false;
    try {
      await setDoc(doc(db, 'coupons', couponId), {
        ...cleanPayload,
        inventory: 50,
        totalClaims: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        userEmail: currentUser?.email || 'santhoshreddyburra@gmail.com',
      });
      firestorePersisted = true;
      console.log('[Firestore] Coupon directly saved to database:', couponId);
    } catch (fbErr) {
      console.warn('[Firestore] Direct write error:', fbErr);
    }

    // 2. Also dispatch to /api/coupons asynchronously for serverless sync
    try {
      const token = currentUser?.token || localStorage.getItem('vouchnest_token');
      const userEmail = currentUser?.email || 'santhoshreddyburra@gmail.com';
      const userRole = currentUser?.role || 'admin';

      fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-user-email': userEmail,
          'x-user-role': userRole,
        },
        body: JSON.stringify({
          ...cleanPayload,
          inventory: 50,
          userEmail,
        }),
      }).catch(() => {});
    } catch {
      // offline fallback
    }

    // 3. Update local userCoupons state & cache
    setUserCoupons((prev) => {
      const next = [cleanPayload, ...prev.filter((c) => c.id !== couponId && c.code !== cleanCode)];
      try {
        localStorage.setItem('vouchnest_coupons', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 4. Match brand or create virtual brand
    let matchedBrand = BRAND_ITEMS.find(
      (b) =>
        b.name.toLowerCase() === cleanBrand.toLowerCase() ||
        b.id.toLowerCase() === cleanBrand.toLowerCase() ||
        b.key.toLowerCase() === cleanBrand.toLowerCase()
    );

    if (!matchedBrand) {
      const brandKeyVal = cleanBrand.toLowerCase().replace(/[^a-z0-9]/g, '');
      const catVal = cleanPayload.category.toLowerCase().includes('fashion')
        ? 'fashion'
        : cleanPayload.category.toLowerCase().includes('skin')
        ? 'skincare'
        : 'electronics';
      matchedBrand = {
        id: brandKeyVal || 'brand',
        name: cleanBrand,
        key: (brandKeyVal || 'brand') as any,
        categories: [catVal],
      };
    }

    const brandKey = matchedBrand.key;

    const newBrandCoupon: BrandCouponData = {
      ...cleanPayload,
      isCommunity: true,
      verified: true,
    };

    // 5. Connect and prepend the published coupon to this particular brand's available coupons
    setBrandCouponsMap((prev) => {
      const existing = prev[brandKey] || [];
      return {
        ...prev,
        [brandKey]: [newBrandCoupon, ...existing.filter((c) => c.id !== cleanPayload.id && c.code !== cleanPayload.code)],
      };
    });

    // 6. Automatically navigate to this brand's coupons page so user immediately sees it
    setSelectedBrandForCoupons(matchedBrand);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    showToast(`🎉 Saved to Firebase Firestore! Published for ${matchedBrand.name}.`);
  };

  // Filter coupons for Home Page display
  const homeDisplayCoupons = userCoupons.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.brand.toLowerCase().includes(query) ||
      c.title.toLowerCase().includes(query) ||
      c.code.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query);

    const matchesCategory =
      !selectedCategory ||
      (selectedCategory === 'fashion' && c.category.toLowerCase().includes('fashion')) ||
      (selectedCategory === 'electronics' && c.category.toLowerCase().includes('electronics')) ||
      (selectedCategory === 'skincare' && (c.category.toLowerCase().includes('skin') || c.category.toLowerCase().includes('care')));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900 font-sans">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-neutral-900 text-white border-2 border-emerald-500 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm animate-bounce">
          <Check size={18} className="text-emerald-400" />
          <span className="font-semibold">{toastMessage}</span>
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

          {/* Section 1.5: Active Platform Coupons & Vouchers (Direct Firestore Synced) */}
          <div className="w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto bg-[#FAFAFA] border-y border-neutral-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2
                    className="text-xl sm:text-2xl font-black tracking-wider uppercase text-neutral-950"
                    style={{ fontFamily: "'Playfair Display', Didot, 'Bodoni MT', Georgia, serif" }}
                  >
                    ACTIVE VOUCHERS & COUPONS
                  </h2>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                    {homeDisplayCoupons.length} LIVE
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                  Verified coupons stored directly in your Firebase Firestore database.
                </p>
              </div>

              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleOpenAddCoupon()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D7131D] hover:bg-[#b00f17] text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer active:scale-95"
                >
                  <Plus size={16} />
                  <span>Share a New Coupon</span>
                </button>
              )}
            </div>

            {homeDisplayCoupons.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-neutral-300 rounded-3xl p-8 sm:p-12 text-center">
                <Tag size={36} className="mx-auto text-neutral-300 mb-2.5" />
                <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                  No active vouchers in this category yet
                </h3>
                <p className="text-neutral-500 text-xs sm:text-sm mt-1 mb-4 max-w-md mx-auto">
                  {currentUser?.role === 'admin'
                    ? "Click 'Share a New Coupon' above to enter voucher details and publish it live to the database."
                    : 'Exclusive brand discount vouchers will appear here once verified.'}
                </p>
                {currentUser?.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleOpenAddCoupon()}
                    className="inline-flex items-center gap-2 bg-[#D7131D] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl hover:bg-[#b00f17] shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <Plus size={16} />
                    <span>Publish First Coupon</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {homeDisplayCoupons.map((coupon) => {
                  const matchedBrand = BRAND_ITEMS.find(
                    (b) =>
                      b.name.toLowerCase() === coupon.brand.toLowerCase() ||
                      b.id.toLowerCase() === coupon.brand.toLowerCase()
                  );

                  return (
                    <div
                      key={coupon.id}
                      className="bg-white rounded-2xl border-2 border-black p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Top row: Brand & Discount Tag */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            {matchedBrand ? (
                              <div className="w-10 h-10 rounded-xl bg-[#FBFBFA] border border-neutral-200 p-1 flex items-center justify-center shrink-0">
                                <BrandLogo brandKey={matchedBrand.key} className="w-full h-full object-contain" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-[#E11D48] text-white flex items-center justify-center font-black text-sm shrink-0">
                                {coupon.brand.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h3 className="font-extrabold text-base text-neutral-950 leading-tight">
                                {coupon.brand}
                              </h3>
                              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
                                {coupon.category}
                              </span>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[#E11D48] font-black text-xs uppercase tracking-wide">
                            {coupon.discount}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <p className="text-sm font-bold text-neutral-900 mb-1">
                          {coupon.title}
                        </p>
                        <p className="text-xs text-neutral-500 line-clamp-2 mb-3">
                          {coupon.description}
                        </p>

                        {/* Pricing details */}
                        <div className="grid grid-cols-3 gap-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-center mb-3">
                          <div>
                            <span className="block text-[10px] text-neutral-400 font-bold uppercase">Voucher</span>
                            <span className="text-xs sm:text-sm font-black text-neutral-900">₹{coupon.couponAmount || '1,000'}</span>
                          </div>
                          <div className="border-x border-neutral-200">
                            <span className="block text-[10px] text-emerald-600 font-bold uppercase">Selling Price</span>
                            <span className="text-xs sm:text-sm font-black text-emerald-700">₹{coupon.sellingPrice || '49'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-neutral-400 font-bold uppercase">Min. Order</span>
                            <span className="text-xs sm:text-sm font-black text-neutral-900">₹{coupon.minPurchaseAmount || '999'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-medium">
                          <Calendar size={13} className="text-[#E11D48]" />
                          <span>Exp: {coupon.expiryDate}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Add to cart */}
                          {currentUser?.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(coupon as any)}
                              className="px-2.5 py-1.5 rounded-lg border border-neutral-300 hover:border-black text-neutral-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Add to Cart"
                            >
                              <ShoppingBag size={13} />
                              <span className="hidden sm:inline">Cart</span>
                            </button>
                          )}

                          {/* Direct Buy or Brand View */}
                          {currentUser?.role !== 'admin' ? (
                            <button
                              type="button"
                              onClick={() => setSelectedCouponForDirectPay(coupon as any)}
                              className="px-3 py-1.5 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-extrabold transition shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <span>Claim ₹{coupon.sellingPrice || '49'}</span>
                              <ArrowRight size={13} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (matchedBrand) {
                                  setSelectedBrandForCoupons(matchedBrand);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>Manage Brand</span>
                              <ExternalLink size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* Direct Payment Checkout Modal */}
      {selectedCouponForDirectPay && (
        <CouponPaymentModal
          isOpen={Boolean(selectedCouponForDirectPay)}
          onClose={() => setSelectedCouponForDirectPay(null)}
          coupon={selectedCouponForDirectPay}
          onSuccess={(paidCoupon) => {
            handleDirectPaymentSuccess(paidCoupon);
            setSelectedCouponForDirectPay(null);
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
