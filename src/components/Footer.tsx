import React from 'react';
import { VouchNestLogo } from './VouchNestLogo';
import { Page } from '../types';

interface FooterProps {
  onNavigate: (page: Page) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#050505] text-neutral-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Brand logo & Tagline */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <VouchNestLogo variant="dark" showTagline={true} size="md" />
          <p className="mt-2 text-xs text-neutral-500 max-w-sm">
            VoucherNest is your premier savings network. Share unused coupons, discover verified discounts, and save on all top brands.
          </p>
        </div>

        {/* Navigation links */}
        <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-neutral-300">
          <button onClick={() => onNavigate('home')} className="hover:text-white transition">
            Home
          </button>
          <button onClick={() => onNavigate('login')} className="hover:text-white transition">
            Sign In
          </button>
          <button onClick={() => onNavigate('register')} className="hover:text-white transition">
            Create Account
          </button>
          <button onClick={() => alert('VoucherNest terms and privacy!')} className="hover:text-white transition">
            Terms of Service
          </button>
          <button onClick={() => alert('VoucherNest 256-Bit SSL Protection')} className="hover:text-white transition">
            Privacy Policy
          </button>
        </div>

        {/* Security & Copyright */}
        <div className="text-center md:text-right text-xs text-neutral-600">
          <p>© {new Date().getFullYear()} VouchNest. All rights reserved.</p>
          <p className="mt-1 flex items-center justify-center md:justify-end gap-1.5 text-neutral-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-emerald-400">Connected: Firebase Firestore</span>
          </p>
          <p className="mt-0.5 flex items-center justify-center md:justify-end gap-1 text-neutral-500 text-[11px]">
            <span>🔒 256-Bit SSL Encrypted & Cloud Synchronized</span>
          </p>
        </div>

      </div>
    </footer>
  );
};
