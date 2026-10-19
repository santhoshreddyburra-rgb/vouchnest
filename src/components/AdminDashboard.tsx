import React, { useState, useEffect } from 'react';
import {
  Tag,
  ShoppingBag,
  Gift,
  TrendingUp,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  RefreshCw,
  Search,
  ArrowLeft,
  Clock,
  Trash2,
  PlusCircle,
  Database,
  User as UserIcon,
} from 'lucide-react';
import { User, Coupon, ClaimRecord, Page } from '../types';
import { BrandLogo } from './BrandLogos';
import { AddCouponModal } from './AddCouponModal';

interface AdminDashboardProps {
  currentUser: User | null;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onNavigate,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'coupons' | 'sales'>('coupons');
  const [adminStats, setAdminStats] = useState({
    totalCoupons: 0,
    totalCouponsSold: 0,
    totalCouponsAvailable: 0,
    totalValueOfCouponsSold: 0,
    totalSellingRevenue: 0,
  });
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null);

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
      'x-user-role': currentUser?.role || 'admin',
    };
  };

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const headers = getAuthHeaders();

      // 1. Fetch Dynamic Admin Stats
      const statsRes = await fetch('/api/admin/stats', { headers });
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setAdminStats({
          totalCoupons: sData.totalCoupons ?? 0,
          totalCouponsSold: sData.totalCouponsSold ?? sData.totalClaimsCount ?? 0,
          totalCouponsAvailable: sData.totalCouponsAvailable ?? sData.activeCoupons ?? 0,
          totalValueOfCouponsSold: sData.totalValueOfCouponsSold ?? 0,
          totalSellingRevenue: sData.totalSellingRevenue ?? sData.totalRevenue ?? 0,
        });
      }

      // 2. Fetch All Platform Coupons
      const couponsRes = await fetch('/api/admin/coupons', { headers });
      if (couponsRes.ok) {
        const cData = await couponsRes.json();
        setCoupons(cData.coupons || []);
      }

      // 3. Fetch All Claims / Purchases
      const claimsRes = await fetch('/api/admin/claims', { headers });
      if (claimsRes.ok) {
        const clData = await claimsRes.json();
        setClaims(clData.claims || []);
      }
    } catch (err) {
      console.warn('Error fetching admin dashboard data:', err);
      showToast('Failed to load dashboard data.');
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
    showToast(`Copied ${code} to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    setDeletingCouponId(id);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        showToast(`Coupon ${code} removed.`);
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        setAdminStats((prev) => ({
          ...prev,
          totalCoupons: Math.max(0, prev.totalCoupons - 1),
          totalCouponsAvailable: Math.max(0, prev.totalCouponsAvailable - 1),
        }));
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
    if (!window.confirm('⚠️ Reset all coupons to zero?\n\nThis will remove all coupons, claims, and saved coupons from the Firebase Firestore database and set all dashboard metrics to 0.')) {
      return;
    }
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/admin/clear-all-coupons', {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        setCoupons([]);
        setClaims([]);
        setAdminStats({
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
    }
  };

  // Filter coupons based on search
  const filteredCoupons = coupons.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.brand.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.category && c.category.toLowerCase().includes(q))
    );
  });

  // Filter claims based on search
  const filteredClaims = claims.filter((cl) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      cl.brand.toLowerCase().includes(q) ||
      cl.couponTitle.toLowerCase().includes(q) ||
      cl.code.toLowerCase().includes(q) ||
      (cl.userName && cl.userName.toLowerCase().includes(q)) ||
      (cl.userEmail && cl.userEmail.toLowerCase().includes(q))
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

      {/* Top Banner Navigation Header */}
      <header className="bg-neutral-950 text-white border-b border-neutral-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-700 transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Store</span>
            </button>
            <div className="h-4 w-px bg-neutral-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="bg-[#D7131D] text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider">
                Admin Console
              </span>
              <span className="text-xs text-neutral-400 hidden md:inline">
                Live Platform Management & Analytics
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddCouponOpen(true)}
              className="inline-flex items-center gap-1.5 bg-[#D7131D] hover:bg-[#b00f17] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow transition cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>+Add Coupon</span>
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-700 transition cursor-pointer"
              title="View Admin Profile Details"
            >
              <UserIcon size={14} />
              <span>Admin Profile</span>
            </button>
            <button
              onClick={onLogout}
              className="text-xs text-neutral-400 hover:text-red-400 font-semibold px-2 py-1.5 rounded-lg hover:bg-neutral-900 transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Page Hero Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-neutral-200 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
                  Admin Dashboard & Statistics
                </h1>
                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 text-xs font-black uppercase px-3 py-1 rounded-full border border-amber-200">
                  👑 Master Administrator
                </span>
                <span className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 text-xs font-bold uppercase px-3 py-1 rounded-full border border-neutral-300">
                  <Lock size={12} /> View-Only Access
                </span>
              </div>
              <p className="text-sm text-neutral-600 max-w-3xl leading-relaxed">
                Dynamic platform control center. View unmasked coupon codes, track total inventory, and monitor user purchase transactions. Coupon redemption and claiming are disabled for Administrator accounts.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={fetchDashboardData}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 px-4 py-2.5 rounded-2xl shadow-xs transition cursor-pointer active:scale-95"
              >
                <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-[#D7131D]' : ''} />
                <span>{isRefreshing ? 'Updating Data...' : 'Refresh Live Data'}</span>
              </button>

              <button
                onClick={handleResetToZero}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2.5 rounded-2xl shadow-xs transition cursor-pointer active:scale-95"
                title="Reset all coupons and claims to zero in database"
              >
                <Trash2 size={15} />
                <span>Reset to Zero</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 5 DYNAMIC SUMMARY STATS CARDS                                */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp size={18} className="text-[#D7131D]" />
              Platform Summary Metrics
            </h2>
            <span className="text-xs text-neutral-500 font-medium">
              Calculated dynamically from live database
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* 1. Total number of coupons */}
            <div className="bg-white rounded-3xl p-5 border-2 border-neutral-200 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                  Total Coupons
                </span>
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 border border-neutral-200 flex items-center justify-center shrink-0">
                  <Tag size={18} />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-neutral-950">
                  {isLoading ? '...' : adminStats.totalCoupons}
                </div>
                <p className="text-[11px] text-neutral-500 font-semibold mt-1">
                  Total listings in system
                </p>
              </div>
            </div>

            {/* 2. Total coupons sold */}
            <div className="bg-white rounded-3xl p-5 border-2 border-neutral-200 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                  Coupons Sold
                </span>
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D7131D] border border-red-200 flex items-center justify-center shrink-0">
                  <ShoppingBag size={18} />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-[#D7131D]">
                  {isLoading ? '...' : adminStats.totalCouponsSold}
                </div>
                <p className="text-[11px] text-neutral-500 font-semibold mt-1">
                  Claimed & purchased by users
                </p>
              </div>
            </div>

            {/* 3. Total coupons available */}
            <div className="bg-white rounded-3xl p-5 border-2 border-neutral-200 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                  Coupons Available
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-emerald-600">
                  {isLoading ? '...' : adminStats.totalCouponsAvailable}
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  Active vouchers in stock
                </p>
              </div>
            </div>

            {/* 4. Total value of coupons sold */}
            <div className="bg-white rounded-3xl p-5 border-2 border-neutral-200 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                  Value of Sold
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
                  <Gift size={18} />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-neutral-950">
                  ₹{isLoading ? '...' : adminStats.totalValueOfCouponsSold.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-neutral-500 font-semibold mt-1">
                  Face value of sold coupons
                </p>
              </div>
            </div>

            {/* 5. Total selling / revenue value */}
            <div className="bg-white rounded-3xl p-5 border-2 border-neutral-200 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                  Selling Revenue
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-neutral-950">
                  ₹{isLoading ? '...' : adminStats.totalSellingRevenue.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  User checkout revenue
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TABS & DIRECTORY SECTION                                     */}
        {/* ============================================================ */}
        <div className="bg-white rounded-3xl border-2 border-neutral-200 shadow-xs overflow-hidden">
          {/* Tab Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 bg-neutral-50/70 p-3 gap-3">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('coupons')}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-extrabold text-sm sm:text-base transition cursor-pointer shrink-0 ${
                  activeTab === 'coupons'
                    ? 'bg-neutral-950 text-white shadow-md'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
                }`}
              >
                <Tag size={17} className={activeTab === 'coupons' ? 'text-[#D7131D]' : ''} />
                <span>All Platform Coupons & Codes</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeTab === 'coupons' ? 'bg-[#D7131D] text-white' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {coupons.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('sales')}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-extrabold text-sm sm:text-base transition cursor-pointer shrink-0 ${
                  activeTab === 'sales'
                    ? 'bg-neutral-950 text-white shadow-md'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
                }`}
              >
                <ShoppingBag size={17} className={activeTab === 'sales' ? 'text-[#D7131D]' : ''} />
                <span>Coupons Sold to Users Ledger</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeTab === 'sales' ? 'bg-[#D7131D] text-white' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {claims.length}
                </span>
              </button>
            </div>

            {/* Live Search Input */}
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder={activeTab === 'coupons' ? 'Search coupons or codes...' : 'Search sales by user or code...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2 bg-white border border-neutral-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:border-[#D7131D]"
              />
            </div>
          </div>

          {/* TAB 1: ALL PLATFORM COUPONS & UNMASKED CODES */}
          {activeTab === 'coupons' && (
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="text-xl font-black text-neutral-950 tracking-tight flex items-center gap-2">
                    <span>All Available Coupons & Coupon Codes</span>
                    <span className="text-xs font-bold uppercase bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-full border border-neutral-300">
                      View Only (Admin)
                    </span>
                  </h3>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Complete directory of all platform vouchers with unmasked coupon codes, values, selling prices, and live status.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddCouponOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#D7131D] hover:underline cursor-pointer self-start sm:self-auto"
                >
                  <PlusCircle size={15} />
                  <span>Create New Coupon</span>
                </button>
              </div>

              {filteredCoupons.length === 0 ? (
                <div className="py-16 text-center max-w-md mx-auto">
                  <Tag size={40} className="text-neutral-300 mx-auto mb-3" />
                  <h4 className="font-bold text-neutral-800 text-base">
                    {coupons.length === 0 ? 'No coupons in inventory (0 coupons)' : 'No coupons found'}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    {coupons.length === 0
                      ? 'All predefined coupons have been removed. Click below to add your own coupon to any brand.'
                      : searchQuery ? `No coupons matching "${searchQuery}".` : 'No coupons available in the store inventory.'}
                  </p>
                  <button
                    onClick={() => setIsAddCouponOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 bg-[#D7131D] text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#b00f17] transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <PlusCircle size={15} />
                    <span>Create First Coupon</span>
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
                          {/* Brand & Category Header */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-200 p-2 flex items-center justify-center shrink-0">
                                <BrandLogo brandKey={coupon.brand.toLowerCase()} className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                                  {coupon.brand}
                                </span>
                                <h4 className="font-extrabold text-neutral-900 text-base leading-snug">
                                  {coupon.title}
                                </h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
                                {coupon.status === 'active' || !coupon.status ? 'Active • Available' : coupon.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                                disabled={deletingCouponId === coupon.id}
                                title="Delete coupon"
                                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-neutral-600 text-xs sm:text-sm mb-3 line-clamp-2">
                            {coupon.description || `${coupon.discount} discount on ${coupon.brand}`}
                          </p>

                          {/* Pricing & Value Details */}
                          <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 mb-4 text-center">
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
                              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Min. Spend</span>
                              <span className="font-extrabold text-neutral-700 text-xs sm:text-sm">
                                ₹{coupon.minPurchaseAmount || '999'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Unmasked Coupon Code & Action Section */}
                        <div className="pt-3 border-t border-neutral-100">
                          <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                            <span className="inline-flex items-center gap-1 font-medium">
                              <Clock size={12} />
                              Expires: {coupon.expiryDate}
                            </span>
                            <span className="text-neutral-500 font-semibold text-[11px]">
                              Inventory: {coupon.inventory || 50} units
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Fully Unmasked Coupon Code Box */}
                            <div className="flex-1 bg-neutral-100/90 border-2 border-neutral-300 rounded-xl px-3 py-2 flex items-center justify-between font-mono font-bold text-sm tracking-wider text-neutral-900">
                              <span className="text-[#D7131D] font-black">{coupon.code}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(coupon.code)}
                                title="Copy Coupon Code"
                                className="text-neutral-600 hover:text-black cursor-pointer p-1 rounded-md hover:bg-neutral-200 transition-colors"
                              >
                                {isCopied ? <Check size={16} className="text-emerald-700" /> : <Copy size={16} />}
                              </button>
                            </div>

                            {/* Redemption Disabled for Admin */}
                            <div
                              title="Admins have view-only access. Claiming and redeeming are disabled for the Administrator role."
                              className="bg-neutral-100 text-neutral-500 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 shrink-0 flex items-center gap-1.5 cursor-not-allowed select-none"
                            >
                              <Lock size={14} className="text-neutral-400" />
                              <span>Claim Disabled (Admin)</span>
                            </div>
                          </div>

                          {isCopied && (
                            <p className="text-emerald-700 text-xs font-bold text-center mt-1.5">
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

          {/* TAB 2: COUPONS SOLD TO USERS LEDGER */}
          {activeTab === 'sales' && (
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="text-xl font-black text-neutral-950 tracking-tight">
                    Coupons Sold to Users Ledger
                  </h3>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Complete platform audit trail of discount vouchers purchased or claimed by users.
                  </p>
                </div>
              </div>

              {filteredClaims.length === 0 ? (
                <div className="py-16 text-center max-w-md mx-auto">
                  <ShoppingBag size={40} className="text-neutral-300 mx-auto mb-3" />
                  <h4 className="font-bold text-neutral-800 text-base">No transactions recorded</h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    {searchQuery ? `No sales matching "${searchQuery}".` : 'When users purchase or claim coupons, their transactions appear here.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden bg-white">
                  {filteredClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/70 transition"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-neutral-50 border border-neutral-200 p-2 flex items-center justify-center shrink-0">
                          <BrandLogo brandKey={claim.brand.toLowerCase()} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-neutral-900 text-base">
                              {claim.brand}
                            </span>
                            <span className="text-xs text-neutral-500">
                              • {claim.couponTitle}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>
                              Purchased by:{' '}
                              <strong className="text-neutral-800">{claim.userName || 'Member'}</strong> ({claim.userEmail})
                            </span>
                            <span>•</span>
                            <span>{new Date(claim.claimedAt).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                        <div className="bg-neutral-100 font-mono font-bold text-xs text-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-200 flex items-center gap-1.5">
                          <span>Code:</span>
                          <span className="text-[#D7131D]">{claim.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(claim.code)}
                            className="text-neutral-500 hover:text-black ml-1"
                            title="Copy code"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-neutral-900">
                            ₹{claim.sellingPrice}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            {claim.paymentMethod || 'UPI Instant'}
                          </div>
                        </div>
                        <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
                          {claim.status === 'redeemed' ? 'Redeemed' : 'Claimed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security & Firestore Integration Card */}
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
                  All coupon records, customer transactions, and inventory mutations are synchronized in real-time with Google Cloud Firestore and protected under Role-Based Access Control (RBAC).
                </p>
              </div>
            </div>

            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center justify-center gap-2 bg-[#D7131D] hover:bg-[#b00f17] text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg transition shrink-0 cursor-pointer"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Sync All Data</span>
            </button>
          </div>
        </div>
      </main>

      {/* Add Coupon Modal for Admin */}
      <AddCouponModal
        isOpen={isAddCouponOpen}
        onClose={() => setIsAddCouponOpen(false)}
        onSuccess={() => {
          setIsAddCouponOpen(false);
          fetchDashboardData();
          showToast('New coupon successfully created and added to store inventory!');
        }}
      />
    </div>
  );
};
