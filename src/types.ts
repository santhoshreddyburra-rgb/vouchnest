export type UserRole = 'admin' | 'user';

export type Page =
  | 'home'
  | 'login'
  | 'register'
  | 'user-home'
  | 'user-login'
  | 'user-register'
  | 'admin-login'
  | 'admin-dashboard'
  | 'profile';

export interface User {
  id?: string;
  username: string;
  email: string;
  fullName?: string;
  age?: number;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  token?: string;
  createdAt?: string;
  isVerified?: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  age?: number;
  phone?: string;
  avatar?: string;
  role: UserRole;
  token?: string;
  createdAt?: string;
}

export interface BrandDeal {
  id: string;
  name: string;
  category: string;
  discount: string;
  code: string;
  expiresIn: string;
  logoUrl?: string;
  verified?: boolean;
  terms?: string;
  couponAmount?: string;
  sellingPrice?: string;
  purchasedAt?: string;
  isUnlocked?: boolean;
}

export interface CartItem {
  id: string;
  couponId: string;
  brand: string;
  title: string;
  discount: string;
  discountType?: 'flat' | 'percent';
  code: string;
  sellingPrice: string;
  couponAmount?: string;
  minPurchaseAmount?: string;
  expiryDate?: string;
  category?: string;
  description?: string;
  addedAt: string;
}

export interface CouponItem {
  id: string;
  title: string;
  brand: string;
  discount: string;
  code: string;
  expiryDate: string;
  category: string;
  description: string;
  couponAmount?: string;
  sellingPrice?: string;
  minPurchaseAmount?: string;
  discountType?: 'flat' | 'percent';
  inventory?: number;
  totalClaims?: number;
  status?: 'active' | 'depleted' | 'expired';
}

export interface Coupon {
  id: string;
  title: string;
  brand: string;
  discount: string;
  discountType: 'flat' | 'percent';
  code: string;
  expiryDate: string;
  category: string;
  description: string;
  couponAmount?: string;
  sellingPrice?: string;
  minPurchaseAmount?: string;
  inventory: number;
  totalClaims: number;
  logoUrl?: string;
  status: 'active' | 'depleted' | 'expired';
  createdAt?: string;
  isClaimedByMe?: boolean;
}

export interface ClaimRecord {
  id: string;
  couponId: string;
  couponTitle: string;
  brand: string;
  discount: string;
  code: string;
  userId: string;
  userEmail: string;
  userName?: string;
  claimedAt: string;
  sellingPrice: string;
  paymentMethod?: string;
  transactionId?: string;
  status: 'claimed' | 'redeemed';
}

export interface AdminStats {
  totalCoupons: number;
  totalCouponsSold: number;
  totalCouponsAvailable: number;
  totalValueOfCouponsSold: number;
  totalSellingRevenue: number;
  totalRevenue?: number;
  activeCoupons?: number;
  totalInventory?: number;
  totalClaimsCount?: number;
  totalUsers?: number;
}

export interface SavedCouponRecord {
  id: string;
  userId: string;
  userEmail: string;
  couponId: string;
  brand: string;
  title: string;
  discount: string;
  sellingPrice?: string;
  couponAmount?: string;
  code?: string;
  expiryDate?: string;
  category?: string;
  savedAt: string;
}
