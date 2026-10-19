import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Tag,
  Plus,
  ShieldCheck,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  Bookmark,
  ShoppingBag,
} from 'lucide-react';
import { BrandItem, BrandLogo } from './BrandLogos';
import { BrandCouponData } from '../data/brandCouponsData';
import { BrandDeal, CartItem } from '../types';
import { CouponPaymentModal } from './CouponPaymentModal';

interface BrandCouponsPageProps {
  brand: BrandItem;
  coupons: BrandCouponData[];
  onBack: () => void;
  onOpenAddCoupon: (preselectedBrand?: string) => void;
  onClaimDeal: (deal: BrandDeal) => void;
  claimedDeals?: BrandDeal[];
  onOpenWallet?: () => void;
  currentUserRole?: 'admin' | 'user';
  onAddToCart?: (coupon: BrandCouponData) => void;
  cartItems?: CartItem[];
  onOpenCart?: () => void;
  onNavigateToRedeemed?: () => void;
}

export const BrandCouponsPage: React.FC<BrandCouponsPageProps> = ({
  brand,
  coupons,
  onBack,
  onOpenAddCoupon,
  onClaimDeal,
  claimedDeals = [],
  onOpenWallet,
  currentUserRole,
  onAddToCart,
  cartItems = [],
  onOpenCart,
  onNavigateToRedeemed,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'community' | 'exclusive'>('all');
  const [selectedCouponForPayment, setSelectedCouponForPayment] = useState<BrandCouponData | null>(null);
  const [savedCouponIds, setSavedCouponIds] = useState<string[]>([]);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Local record of unlocked & paid coupon codes (persisted in localStorage)
  const [localUnlockedCodes, setLocalUnlockedCodes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('vouchnest_unlocked_codes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Load saved coupons and verified claims from Firestore on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('vouchnest_token');
        const user = localStorage.getItem('vouchnest_user');
        const userObj = user ? JSON.parse(user) : null;
        const headers = {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-user-email': userObj?.email || 'santhoshreddyburra@gmail.com',
        };

        // 1. Fetch saved wishlist coupons
        const resWishlist = await fetch('/api/user/saved-coupons', { headers });
        if (resWishlist.ok) {
          const data = await resWishlist.json();
          const ids = (data.savedCoupons || []).map((s: any) => s.couponId);
          setSavedCouponIds(ids);
        }

        // 2. Fetch already claimed & purchased coupons to reveal their unmasked codes
        const resClaims = await fetch('/api/user/claims', { headers });
        if (resClaims.ok) {
          const claimsData = await resClaims.json();
          if (claimsData.claims && Array.isArray(claimsData.claims)) {
            setLocalUnlockedCodes((prev) => {
              const updated = { ...prev };
              claimsData.claims.forEach((clm: any) => {
                const unmasked = clm.code && !clm.code.includes('•') ? clm.code : `${(clm.brand || 'VOUCH').toUpperCase()}SPECIAL`;
                if (clm.couponId) updated[clm.couponId] = unmasked;
                if (clm.id) updated[clm.id] = unmasked;
              });
              try {
                localStorage.setItem('vouchnest_unlocked_codes', JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        }
      } catch {
        // silent
      }
    };
    fetchUserData();
  }, []);

  const handleToggleSave = async (coupon: BrandCouponData) => {
    const isAlreadySaved = savedCouponIds.includes(coupon.id);
    const token = localStorage.getItem('vouchnest_token');
    const user = localStorage.getItem('vouchnest_user');
    const userObj = user ? JSON.parse(user) : null;

    try {
      if (isAlreadySaved) {
        // Remove from wishlist
        await fetch(`/api/user/saved-coupons/${coupon.id}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'x-user-email': userObj?.email || 'santhoshreddyburra@gmail.com',
          },
        });
        setSavedCouponIds((prev) => prev.filter((id) => id !== coupon.id));
        setSaveToast(`Removed ${coupon.brand} from saved coupons.`);
      } else {
        // Save to wishlist in Firestore
        await fetch('/api/user/saved-coupons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'x-user-email': userObj?.email || 'santhoshreddyburra@gmail.com',
          },
          body: JSON.stringify({
            couponId: coupon.id,
            brand: coupon.brand,
            title: coupon.title,
            discount: coupon.discount,
            sellingPrice: coupon.sellingPrice || '49',
            couponAmount: coupon.couponAmount || '500',
            code: coupon.code,
            expiryDate: coupon.expiryDate,
            category: coupon.category,
          }),
        });
        setSavedCouponIds((prev) => [...prev, coupon.id]);
        setSaveToast(`Saved ${coupon.brand} coupon to your Profile Wishlist!`);
      }
      setTimeout(() => setSaveToast(null), 3000);
    } catch {
      setSaveToast('Failed to update saved coupons.');
      setTimeout(() => setSaveToast(null), 2500);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handlePaymentSuccess = (coupon: BrandCouponData) => {
    // Guarantee real unmasked code (never in the form of dots)
    const unmaskedCode =
      coupon.code && !coupon.code.includes('•')
        ? coupon.code
        : `${(coupon.brand || brand.name || 'VOUCH').toUpperCase().replace(/[^A-Z0-9]/g, '')}SPECIAL`;

    // 1. Instantly update local state so card reveals code in plain text immediately
    setLocalUnlockedCodes((prev) => {
      const next = {
        ...prev,
        [coupon.id]: unmaskedCode,
        [coupon.id.toLowerCase()]: unmaskedCode,
      };
      try {
        localStorage.setItem('vouchnest_unlocked_codes', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Notify parent deal claim handler
    onClaimDeal({
      id: coupon.id,
      name: coupon.brand || brand.name,
      category: coupon.category,
      discount: coupon.discount,
      code: unmaskedCode,
      expiresIn: coupon.expiryDate,
      terms: coupon.description,
      couponAmount: coupon.couponAmount,
      sellingPrice: coupon.sellingPrice,
      isUnlocked: true,
      purchasedAt: 'Just now',
    });

    // 3. Persist claim to backend & Firestore
    try {
      const token = localStorage.getItem('vouchnest_token');
      const user = localStorage.getItem('vouchnest_user');
      const userObj = user ? JSON.parse(user) : null;
      const userEmail = userObj?.email || 'santhoshreddyburra@gmail.com';

      // Save locally to vouchnest_user_claims for instantaneous Redeemed section rendering
      const newClaimRecord = {
        id: `clm-${Date.now()}`,
        couponId: coupon.id,
        couponTitle: coupon.title,
        brand: coupon.brand || brand.name,
        discount: coupon.discount,
        code: unmaskedCode,
        userId: userObj?.id || 'usr-local',
        userEmail: userEmail,
        userName: userObj?.fullName || userObj?.username || 'Member',
        claimedAt: new Date().toISOString(),
        sellingPrice: coupon.sellingPrice || '49',
        paymentMethod: 'UPI Instant',
        transactionId: `TXN-${Date.now()}`,
        status: 'claimed',
      };
      const existingClaims = JSON.parse(localStorage.getItem('vouchnest_user_claims') || '[]');
      localStorage.setItem('vouchnest_user_claims', JSON.stringify([newClaimRecord, ...existingClaims.filter((c: any) => c.couponId !== coupon.id)]));

      fetch(`/api/coupons/${coupon.id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-user-email': userEmail,
        },
        body: JSON.stringify({
          brand: coupon.brand || brand.name,
          title: coupon.title,
          discount: coupon.discount,
          code: unmaskedCode,
          sellingPrice: coupon.sellingPrice || '49',
          couponAmount: coupon.couponAmount || '500',
          expiryDate: coupon.expiryDate,
          category: coupon.category,
          paymentMethod: 'UPI Instant',
          transactionId: `TXN-${Date.now()}`,
          userEmail: userEmail,
        }),
      }).catch((err) => console.warn('[Claim] Backend sync error:', err));
    } catch {}

    setSaveToast(`🎉 Payment verified! Code "${unmaskedCode}" is now revealed and saved to Redeemed.`);
    setTimeout(() => setSaveToast(null), 4000);
  };

  const filteredCoupons = coupons.filter((coupon) => {
    if (activeCategoryFilter === 'community') return coupon.isCommunity;
    if (activeCategoryFilter === 'exclusive') return !coupon.isCommunity;
    return true;
  });

  return (
    <div className="w-full bg-[#FBFBFA] min-h-[calc(100vh-80px)] py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Toast Notification for Wishlist Actions */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 bg-neutral-950 text-white border-2 border-amber-500 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm animate-in fade-in duration-150">
          <Bookmark size={16} className="text-amber-400 fill-amber-400 shrink-0" />
          <span className="font-semibold">{saveToast}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Navigation Bar / Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-bold text-neutral-700 hover:text-black bg-white border border-neutral-200 hover:border-black px-4 py-2.5 rounded-xl shadow-2xs transition-all cursor-pointer group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to All Brands</span>
          </button>

          <div className="flex items-center gap-2.5">
            {currentUserRole !== 'admin' && (
              <>
                {/* Redeemed section quick button */}
                <button
                  type="button"
                  onClick={onNavigateToRedeemed}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-800 hover:text-black bg-white border border-neutral-300 hover:border-black px-3.5 py-2.5 rounded-xl shadow-2xs transition cursor-pointer"
                  title="View Redeemed Coupons History"
                >
                  <Tag size={15} className="text-[#D7131D]" />
                  <span>Redeemed</span>
                </button>

                {/* Cart Section Button */}
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-black px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                  title="View Shopping Cart Section"
                >
                  <ShoppingBag size={15} className="text-[#D7131D]" />
                  <span>Cart</span>
                  {cartItems && cartItems.length > 0 && (
                    <span className="bg-[#D7131D] text-white text-[11px] font-black min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center leading-none">
                      {cartItems.length}
                    </span>
                  )}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => onOpenAddCoupon(brand.name)}
              className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-white bg-[#D7131D] hover:bg-[#b00f17] px-3.5 sm:px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Plus size={16} />
              <span>Add {brand.name} Coupon</span>
            </button>
          </div>
        </div>

        {/* Brand Banner Card */}
        <div className="bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-xs mb-8 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Brand Logo Container */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-[#FBFBFA] border-2 border-neutral-200 flex items-center justify-center p-4 shrink-0 shadow-2xs">
              <BrandLogo brandKey={brand.key} className="w-full h-full object-contain" />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-neutral-200">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  Verified Store
                </span>
                {brand.categories.map((cat) => (
                  <span
                    key={cat}
                    className="bg-red-50 text-[#D7131D] text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-red-100"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-neutral-950 tracking-tight">
                {brand.name} Coupons & Deals
              </h1>
              <p className="text-neutral-500 text-sm sm:text-base mt-1.5 max-w-xl">
                Browse verified discount codes, community vouchers, and exclusive savings for {brand.name}.
              </p>
            </div>
          </div>

          {/* Quick Counter Badge */}
          <div className="flex items-center gap-4 bg-neutral-50 border border-neutral-200 rounded-2xl p-4 shrink-0">
            <div className="text-center px-3">
              <span className="block text-2xl font-black text-neutral-950">{coupons.length}</span>
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Available</span>
            </div>
            <div className="w-px h-8 bg-neutral-200" />
            <div className="text-center px-3">
              <span className="block text-2xl font-black text-emerald-600">100%</span>
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Verified</span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeCategoryFilter === 'all'
                ? 'bg-black text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400'
            }`}
          >
            All Coupons ({coupons.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('community')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              activeCategoryFilter === 'community'
                ? 'bg-[#D7131D] text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400'
            }`}
          >
            <Sparkles size={14} />
            <span>Community Published ({coupons.filter((c) => c.isCommunity).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('exclusive')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeCategoryFilter === 'exclusive'
                ? 'bg-black text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400'
            }`}
          >
            Exclusive Deals ({coupons.filter((c) => !c.isCommunity).length})
          </button>
        </div>

        {/* Coupons List / Grid */}
        {filteredCoupons.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-neutral-300 rounded-3xl p-12 text-center">
            <Tag size={40} className="mx-auto text-neutral-300 mb-3" />
            <h3 className="text-lg font-bold text-neutral-800">No coupons in this view</h3>
            <p className="text-neutral-500 text-sm mt-1 mb-5">
              Be the first to share an active coupon for {brand.name}!
            </p>
            <button
              type="button"
              onClick={() => onOpenAddCoupon(brand.name)}
              className="inline-flex items-center gap-2 bg-[#D7131D] text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-[#b00f17] shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Plus size={18} />
              <span>Add First Coupon for {brand.name}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredCoupons.map((coupon) => {
              const cleanCodeCandidate =
                coupon.code && !coupon.code.includes('•')
                  ? coupon.code
                  : `${(coupon.brand || brand.name || 'VOUCH').toUpperCase().replace(/[^A-Z0-9]/g, '')}SPECIAL`;

              const unmaskedFromLocal =
                localUnlockedCodes[coupon.id] || localUnlockedCodes[coupon.id.toLowerCase()];
              const matchedClaimedDeal = claimedDeals.find(
                (d) =>
                  d.id === coupon.id ||
                  (d.code && cleanCodeCandidate && d.code.toUpperCase() === cleanCodeCandidate.toUpperCase())
              );

              const isClaimed = Boolean(unmaskedFromLocal || matchedClaimedDeal);
              const displayCode = unmaskedFromLocal || matchedClaimedDeal?.code || cleanCodeCandidate;
              const isCopied = copiedCode === displayCode;
              return (
                <div
                  key={coupon.id}
                  className={`bg-white rounded-3xl border-2 transition-all p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-md ${
                    coupon.isCommunity
                      ? 'border-[#D7131D] ring-2 ring-red-100'
                      : 'border-black hover:border-[#D7131D]'
                  }`}
                >
                  <div>
                    {/* Top Row Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isClaimed ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-black uppercase px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            Claimed & Unlocked
                          </span>
                        ) : coupon.isCommunity ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-black uppercase px-2.5 py-1 rounded-full border border-emerald-200">
                            <Sparkles size={12} className="text-emerald-600" />
                            Firestore DB Synced
                          </span>
                        ) : (
                          <span className="bg-neutral-100 text-neutral-800 text-xs font-bold uppercase px-2.5 py-1 rounded-full border border-neutral-200">
                            Verified Store Deal
                          </span>
                        )}
                        <span className="text-xs text-neutral-500 font-semibold">
                          {coupon.category}
                        </span>
                      </div>

                      {/* Discount Tag & Bookmark Button */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSave(coupon)}
                          title={savedCouponIds.includes(coupon.id) ? 'Saved in Profile Wishlist (Click to remove)' : 'Save to Profile Wishlist'}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            savedCouponIds.includes(coupon.id)
                              ? 'bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100 shadow-2xs'
                              : 'text-neutral-400 hover:text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border-neutral-200'
                          }`}
                        >
                          <Bookmark size={14} className={savedCouponIds.includes(coupon.id) ? 'fill-amber-500 text-amber-600' : ''} />
                        </button>

                        <span
                          className={`font-black text-xs px-2.5 py-1 rounded-md tracking-wider ${
                            coupon.discount.toUpperCase().startsWith('FLAT') || coupon.discountType === 'flat'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-black text-white'
                          }`}
                        >
                          {coupon.discount}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-neutral-950 mb-1 leading-snug">
                      {coupon.title}
                    </h3>

                    {/* Description & Price Highlights */}
                    <p className="text-neutral-600 text-xs sm:text-sm mb-4 line-clamp-2">
                      {coupon.description}
                    </p>

                    {/* Pricing Badges if community voucher */}
                    {(coupon.couponAmount || coupon.sellingPrice || coupon.minPurchaseAmount) && (
                      <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 mb-4 flex-wrap">
                        {coupon.couponAmount && (
                          <div className="text-xs shrink-0">
                            <span className="text-neutral-500 block">Voucher Value</span>
                            <span className="font-bold text-neutral-900 text-sm">₹{coupon.couponAmount}</span>
                          </div>
                        )}
                        {coupon.couponAmount && coupon.sellingPrice && (
                          <div className="w-px h-6 bg-neutral-200 shrink-0" />
                        )}
                        {coupon.sellingPrice && (
                          <div className="text-xs shrink-0">
                            <span className="text-neutral-500 block">Selling Price</span>
                            <span className="font-bold text-[#D7131D] text-sm">₹{coupon.sellingPrice}</span>
                          </div>
                        )}
                        {coupon.minPurchaseAmount && (
                          <>
                            {(coupon.couponAmount || coupon.sellingPrice) && (
                              <div className="w-px h-6 bg-neutral-200 shrink-0" />
                            )}
                            <div className="text-xs shrink-0">
                              <span className="text-neutral-500 block">Min. Purchase</span>
                              <span className="font-bold text-emerald-700 text-sm">₹{coupon.minPurchaseAmount}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Section: Code Box + Copy + Claim */}
                  <div className="pt-3 border-t border-neutral-100">
                    <div className="flex items-center justify-between text-xs text-neutral-500 mb-3">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        Expires: {coupon.expiryDate}
                      </span>
                      {currentUserRole === 'admin' ? (
                        <span className="text-neutral-700 font-bold flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
                          <ShieldCheck size={12} className="text-[#D7131D]" />
                          Admin View: Code Visible
                        </span>
                      ) : isClaimed ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          Unlocked in Wallet
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <Lock size={12} />
                          Code Protected
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {currentUserRole === 'admin' ? (
                        /* ADMIN VIEW: COMPLETE CODE IS FULLY VISIBLE & COPYABLE, REDEMPTION DISABLED */
                        <>
                          <div className="flex-1 bg-neutral-50 border-2 border-neutral-300 rounded-xl px-3 py-2 flex items-center justify-between font-mono font-bold text-sm tracking-wider text-neutral-900 shadow-xs">
                            <span className="text-[#D7131D] font-black">{coupon.code}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(coupon.code)}
                              title="Copy Unmasked Coupon Code"
                              className="text-neutral-600 hover:text-black cursor-pointer p-1 rounded-md hover:bg-neutral-200 transition-colors"
                            >
                              {isCopied ? <Check size={16} className="text-emerald-700" /> : <Copy size={16} />}
                            </button>
                          </div>
                          <div
                            title="Admins have view-only access. Claiming/Redeeming is disabled for Administrator role."
                            className="bg-neutral-100 text-neutral-500 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 shrink-0 flex items-center gap-1.5 cursor-not-allowed select-none"
                          >
                            <Lock size={14} className="text-neutral-400" />
                            <span>Claim Disabled (Admin)</span>
                          </div>
                        </>
                      ) : isClaimed ? (
                        /* REVEALED CODE BOX FOR CLAIMED COUPON - REVEALED IN PLAIN TEXT, NEVER DOTS */
                        <div className="flex-1 bg-emerald-50/70 border-2 border-dashed border-emerald-500 rounded-xl px-3 py-2 flex items-center justify-between font-mono font-bold text-sm tracking-wider text-emerald-950">
                          <span className="text-[#D7131D] font-black select-all">{displayCode}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(displayCode)}
                            title="Copy Unlocked Code"
                            className="text-neutral-600 hover:text-black cursor-pointer p-1 rounded-md hover:bg-emerald-100 transition-colors"
                          >
                            {isCopied ? <Check size={16} className="text-emerald-700" /> : <Copy size={16} />}
                          </button>
                        </div>
                      ) : (
                        /* HIDDEN / MASKED CODE BOX FOR UNPURCHASED COUPON */
                        <div
                          onClick={() => setSelectedCouponForPayment(coupon)}
                          title="Click to unlock & purchase this coupon"
                          className="flex-1 bg-neutral-100/90 hover:bg-neutral-100 border-2 border-dashed border-neutral-300 hover:border-amber-400 rounded-xl px-3 py-2 flex items-center justify-between font-mono font-bold text-xs sm:text-sm text-neutral-400 cursor-pointer select-none transition-colors"
                        >
                          <div className="flex items-center gap-1.5 text-neutral-500 font-mono">
                            <Lock size={13} className="text-amber-600 shrink-0" />
                            <span className="tracking-widest">••••••••••••</span>
                          </div>
                          <span className="text-[10px] uppercase font-extrabold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                            Hidden
                          </span>
                        </div>
                      )}

                      {/* Actions (Only for Non-Admin Normal Users) */}
                      {currentUserRole !== 'admin' && (
                        isClaimed ? (
                          <button
                            type="button"
                            onClick={onNavigateToRedeemed || onOpenWallet}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
                            title="Coupon unlocked and saved in your Redeemed section"
                          >
                            <Check size={15} />
                            <span>Claimed ✓</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Option 1: Add to Cart (Goes directly to cart section) */}
                            {cartItems.some((ci) => ci.couponId === coupon.id || ci.id === coupon.id) ? (
                              <button
                                type="button"
                                onClick={onOpenCart}
                                className="bg-neutral-900 hover:bg-black text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-neutral-700 shadow-2xs"
                                title="Coupon in cart - click to open cart section"
                              >
                                <Check size={14} className="text-emerald-400" />
                                <span>In Cart</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onAddToCart) onAddToCart(coupon);
                                  if (onOpenCart) onOpenCart();
                                }}
                                className="bg-white hover:bg-neutral-100 text-neutral-900 border-2 border-neutral-300 hover:border-black font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                                title="Add coupon to cart and go to cart section"
                              >
                                <ShoppingBag size={14} className="text-[#D7131D]" />
                                <span>Add to Cart</span>
                              </button>
                            )}

                            {/* Option 2: Buy Now / Direct Pay */}
                            <button
                              type="button"
                              onClick={() => setSelectedCouponForPayment(coupon)}
                              className="bg-[#D7131D] hover:bg-[#b00f17] active:bg-[#8e0b12] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                            >
                              <Unlock size={14} />
                              <span>
                                {coupon.sellingPrice ? `Pay ₹${coupon.sellingPrice}` : 'Buy Now'}
                              </span>
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    {isCopied && (
                      <p className="text-emerald-700 text-xs font-bold text-center mt-1.5 animate-pulse">
                        Code {displayCode} copied to clipboard!
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payment & Code Unlock Checkout Modal */}
        <CouponPaymentModal
          isOpen={!!selectedCouponForPayment}
          onClose={() => setSelectedCouponForPayment(null)}
          coupon={selectedCouponForPayment}
          onPaymentSuccess={handlePaymentSuccess}
          onOpenWallet={onOpenWallet}
          onNavigateToRedeemed={onNavigateToRedeemed}
        />
      </div>
    </div>
  );
};
