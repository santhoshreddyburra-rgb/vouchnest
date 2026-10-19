import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShieldCheck,
  Crown,
  Tag,
  Bookmark,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  CreditCard,
  ExternalLink,
  Trash2,
  Edit3,
  Save,
  X,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Database,
  RefreshCw,
  ShoppingBag,
  Gift,
  Lock,
  ChevronRight,
  AlertCircle,
  Layers,
  Camera,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { User, ClaimRecord, SavedCouponRecord, Page, Coupon } from '../types';
import { BrandLogo } from './BrandLogos';
import { BrandCouponData } from '../data/brandCouponsData';
import { CouponPaymentModal } from './CouponPaymentModal';

interface UserProfileViewProps {
  currentUser: User | null;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  onUpdateCurrentUser?: (user: User) => void;
  initialTab?: 'redeemed' | 'saved' | 'overview';
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  onNavigate,
  onLogout,
  onUpdateCurrentUser,
  initialTab = 'redeemed',
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'redeemed' | 'saved' | 'overview'>(initialTab);
  const [claims, setClaims] = useState<ClaimRecord[]>(() => {
    try {
      const savedUserClaims = localStorage.getItem('vouchnest_user_claims');
      if (savedUserClaims) return JSON.parse(savedUserClaims);
      const savedDeals = localStorage.getItem('vouchnest_claimed_deals');
      if (savedDeals) {
        const deals: any[] = JSON.parse(savedDeals);
        return deals.map((d) => ({
          id: `clm-${d.id}`,
          couponId: d.id,
          couponTitle: d.terms || `${d.name} Voucher`,
          brand: d.name,
          discount: d.discount,
          code: d.code && !d.code.includes('•') ? d.code : `${d.name.toUpperCase()}SPECIAL`,
          userId: currentUser?.id || 'usr-local',
          userEmail: currentUser?.email || 'user@vouchnest.com',
          userName: currentUser?.fullName || currentUser?.username || 'Member',
          claimedAt: d.purchasedAt || new Date().toISOString(),
          sellingPrice: d.sellingPrice || '49',
          status: 'claimed' as const,
        }));
      }
    } catch {}
    return [];
  });
  const [savedCoupons, setSavedCoupons] = useState<SavedCouponRecord[]>([]);
  const [stats, setStats] = useState({
    redeemedCount: 0,
    savedCount: 0,
    totalSavings: 2450,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState(currentUser?.fullName || currentUser?.username || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editAge, setEditAge] = useState(
    currentUser?.age !== undefined && currentUser?.age !== null ? currentUser.age.toString() : ''
  );
  const [editAvatar, setEditAvatar] = useState<string | null>(currentUser?.avatar || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Hidden file inputs for direct camera/device photo picker
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formFileInputRef = useRef<HTMLInputElement>(null);

  // Modal for unlocking a saved coupon directly from wishlist
  const [couponToUnlock, setCouponToUnlock] = useState<BrandCouponData | null>(null);

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
      'x-user-role': currentUser?.role || 'user',
    };
  };

  // Fetch full user profile, claims, and saved coupons from server & Firestore
  const fetchProfileData = async () => {
    setIsRefreshing(true);
    try {
      const headers = getAuthHeaders();

      // 1. Fetch Profile & Stats
      const profileRes = await fetch('/api/user/profile', { headers });
      if (profileRes.ok) {
        const pData = await profileRes.json();
        if (pData.stats) {
          setStats(pData.stats);
        }
        if (pData.user && onUpdateCurrentUser) {
          onUpdateCurrentUser({
            ...currentUser,
            ...pData.user,
          });
          setEditFullName(pData.user.fullName || pData.user.username || '');
          setEditPhone(pData.user.phone || '');
          setEditAge(pData.user.age !== undefined && pData.user.age !== null ? pData.user.age.toString() : '');
          if (pData.user.avatar) {
            setEditAvatar(pData.user.avatar);
          }
        }
      }

      // 2. Fetch User Claims / Redeemed Coupons
      const claimsRes = await fetch('/api/user/claims', { headers });
      if (claimsRes.ok) {
        const cData = await claimsRes.json();
        const serverClaims: ClaimRecord[] = cData.claims || [];
        setClaims((prev) => {
          const combined = [...serverClaims];
          prev.forEach((pc) => {
            if (!combined.some((c) => c.id === pc.id || (c.couponId === pc.couponId && c.code.toUpperCase() === pc.code.toUpperCase()))) {
              combined.push(pc);
            }
          });
          try {
            localStorage.setItem('vouchnest_user_claims', JSON.stringify(combined));
          } catch {}
          setStats((s) => ({ ...s, redeemedCount: combined.length }));
          return combined;
        });
      }

      // 3. Fetch User Saved Coupons
      const savedRes = await fetch('/api/user/saved-coupons', { headers });
      if (savedRes.ok) {
        const sData = await savedRes.json();
        setSavedCoupons(sData.savedCoupons || []);
      }
    } catch (err) {
      console.warn('Error fetching profile data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [currentUser?.email]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Copied ${code} to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Toggle Claimed status (Active vs Redeemed at Merchant)
  const handleToggleClaimStatus = async (claimId: string) => {
    if (isAdmin) {
      showToast('Access Denied: Administrators cannot redeem coupons.');
      return;
    }
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/user/claims/${claimId}/toggle-status`, {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? { ...c, status: data.claim.status } : c))
        );
        showToast(data.message || 'Status updated successfully.');
      }
    } catch {
      showToast('Failed to update status.');
    }
  };

  // Remove coupon from saved wishlist
  const handleRemoveSavedCoupon = async (couponId: string, brandName: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/user/saved-coupons/${couponId}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        setSavedCoupons((prev) => prev.filter((s) => s.couponId !== couponId && s.id !== couponId));
        setStats((prev) => ({ ...prev, savedCount: Math.max(0, prev.savedCount - 1) }));
        showToast(`Removed ${brandName} coupon from wishlist.`);
      }
    } catch {
      showToast('Error removing coupon.');
    }
  };

  // Helper: process image from device, scale & crop to 400x400 square JPEG
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please select a valid image file (JPG, PNG, WEBP, HEIC).'));
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        reject(new Error('Image file is too large. Please select a photo under 15MB.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 400; // Crisp profile avatar dimensions
            const minSide = Math.min(img.width, img.height);
            const sx = (img.width - minSide) / 2;
            const sy = (img.height - minSide) / 2;

            canvas.width = maxDim;
            canvas.height = maxDim;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(e.target?.result as string);
              return;
            }
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxDim, maxDim);
            const compressed = canvas.toDataURL('image/jpeg', 0.88);
            resolve(compressed);
          } catch {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Unable to decode image from device.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error reading image file from device.'));
      reader.readAsDataURL(file);
    });
  };

  // Direct upload from device via hero camera button
  const handleDirectPhotoUpload = async (file: File) => {
    setIsUploadingPhoto(true);
    try {
      const photoDataUrl = await processImageFile(file);
      setEditAvatar(photoDataUrl);

      const updatedUser: User = {
        ...(currentUser || {
          username: 'Member',
          email: 'user@vouchnest.com',
          role: 'user',
        }),
        avatar: photoDataUrl,
      };

      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(updatedUser);
      }
      localStorage.setItem('vouchnest_user', JSON.stringify(updatedUser));

      // Persist to server & Firestore
      const headers = getAuthHeaders();
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          avatar: photoDataUrl,
        }),
      });

      if (res.ok) {
        showToast('📸 Profile photo updated from device & saved to Firestore!');
      } else {
        showToast('Profile photo updated on device.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Stage photo selection in edit form
  const handleFormPhotoSelect = async (file: File) => {
    try {
      const photoDataUrl = await processImageFile(file);
      setEditAvatar(photoDataUrl);
      showToast('Photo selected! Click "Save Changes" to apply.');
    } catch (err: any) {
      showToast(err?.message || 'Error processing photo.');
    }
  };

  // Remove photo from profile
  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true);
    try {
      setEditAvatar(null);
      const updatedUser: User = {
        ...(currentUser || {
          username: 'Member',
          email: 'user@vouchnest.com',
          role: 'user',
        }),
        avatar: '',
      };

      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(updatedUser);
      }
      localStorage.setItem('vouchnest_user', JSON.stringify(updatedUser));

      const headers = getAuthHeaders();
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          avatar: '',
        }),
      });
      showToast('Profile photo removed.');
    } catch {
      showToast('Failed to remove photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Save profile edits to Firestore
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const headers = getAuthHeaders();
      const parsedAge = editAge.trim() ? parseInt(editAge.trim(), 10) : undefined;
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          fullName: editFullName.trim(),
          phone: editPhone.trim(),
          age: !isNaN(Number(parsedAge)) ? parsedAge : undefined,
          avatar: editAvatar !== null ? editAvatar : '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const updated = {
            ...currentUser,
            ...data.user,
            avatar: editAvatar !== null ? editAvatar : '',
          };
          if (onUpdateCurrentUser) {
            onUpdateCurrentUser(updated);
          }
          localStorage.setItem('vouchnest_user', JSON.stringify(updated));
        }
        setIsEditing(false);
        showToast('Profile updated & synced with Firebase Firestore!');
      } else {
        showToast('Failed to update profile.');
      }
    } catch {
      showToast('Error saving profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle successful unlock payment of a saved coupon
  const handlePaymentSuccess = async (coupon: BrandCouponData) => {
    if (isAdmin) {
      showToast('Access Denied: Administrators cannot redeem, claim, or purchase coupons.');
      return;
    }
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/coupons/${coupon.id}/claim`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          paymentMethod: 'UPI Instant',
          transactionId: `TXN-${Date.now()}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.claim) {
          setClaims((prev) => {
            const next = [data.claim, ...prev];
            try {
              localStorage.setItem('vouchnest_user_claims', JSON.stringify(next));
            } catch {}
            return next;
          });
          setStats((prev) => ({ ...prev, redeemedCount: prev.redeemedCount + 1 }));
          setActiveTab('redeemed');
        }
        // Remove from saved list once unlocked
        handleRemoveSavedCoupon(coupon.id, coupon.brand);
        showToast(`🎉 Coupon unlocked & saved to Redeemed! Code: ${data.code}`);
      }
    } catch {
      showToast('Error claiming coupon.');
    }
  };

  const getInitials = (name?: string, username?: string) => {
    const text = name || username || 'User';
    const parts = text.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  const userDisplayName = currentUser?.fullName || currentUser?.username || 'VouchNest User';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 pb-20 font-sans selection:bg-[#D7131D] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-neutral-950 text-white border-2 border-[#D7131D] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Navigation */}
      <header className="bg-neutral-950 text-white border-b border-neutral-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 px-3.5 py-1.5 rounded-xl border border-neutral-700 transition cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Marketplace</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
              <span>Home</span>
              <ChevronRight size={12} />
              <span className="text-white font-bold">User Profile</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Database Sync Status Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Firebase Firestore Synced</span>
              <span className="sm:hidden">Firestore DB</span>
            </div>

            <button
              onClick={fetchProfileData}
              disabled={isRefreshing}
              title="Refresh Data from Firestore"
              className="p-2 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-[#D7131D]' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Profile Identity Hero Card */}
        <div className="relative bg-white rounded-3xl border-2 border-neutral-200 overflow-hidden shadow-sm">
          {/* Header Graphic Background */}
          <div className="h-32 sm:h-40 bg-gradient-to-r from-neutral-950 via-neutral-900 to-red-950 relative overflow-hidden">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#D7131D_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="bg-white/10 backdrop-blur-md text-white/90 text-xs font-semibold px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
                <Database size={13} className="text-[#D7131D]" />
                VouchNest Secure Member ID
              </span>
            </div>
          </div>

          {/* User Details & Avatar Block */}
          <div className="px-6 sm:px-10 pb-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 -mt-16 sm:-mt-14 mb-6">
              {/* Avatar + Main Identity */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                <div className="relative group">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-neutral-950 text-white border-4 border-white shadow-xl flex items-center justify-center font-black text-3xl sm:text-4xl tracking-tight bg-gradient-to-br from-neutral-900 via-neutral-950 to-[#D7131D] overflow-hidden relative">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={userDisplayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(currentUser?.fullName, currentUser?.username)}</span>
                    )}

                    {/* Hover Overlay Button to Change Photo */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      title="Upload profile photo from device"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white text-xs font-bold cursor-pointer"
                    >
                      <Camera size={22} className="text-white drop-shadow" />
                      <span className="text-[10px] tracking-wide uppercase font-extrabold bg-black/50 px-2.5 py-1 rounded-full border border-white/20">
                        {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
                      </span>
                    </button>
                  </div>

                  {/* Device Photo Upload Camera Badge Button (accessible on mobile taps) */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    title="Choose photo from device"
                    className="absolute -bottom-1 -right-1 bg-[#D7131D] hover:bg-[#b00f17] active:scale-95 text-white p-2.5 rounded-2xl shadow-lg border-2 border-white flex items-center justify-center transition cursor-pointer"
                  >
                    <Camera size={15} />
                  </button>

                  {/* Hidden File Input for Device Photo Selection */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleDirectPhotoUpload(file);
                        e.target.value = '';
                      }
                    }}
                  />

                  {isAdmin && (
                    <div
                      title="Master Administrator"
                      className="absolute -top-2 -right-2 bg-[#D7131D] text-white p-2 rounded-2xl shadow-lg border-2 border-white flex items-center justify-center z-10"
                    >
                      <Crown size={16} />
                    </div>
                  )}
                </div>

                <div className="space-y-1 sm:mb-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
                      {userDisplayName}
                    </h1>
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-100 text-[#D7131D] text-xs font-extrabold px-3 py-1 rounded-full border border-red-200 uppercase tracking-wider">
                        <Shield size={12} className="text-[#D7131D]" />
                        Admin Access
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider">
                        <ShieldCheck size={12} className="text-emerald-600" />
                        Verified Member
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-500 font-medium text-sm sm:text-base">
                    @{currentUser?.username || 'member'} • Member of VouchNest Savings Club
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl border transition cursor-pointer shadow-xs ${
                    isEditing
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-300'
                  }`}
                >
                  {isEditing ? <X size={15} /> : <Edit3 size={15} />}
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                </button>

                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold bg-red-50 hover:bg-red-100 text-[#D7131D] px-4 py-2.5 rounded-xl border border-red-200 transition cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Editable Profile Form OR Read-Only Information Grid */}
            {isEditing ? (
              <form
                onSubmit={handleSaveProfile}
                className="mt-6 p-6 bg-neutral-50 border-2 border-neutral-200 rounded-2xl animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-neutral-900 text-base flex items-center gap-2">
                    <Edit3 size={16} className="text-[#D7131D]" />
                    Edit Personal Details
                  </h3>
                  <span className="text-xs text-neutral-500">
                    Changes will synchronize directly to your Firebase Firestore document.
                  </span>
                </div>

                {/* Profile Photo from Device Upload Section */}
                <div className="mb-6 p-4 bg-white rounded-2xl border border-neutral-300 shadow-xs">
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2.5">
                    Profile Photo from Device
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Preview Thumbnail */}
                    <div className="w-16 h-16 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-black text-xl overflow-hidden shrink-0 border-2 border-neutral-300 shadow-sm relative">
                      {editAvatar ? (
                        <img src={editAvatar} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <span>{getInitials(editFullName || currentUser?.fullName, currentUser?.username)}</span>
                      )}
                    </div>

                    {/* Actions & Description */}
                    <div className="flex-1 text-center sm:text-left space-y-1.5">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => formFileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shadow-xs"
                        >
                          <Upload size={14} className="text-[#D7131D]" />
                          <span>Choose Photo from Device</span>
                        </button>

                        {editAvatar && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            disabled={isUploadingPhoto}
                            className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-[#D7131D] text-xs font-bold px-3 py-2 rounded-xl border border-red-200 transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>Remove Photo</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Upload any picture from your device camera or library (JPG, PNG, WEBP). Automatically compressed and optimized.
                      </p>
                    </div>
                  </div>

                  {/* Hidden file input for form */}
                  <input
                    ref={formFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFormPhotoSelect(file);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      placeholder="e.g. Santhosh Reddy"
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#D7131D] focus:ring-1 focus:ring-[#D7131D]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. 7569806640"
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#D7131D] focus:ring-1 focus:ring-[#D7131D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Age
                    </label>
                    <input
                      type="number"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      min="13"
                      max="120"
                      placeholder="e.g. 20"
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#D7131D] focus:ring-1 focus:ring-[#D7131D]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs sm:text-sm font-bold text-neutral-600 hover:text-neutral-900 px-4 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-2 bg-[#D7131D] hover:bg-[#b00f17] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    <Save size={15} />
                    <span>{isSavingProfile ? 'Saving to Firestore...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* User Information Pills Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-100">
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80">
                  <div className="flex items-center gap-2.5 text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
                    <Mail size={14} className="text-[#D7131D]" />
                    Email Address
                  </div>
                  <div className="font-extrabold text-neutral-900 text-sm truncate" title={currentUser?.email}>
                    {currentUser?.email || 'santhoshreddyburra@gmail.com'}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Primary Verified
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80">
                  <div className="flex items-center gap-2.5 text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
                    <Phone size={14} className="text-[#D7131D]" />
                    Mobile Phone
                  </div>
                  <div className="font-extrabold text-neutral-900 text-sm">
                    {currentUser?.phone ? `+91 ${currentUser.phone}` : '+91 7569806640'}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-medium mt-1">
                    Instant OTP & Claim Alerts
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80">
                  <div className="flex items-center gap-2.5 text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
                    <UserIcon size={14} className="text-[#D7131D]" />
                    Age & Demographics
                  </div>
                  <div className="font-extrabold text-neutral-900 text-sm">
                    {currentUser?.age !== undefined && currentUser?.age !== null
                      ? `${currentUser.age} years old`
                      : 'Not specified'}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-medium mt-1">
                    Registered Profile Age
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80">
                  <div className="flex items-center gap-2.5 text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
                    <Shield size={14} className="text-[#D7131D]" />
                    Account Security
                  </div>
                  <div className="font-extrabold text-neutral-900 text-sm capitalize">
                    {currentUser?.role === 'admin' ? 'Master Admin Role' : 'Standard Member'}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <Database size={11} /> Firestore Synchronized
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* ADMIN PROFILE VIEW (STRICTLY FOR ADMIN ROLE)                 */}
        {/* ============================================================ */}
        {isAdmin ? (
          <div className="space-y-6">
            {/* Administrator Control Center Card */}
            <div className="bg-white rounded-3xl border-2 border-neutral-200 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-100 text-[#D7131D] text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border border-red-200 flex items-center gap-1.5">
                      <Crown size={13} className="text-[#D7131D]" />
                      Master Administrator Console
                    </span>
                    <span className="text-xs text-neutral-400 font-semibold">• High Privilege Mode</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
                    Admin Dashboard & Statistics
                  </h2>
                  <p className="text-neutral-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
                    All platform-wide summary statistics (Total Coupons, Coupons Sold, Available Coupons, Total Value Sold, Selling Revenue) along with the full Platform Coupons Directory and Coupons Sold Ledger are managed exclusively on your dedicated Admin Dashboard.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <button
                    onClick={() => onNavigate('admin-dashboard')}
                    className="inline-flex items-center justify-center gap-2 bg-[#D7131D] hover:bg-[#b00f17] text-white text-sm font-extrabold px-6 py-3.5 rounded-2xl shadow-md transition cursor-pointer active:scale-95"
                  >
                    <Crown size={16} />
                    <span>Launch Admin Dashboard</span>
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => onNavigate('home')}
                    className="inline-flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-sm font-bold px-4 py-3.5 rounded-2xl border border-neutral-300 transition cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                    <span>Marketplace</span>
                  </button>
                </div>
              </div>

              {/* Admin Quick Features Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-neutral-100">
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-neutral-800 uppercase tracking-wider mb-1">
                    <TrendingUp size={14} className="text-[#D7131D]" />
                    Dynamic Summary Stats
                  </div>
                  <p className="text-xs text-neutral-500 font-medium">
                    Live dynamic calculation of inventory, sold vouchers, and gross revenue.
                  </p>
                </div>

                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-neutral-800 uppercase tracking-wider mb-1">
                    <Tag size={14} className="text-[#D7131D]" />
                    Unmasked Coupon Codes
                  </div>
                  <p className="text-xs text-neutral-500 font-medium">
                    Full unmasked codes view and inventory management on the dashboard.
                  </p>
                </div>

                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-neutral-800 uppercase tracking-wider mb-1">
                    <ShoppingBag size={14} className="text-[#D7131D]" />
                    Sold To Users Ledger
                  </div>
                  <p className="text-xs text-neutral-500 font-medium">
                    Comprehensive audit log of user claims, UPI transactions, and redemption timestamps.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* NORMAL USER VIEW (EXACT ORIGINAL STATS & REDEEM TABS)        */
          /* ============================================================ */
          <div className="space-y-8">
            {/* Overview Stats Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Card 1: Total Savings */}
              <div className="bg-white rounded-3xl p-6 border-2 border-neutral-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    Total Money Saved
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-neutral-950">
                    ₹{stats.totalSavings.toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                    <TrendingUp size={13} /> Across redeemed store vouchers
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Sparkles size={24} />
                </div>
              </div>

              {/* Card 2: Redeemed Coupons */}
              <div
                onClick={() => setActiveTab('redeemed')}
                className={`bg-white rounded-3xl p-6 border-2 transition cursor-pointer shadow-xs flex items-center justify-between ${
                  activeTab === 'redeemed' ? 'border-[#D7131D] ring-2 ring-[#D7131D]/20' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    Redeemed & Claimed
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-[#D7131D]">
                    {claims.length}
                  </div>
                  <p className="text-xs text-neutral-500 font-semibold mt-1.5">
                    Unlocked codes ready to use
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#D7131D] border border-red-200 flex items-center justify-center shrink-0">
                  <Tag size={24} />
                </div>
              </div>

              {/* Card 3: Saved Wishlist */}
              <div
                onClick={() => setActiveTab('saved')}
                className={`bg-white rounded-3xl p-6 border-2 transition cursor-pointer shadow-xs flex items-center justify-between ${
                  activeTab === 'saved' ? 'border-[#D7131D] ring-2 ring-[#D7131D]/20' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    Saved Wishlist
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-neutral-950">
                    {savedCoupons.length}
                  </div>
                  <p className="text-xs text-neutral-500 font-semibold mt-1.5">
                    Bookmarked for future purchase
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                  <Bookmark size={24} />
                </div>
              </div>
            </div>

            {/* Interactive Tabs Navigation: Redeemed History vs Saved Wishlist */}
            <div className="bg-white rounded-3xl border-2 border-neutral-200 shadow-xs overflow-hidden">
              {/* Tab Selector Bar */}
              <div className="flex border-b border-neutral-200 bg-neutral-50/70 p-2 gap-2 sm:gap-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('redeemed')}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-extrabold text-sm sm:text-base transition cursor-pointer shrink-0 ${
                    activeTab === 'redeemed'
                      ? 'bg-neutral-950 text-white shadow-md'
                      : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
                  }`}
                >
                  <Tag size={17} className={activeTab === 'redeemed' ? 'text-[#D7131D]' : ''} />
                  <span>Redeemed Coupons History</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      activeTab === 'redeemed' ? 'bg-[#D7131D] text-white' : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {claims.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('saved')}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-extrabold text-sm sm:text-base transition cursor-pointer shrink-0 ${
                    activeTab === 'saved'
                      ? 'bg-neutral-950 text-white shadow-md'
                      : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
                  }`}
                >
                  <Bookmark size={17} className={activeTab === 'saved' ? 'text-amber-400' : ''} />
                  <span>Saved / Wishlisted Coupons</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      activeTab === 'saved' ? 'bg-[#D7131D] text-white' : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {savedCoupons.length}
                  </span>
                </button>
              </div>

              {/* TAB 1: REDEEMED / CLAIMED HISTORY */}
              {activeTab === 'redeemed' && (
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-100">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
                    Redeemed & Unlocked Coupons
                  </h2>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    All discount codes unlocked with verified payments. Codes are unlocked and ready to use at checkout.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('home')}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#D7131D] hover:underline cursor-pointer"
                >
                  <ShoppingBag size={14} />
                  <span>Browse More Coupons</span>
                </button>
              </div>

              {claims.length === 0 ? (
                <div className="py-16 text-center max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-red-50 text-[#D7131D] flex items-center justify-center mx-auto mb-4 border border-red-100">
                    <Tag size={28} />
                  </div>
                  <h3 className="text-lg font-black text-neutral-900 mb-1">No Redeemed Coupons Yet</h3>
                  <p className="text-neutral-500 text-sm mb-6">
                    You have not unlocked any discount vouchers yet. Browse popular brands and claim exclusive deals.
                  </p>
                  <button
                    onClick={() => onNavigate('home')}
                    className="inline-flex items-center gap-2 bg-[#D7131D] hover:bg-[#b00f17] text-white font-bold px-6 py-3 rounded-xl shadow-md transition cursor-pointer"
                  >
                    <ShoppingBag size={16} />
                    <span>Explore Brand Deals</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {claims.map((claim) => {
                    const cleanCode =
                      claim.code && !claim.code.includes('•')
                        ? claim.code
                        : `${(claim.brand || 'VOUCH').toUpperCase().replace(/[^A-Z0-9]/g, '')}SPECIAL`;
                    const isCopied = copiedCode === cleanCode;
                    const isUsed = claim.status === 'redeemed';

                    return (
                      <div
                        key={claim.id}
                        className={`bg-white rounded-2xl border-2 p-5 transition-all relative flex flex-col justify-between shadow-2xs ${
                          isUsed ? 'border-neutral-200 opacity-90' : 'border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {/* Top: Brand info and status */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-200 p-2 flex items-center justify-center shrink-0">
                                <BrandLogo brandKey={claim.brand.toLowerCase()} className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                                  {claim.brand}
                                </span>
                                <h4 className="font-extrabold text-neutral-900 text-base leading-snug">
                                  {claim.couponTitle}
                                </h4>
                              </div>
                            </div>

                            <span
                              className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full shrink-0 border ${
                                isUsed
                                  ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {isUsed ? 'Redeemed' : 'Ready to Use'}
                            </span>
                          </div>

                          {/* Discount Tag */}
                          <div className="inline-flex items-center gap-1.5 bg-red-50 text-[#D7131D] px-3 py-1 rounded-xl text-xs font-black uppercase mb-3 border border-red-100">
                            <Gift size={13} />
                            <span>{claim.discount}</span>
                          </div>

                          {/* Unlocked Code Highlight Box - Revealed in Plain Text */}
                          <div className="bg-emerald-50/70 border-2 border-dashed border-emerald-500 rounded-xl p-3 mb-3 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block">
                                Unlocked Voucher Code
                              </span>
                              <span className="font-mono text-base font-black text-[#D7131D] tracking-wider select-all">
                                {cleanCode}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyCode(cleanCode)}
                              className="inline-flex items-center gap-1.5 bg-white hover:bg-emerald-100 text-neutral-900 text-xs font-bold px-3 py-2 rounded-lg border border-emerald-300 transition shadow-2xs cursor-pointer"
                            >
                              {isCopied ? (
                                <>
                                  <Check size={14} className="text-emerald-700" />
                                  <span className="text-emerald-700">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Meta Details: Transaction ID, Paid Amount, Claim Date */}
                          <div className="space-y-1.5 text-xs text-neutral-500 bg-neutral-50 p-3 rounded-xl border border-neutral-100 mb-3">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} /> Claimed On:
                              </span>
                              <span className="font-semibold text-neutral-800">
                                {new Date(claim.claimedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <CreditCard size={12} /> Unlock Price:
                              </span>
                              <span className="font-bold text-[#D7131D]">
                                ₹{claim.sellingPrice} via {claim.paymentMethod || 'UPI'}
                              </span>
                            </div>

                            {claim.transactionId && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-mono text-neutral-400">TXN Ref:</span>
                                <span className="font-mono text-neutral-700">{claim.transactionId}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Actions: Toggle Used + External Shop */}
                        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleClaimStatus(claim.id)}
                            className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <CheckCircle2 size={14} className={isUsed ? 'text-emerald-600' : 'text-neutral-400'} />
                            <span>{isUsed ? 'Marked as Used' : 'Mark as Used'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              showToast(`Applying ${claim.code} at ${claim.brand}...`);
                              onNavigate('home');
                            }}
                            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#D7131D] hover:text-[#b00f17] cursor-pointer"
                          >
                            <span>Use Coupon</span>
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED / WISHLIST COUPONS */}
          {activeTab === 'saved' && (
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-100">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
                    Saved Coupons Wishlist
                  </h2>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Coupons bookmarked for later. You can unlock them anytime with verified payment.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('home')}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#D7131D] hover:underline cursor-pointer"
                >
                  <ShoppingBag size={14} />
                  <span>Discover More Deals</span>
                </button>
              </div>

              {savedCoupons.length === 0 ? (
                <div className="py-16 text-center max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
                    <Bookmark size={28} />
                  </div>
                  <h3 className="text-lg font-black text-neutral-900 mb-1">Your Wishlist is Empty</h3>
                  <p className="text-neutral-500 text-sm mb-6">
                    Bookmark your favorite brand discounts while browsing to save them here for later redemption.
                  </p>
                  <button
                    onClick={() => onNavigate('home')}
                    className="inline-flex items-center gap-2 bg-[#D7131D] hover:bg-[#b00f17] text-white font-bold px-6 py-3 rounded-xl shadow-md transition cursor-pointer"
                  >
                    <ShoppingBag size={16} />
                    <span>Browse Coupons to Save</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {savedCoupons.map((saved) => (
                    <div
                      key={saved.id}
                      className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-neutral-400 p-5 transition-all flex flex-col justify-between shadow-2xs"
                    >
                      <div>
                        {/* Header: Brand Logo & Title */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-200 p-2 flex items-center justify-center shrink-0">
                              <BrandLogo brandKey={saved.brand.toLowerCase()} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                                {saved.brand}
                              </span>
                              <h4 className="font-extrabold text-neutral-900 text-base leading-snug">
                                {saved.title}
                              </h4>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSavedCoupon(saved.couponId, saved.brand)}
                            title="Remove from wishlist"
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Discount Badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1 rounded-xl text-xs font-black uppercase border border-amber-200">
                            <Gift size={13} />
                            {saved.discount}
                          </span>
                          {saved.category && (
                            <span className="bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-xl text-[11px] font-bold">
                              {saved.category}
                            </span>
                          )}
                        </div>

                        {/* Pricing details */}
                        <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-100 mb-4">
                          <div>
                            <span className="text-[11px] text-neutral-500 block">Voucher Value</span>
                            <span className="font-extrabold text-neutral-900 text-sm">₹{saved.couponAmount || '500'}</span>
                          </div>
                          <div className="w-px h-6 bg-neutral-200" />
                          <div>
                            <span className="text-[11px] text-neutral-500 block">Unlock Price</span>
                            <span className="font-extrabold text-[#D7131D] text-sm">₹{saved.sellingPrice || '49'}</span>
                          </div>
                          <div className="w-px h-6 bg-neutral-200" />
                          <div>
                            <span className="text-[11px] text-neutral-500 block">Valid Until</span>
                            <span className="font-semibold text-neutral-700 text-xs">{saved.expiryDate || '30-11-2026'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Unlock Button */}
                      <div className="flex items-center gap-3 pt-3 border-t border-neutral-100">
                        {isAdmin ? (
                          <div
                            title="Admins have view-only access. Claiming/Redeeming is disabled for Administrator role."
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-neutral-100 text-neutral-500 text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl border border-neutral-300 cursor-not-allowed select-none"
                          >
                            <Lock size={14} className="text-neutral-400" />
                            <span>Claim Disabled (Admin)</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              // Construct coupon item for payment modal
                              const modalCoupon: BrandCouponData = {
                                id: saved.couponId,
                                brand: saved.brand,
                                title: saved.title,
                                discount: saved.discount,
                                discountType: 'percent',
                                code: saved.code || 'VOUCHPROMO',
                                description: `${saved.discount} on ${saved.brand}`,
                                expiryDate: saved.expiryDate || '30-11-2026',
                                category: saved.category || 'General',
                                sellingPrice: saved.sellingPrice || '49',
                                couponAmount: saved.couponAmount || '500',
                              };
                              setCouponToUnlock(modalCoupon);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#D7131D] hover:bg-[#b00f17] text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl shadow-md transition cursor-pointer active:scale-95"
                          >
                            <Lock size={14} />
                            <span>Unlock & Redeem for ₹{saved.sellingPrice || '49'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )}

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
                  Your claimed coupons, payment transactions, saved wishlist, and personal profile details are synchronously backed up and protected under Firestore Role-Based Access Control (RBAC).
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl border border-neutral-600 transition cursor-pointer shrink-0"
            >
              <span>Explore Marketplace</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

      </main>

      {/* Payment / Unlock Modal */}
      {couponToUnlock && (
        <CouponPaymentModal
          isOpen={!!couponToUnlock}
          coupon={couponToUnlock}
          onClose={() => setCouponToUnlock(null)}
          onPaymentSuccess={(c) => {
            handlePaymentSuccess(c);
          }}
          onNavigateToRedeemed={() => setActiveTab('redeemed')}
        />
      )}
    </div>
  );
};
