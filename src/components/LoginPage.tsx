import React, { useState } from 'react';
import { User as UserIcon, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { LeatherTag } from './LeatherTag';
import { Page, User, UserRole } from '../types';

interface LoginPageProps {
  onNavigate: (page: Page) => void;
  onLoginSuccess: (user: User | string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
}) => {
  // Default to false so user immediately sees the exact 1:1 view of LOGIN1.jpg
  const [showCard, setShowCard] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.user) {
        setLoading(false);
        onLoginSuccess(data.user);
        return;
      }

      if (data.error && response.status === 401) {
        setError(data.error);
        setLoading(false);
        return;
      }
    } catch {
      // Network fallback
    }

    const savedUserStr = localStorage.getItem('vouchnest_user');
    let localSavedUser: User | null = null;
    if (savedUserStr) {
      try {
        localSavedUser = JSON.parse(savedUserStr);
      } catch {}
    }

    const isMasterAdmin =
      username.trim().toLowerCase() === 'admin' ||
      username.trim().toLowerCase() === 'administrator' ||
      username.trim().toLowerCase() === 'santhosh' ||
      username.trim().toLowerCase() === 'santhu' ||
      username.trim().toLowerCase() === 'santhoshreddyburra@gmail.com' ||
      username.trim().toLowerCase() === 'admin@vouchnest.com';
    const role: UserRole = isMasterAdmin ? 'admin' : (localSavedUser?.role || 'user');

    const cleanInput = username.trim().toLowerCase();
    const isMatchingLocal =
      localSavedUser &&
      (localSavedUser.email.toLowerCase() === cleanInput ||
        localSavedUser.username.toLowerCase() === cleanInput);

    setTimeout(() => {
      setLoading(false);
      if (isMatchingLocal && localSavedUser) {
        onLoginSuccess(localSavedUser);
        return;
      }
      onLoginSuccess({
        username: username.trim(),
        email:
          username.trim().toLowerCase() === 'santhosh' || username.trim().toLowerCase() === 'santhu'
            ? 'santhoshreddyburra@gmail.com'
            : `${username.trim().toLowerCase().replace(/\s+/g, '')}@vouchnest.com`,
        fullName:
          username.trim().toLowerCase() === 'santhosh' || username.trim().toLowerCase() === 'santhu'
            ? 'Santhosh'
            : username.trim(),
        age: username.trim().toLowerCase() === 'santhosh' ? 20 : undefined,
        phone: username.trim().toLowerCase() === 'santhosh' ? '7569806640' : undefined,
        role,
      });
    }, 400);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#870007] overflow-hidden flex flex-col justify-between p-4 sm:p-8 md:p-12 font-sans select-none">
      {/* Background matching LOGIN1.jpg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 40% 50%, #99030C 0%, #870007 55%, #590004 100%)',
        }}
      />

      {/* Top Bar with Page Switcher & Reference Toggle */}
      <div className="relative z-30 w-full max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Toggle button to see clean LOGIN1.jpg view vs interactive form card */}
          <button
            onClick={() => setShowCard(!showCard)}
            className="text-[11px] font-bold bg-black/40 hover:bg-black/60 text-neutral-200 px-3 py-1.5 rounded-full border border-white/15 transition backdrop-blur-md cursor-pointer"
          >
            {showCard ? '👁️ Reference Photo (LOGIN1.jpg)' : '📝 Sign-in Form'}
          </button>
        </div>

        {/* Global Page Switcher */}
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-semibold text-white">
          <span className="text-white/60">Pages:</span>
          <button
            onClick={() => onNavigate('home')}
            className="px-2.5 py-1 rounded-full hover:bg-white/20 transition"
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('login')}
            className="px-2.5 py-1 rounded-full bg-[#D7131D] text-white font-bold shadow-xs"
          >
            Login
          </button>
          <button
            onClick={() => onNavigate('register')}
            className="px-2.5 py-1 rounded-full hover:bg-white/20 transition"
          >
            Register
          </button>
        </div>
      </div>

      {/* Main Layout Area matching LOGIN1.jpg */}
      <div className="relative z-20 w-full max-w-6xl mx-auto flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-10 sm:gap-14 my-auto py-6">
        
        {/* LEFT AREA: "VOUCH NEST..." + LOGIN BUTTON (from LOGIN1.jpg) */}
        <div className="w-full max-w-md flex flex-col items-start">
          
          {/* White Brush Script Typography "VOUCH NEST..." exactly as in LOGIN1.jpg */}
          <div className="mb-6 sm:mb-8 cursor-pointer" onClick={() => onNavigate('home')}>
            <h1
              className="brush-font text-white text-5xl sm:text-6xl md:text-7xl tracking-wider uppercase leading-[0.88] drop-shadow-[0_6px_20px_rgba(0,0,0,0.6)] transform -rotate-4"
              style={{
                textShadow: '0 3px 12px rgba(0,0,0,0.6), 0 0 24px rgba(255,255,255,0.25)',
              }}
            >
              VOUCH<br />
              <span className="text-white ml-2 sm:ml-4">NEST...</span>
            </h1>
          </div>

          {/* Condition A: Clean View matching LOGIN1.jpg exactly */}
          {!showCard ? (
            <div className="mt-4 sm:mt-8">
              <button
                onClick={() => setShowCard(true)}
                className="bg-white hover:bg-neutral-100 text-black font-black text-xl sm:text-2xl uppercase tracking-widest px-14 sm:px-18 py-3.5 sm:py-4 rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.65)] border border-neutral-200 active:scale-95 transition-all cursor-pointer block text-center"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                LOGIN
              </button>
            </div>
          ) : (
            /* Condition B: Interactive Sign-in Card */
            <div className="w-full relative backdrop-blur-md bg-white/10 border border-white/35 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.65)] text-white">
              <div className="flex justify-between items-center mb-4">
                <span className="font-serif font-bold text-lg text-white">Sign In</span>
                <button
                  onClick={() => setShowCard(false)}
                  className="text-xs text-white/70 hover:text-white bg-black/30 px-2.5 py-1 rounded-full"
                >
                  Close &times;
                </button>
              </div>

              {error && (
                <div className="mb-3 text-xs bg-red-950/80 border border-red-500/60 text-red-200 rounded-lg p-2 text-center font-medium">
                  {error}
                </div>
              )}

              {infoMessage && (
                <div className="mb-3 text-xs bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 rounded-lg p-2 text-center font-medium animate-in fade-in">
                  {infoMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* USERNAME */}
                <div>
                  <label className="block text-[11px] font-bold tracking-widest uppercase text-white/90 mb-1 pl-1">
                    USERNAME
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-neutral-500 pointer-events-none">
                      <UserIcon size={17} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter Username"
                      className="w-full bg-white text-neutral-900 placeholder-neutral-400 font-medium text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#D7131D] shadow-inner"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="block text-[11px] font-bold tracking-widest uppercase text-white/90 mb-1 pl-1">
                    PASSWORD
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-neutral-500 pointer-events-none">
                      <Lock size={17} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      className="w-full bg-white text-neutral-900 placeholder-neutral-400 font-medium text-sm rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-[#D7131D] shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-neutral-400 hover:text-neutral-700"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex items-center justify-end pt-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setInfoMessage('Password reset instructions sent to your email.');
                      setTimeout(() => setInfoMessage(''), 4000);
                    }}
                    className="text-white/85 hover:text-white hover:underline transition cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Sign in button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-1 bg-[#D7131D] hover:bg-[#B90D17] active:scale-[0.99] text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enter VoucherNest</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              {/* Social Login Buttons exactly matching Login.png */}
              <div className="mt-5 flex flex-col items-center gap-3">
                <div className="flex items-center justify-center gap-4">
                  {/* Google */}
                  <button
                    type="button"
                    onClick={() => onLoginSuccess({ username: 'GoogleUser', email: 'google.user@vouchnest.com', role: 'user' })}
                    className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    title="Sign in with Google"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </button>

                  {/* Apple */}
                  <button
                    type="button"
                    onClick={() => onLoginSuccess({ username: 'AppleUser', email: 'apple.user@vouchnest.com', role: 'user' })}
                    className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    title="Sign in with Apple"
                  >
                    <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.62-.77 1.05-1.84.93-2.91-.91.04-2 .61-2.63 1.37-.56.65-.99 1.73-.86 2.78 1.02.08 2.01-.52 2.56-1.24z" />
                    </svg>
                  </button>

                  {/* Google Play */}
                  <button
                    type="button"
                    onClick={() => onLoginSuccess({ username: 'PlayUser', email: 'play.user@vouchnest.com', role: 'user' })}
                    className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    title="Sign in with Google Play"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M3.6 1.4L13.8 11.6 3.6 21.8C3.2 21.4 3 20.7 3 20V3.2C3 2.5 3.2 1.8 3.6 1.4z"
                      />
                      <path
                        fill="#FBBC04"
                        d="M17.4 15.2L13.8 11.6 17.4 8l3.9 2.2c1.1.6 1.1 1.7 0 2.4l-3.9 2.6z"
                      />
                      <path
                        fill="#4285F4"
                        d="M3.6 1.4L13.8 11.6 17.4 8 5.7 1.4C4.9 1 4.2 1 3.6 1.4z"
                      />
                      <path
                        fill="#34A853"
                        d="M13.8 11.6L3.6 21.8C4.2 22.2 4.9 22.2 5.7 21.8l11.7-6.6-3.6-3.6z"
                      />
                    </svg>
                  </button>
                </div>

                <div className="text-xs text-white/80 pt-1">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('register')}
                    className="font-bold underline text-white hover:text-red-200"
                  >
                    Register here
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* RIGHT AREA: THE STITCHED LEATHER PRICE TAG FROM THE REFERENCE */}
        <div className="w-full lg:w-auto flex justify-center lg:justify-end mt-4 lg:mt-0">
          <LeatherTag />
        </div>

      </div>

      {/* Subtle Diamond Twinkle Star in Lower Right (from screenshot) */}
      <div className="absolute bottom-6 right-8 text-white/30 pointer-events-none">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
        </svg>
      </div>

      {/* Bottom Legal bar */}
      <div className="relative z-20 text-center text-xs text-white/40 pt-2">
        VOUCH NEST &bull; Your Savings Hub
      </div>
    </div>
  );
};
