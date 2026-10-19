import React, { useState, useEffect } from 'react';
import {
  Tag,
  ShoppingBag,
  CheckCircle2,
  Gift,
  TrendingUp,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Plus,
  Clock,
  Lock,
  ArrowLeft,
  ChevronRight,
  Database,
  Crown,
  Search,
  Filter,
  CreditCard,
  User as UserIcon,
  Shield,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { User, Coupon, ClaimRecord, Page, CouponItem } from '../types';
import { BrandLogo } from './BrandLogos';
import { AddCouponModal } from './AddCouponModal';
import { VouchNestLogo, VouchNestMark } from './VouchNestLogo';
import { VouchNestReferenceBadge } from './VouchNestReferenceBadge';

interface AdminDashboardViewProps {
  currentUser: User | null;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  onNavigate,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'coupons' | 'claims'>('coupons');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Search & Filter States
  const [couponSearchQuery, setCouponSearchQuery] = useState('');
  const [couponCategoryFilter, setCouponCategoryFilter] = useState<'all' | 'Fashion' | 'Electronics' | 'Skin Care'>('all');
  const [claimsSearchQuery, setClaimsSearchQuery] = useState('');

  // Dynamic Data States
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [stats, setStats] = useState({
    totalCoupons: 0,
    totalCouponsSold: 0,
    totalCouponsAvailable: 0,
    totalValueOfCouponsSold: 0,
    totalSellingRevenue: 0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = currentUser?.token || localStorage.getItem('vouchnest_token') || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-user-email': currentUser?.email || 'santhoshreddyburra@gmail.com',
      'x-user-role': 'admin',
    };
  };

  // Re-calculate summary statistics dynamically from coupons and claims
  const recalculateStats = (couponsList: Coupon[], claimsList: ClaimRecord[]) => {
    const totalCoupons = couponsList.length;
    const totalCouponsSold = claimsList.length;
    const totalCouponsAvailable = couponsList.filter(
      (c) => c.status === 'active' && (c.inventory === undefined || c.inventory > 0)
    ).length;

    const totalValueOfCouponsSold = claimsList.reduce((acc, clm) => {
      const matched = couponsList.find((c) => c.id === clm.couponId);
      const faceVal = parseFloat(matched?.couponAmount || (clm as any).couponAmount || '500') || 0;
      return acc + faceVal;
    }, 0);

    const totalSellingRevenue = claimsList.reduce((acc, clm) => {
      return acc + (parseFloat(clm.sellingPrice) || 0);
    }, 0);

    setStats({
      totalCoupons,
      totalCouponsSold,
      totalCouponsAvailable,
      totalValueOfCouponsSold,
      totalSellingRevenue,
    });
  };

  // Fetch live admin metrics, all platform coupons with unmasked codes, and sold ledger
  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const headers = getAuthHeaders();

      // 1. Fetch live admin stats
      const statsPromise = fetch('/api/admin/stats', { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      // 2. Fetch all platform coupons with unmasked codes
      const couponsPromise = fetch('/api/admin/coupons', { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      // 3. Fetch coupons sold to users ledger
      const claimsPromise = fetch('/api/admin/claims', { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const [statsData, couponsData, claimsData] = await Promise.all([
        statsPromise,
        couponsPromise,
        claimsPromise,
      ]);

      const fetchedCoupons: Coupon[] = couponsData?.coupons || [];
      const fetchedClaims: ClaimRecord[] = claimsData?.claims || [];

      setCoupons(fetchedCoupons);
      setClaims(fetchedClaims);

      if (statsData) {
        setStats({
          totalCoupons: statsData.totalCoupons ?? fetchedCoupons.length,
          totalCouponsSold: statsData.totalCouponsSold ?? fetchedClaims.length,
          totalCouponsAvailable: statsData.totalCouponsAvailable ?? fetchedCoupons.filter((c) => c.status === 'active').length,
          totalValueOfCouponsSold: statsData.totalValueOfCouponsSold ?? 0,
          totalSellingRevenue: statsData.totalSellingRevenue ?? 0,
        });
      } else {
        recalculateStats(fetchedCoupons, fetchedClaims);
      }
    } catch (err) {
      console.warn('Error fetching admin dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Copied code "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${code}" from Firebase Firestore and the platform?`)) {
      return;
    }
    setDeletingCouponId(id);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        showToast(`Coupon "${code}" deleted successfully.`);
        const updatedCoupons = coupons.filter((c) => c.id !== id);
        setCoupons(updatedCoupons);
        recalculateStats(updatedCoupons, claims);
      } else {
        showToast('Failed to delete coupon.');
      }
    } catch {
      showToast('Error deleting coupon.');
    } finally {
      setDeletingCouponId(null);
    }
  };

  const handleResetToZero = async () => {
    if (!window.confirm('⚠️ Reset all coupons to zero?\\n\\nThis will remove all coupons, claims, and saved coupons from the Firebase Firestore database and set all dashboard metrics to 0.')) {
      return;
    }
    setIsResetting(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/admin/clear-all-coupons', {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        setCoupons([]);
        setClaims([]);
        setStats({
          totalCoupons: 0,
          totalCouponsSold: 0,
          totalCouponsAvailable: 0,
          totalValueOfCouponsSold: 0,
          totalSellingRevenue: 0,
        });
        showToast('All coupons removed from database. Dashboard reset to zero!');
      } else {
        showToast('Failed to reset coupons.');
      }
    } catch {
      showToast('Error resetting database.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleAddNewCoupon = async (newCouponItem: CouponItem) => {
    try {
      const headers = getAuthHeaders();
      const payload = {
        brand: newCouponItem.brand,
        code: newCouponItem.code,
        discount: newCouponItem.discount,
        discountType: newCouponItem.discountType || 'percent',
        title: newCouponItem.title,
        description: newCouponItem.description,
        expiryDate: newCouponItem.expiryDate,
        category: newCouponItem.category,
        couponAmount: newCouponItem.couponAmount || '500',
        sellingPrice: newCouponItem.sellingPrice || '49',
        minPurchaseAmount: newCouponItem.minPurchaseAmount || '999',
        inventory: newCouponItem.inventory || 50,
      };

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const createdCoupon: Coupon = data.coupon || {
          ...payload,
          id: 'cpn-' + Date.now(),
          status: 'active',
          totalClaims: 0,
        };
        const updatedCoupons = [createdCoupon, ...coupons];
        setCoupons(updatedCoupons);
        recalculateStats(updatedCoupons, claims);
        setIsAddCouponOpen(false);
        showToast(`🎉 New coupon "${createdCoupon.code}" created and stored in Firestore!`);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Failed to create coupon.');
      }
    } catch {
      showToast('Error adding new coupon.');
    }
  };

  // Filtered coupons list
  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      couponSearchQuery === '' ||
      c.brand.toLowerCase().includes(couponSearchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(couponSearchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(couponSearchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(couponSearchQuery.toLowerCase());

    const matchesCategory =
      couponCategoryFilter === 'all' ||
      c.category.toLowerCase() === couponCategoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Filtered sold claims list
  const filteredClaims = claims.filter((claim) => {
    if (!claimsSearchQuery) return true;
    const q = claimsSearchQuery.toLowerCase();
    return (
      claim.userEmail.toLowerCase().includes(q) ||
      (claim.userName && claim.userName.toLowerCase().includes(q)) ||
      claim.brand.toLowerCase().includes(q) ||
      claim.couponTitle.toLowerCase().includes(q) ||
      claim.code.toLowerCase().includes(q) ||
      (claim.transactionId && claim.transactionId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 pb-20 font-sans selection:bg-[#D7131D] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-neutral-950 text-white border-2 border-[#D7131D] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top OS Window Chrome Bar */}
      <div className="bg-[#ECECED] text-neutral-800 border-b border-neutral-300 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E] inline-block shadow-xs" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123] inline-block shadow-xs" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29] inline-block shadow-xs" />
            <span className="ml-2 text-[11px] font-bold text-neutral-600 hidden sm:inline">
              VouchNest Administrator Console
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-neutral-600 font-medium hidden sm:inline">
              Admin: <strong className="text-neutral-900">{currentUser?.fullName || currentUser?.username}</strong>
              <button
                onClick={onLogout}
                className="ml-2 text-[#D7131D] hover:underline font-bold cursor-pointer"
              >
                Logout
              </button>
            </span>
            <VouchNestReferenceBadge height={26} onClick={() => onNavigate('home')} />
          </div>
        </div>
      </div>

      {/* Sticky Top Header Navigation */}
      <header className="bg-neutral-950 text-white border-b border-neutral-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Left: Brand + Breadcrumbs */}
          <div className="flex items-center gap-4">
            <div
              className="cursor-pointer hover:opacity-90 transition flex items-center"
              onClick={() => onNavigate('home')}
              title="VouchNest Marketplace"
            >
              <VouchNestMark size={34} variant="dark" />
            </div>

            <div className="hidden sm:block h-6 w-px bg-neutral-800" />

            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <button
                onClick={() => onNavigate('home')}
                className="text-neutral-400 hover:text-white transition font-medium flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Marketplace</span>
              </button>
              <ChevronRight size={12} className="text-neutral-600" />
              <div className="flex items-center gap-1.5 font-black text-white bg-red-950/60 border border-red-800/60 px-3 py-1 rounded-xl">
                <Crown size={14} className="text-[#D7131D]" />
                <span>Admin Dashboard</span>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Database Sync Status Badge */}
            <div className="hidden md:inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Firebase Firestore Synced</span>
            </div>

            {/* + Add Coupon Button */}
            <button
              onClick={() => setIsAddCouponOpen(true)}
              className="inline-flex items-center gap-1.5 bg-[#D7131D] hover:bg-[#b00f17] text-white text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 rounded-xl shadow-md transition cursor-pointer active:scale-95"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">+Add Coupon</span>
              <span className="sm:hidden">Add</span>
            </button>

            {/* Refresh Live Data */}
            <button
              onClick={fetchDashboardData}
              disabled={isRefreshing}
              title="Refresh live data from Firestore"
              className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#D7131D]' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Reset to Zero Button */}
            <button
              onClick={handleResetToZero}
              disabled={isResetting}
              title="Reset all coupons and claims to zero in database"
              className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-red-950/80 text-red-400 hover:text-red-300 border border-red-900/60 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">{isResetting ? 'Resetting...' : 'Reset to Zero'}</span>
            </button>

            {/* Profile Link */}
            <button
              onClick={() => onNavigate('profile')}
              title="View Administrator Profile"
              className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <UserIcon size={14} />
              <span className="hidden sm:inline">My Profile</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border-2 border-neutral-200 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-[#D7131D] text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border border-red-200 flex items-center gap-1">
                <Shield size={12} />
                Administrator Control Center
              </span>
              <span className="text-xs text-neutral-400">• Live Production Metrics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight flex items-center gap-2.5">
              <span>Admin Dashboard & Summary Statistics</span>
            </h1>
            <p className="text-neutral-500 text-xs sm:text-sm max-w-2xl">
              Dynamically calculates platform statistics across all platform coupons, inventories, and user purchase redemptions. Full unmasked codes and sales transaction logs are managed below.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <button
              onClick={() => setIsAddCouponOpen(true)}
              className="inline-flex items-center gap-2 bg-neutral-950 hover:bg-neutral-800 text-white font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow transition cursor-pointer"
            >
              <Plus size={16} className="text-[#D7131D]" />
              <span>Create New Voucher</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* DYNAMIC SUMMARY STATISTICS (5 MANDATORY METRICS)             */}
        {/* ============================================================ */}
        <section aria-label="Dynamic Admin Summary Statistics" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight flex items-center gap-2">
              <TrendingUp size={20} className="text-[#D7131D]" />
              <span>Real-Time Platform Summary Metrics</span>
            </h2>
            <span className="text-xs text-neutral-500 font-medium">
              Synchronized with Firebase Firestore
            </span>
          </div>

          {/* 5 Dynamic Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Metric 1: Total number of coupons */}
            <div className="bg-white rounded-3xl p-5 border-2 border-neutral-200 hover:border-neutral-400 shadow-xs flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                  Total Coupons
                </span>
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 border border-neutral-200 flex items-center justify-center shrink-0">
                  <Tag size={18} />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-neutral-950 tracking-tight">
                  {stats.totalCoupons}
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 font-semibold mt-1">
                  <span>Total listings on platform</span>
                  <span className="text-neutral-700 font-bold">{coupons.length} vouchers</span>
                </div>
              </div>
            </div>

            {/* Metric 2: Total coupons sold */}
            <div className="bg-white rounded-3xl p-5 border-2 border-neutral-200 hover:border-red-300 shadow-xs flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                  Coupons Sold
                </span>
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D7131D] border border-red-200 flex items-center justify-center shrink-0">
                  <ShoppingBag size={18} />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-[#D7131D] tracking-tight">
                  {stats.totalCouponsSold}
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 font-semibold mt-1">
                  <span>Purchased by users</span>
                  <span className="text-[#D7131D] font-bold">{claims.length} claims</span>
                </div>
              </div>
            </div>

            {/* Metric 3: Total coupons available */}
            <div className="bg-white rounded-3xl p-5 border-2 border-neutral-200 hover:border-emerald-300 shadow-xs flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                  Coupons Available
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-emerald-600 tracking-tight">
                  {stats.totalCouponsAvailable}
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-700 font-semibold mt-1">
                  <span>Active in stock</span>
                  <span className="text-emerald-800 font-bold">Ready to claim</span>
                </div>
              </div>
            </div>

            {/* Metric 4: Total value of coupons sold */}
            <div className="bg-white rounded-3xl p-5 border-2 border-neutral-200 hover:border-purple-300 shadow-xs flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                  Value of Sold
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
                  <Gift size={18} />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
                  ₹{stats.totalValueOfCouponsSold.toLocaleString('en-IN')}
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 font-semibold mt-1">
                  <span>Face value of sold</span>
                  <span className="text-purple-700 font-bold">Vouchers</span>
                </div>
              </div>
            </div>

            {/* Metric 5: Total selling / revenue value */}
            <div className="bg-white rounded-3xl p-5 border-2 border-neutral-200 hover:border-amber-300 shadow-xs flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                  Selling Revenue
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
                  ₹{stats.totalSellingRevenue.toLocaleString('en-IN')}
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-700 font-semibold mt-1">
                  <span>Collected revenue</span>
                  <span className="text-emerald-800 font-bold">100% Real</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* FULL TABS: ALL PLATFORM COUPONS & SOLD LEDGER                */}
        {/* ============================================================ */}
        <section aria-label="Admin Data Management Tabs" className="bg-white rounded-3xl border-2 border-neutral-200 shadow-xs overflow-hidden">
          {/* Tab Navigation Header */}
          <div className="flex border-b border-neutral-200 bg-neutral-50/80 p-2 gap-2 sm:gap-4 overflow-x-auto">
            {/* Tab 1 Button */}
            <button
              onClick={() => setActiveTab('coupons')}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base transition cursor-pointer shrink-0 ${
                activeTab === 'coupons'
                  ? 'bg-neutral-950 text-white shadow-md'
                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60'
              }`}
            >
              <Tag size={18} className={activeTab === 'coupons' ? 'text-[#D7131D]' : ''} />
              <span>All Platform Coupons & Codes</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'coupons' ? 'bg-[#D7131D] text-white' : 'bg-neutral-200 text-neutral-800'
                }`}
              >
                {coupons.length}
              </span>
            </button>

            {/* Tab 2 Button */}
            <button
              onClick={() => setActiveTab('claims')}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base transition cursor-pointer shrink-0 ${
                activeTab === 'claims'
                  ? 'bg-neutral-950 text-white shadow-md'
                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60'
              }`}
            >
              <ShoppingBag size={18} className={activeTab === 'claims' ? 'text-[#D7131D]' : ''} />
              <span>Coupons Sold to Users Ledger</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'claims' ? 'bg-[#D7131D] text-white' : 'bg-neutral-200 text-neutral-800'
                }`}
              >
                {claims.length}
              </span>
            </button>
          </div>

          {/* ============================================================ */}
          {/* TAB 1: ALL PLATFORM COUPONS & UNMASKED CODES                 */}
          {/* ============================================================ */}
          {activeTab === 'coupons' && (
            <div className="p-6 sm:p-8 space-y-6">
              {/* Controls bar: search, category filters, and Add button */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="text-xl font-black text-neutral-950 tracking-tight flex items-center gap-2">
                    <span>All Platform Coupons & Codes</span>
                    <span className="text-xs font-bold uppercase bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-full border border-neutral-300">
                      Unmasked Codes (Admin)
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                    View, copy, and manage every coupon code published across the entire VouchNest platform.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Input */}
                  <div className="relative min-w-[220px]">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search coupon, brand, code..."
                      value={couponSearchQuery}
                      onChange={(e) => setCouponSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#D7131D] focus:bg-white transition"
                    />
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl text-xs font-bold">
                    {(['all', 'Fashion', 'Electronics', 'Skin Care'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCouponCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                          couponCategoryFilter === cat
                            ? 'bg-white text-neutral-950 shadow-2xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        {cat === 'all' ? 'All' : cat}
                      </button>
                    ))}
                  </div>

                  {/* Add Coupon Button */}
                  <button
                    onClick={() => setIsAddCouponOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-[#D7131D] hover:bg-[#b00f17] text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>+Add Coupon</span>
                  </button>
                </div>
              </div>

              {/* Coupons List */}
              {filteredCoupons.length === 0 ? (
                <div className="py-16 text-center max-w-md mx-auto">
                  <Tag size={40} className="text-neutral-300 mx-auto mb-3" />
                  <h4 className="font-bold text-neutral-800 text-base">
                    {coupons.length === 0 ? 'No coupons in inventory (0 coupons)' : 'No coupons match your filter'}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    {coupons.length === 0
                      ? 'All predefined coupons have been removed. Click below to add your own coupon to any brand.'
                      : 'Try clearing your search query or add a new coupon to inventory.'}
                  </p>
                  <button
                    onClick={() => setIsAddCouponOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 bg-[#D7131D] text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#b00f17] transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <Plus size={15} />
                    <span>Add New Coupon</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredCoupons.map((coupon) => {
                    const isCopied = copiedCode === coupon.code;
                    return (
                      <div
                        key={coupon.id}
                        className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-neutral-400 p-5 transition-all flex flex-col justify-between shadow-2xs"
                      >
                        <div>
                          {/* Header: Brand, Title, Status & Actions */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-200 p-2 flex items-center justify-center shrink-0">
                                <BrandLogo brandKey={coupon.brand.toLowerCase()} className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                                  {coupon.brand} • {coupon.category}
                                </span>
                                <h4 className="font-extrabold text-neutral-900 text-base leading-snug">
                                  {coupon.title}
                                </h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
                                {coupon.status === 'active' || !coupon.status ? 'Active • In Stock' : coupon.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                                disabled={deletingCouponId === coupon.id}
                                title="Delete coupon from Firestore"
                                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-neutral-600 text-xs sm:text-sm mb-3 line-clamp-2">
                            {coupon.description || `${coupon.discount} discount on ${coupon.brand}`}
                          </p>

                          {/* Pricing & Financial Attributes */}
                          <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-100 mb-4 text-center">
                            <div>
                              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Coupon Value</span>
                              <span className="font-extrabold text-neutral-900 text-xs sm:text-sm">
                                ₹{coupon.couponAmount || '500'}
                              </span>
                            </div>
                            <div className="border-x border-neutral-200">
                              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Selling Price</span>
                              <span className="font-extrabold text-[#D7131D] text-xs sm:text-sm">
                                ₹{coupon.sellingPrice || '49'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Min Spend</span>
                              <span className="font-extrabold text-neutral-700 text-xs sm:text-sm">
                                ₹{coupon.minPurchaseAmount || '999'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Unmasked Coupon Code & Admin Action Row */}
                        <div className="pt-3 border-t border-neutral-100">
                          <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                            <span className="inline-flex items-center gap-1 font-medium">
                              <Clock size={12} />
                              Expires: {coupon.expiryDate}
                            </span>
                            <span className="text-neutral-600 font-semibold text-[11px]">
                              Stock: {coupon.inventory || 50} units
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Unmasked Coupon Code Display with Copy Button */}
                            <div className="flex-1 bg-neutral-100 border-2 border-neutral-300 rounded-xl px-3 py-2 flex items-center justify-between font-mono font-bold text-sm tracking-wider text-neutral-900 shadow-2xs">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-sans font-bold text-neutral-500 uppercase">CODE:</span>
                                <span className="text-[#D7131D] font-black">{coupon.code}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(coupon.code)}
                                title="Copy unmasked coupon code"
                                className="text-neutral-600 hover:text-black cursor-pointer p-1 rounded-md hover:bg-neutral-200 transition-colors"
                              >
                                {isCopied ? <Check size={16} className="text-emerald-700" /> : <Copy size={16} />}
                              </button>
                            </div>

                            {/* View Only / Claim Disabled Badge for Admin */}
                            <div
                              title="Admins have view-only access. Claiming and redeeming are disabled for the Administrator role."
                              className="bg-neutral-100 text-neutral-500 font-bold text-xs px-3 py-2.5 rounded-xl border border-neutral-300 shrink-0 flex items-center gap-1.5 cursor-not-allowed select-none"
                            >
                              <Lock size={13} className="text-neutral-400" />
                              <span className="hidden sm:inline">Claim Disabled (Admin)</span>
                              <span className="sm:hidden">Disabled</span>
                            </div>
                          </div>

                          {isCopied && (
                            <p className="text-emerald-700 text-xs font-bold text-center mt-1.5 animate-in fade-in duration-100">
                              Code {coupon.code} copied to clipboard!
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: COUPONS SOLD TO USERS LEDGER                         */}
          {/* ============================================================ */}
          {activeTab === 'claims' && (
            <div className="p-6 sm:p-8 space-y-6">
              {/* Header & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="text-xl font-black text-neutral-950 tracking-tight flex items-center gap-2">
                    <span>Coupons Sold to Users Ledger</span>
                    <span className="text-xs font-bold uppercase bg-red-100 text-[#D7131D] px-2.5 py-0.5 rounded-full border border-red-200">
                      Purchases Ledger
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                    Real-time transaction tracking of every voucher purchase made across the platform with customer details, unmasked code, and payment method.
                  </p>
                </div>

                <div className="relative min-w-[260px]">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search buyer email, brand, code, txn..."
                    value={claimsSearchQuery}
                    onChange={(e) => setClaimsSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#D7131D] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Claims Ledger Records */}
              {filteredClaims.length === 0 ? (
                <div className="py-16 text-center max-w-md mx-auto">
                  <ShoppingBag size={40} className="text-neutral-300 mx-auto mb-3" />
                  <h4 className="font-bold text-neutral-800 text-base">No sold coupons recorded</h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    When users claim or purchase discount coupons in the store, they will automatically appear in this ledger.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  {filteredClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-neutral-50/80 transition"
                    >
                      {/* Left: Brand + Deal + Buyer info */}
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-200 p-2 flex items-center justify-center shrink-0">
                          <BrandLogo brandKey={claim.brand.toLowerCase()} className="w-full h-full object-contain" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-neutral-900 text-base">
                              {claim.brand}
                            </span>
                            <span className="text-xs font-semibold text-neutral-600">
                              • {claim.couponTitle}
                            </span>
                          </div>

                          <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1 font-semibold text-neutral-800">
                              <UserIcon size={12} className="text-neutral-400" />
                              <span>{claim.userName || 'Member'}</span>
                            </span>
                            <span>•</span>
                            <span className="font-medium text-neutral-600">{claim.userEmail}</span>
                            <span>•</span>
                            <span className="text-neutral-400">{new Date(claim.claimedAt).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Unmasked Code, Paid Price, Payment Method & Status */}
                      <div className="flex items-center gap-3 shrink-0 self-end lg:self-auto flex-wrap">
                        {/* Unmasked Code */}
                        <div className="bg-neutral-100 font-mono font-bold text-xs text-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-200 flex items-center gap-1.5">
                          <span className="text-neutral-400 font-sans text-[10px]">CODE:</span>
                          <span className="text-[#D7131D] font-extrabold">{claim.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(claim.code)}
                            title="Copy code"
                            className="text-neutral-500 hover:text-neutral-900 ml-1 cursor-pointer"
                          >
                            <Copy size={13} />
                          </button>
                        </div>

                        {/* Revenue & Payment */}
                        <div className="text-right">
                          <div className="text-xs font-extrabold text-neutral-900">
                            ₹{claim.sellingPrice}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                            <CreditCard size={10} />
                            <span>{claim.paymentMethod || 'UPI Instant'}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                            claim.status === 'redeemed'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {claim.status === 'redeemed' ? 'Redeemed' : 'Claimed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Security & Firestore Integration Info Card */}
        <div className="bg-neutral-950 text-white rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-[#D7131D] shrink-0">
                <Database size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-extrabold text-base sm:text-lg">
                    Real-time Firebase Firestore Persistence
                  </h3>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Active
                  </span>
                </div>
                <p className="text-neutral-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  All platform coupons, sales claims, user purchases, and revenue metrics are securely stored in Firebase Firestore and safeguarded by server-enforced Role-Based Access Control (RBAC).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onNavigate('profile')}
                className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl border border-neutral-700 transition cursor-pointer"
              >
                <UserIcon size={15} />
                <span>My Admin Profile</span>
              </button>
              <button
                onClick={() => onNavigate('home')}
                className="inline-flex items-center gap-2 bg-[#D7131D] hover:bg-[#b00f17] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow transition cursor-pointer"
              >
                <span>Marketplace</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Add Coupon Modal */}
      {isAddCouponOpen && (
        <AddCouponModal
          isOpen={isAddCouponOpen}
          onClose={() => setIsAddCouponOpen(false)}
          onAddCoupon={handleAddNewCoupon}
        />
      )}
    </div>
  );
};
