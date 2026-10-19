import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  Tag,
  Copy,
  Check,
  Calendar,
  CreditCard,
  Heart,
  Edit3,
  LogOut,
  ArrowLeft,
  Sparkles,
  Database,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  ChevronRight,
  ShoppingBag,
  Award,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { User, Page, ClaimRecord, Coupon } from '../types';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface UserProfilePageProps {
  currentUser: User | null;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  onOpenAddCoupon?: () => void;
  onOpenCart?: () => void;
  cartCount?: number;
}

export function UserProfilePage({
  currentUser,
  onNavigate,
  onLogout,
  onOpenAddCoupon = () => {},
  onOpenCart = () => {},
  cartCount = 0,
}: UserProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'redeemed' | 'saved' | 'details'>('redeemed');
  const [profileData, setProfileData] = useState<User | null>(currentUser);
  const [redeemedCoupons, setRedeemedCoupons] = useState<ClaimRecord[]>([]);
  const [savedCoupons, setSavedCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState({
    totalRedeemed: 0,
    totalSavedCount: 0,
    estimatedSavings: 0,
    activeVouchers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: currentUser?.fullName || currentUser?.username || '',
    phone: currentUser?.phone || '',
    age: currentUser?.age || 20,
  });
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = currentUser?.token || localStorage.getItem('vouchnest_token');
      const res = await fetch('/api/user/profile', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-user-email': currentUser?.email || 'santhoshreddyburra@gmail.com',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProfileData(data.user);
        setRedeemedCoupons(data.redeemedCoupons || []);
        setSavedCoupons(data.savedCoupons || []);
        if (data.stats) {
          setStats(data.stats);
        }
        setEditForm({
          fullName: data.user.fullName || data.user.username || '',
          phone: data.user.phone || '',
          age: data.user.age || 20,
        });
      }
    } catch (err) {
      console.warn('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const token = currentUser?.token || localStorage.getItem('vouchnest_token');
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-user-email': currentUser?.email || 'santhoshreddyburra@gmail.com',
        },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const data = await res.json();
        setProfileData(data.user);
        setIsEditing(false);
        setSaveSuccess('Profile updated and saved to Firebase Firestore!');
        setTimeout(() => setSaveSuccess(null), 3500);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to update profile');
      }
    } catch {
      setErrorMsg('Network error while saving profile');
    }
  };

  const handleRemoveSaved = async (couponId: string) => {
    try {
      const token = currentUser?.token || localStorage.getItem('vouchnest_token');
      await fetch(`/api/user/saved-coupons/${couponId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-user-email': currentUser?.email || 'santhoshreddyburra@gmail.com',
        },
      });
      setSavedCoupons((prev) => prev.filter((c) => c.id !== couponId));
      setStats((prev) => ({ ...prev, totalSavedCount: Math.max(0, prev.totalSavedCount - 1) }));
    } catch (err) {
      console.warn('Failed to remove saved coupon:', err);
    }
  };

  const userInitial = (profileData?.fullName || profileData?.username || 'U')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenAddCoupon={onOpenAddCoupon}
        onOpenCart={onOpenCart}
        cartCount={cartCount}
        onNavigate={onNavigate}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Marketplace</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Firestore DB: Connected</span>
          </div>
        </div>

        {/* Profile Header Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl p-6 sm:p-8 mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D7131D]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#D7131D] to-[#990000] border-2 border-white/20 flex items-center justify-center text-white text-3xl font-black shadow-lg overflow-hidden">
                  {profileData?.avatar ? (
                    <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    userInitial
                  )}
                </div>
                {profileData?.role === 'admin' ? (
                  <span className="absolute -bottom-2 -right-2 bg-amber-500 text-neutral-950 p-1.5 rounded-full shadow-md title='Master Admin'">
                    <ShieldCheck size={16} className="stroke-[2.5]" />
                  </span>
                ) : (
                  <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-neutral-950 p-1.5 rounded-full shadow-md title='Verified Member'">
                    <Award size={16} className="stroke-[2.5]" />
                  </span>
                )}
              </div>

              {/* User Bio */}
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {profileData?.fullName || profileData?.username || 'User Profile'}
                  </h1>
                  <span
                    className={`text-xs uppercase font-extrabold px-3 py-0.5 rounded-full border ${
                      profileData?.role === 'admin'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                    }`}
                  >
                    {profileData?.role === 'admin' ? 'Master Admin' : 'Customer'}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <UserIcon size={14} className="text-[#D7131D]" />
                    <span>@{profileData?.username}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} className="text-[#D7131D]" />
                    <span>{profileData?.email}</span>
                  </span>
                  {profileData?.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={14} className="text-[#D7131D]" />
                      <span>{profileData?.phone}</span>
                    </span>
                  )}
                  {profileData?.age && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-[#D7131D]" />
                      <span>{profileData?.age} yrs old</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer border border-neutral-700"
              >
                <Edit3 size={15} />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
              </button>

              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-xl bg-[#D7131D]/15 hover:bg-[#D7131D]/25 text-[#ff4d58] border border-[#D7131D]/30 font-semibold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Edit Profile Form Modal / Inline Drawer */}
          {isEditing && (
            <div className="mt-6 pt-6 border-t border-neutral-800">
              <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Edit3 size={16} className="text-[#D7131D]" />
                Update Profile in Firebase Firestore
              </h2>
              <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D7131D]"
                    placeholder="Your Full Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Mobile / Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D7131D]"
                    placeholder="e.g. 7569806640"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Age</label>
                  <input
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D7131D]"
                    placeholder="20"
                    min="12"
                    max="100"
                  />
                </div>
                <div className="sm:col-span-3 flex justify-end gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[#D7131D] hover:bg-[#b00f17] text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    Save Changes to Database
                  </button>
                </div>
              </form>
            </div>
          )}

          {saveSuccess && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <Check size={16} />
              <span>{saveSuccess}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* 4 Metric Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Redeemed Deals</span>
              <div className="w-8 h-8 rounded-lg bg-[#D7131D]/15 text-[#D7131D] flex items-center justify-center">
                <Tag size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalRedeemed}</div>
            <p className="text-[11px] text-neutral-500 mt-1">Unlocked & ready vouchers</p>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Savings</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Sparkles size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              ₹{stats.estimatedSavings.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Estimated savings across claims</p>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Saved Wishlist</span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <Heart size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">{savedCoupons.length}</div>
            <p className="text-[11px] text-neutral-500 mt-1">Bookmarked brand deals</p>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Account Role</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white capitalize">
              {profileData?.role === 'admin' ? 'Admin' : 'Member'}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Zero-Trust Protected</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-neutral-800 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('redeemed')}
            className={`pb-3 px-4 text-sm font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === 'redeemed'
                ? 'border-[#D7131D] text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Tag size={16} className={activeTab === 'redeemed' ? 'text-[#D7131D]' : ''} />
            <span>Redeemed Coupons</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-neutral-800 text-neutral-300 font-semibold">
              {redeemedCoupons.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-3 px-4 text-sm font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === 'saved'
                ? 'border-[#D7131D] text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Heart size={16} className={activeTab === 'saved' ? 'text-[#D7131D]' : ''} />
            <span>Saved Coupons</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-neutral-800 text-neutral-300 font-semibold">
              {savedCoupons.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 px-4 text-sm font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === 'details'
                ? 'border-[#D7131D] text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <UserIcon size={16} className={activeTab === 'details' ? 'text-[#D7131D]' : ''} />
            <span>Account Details</span>
          </button>
        </div>

        {/* Tab Content 1: REDEEMED COUPONS HISTORY */}
        {activeTab === 'redeemed' && (
          <div>
            {loading ? (
              <div className="py-16 text-center text-neutral-400 flex flex-col items-center">
                <RefreshCw size={24} className="animate-spin text-[#D7131D] mb-3" />
                <span>Loading your redeemed vouchers from database...</span>
              </div>
            ) : redeemedCoupons.length === 0 ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 mx-auto flex items-center justify-center text-neutral-500 mb-4">
                  <Tag size={28} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No Redeemed Coupons Yet</h3>
                <p className="text-sm text-neutral-400 max-w-md mx-auto mb-6">
                  You haven't unlocked any coupon codes yet. Browse top brands like Nike, Puma, Apple, and Starbucks to unlock exclusive deals.
                </p>
                <button
                  onClick={() => onNavigate('home')}
                  className="px-6 py-2.5 rounded-xl bg-[#D7131D] hover:bg-[#b00f17] text-white font-bold text-sm transition shadow-lg inline-flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingBag size={16} />
                  <span>Explore Brand Deals</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {redeemedCoupons.map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 sm:p-6 transition shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    {/* Coupon Identity */}
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[#D7131D]/15 border border-[#D7131D]/30 flex flex-col items-center justify-center text-[#D7131D] shrink-0 font-black">
                        <span className="text-xs uppercase">{claim.brand?.substring(0, 3)}</span>
                        <Tag size={16} className="mt-0.5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#D7131D] uppercase tracking-wider">
                            {claim.brand}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/30 text-emerald-400">
                            {claim.discount || 'Special Discount'}
                          </span>
                          <span className="text-xs text-neutral-500">
                            ID: {claim.transactionId || claim.id}
                          </span>
                        </div>

                        <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                          {claim.couponTitle || `${claim.brand} Voucher`}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} className="text-neutral-500" />
                            Redeemed on {new Date(claim.claimedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard size={13} className="text-neutral-500" />
                            Paid: ₹{claim.sellingPrice} ({claim.paymentMethod || 'UPI'})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Unlocked Code Box */}
                    <div className="flex sm:items-center justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-800">
                      {(() => {
                        const cleanCode =
                          claim.code && !claim.code.includes('•')
                            ? claim.code
                            : `${claim.brand.toUpperCase().replace(/[^A-Z0-9]/g, '')}SPECIAL`;
                        return (
                          <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl px-4 py-2.5 flex items-center gap-3">
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                                Promo Code
                              </span>
                              <span className="font-mono text-base font-black text-amber-300 tracking-wider select-all">
                                {cleanCode}
                              </span>
                            </div>

                            <button
                              onClick={() => handleCopyCode(claim.id, cleanCode)}
                              className={`p-2 rounded-lg transition cursor-pointer ${
                                copiedCodeId === claim.id
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white'
                              }`}
                              title="Copy Promo Code"
                            >
                              {copiedCodeId === claim.id ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                          </div>
                        );
                      })()}

                      <button
                        onClick={() => {
                          const cleanCode =
                            claim.code && !claim.code.includes('•')
                              ? claim.code
                              : `${claim.brand.toUpperCase().replace(/[^A-Z0-9]/g, '')}SPECIAL`;
                          handleCopyCode(claim.id, cleanCode);
                          alert(`Promo code "${cleanCode}" copied! Apply at checkout on ${claim.brand}.`);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs sm:text-sm transition shrink-0 cursor-pointer"
                      >
                        Use Deal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: SAVED COUPONS (WISHLIST) */}
        {activeTab === 'saved' && (
          <div>
            {savedCoupons.length === 0 ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 mx-auto flex items-center justify-center text-neutral-500 mb-4">
                  <Heart size={28} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Your Wishlist is Empty</h3>
                <p className="text-sm text-neutral-400 max-w-md mx-auto mb-6">
                  Save your favorite vouchers to easily find and unlock them later when you're ready to shop.
                </p>
                <button
                  onClick={() => onNavigate('home')}
                  className="px-6 py-2.5 rounded-xl bg-[#D7131D] hover:bg-[#b00f17] text-white font-bold text-sm transition shadow-lg inline-flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingBag size={16} />
                  <span>Browse Deals</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedCoupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 transition shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#D7131D] uppercase tracking-wider">
                          {coupon.brand}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300">
                          {coupon.category}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white mb-1.5">{coupon.title}</h4>
                      <p className="text-xs text-neutral-400 line-clamp-2 mb-4">{coupon.description}</p>
                    </div>

                    <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-neutral-500 block">Unlock Price</span>
                        <span className="text-sm font-black text-emerald-400">
                          ₹{coupon.sellingPrice || '49'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRemoveSaved(coupon.id)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 text-xs font-semibold transition"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => onNavigate('home')}
                          className="px-4 py-1.5 rounded-lg bg-[#D7131D] hover:bg-[#b00f17] text-white text-xs font-bold transition flex items-center gap-1"
                        >
                          <span>Unlock</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: ACCOUNT & SECURITY DETAILS */}
        {activeTab === 'details' && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Database size={20} className="text-[#D7131D]" />
              Firebase Database & Identity Record
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-xs font-medium text-neutral-500 block mb-1">User Record ID</span>
                <span className="font-mono text-sm text-neutral-200">{profileData?.id || 'usr-master'}</span>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-xs font-medium text-neutral-500 block mb-1">Firestore Database ID</span>
                <span className="font-mono text-xs text-emerald-400 break-all">
                  ai-studio-remixvouchnest-7ee09842-48e1-40c1-b165-6f4eafab9dfd
                </span>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-xs font-medium text-neutral-500 block mb-1">System Role</span>
                <span className="font-semibold text-sm text-white capitalize">
                  {profileData?.role} ({profileData?.role === 'admin' ? 'Unrestricted Admin' : 'Customer Account'})
                </span>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-xs font-medium text-neutral-500 block mb-1">Password Encryption</span>
                <span className="font-mono text-xs text-neutral-300">
                  PBKDF2 / SHA-256 with Cryptographic Salt
                </span>
              </div>
            </div>

            {profileData?.role === 'admin' && (
              <div className="p-5 rounded-xl bg-[#D7131D]/10 border border-[#D7131D]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Administrator Actions</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    You have verified full access to create, edit, and delete coupons across all brands.
                  </p>
                </div>

                <button
                  onClick={() => {
                    onOpenAddCoupon();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#D7131D] hover:bg-[#b00f17] text-white text-xs font-bold transition shrink-0 flex items-center gap-1.5"
                >
                  <Tag size={14} />
                  <span>+Add New Coupon</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
