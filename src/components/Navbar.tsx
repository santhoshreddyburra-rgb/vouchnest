import React, { useState } from 'react';
import { User as UserIcon, Plus, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react';
import { VouchNestLogo, LogoDesign, VouchNestMark } from './VouchNestLogo';
import { VouchNestReferenceBadge } from './VouchNestReferenceBadge';
import { Page, User } from '../types';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenAddCoupon: () => void;
  onOpenCart: () => void;
  cartCount: number;
  onSelectCategory?: (category: 'fashion' | 'electronics' | 'skincare') => void;
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  onLogout,
  onOpenAddCoupon,
  onOpenCart,
  cartCount,
  onSelectCategory,
  onGoHome,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<'categories' | 'brands' | 'home' | 'add-coupon' | 'redeemed' | 'cart'>('home');

  const handleBrandsClick = () => {
    setActiveItem('brands');
    if (onGoHome) {
      onGoHome();
    }
    if (currentPage !== 'home') {
      onNavigate('home');
      setTimeout(() => {
        document.getElementById('featured-brands')?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      document.getElementById('featured-brands')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHomeClick = () => {
    setActiveItem('home');
    if (onGoHome) {
      onGoHome();
    }
    onNavigate('home');
  };

  const handleCategoryClick = (cat: string) => {
    setActiveItem('categories');
    setCategoriesOpen(false);
    const clean = cat.toLowerCase().replace(/\s+/g, '');
    const normalized = (clean === 'skincare' ? 'skincare' : cat.toLowerCase()) as 'fashion' | 'electronics' | 'skincare';
    if (onSelectCategory) {
      onSelectCategory(normalized);
    }
    if (currentPage !== 'home') {
      onNavigate('home');
      setTimeout(() => {
        document.getElementById('category-filter-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      document.getElementById('category-filter-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const categories = [
    'Fashion',
    'Electronics',
    'Skin Care',
  ];

  return (
    <header className="w-full bg-[#000000] text-white select-none sticky top-0 z-50">
      
      {/* Top OS Window Chrome Bar from HOME.png */}
      <div className="bg-[#ECECED] text-neutral-800 border-b border-neutral-300 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-3">
          {/* Mac colored window dots (Red, Yellow, Green) */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E] inline-block shadow-xs" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123] inline-block shadow-xs" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29] inline-block shadow-xs" />
          </div>

          {/* Right side: VouchNest Reference Badge matching Screenshot 2026-09-17 192702.png */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <span className="text-[11px] text-neutral-600 font-medium hidden sm:inline">
                Signed in as <strong className="text-neutral-900">{currentUser.fullName || currentUser.username}</strong>
                <button
                  onClick={onLogout}
                  className="ml-2 text-[#D7131D] hover:underline font-bold cursor-pointer"
                >
                  Logout
                </button>
              </span>
            )}
            <VouchNestReferenceBadge
              height={26}
              onClick={() => onNavigate(currentUser ? 'home' : 'login')}
            />
          </div>
        </div>
      </div>

      {/* Main Jet Black Navigation Bar from HOME.png */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left Side: Nest Icon + Categories + Brands + VouchNest Logo */}
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-7">
          
          {/* 1. Leftmost Standalone V-Nest Logo matching uploaded reference Screenshot 2026-09-17 192351.png */}
          <div
            className="shrink-0 cursor-pointer flex items-center hover:opacity-90 transition"
            onClick={handleHomeClick}
            title="VouchNest"
          >
            <VouchNestMark size={36} variant="dark" />
          </div>

          {/* 2. Categories */}
          <div className="relative py-1">
            <button
              type="button"
              onClick={() => {
                setActiveItem('categories');
                setCategoriesOpen(!categoriesOpen);
              }}
              className={`flex items-center gap-1 transition text-sm cursor-pointer ${
                activeItem === 'categories' ? 'text-white font-semibold' : 'text-neutral-300 hover:text-white font-medium'
              }`}
            >
              <span>Categories</span>
              <ChevronDown size={14} className={`transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
            </button>
            {activeItem === 'categories' && (
              <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#D7131D] rounded-full" />
            )}

            {categoriesOpen && (
              <div className="absolute top-full left-0 mt-2 w-52 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl py-2 z-50 text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className="w-full text-left px-4 py-2 hover:bg-[#D7131D] hover:text-white transition text-neutral-200 font-medium"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Brands */}
          <div className="relative py-1">
            <button
              onClick={handleBrandsClick}
              className={`transition text-sm cursor-pointer ${
                activeItem === 'brands' ? 'text-white font-semibold' : 'text-neutral-300 hover:text-white font-medium'
              }`}
            >
              Brands
            </button>
            {activeItem === 'brands' && (
              <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#D7131D] rounded-full" />
            )}
          </div>

          {/* 4. Center-Left Logo: VouchNest matching uploaded reference photo */}
          <div className="ml-2 sm:ml-4 flex items-center">
            <VouchNestLogo
              variant="dark"
              design="reference"
              nestColor="#EE1C25"
              size="md"
              onClick={handleHomeClick}
              className="cursor-pointer"
            />
          </div>

          {/* 5. Nav Links after Logo: Home +Add Coupon Redeemed cart */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm text-neutral-200 ml-2">
            {/* Home */}
            <div className="relative py-1">
              <button
                onClick={() => {
                  handleHomeClick();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`text-base lg:text-lg transition cursor-pointer ${
                  activeItem === 'home' ? 'text-white font-bold' : 'text-neutral-300 hover:text-white font-medium'
                }`}
              >
                Home
              </button>
              {activeItem === 'home' && (
                <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#D7131D] rounded-full" />
              )}
            </div>

            {/* +Add Coupon - Strictly restricted to single Admin (Santhosh) */}
            {currentUser?.role === 'admin' && (
              <div className="relative py-1">
                <button
                  onClick={() => {
                    setActiveItem('add-coupon');
                    onOpenAddCoupon();
                  }}
                  className={`text-base lg:text-lg transition cursor-pointer ${
                    activeItem === 'add-coupon' ? 'text-white font-bold' : 'text-neutral-300 hover:text-white font-medium'
                  }`}
                >
                  +Add Coupon
                </button>
                {activeItem === 'add-coupon' && (
                  <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#D7131D] rounded-full" />
                )}
              </div>
            )}

            {/* Admin Dashboard - Strictly visible only for Admin */}
            {currentUser?.role === 'admin' && (
              <div className="relative py-1">
                <button
                  onClick={() => {
                    setActiveItem('admin-dashboard');
                    onNavigate('admin-dashboard');
                  }}
                  className={`text-base lg:text-lg transition cursor-pointer ${
                    activeItem === 'admin-dashboard' || currentPage === 'admin-dashboard'
                      ? 'text-white font-bold'
                      : 'text-neutral-300 hover:text-white font-medium'
                  }`}
                >
                  Dashboard
                </button>
                {(activeItem === 'admin-dashboard' || currentPage === 'admin-dashboard') && (
                  <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#D7131D] rounded-full" />
                )}
              </div>
            )}

            {/* Redeemed - Strictly for Normal Users (Disabled/Removed for Admin) */}
            {currentUser?.role !== 'admin' && (
              <div className="relative py-1">
                <button
                  onClick={() => {
                    setActiveItem('redeemed');
                    onNavigate('profile');
                  }}
                  className={`text-base lg:text-lg transition cursor-pointer ${
                    activeItem === 'redeemed' || currentPage === 'profile'
                      ? 'text-white font-bold'
                      : 'text-neutral-300 hover:text-white font-medium'
                  }`}
                >
                  Redeemed
                </button>
                {(activeItem === 'redeemed' || currentPage === 'profile') && (
                  <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#D7131D] rounded-full" />
                )}
              </div>
            )}

            {/* cart - Strictly for Normal Users (Disabled/Removed for Admin) */}
            {currentUser?.role !== 'admin' && (
              <div className="relative py-1">
                <button
                  onClick={() => {
                    setActiveItem('cart');
                    onOpenCart();
                  }}
                  className={`text-base lg:text-lg transition flex items-center gap-1.5 cursor-pointer ${
                    activeItem === 'cart' ? 'text-white font-bold' : 'text-neutral-300 hover:text-white font-medium'
                  }`}
                >
                  <span>cart</span>
                  {cartCount > 0 && (
                    <span className="bg-[#D7131D] text-white text-[11px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center leading-none">
                      {cartCount}
                    </span>
                  )}
                </button>
                {activeItem === 'cart' && (
                  <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#D7131D] rounded-full" />
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Right Side: Red "Brands" Button + Oval "Login" Button from HOME.png */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {/* Red "Brands" Button */}
          <button
            onClick={handleBrandsClick}
            className="bg-[#D7131D] hover:bg-[#B7111A] text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded shadow transition cursor-pointer"
          >
            Brands
          </button>

          {/* White Oval Profile/Login Button with red border */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('profile')}
                className="bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-full border-2 border-[#D7131D] shadow transition flex items-center gap-2 cursor-pointer active:scale-95"
                title="View My Profile, Redeemed History & Saved Coupons"
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.fullName || currentUser.username}
                    className="w-5 h-5 rounded-full object-cover border border-neutral-300 shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                    {(currentUser.fullName || currentUser.username).substring(0, 1).toUpperCase()}
                  </div>
                )}
                <span>
                  {currentUser.fullName || currentUser.username} {currentUser.role === 'admin' ? '👑' : ''}
                </span>
              </button>

              <button
                onClick={onLogout}
                className="text-neutral-400 hover:text-white text-xs font-semibold px-2 py-1 rounded transition hover:bg-neutral-800 cursor-pointer"
                title="Log out"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="bg-white hover:bg-neutral-50 active:scale-95 text-[#D7131D] font-bold text-xs sm:text-sm px-4 py-1 rounded-full border-2 border-[#D7131D] shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <div className="w-4 h-4 rounded-full border border-[#D7131D] flex items-center justify-center text-[#D7131D]">
                <UserIcon size={10} />
              </div>
              <span className="tracking-tight">Login</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => onNavigate('admin-dashboard')}
                  className="text-xs bg-[#D7131D] text-white font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1"
                >
                  <span>Dashboard</span>
                </button>
              )}
              <button
                onClick={() => onNavigate('profile')}
                className="text-xs bg-white text-neutral-900 font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1"
              >
                <UserIcon size={12} />
                <span>Profile</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="text-xs bg-white text-neutral-900 font-bold px-3 py-1.5 rounded-full"
            >
              Login
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-300 hover:text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-neutral-950 border-t border-neutral-800 p-4 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="flex-1 bg-neutral-900 text-white py-2 rounded-lg text-sm font-semibold"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="flex-1 bg-[#B71C1C] text-white py-2 rounded-lg text-sm font-semibold"
            >
              Brands
            </button>
          </div>

          {currentUser ? (
            <>
              {currentUser.role === 'admin' ? (
                <>
                  <button
                    onClick={() => {
                      onNavigate('admin-dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2 px-3 text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg text-sm font-bold flex items-center justify-between"
                  >
                    <span>👑 Admin Dashboard & Summary Statistics</span>
                    <span className="text-[10px] bg-[#D7131D] text-white px-2 py-0.5 rounded-full font-bold">Live</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2 px-3 text-neutral-200 hover:bg-neutral-900 rounded-lg text-sm font-semibold flex items-center gap-2"
                  >
                    <UserIcon size={14} className="text-[#D7131D]" />
                    <span>Admin Profile (Account Details)</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenAddCoupon();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2 px-3 text-neutral-200 hover:bg-neutral-900 rounded-lg text-sm font-semibold flex items-center gap-2"
                  >
                    <Plus size={14} className="text-[#D7131D]" />
                    <span>+Add Coupon</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2.5 px-3 text-white bg-neutral-900 rounded-lg text-sm font-bold flex items-center justify-between"
                  >
                    <span>🎟️ Redeemed Coupons Section</span>
                    <span className="text-[10px] bg-[#D7131D] text-white px-2 py-0.5 rounded-full font-bold">View</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenCart();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2 px-3 text-neutral-200 hover:bg-neutral-900 rounded-lg text-sm font-semibold flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingBag size={14} className="text-[#D7131D]" />
                      <span>Shopping Cart</span>
                    </span>
                    {cartCount > 0 && (
                      <span className="bg-[#D7131D] text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2 px-3 text-neutral-300 hover:bg-neutral-900 rounded-lg text-sm font-medium"
                  >
                    <span>👤 My Profile & Saved Wishlist</span>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 text-red-400 hover:bg-neutral-900 rounded-lg text-sm font-semibold"
              >
                Logout ({currentUser.username})
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                onNavigate('register');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 text-neutral-200 hover:bg-neutral-900 rounded-lg text-sm"
            >
              Register Account
            </button>
          )}
        </div>
      )}

    </header>
  );
};
