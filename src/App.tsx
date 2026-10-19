import React, { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { UserProfileView } from './components/UserProfileView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { Page, User, UserRole } from './types';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('vouchnest_user');
      if (!saved) return null;
      const parsed: User = JSON.parse(saved);
      // Strictly enforce: Only Santhosh is Administrator; all other accounts are normal users
      const isSingleAdmin =
        parsed.email?.toLowerCase() === 'santhoshreddyburra@gmail.com' ||
        parsed.email?.toLowerCase() === 'admin@vouchnest.com' ||
        parsed.username?.toLowerCase() === 'santhosh' ||
        parsed.username?.toLowerCase() === 'santhu';
      return {
        ...parsed,
        role: isSingleAdmin ? 'admin' : 'user',
      };
    } catch {
      return null;
    }
  });
  const [authWarning, setAuthWarning] = useState<string | null>(null);

  const showSecurityWarning = (msg: string) => {
    setAuthWarning(msg);
    setTimeout(() => setAuthWarning(null), 4000);
  };

  // URL / Route Protection for direct access (e.g. #admin, ?page=admin, #add-coupon, etc.)
  useEffect(() => {
    const checkUrlAccess = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const path = window.location.pathname.toLowerCase();

      const isRedeemRequested =
        hash.includes('redeem') ||
        hash.includes('claim') ||
        search.includes('redeem') ||
        search.includes('claim') ||
        path.includes('/redeem') ||
        path.includes('/claim');

      if (isRedeemRequested && currentUser?.role === 'admin') {
        showSecurityWarning('Access Denied: Administrators cannot redeem, claim, or purchase coupons. Admin role is view-only.');
        setCurrentPage('home');
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }

      const isAdminRequested =
        hash.includes('admin') ||
        hash.includes('add-coupon') ||
        search.includes('admin') ||
        search.includes('add-coupon') ||
        path.includes('/admin');

      if (isAdminRequested) {
        if (!currentUser) {
          showSecurityWarning('Access denied: Please log in with Administrator credentials.');
          setCurrentPage('login');
          window.history.replaceState(null, '', window.location.pathname);
        } else if (currentUser.role !== 'admin') {
          showSecurityWarning(
            `Access Denied: Administrator privileges required. Your current account role is "${currentUser.role}".`
          );
          setCurrentPage('home');
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    };

    checkUrlAccess();
    window.addEventListener('hashchange', checkUrlAccess);
    window.addEventListener('popstate', checkUrlAccess);
    return () => {
      window.removeEventListener('hashchange', checkUrlAccess);
      window.removeEventListener('popstate', checkUrlAccess);
    };
  }, [currentUser]);

  const handleNavigate = (page: Page) => {
    // Role protection on internal page routing
    if (page === 'admin-dashboard' || page === 'admin-login') {
      if (currentUser?.role !== 'admin') {
        showSecurityWarning('Access Denied: Only users with the "admin" role can access Admin pages.');
        setCurrentPage('home');
        return;
      }
    }

    if (page === 'profile' && !currentUser) {
      const hasClaims = localStorage.getItem('vouchnest_user_claims') || localStorage.getItem('vouchnest_claimed_deals');
      if (hasClaims) {
        const memberUser: User = {
          username: 'Member',
          fullName: 'VouchNest Member',
          email: 'user@vouchnest.com',
          role: 'user',
        };
        setCurrentUser(memberUser);
        localStorage.setItem('vouchnest_user', JSON.stringify(memberUser));
        setCurrentPage('profile');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      showSecurityWarning('Please sign in to view your profile, redeemed history, and saved coupons.');
      setCurrentPage('login');
      return;
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (userOrUsername: User | string) => {
    let userObj: User;
    if (typeof userOrUsername === 'string') {
      const isMasterAdmin =
        userOrUsername.toLowerCase() === 'admin' ||
        userOrUsername.toLowerCase() === 'administrator';
      const role: UserRole = isMasterAdmin ? 'admin' : 'user';
      userObj = {
        username: userOrUsername,
        email: `${userOrUsername.toLowerCase().replace(/\s+/g, '')}@vouchnest.com`,
        role,
      };
    } else {
      userObj = userOrUsername;
    }

    const isSingleAdmin =
      userObj.email?.toLowerCase() === 'santhoshreddyburra@gmail.com' ||
      userObj.email?.toLowerCase() === 'admin@vouchnest.com' ||
      userObj.username?.toLowerCase() === 'santhosh' ||
      userObj.username?.toLowerCase() === 'santhu';

    userObj.role = isSingleAdmin ? 'admin' : 'user';

    setCurrentUser(userObj);
    localStorage.setItem('vouchnest_user', JSON.stringify(userObj));
    if (userObj.token) {
      localStorage.setItem('vouchnest_token', userObj.token);
    }

    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegisterSuccess = (user: User) => {
    // Strictly enforce role: 'user' for all newly registered accounts
    const normalUser: User = {
      ...user,
      role: 'user',
    };
    setCurrentUser(normalUser);
    localStorage.setItem('vouchnest_user', JSON.stringify(normalUser));
    if (normalUser.token) {
      localStorage.setItem('vouchnest_token', normalUser.token);
    }
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('vouchnest_user');
    localStorage.removeItem('vouchnest_token');
    try {
      fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-[#D7131D] selection:text-white">
      {/* Real-time RBAC Security Alert Banner */}
      {authWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[90%] bg-neutral-950 text-white border-2 border-[#D7131D] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm animate-bounce">
          <ShieldAlert size={20} className="text-[#D7131D] shrink-0" />
          <span className="font-semibold">{authWarning}</span>
        </div>
      )}

      {currentPage === 'home' && (
        <HomePage
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'login' && (
        <LoginPage
          onNavigate={handleNavigate}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {currentPage === 'register' && (
        <RegisterPage
          onNavigate={handleNavigate}
          onRegisterSuccess={handleRegisterSuccess}
        />
      )}

      {currentPage === 'admin-dashboard' && (
        <AdminDashboardView
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'profile' && (
        <UserProfileView
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onUpdateCurrentUser={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem('vouchnest_user', JSON.stringify(updated));
          }}
        />
      )}
    </div>
  );
}
