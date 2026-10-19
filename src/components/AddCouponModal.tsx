import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Plane, CheckCircle2, ChevronLeft, ChevronRight, Sparkles, Percent, IndianRupee } from 'lucide-react';
import { CouponItem } from '../types';
import { BRAND_ITEMS } from './BrandLogos';

interface AddCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCoupon: (coupon: CouponItem) => void;
  initialBrand?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const PERCENT_PRESETS = [
  '10% OFF', '15% OFF', '20% OFF', '25% OFF', '30% OFF',
  '35% OFF', '40% OFF', '50% OFF', '60% OFF', '70% OFF',
  '80% OFF', 'BUY 1 GET 1'
];

const FLAT_PRESETS = [
  'FLAT ₹50 OFF', 'FLAT ₹100 OFF', 'FLAT ₹150 OFF', 'FLAT ₹200 OFF',
  'FLAT ₹250 OFF', 'FLAT ₹300 OFF', 'FLAT ₹400 OFF', 'FLAT ₹500 OFF',
  'FLAT ₹750 OFF', 'FLAT ₹1,000 OFF', 'FLAT ₹1,500 OFF', 'FLAT ₹2,000 OFF',
  'FLAT ₹5,000 OFF'
];

export const AddCouponModal: React.FC<AddCouponModalProps> = ({
  isOpen,
  onClose,
  onAddCoupon,
  initialBrand,
}) => {
  const [couponAmount, setCouponAmount] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [brand, setBrand] = useState(initialBrand || 'Amazon');
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [customBrandName, setCustomBrandName] = useState('');
  const [discountLabel, setDiscountLabel] = useState('20% OFF');
  const [autoCalculatedDiscount, setAutoCalculatedDiscount] = useState<{
    label: string;
    savings: number;
    pct: number;
    type: 'percent' | 'flat';
  } | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [category, setCategory] = useState<'Electronics' | 'Fashion' | 'Skin Care'>('Electronics');
  
  // Date states
  const [expiryDate, setExpiryDate] = useState('30-11-2026');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(10); // 0-indexed (10 = November)
  const calendarRef = useRef<HTMLDivElement>(null);

  const [isValidated, setIsValidated] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState('');

  // Sync initialBrand when modal opens
  useEffect(() => {
    if (initialBrand) {
      setBrand(initialBrand);
      const matched = BRAND_ITEMS.find((b) => b.name.toLowerCase() === initialBrand.toLowerCase());
      if (matched && matched.categories.length > 0) {
        const primaryCat = matched.categories[0];
        if (primaryCat === 'fashion') setCategory('Fashion');
        else if (primaryCat === 'electronics') setCategory('Electronics');
        else if (primaryCat === 'skincare') setCategory('Skin Care');
      }
    }
  }, [initialBrand, isOpen]);

  // Close calendar dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Recalculate discount whenever coupon amount, selling price, or discount type changes
  const calculateDiscount = (
    amountStr: string,
    priceStr: string,
    type: 'percent' | 'flat' = discountType
  ) => {
    const amount = parseFloat(amountStr);
    const price = parseFloat(priceStr);

    if (!isNaN(amount) && amount > 0) {
      if (!isNaN(price) && price >= 0) {
        if (price <= amount) {
          const savings = Math.max(0, amount - price);
          const pct = Math.round((savings / amount) * 100);
          if (type === 'percent') {
            return {
              label: `${pct}% OFF`,
              savings,
              pct,
              type: 'percent' as const,
            };
          } else {
            return {
              label: `FLAT ₹${savings} OFF`,
              savings,
              pct,
              type: 'flat' as const,
            };
          }
        } else {
          return { label: 'SPECIAL DEAL', savings: 0, pct: 0, type };
        }
      } else {
        if (type === 'percent') {
          return { label: `100% OFF`, savings: amount, pct: 100, type: 'percent' as const };
        } else {
          return { label: `FLAT ₹${amount} OFF`, savings: amount, pct: 100, type: 'flat' as const };
        }
      }
    }
    return null;
  };

  const handleCouponAmountChange = (val: string) => {
    setCouponAmount(val);
    const calculated = calculateDiscount(val, sellingPrice, discountType);
    if (calculated) {
      setAutoCalculatedDiscount(calculated);
      setDiscountLabel(calculated.label);
    } else {
      setAutoCalculatedDiscount(null);
    }
  };

  const handleSellingPriceChange = (val: string) => {
    setSellingPrice(val);
    const calculated = calculateDiscount(couponAmount, val, discountType);
    if (calculated) {
      setAutoCalculatedDiscount(calculated);
      setDiscountLabel(calculated.label);
    } else {
      setAutoCalculatedDiscount(null);
    }
  };

  const handleDiscountTypeChange = (newType: 'percent' | 'flat') => {
    setDiscountType(newType);
    const calculated = calculateDiscount(couponAmount, sellingPrice, newType);
    if (calculated) {
      setAutoCalculatedDiscount(calculated);
      setDiscountLabel(calculated.label);
    } else {
      setAutoCalculatedDiscount(null);
      setDiscountLabel(newType === 'percent' ? '20% OFF' : 'FLAT ₹500 OFF');
    }
  };

  const handleValidate = () => {
    const trimmed = couponCode.trim();
    if (!trimmed) {
      setIsValidated(false);
      setValidationMessage('Enter a code to validate');
      return;
    }
    if (trimmed.length < 4) {
      setIsValidated(false);
      setValidationMessage('Code must be at least 4 characters');
      return;
    }
    setIsValidated(true);
    setValidationMessage('Code verified & ready!');
  };

  // Calendar Helpers
  const parseCurrentDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return { day, month, year };
      }
    }
    return null;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleSelectDate = (day: number) => {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(calendarMonth + 1).padStart(2, '0');
    const formatted = `${dayStr}-${monthStr}-${calendarYear}`;
    setExpiryDate(formatted);
    setIsCalendarOpen(false);
  };

  const handleQuickDatePreset = (monthsAhead: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsAhead);
    const dayStr = String(d.getDate()).padStart(2, '0');
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    const yearStr = d.getFullYear();
    setExpiryDate(`${dayStr}-${monthStr}-${yearStr}`);
    setCalendarYear(yearStr);
    setCalendarMonth(d.getMonth());
    setIsCalendarOpen(false);
  };

  const formattedDisplayDate = () => {
    const parsed = parseCurrentDate(expiryDate);
    if (parsed) {
      const { day, month, year } = parsed;
      return `${String(day).padStart(2, '0')} ${SHORT_MONTH_NAMES[month] || ''} ${year}`;
    }
    return expiryDate || 'Select Date';
  };

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      setIsValidated(false);
      setValidationMessage('Please enter a coupon code');
      return;
    }

    const finalBrand = isCustomBrand && customBrandName.trim() ? customBrandName.trim() : brand;

    const calculatedTitle = couponAmount
      ? `₹${couponAmount} Voucher for ${finalBrand}`
      : `${discountLabel} at ${finalBrand}`;

    const descParts: string[] = [];
    if (couponAmount) descParts.push(`Voucher: ₹${couponAmount}`);
    if (sellingPrice) descParts.push(`Selling: ₹${sellingPrice}`);
    if (minPurchaseAmount) descParts.push(`Min. order: ₹${minPurchaseAmount}`);
    const generatedDescription = descParts.length > 0
      ? descParts.join(' • ')
      : 'Verified coupon on VoucherNest';

    onAddCoupon({
      id: `coupon-${Date.now()}`,
      title: calculatedTitle,
      brand: finalBrand,
      discount: discountLabel || (discountType === 'percent' ? '20% OFF' : 'FLAT ₹500 OFF'),
      discountType,
      code: couponCode.trim().toUpperCase(),
      expiryDate: expiryDate || '30-11-2026',
      category,
      couponAmount,
      sellingPrice,
      minPurchaseAmount,
      description: generatedDescription,
    });

    // Reset fields
    setCouponAmount('');
    setSellingPrice('');
    setMinPurchaseAmount('');
    setCouponCode('');
    setCustomBrandName('');
    setIsCustomBrand(false);
    setExpiryDate('30-11-2026');
    setIsValidated(null);
    setValidationMessage('');
    setAutoCalculatedDiscount(null);
    setDiscountType('percent');
    setDiscountLabel('20% OFF');
    onClose();
  };

  // Helper for brand badge
  const getBrandBadge = (brandName: string) => {
    const initial = brandName.charAt(0).toUpperCase();
    return (
      <div className="w-6 h-6 rounded-md bg-[#E11D48] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
        {initial}
      </div>
    );
  };

  if (!isOpen) return null;

  const parsedCurrent = parseCurrentDate(expiryDate);
  const daysInCurrentMonth = getDaysInMonth(calendarYear, calendarMonth);
  const startDayOffset = getFirstDayOfMonth(calendarYear, calendarMonth);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white text-neutral-900 rounded-[28px] sm:rounded-[32px] w-full max-w-[500px] p-6 sm:p-8 shadow-2xl relative border border-neutral-100 my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        {/* Top Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2.5">
            {/* Exact Yellow Tag Icon from Reference Photo */}
            <div className="w-8 h-8 rounded-lg bg-amber-100/80 flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-amber-500 fill-amber-400"
                style={{ transform: 'rotate(-25deg)' }}
              >
                <path
                  d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8 8a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828l-8-8z"
                  fill="#FBBF24"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                />
                <circle cx="7" cy="7" r="1.5" fill="#FFFFFF" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-[900] text-[#0F172A] tracking-tight">
              Share a New Coupon
            </h2>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm font-normal mt-1 ml-0.5">
            Fill in the details below. All vouchers are verified and stored directly in your Firebase Firestore database.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Firebase Firestore Database Connected</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Field 1: Coupon Amount */}
          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-1">
              Coupon Amount
            </label>
            <div className="relative flex items-center bg-[#F8FAFC] focus-within:bg-white border border-[#E2E8F0] focus-within:border-slate-400 rounded-2xl transition-all duration-150 h-[50px] px-3.5">
              <span className="text-[#10B981] font-bold text-lg select-none mr-2">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={couponAmount}
                onChange={(e) => handleCouponAmountChange(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full bg-transparent text-[#0F172A] text-base font-semibold placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Field 2: Selling Price */}
          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-1">
              Selling Price
            </label>
            <div className="relative flex items-center bg-[#F8FAFC] focus-within:bg-white border border-[#E2E8F0] focus-within:border-slate-400 rounded-2xl transition-all duration-150 h-[50px] px-3.5">
              <span className="text-[#10B981] font-bold text-lg select-none mr-2">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={sellingPrice}
                onChange={(e) => handleSellingPriceChange(e.target.value)}
                placeholder="e.g. 700"
                className="w-full bg-transparent text-[#0F172A] text-base font-semibold placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Field 3: Minimum Purchase Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-bold text-[#0F172A]">
                Minimum Purchase Amount
              </label>
              <span className="text-xs text-slate-400 font-medium">
                (Min. cart value)
              </span>
            </div>
            <div className="relative flex items-center bg-[#F8FAFC] focus-within:bg-white border border-[#E2E8F0] focus-within:border-slate-400 rounded-2xl transition-all duration-150 h-[50px] px-3.5">
              <span className="text-[#10B981] font-bold text-lg select-none mr-2">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={minPurchaseAmount}
                onChange={(e) => setMinPurchaseAmount(e.target.value)}
                placeholder="e.g. 1999"
                className="w-full bg-transparent text-[#0F172A] text-base font-semibold placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Field 4: Discount Type Selector (Flat vs Percent) */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                <span>Select Discount Type:</span>
                <span className="font-extrabold uppercase text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[#0F172A]">
                  {discountType === 'percent' ? 'Percentage' : 'Flat Amount'}
                </span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Choose format
              </span>
            </div>

            {/* Segmented Pill Selector: Percent (%) vs Flat (₹) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
              {/* Option 1: Percent (%) */}
              <button
                type="button"
                onClick={() => handleDiscountTypeChange('percent')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer select-none ${
                  discountType === 'percent'
                    ? 'bg-[#E11D48] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-xs ${
                    discountType === 'percent'
                      ? 'bg-white/20 text-white'
                      : 'bg-rose-100 text-[#E11D48]'
                  }`}
                >
                  <Percent size={12} strokeWidth={2.8} />
                </div>
                <span>Percent (%)</span>
              </button>

              {/* Option 2: Flat (₹) */}
              <button
                type="button"
                onClick={() => handleDiscountTypeChange('flat')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer select-none ${
                  discountType === 'flat'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-xs ${
                    discountType === 'flat'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <IndianRupee size={12} strokeWidth={2.8} />
                </div>
                <span>Flat (₹)</span>
              </button>
            </div>
          </div>

          {/* Row 5: Store / Brand (left) & Discount Label (right) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Store / Brand */}
            <div>
              <label className="block text-sm font-bold text-[#0F172A] mb-1">
                Store / Brand
              </label>
              <div className="relative flex items-center bg-[#F8FAFC] hover:bg-[#F1F5F9]/60 focus-within:bg-white border border-[#E2E8F0] focus-within:border-slate-400 rounded-2xl transition-all h-[50px] px-3">
                <div className="flex items-center gap-2 w-full overflow-hidden">
                  {getBrandBadge(brand)}
                  <select
                    value={isCustomBrand ? 'CUSTOM' : brand}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      if (selectedName === 'CUSTOM') {
                        setIsCustomBrand(true);
                      } else {
                        setIsCustomBrand(false);
                        setBrand(selectedName);
                        const matched = BRAND_ITEMS.find((b) => b.name === selectedName);
                        if (matched && matched.categories.length > 0) {
                          const primaryCat = matched.categories[0];
                          if (primaryCat === 'fashion') setCategory('Fashion');
                          else if (primaryCat === 'electronics') setCategory('Electronics');
                          else if (primaryCat === 'skincare') setCategory('Skin Care');
                        }
                      }
                    }}
                    className="w-full bg-transparent text-sm font-semibold text-[#0F172A] focus:outline-none cursor-pointer appearance-none truncate pr-4"
                  >
                    {BRAND_ITEMS.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Other / Custom Brand</option>
                  </select>
                </div>
                {/* Downward Caret Triangle */}
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">
                  ▼
                </div>
              </div>
              {isCustomBrand && (
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    value={customBrandName}
                    onChange={(e) => setCustomBrandName(e.target.value)}
                    placeholder="Enter brand name (e.g. Apple, Zara, Swiggy)"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#D7131D] focus:bg-white rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-[#0F172A] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Discount Label - dynamically adjusted for Flat vs Percent */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-bold text-[#0F172A]">
                  Discount Label
                </label>
                {autoCalculatedDiscount && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                    <Sparkles size={10} /> Auto
                  </span>
                )}
              </div>
              <div className="relative flex items-center bg-[#F8FAFC] hover:bg-[#F1F5F9]/60 focus-within:bg-white border border-[#E2E8F0] focus-within:border-slate-400 rounded-2xl transition-all h-[50px] px-3">
                <div className="flex items-center gap-2 w-full">
                  {/* Indicator Dot (Coral for Percent, Green for Flat) */}
                  <span
                    className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                      discountType === 'percent' ? 'bg-[#E11D48]' : 'bg-emerald-600'
                    }`}
                  />
                  <select
                    value={discountLabel}
                    onChange={(e) => setDiscountLabel(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-[#0F172A] focus:outline-none cursor-pointer appearance-none truncate pr-4"
                  >
                    {/* Include auto-calculated option if present */}
                    {autoCalculatedDiscount && (
                      <option value={autoCalculatedDiscount.label}>
                        {autoCalculatedDiscount.label} (Auto)
                      </option>
                    )}

                    {/* Presets based on selected discountType */}
                    {discountType === 'percent' ? (
                      PERCENT_PRESETS.map((preset) => (
                        <option key={preset} value={preset}>
                          {preset}
                        </option>
                      ))
                    ) : (
                      FLAT_PRESETS.map((preset) => (
                        <option key={preset} value={preset}>
                          {preset}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                {/* Downward Caret Triangle */}
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Auto Calculation Helper feedback */}
          {autoCalculatedDiscount && autoCalculatedDiscount.savings > 0 && (
            <div
              className={`rounded-xl px-3 py-2 flex items-center justify-between text-xs border ${
                discountType === 'percent'
                  ? 'bg-rose-50 border-rose-200/80 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200/80 text-emerald-900'
              }`}
            >
              <span className="font-medium flex items-center gap-1.5">
                <Sparkles size={12} className={discountType === 'percent' ? 'text-rose-600' : 'text-emerald-600'} />
                <span>
                  {discountType === 'percent'
                    ? `Auto calculated percentage discount:`
                    : `Auto calculated flat rupee discount:`}
                </span>
              </span>
              <span className="font-bold">
                {discountType === 'percent'
                  ? `Saves ₹${autoCalculatedDiscount.savings} (${autoCalculatedDiscount.pct}% OFF)`
                  : `FLAT ₹${autoCalculatedDiscount.savings} OFF (${autoCalculatedDiscount.pct}% equiv)`}
              </span>
            </div>
          )}

          {/* Field 6: Coupon Code */}
          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-1">
              Coupon Code
            </label>
            <div className="relative flex items-center bg-[#F8FAFC] focus-within:bg-white border border-[#E2E8F0] focus-within:border-slate-400 rounded-2xl transition-all duration-150 h-[50px] px-3.5">
              <span className="text-lg mr-2 select-none shrink-0" role="img" aria-label="lock">
                🔒
              </span>
              <input
                type="text"
                required
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setIsValidated(null);
                  setValidationMessage('');
                }}
                placeholder="e.g. FESTIVE50"
                className="w-full bg-transparent font-mono text-sm sm:text-base uppercase tracking-wider text-[#0F172A] font-bold focus:outline-none pr-2"
              />
              {/* Validate Button */}
              <button
                type="button"
                onClick={handleValidate}
                className="shrink-0 px-3 py-1.5 rounded-xl border border-[#E11D48] text-[#E11D48] hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer active:scale-95"
              >
                Validate
              </button>
            </div>
            {validationMessage && (
              <p
                className={`text-xs mt-1 font-medium flex items-center gap-1 ${
                  isValidated ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {isValidated && <CheckCircle2 size={12} />}
                <span>{validationMessage}</span>
              </p>
            )}
          </div>

          {/* Row 7: Category (left) & Expiry Date (right with Calendar implementation) */}
          <div className="grid grid-cols-2 gap-3 relative">
            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-[#0F172A] mb-1">
                Category
              </label>
              <div className="relative flex items-center bg-[#F8FAFC] hover:bg-[#F1F5F9]/60 focus-within:bg-white border border-[#E2E8F0] focus-within:border-slate-400 rounded-2xl transition-all h-[50px] px-3">
                <div className="flex items-center gap-2 w-full">
                  <span className="w-3.5 h-3.5 rounded-[2px] bg-[#2563EB] rotate-45 shrink-0 ml-0.5" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-transparent text-sm font-semibold text-[#0F172A] focus:outline-none cursor-pointer appearance-none truncate pr-4"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Skin Care">Skin Care</option>
                  </select>
                </div>
                {/* Downward Caret Triangle */}
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">
                  ▼
                </div>
              </div>
            </div>

            {/* Expiry Date with clear format & interactive Calendar implementation */}
            <div className="relative" ref={calendarRef}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-bold text-[#0F172A]">
                  Expiry Date
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">
                  DD-MM-YYYY
                </span>
              </div>

              {/* Clickable Date trigger box */}
              <div
                onClick={() => {
                  const parsed = parseCurrentDate(expiryDate);
                  if (parsed) {
                    setCalendarYear(parsed.year);
                    setCalendarMonth(parsed.month);
                  }
                  setIsCalendarOpen(!isCalendarOpen);
                }}
                className="relative flex items-center bg-[#F8FAFC] hover:bg-[#F1F5F9]/80 border border-[#E2E8F0] hover:border-slate-400 rounded-2xl transition-all h-[50px] px-3 cursor-pointer select-none"
              >
                {/* Colorful calendar icon */}
                <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 mr-2 shadow-2xs">
                  <div className="grid grid-cols-2 gap-0.5 p-0.5">
                    <span className="w-1 h-1 bg-white rounded-2xs" />
                    <span className="w-1 h-1 bg-white rounded-2xs" />
                    <span className="w-1 h-1 bg-white rounded-2xs" />
                    <span className="w-1 h-1 bg-white rounded-2xs" />
                  </div>
                </div>

                {/* Formatted Date text */}
                <div className="flex-1 min-w-0">
                  <span className="block text-xs sm:text-sm font-bold text-[#0F172A] truncate">
                    {formattedDisplayDate()}
                  </span>
                  <span className="block text-[10px] text-slate-500 font-mono">
                    {expiryDate}
                  </span>
                </div>

                {/* Calendar Icon on right */}
                <Calendar size={18} className="text-[#E11D48] shrink-0 ml-1" />
              </div>

              {/* Interactive Calendar Popover Dropdown */}
              {isCalendarOpen && (
                <div className="absolute right-0 bottom-full mb-2 z-50 w-72 sm:w-80 bg-white border-2 border-neutral-900 rounded-2xl p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  {/* Calendar Header with Navigation */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        prevMonth();
                      }}
                      className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-700 cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-extrabold text-sm text-neutral-900">
                      {MONTH_NAMES[calendarMonth]} {calendarYear}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextMonth();
                      }}
                      className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-700 cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Day of Week Labels */}
                  <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 mb-1.5">
                    <span>Su</span>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>

                  {/* Month Days Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {/* Empty placeholder cells for day offset */}
                    {Array.from({ length: startDayOffset }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-7 w-7" />
                    ))}

                    {/* Day cells */}
                    {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                      const dayNumber = i + 1;
                      const isSelected =
                        parsedCurrent &&
                        parsedCurrent.day === dayNumber &&
                        parsedCurrent.month === calendarMonth &&
                        parsedCurrent.year === calendarYear;

                      return (
                        <button
                          key={`day-${dayNumber}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDate(dayNumber);
                          }}
                          className={`h-7 w-7 mx-auto rounded-lg font-bold flex items-center justify-center transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#E11D48] text-white shadow-xs'
                              : 'hover:bg-rose-50 text-neutral-800'
                          }`}
                        >
                          {dayNumber}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] font-bold text-neutral-600">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickDatePreset(1);
                      }}
                      className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-md cursor-pointer transition-colors"
                    >
                      +1 Mo
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickDatePreset(3);
                      }}
                      className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-md cursor-pointer transition-colors"
                    >
                      +3 Mo
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickDatePreset(6);
                      }}
                      className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-md cursor-pointer transition-colors"
                    >
                      +6 Mo
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCalendarOpen(false);
                      }}
                      className="px-2 py-1 text-[#E11D48] hover:bg-rose-50 rounded-md cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: Cancel (left) & Publish Coupon (right) */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full h-[50px] bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#0F172A] font-bold text-sm sm:text-base rounded-2xl transition duration-150 flex items-center justify-center cursor-pointer shadow-xs active:scale-[0.99]"
            >
              Cancel
            </button>

            {/* Publish Coupon Button with Plane icon */}
            <button
              type="submit"
              className="w-full h-[50px] bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] text-white font-bold text-sm sm:text-base rounded-2xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-500/25 active:scale-[0.99]"
            >
              <Plane size={18} className="text-white fill-white -rotate-45" />
              <span>Publish Coupon</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
