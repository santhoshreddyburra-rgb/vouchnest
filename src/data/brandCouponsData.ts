import { CouponItem } from '../types';

export interface BrandCouponData extends CouponItem {
  isCommunity?: boolean;
  terms?: string;
  verified?: boolean;
}

// All predefined coupons removed as requested. Every brand starts empty (0 coupons)
// ready for user to add their own custom coupons for each brand.
export const INITIAL_BRAND_COUPONS: Record<string, BrandCouponData[]> = {
  amazon: [],
  boat: [],
  flipkart: [],
  lenskart: [],
  myntra: [],
  nike: [],
  puma: [],
  noise: [],
  redtape: [],
  chemistatplay: [],
  dotandkey: [],
  dermaco: [],
};
