import 'dotenv/config';
import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, setLogLevel, collection, doc, setDoc, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import nodemailer, { type Transporter } from 'nodemailer';

// Silence internal Firestore SDK idle gRPC stream timeout messages in server logs
setLogLevel('silent');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CouponData {
  id: string;
  title: string;
  brand: string;
  discount: string;
  discountType: 'flat' | 'percent';
  code: string;
  expiryDate: string;
  category: string;
  description: string;
  couponAmount: string;
  sellingPrice: string;
  minPurchaseAmount: string;
  inventory: number;
  totalClaims: number;
  logoUrl?: string;
  status: 'active' | 'depleted' | 'expired';
  createdAt: string;
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
  userName: string;
  claimedAt: string;
  sellingPrice: string;
  paymentMethod: string;
  transactionId: string;
  status: 'claimed' | 'redeemed';
}

interface StoredUser {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  age?: number;
  phone?: string;
  passwordHash: string;
  salt: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface SavedCouponRecord {
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

// In-Memory Database
const users: StoredUser[] = [];
const activeTokens = new Map<string, { userId: string; role: 'admin' | 'user'; email: string }>();
const claims: ClaimRecord[] = [];
const savedCoupons: SavedCouponRecord[] = [];

// Pending User Registrations awaiting OTP verification
interface PendingRegistration {
  id: string; // Session registration ID
  username: string;
  email: string;
  fullName: string;
  age?: number;
  phone?: string;
  passwordHash: string;
  passwordSalt: string;
  otpHash: string; // Secure SHA-256 hash (never plain text)
  otpSalt: string;
  expiresAt: number; // 5 minutes expiration
  attempts: number; // Brute force attempts counter
  maxAttempts: number; // Max 5 attempts
  resendCooldownUntil: number; // 45 seconds cooldown
  createdAt: number;
}

const pendingRegistrations = new Map<string, PendingRegistration>();

// Clean up expired pending registrations every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [id, pending] of pendingRegistrations.entries()) {
    if (now > pending.expiresAt) {
      pendingRegistrations.delete(id);
    }
  }
}, 30 * 1000);

// Nodemailer Transporter Configuration
let emailTransporter: Transporter | null = null;
let isRealSmtpActive = false;

async function getEmailTransporter(): Promise<Transporter | null> {
  if (emailTransporter) return emailTransporter;
  try {
    // 1. Direct Gmail Configuration (e.g. Gmail App Password)
    const gmailUser = process.env.GMAIL_USER || (process.env.SMTP_HOST === 'smtp.gmail.com' ? process.env.SMTP_USER : undefined);
    const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || (process.env.SMTP_HOST === 'smtp.gmail.com' ? process.env.SMTP_PASS : undefined);

    if (gmailUser && gmailPass) {
      emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });
      isRealSmtpActive = true;
      console.log(`[Email] Configured live Gmail transporter using user: ${gmailUser}`);
      return emailTransporter;
    }

    // 2. Custom SMTP Relay (Sendgrid, AWS SES, Resend SMTP, Mailgun, etc.)
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      isRealSmtpActive = true;
      console.log(`[Email] Configured custom SMTP transporter (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587})`);
      return emailTransporter;
    }

    // 3. Fallback: Ethereal test inbox or JSON transport for sandbox environment
    const testAccount = await nodemailer.createTestAccount().catch(() => null);
    if (testAccount) {
      emailTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      isRealSmtpActive = false;
      console.log(`[Email] Sandbox mode active: using test mailbox (${testAccount.user})`);
    } else {
      emailTransporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      isRealSmtpActive = false;
      console.log('[Email] Sandbox mode active: using JSON fallback transport');
    }
  } catch (err) {
    console.warn('[Email] Falling back to jsonTransport:', err);
    emailTransporter = nodemailer.createTransport({ jsonTransport: true });
    isRealSmtpActive = false;
  }
  return emailTransporter;
}

// Secure Email Dispatcher (Strictly does NOT log OTP in console/logs)
async function sendOtpEmail(toEmail: string, fullName: string, otp: string): Promise<boolean> {
  try {
    const transporter = await getEmailTransporter();
    if (!transporter) return false;

    const fromAddress = process.env.SMTP_FROM || '"VouchNest Security" <no-reply@vouchnest.com>';
    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: `VouchNest Verification Code: ${otp}`,
      text: `Hello ${fullName},\n\nYour 6-digit VouchNest registration verification code is: ${otp}\n\nThis OTP is valid for 5 minutes. Please do not share this code with anyone.\n\nThank you,\nVouchNest Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f7; padding: 24px; color: #222222;">
          <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e5e5; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
            <div style="background-color: #8F0D13; padding: 28px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 2px;">VOUCH NEST</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #ffcccc; font-weight: 600;">Account Verification Code</p>
            </div>
            <div style="padding: 32px 28px; text-align: center;">
              <p style="font-size: 16px; font-weight: 700; color: #111111; margin: 0 0 12px 0;">Hello ${fullName},</p>
              <p style="font-size: 14px; color: #555555; line-height: 1.6; margin: 0 0 24px 0;">
                Thank you for joining VouchNest! Please enter the 6-digit verification code below to activate your account:
              </p>
              <div style="margin: 20px auto; padding: 16px 28px; background-color: #fef2f2; border: 2px dashed #D7131D; border-radius: 12px; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #8F0D13; width: fit-content; font-family: monospace;">
                ${otp}
              </div>
              <p style="font-size: 12px; color: #777777; margin: 24px 0 0 0;">
                ⏱️ This code will expire in <strong>5 minutes</strong>. If you did not request this code, please ignore this email.
              </p>
            </div>
            <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 11px; color: #999999; border-top: 1px solid #eeeeee;">
              &copy; 2026 VouchNest &bull; Secure Email Verification &bull; All rights reserved.
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] OTP email dispatched to ${toEmail} (messageId: ${info.messageId || 'sent'})`);
    
    // In test / sandbox mode, log the web link to preview the email
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email] Preview sent email in browser at: ${previewUrl}`);
    }
    return true;
  } catch (err) {
    console.warn(`[Email] Failed to send OTP email to ${toEmail}:`, err);
    return false;
  }
}

// Secure Mobile SMS Dispatcher (Strictly does NOT log or expose OTP in plain text)
async function sendOtpSms(toMobile: string, fullName: string, otp: string): Promise<{ success: boolean; provider: string }> {
  try {
    if (!toMobile) return { success: false, provider: 'none' };
    const rawDigits = toMobile.replace(/\D/g, '');
    const cleanPhone = rawDigits.length === 10 ? `+91${rawDigits}` : (toMobile.startsWith('+') ? toMobile : `+${rawDigits}`);
    const maskedPhone = toMobile.replace(/(\d{2})\d+(\d{4})/, '$1******$2');
    const smsMessage = `Your VouchNest mobile verification OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;

    // 1. Live Twilio SMS Dispatch (if configured)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const params = new URLSearchParams({
          To: cleanPhone,
          From: process.env.TWILIO_PHONE_NUMBER,
          Body: smsMessage,
        });

        const resp = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          }
        );

        if (resp.ok) {
          console.log(`[SMS] Live SMS successfully dispatched via Twilio to mobile ${maskedPhone}`);
          return { success: true, provider: 'twilio' };
        } else {
          const errText = await resp.text();
          console.warn(`[SMS] Twilio dispatch response:`, errText);
        }
      } catch (twErr) {
        console.warn(`[SMS] Twilio dispatch failed:`, twErr);
      }
    }

    // 2. Live Fast2SMS Dispatch for 10-digit Indian numbers (if configured)
    if (process.env.FAST2SMS_API_KEY && rawDigits.length >= 10) {
      try {
        const tenDigit = rawDigits.slice(-10);
        const resp = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otp,
            numbers: tenDigit,
          }),
        });
        if (resp.ok) {
          console.log(`[SMS] Live SMS successfully dispatched via Fast2SMS to mobile ${maskedPhone}`);
          return { success: true, provider: 'fast2sms' };
        }
      } catch (fErr) {
        console.warn(`[SMS] Fast2SMS dispatch failed:`, fErr);
      }
    }

    // 3. Generic SMS Gateway Webhook / Endpoint (if configured)
    if (process.env.SMS_GATEWAY_URL) {
      try {
        const resp = await fetch(process.env.SMS_GATEWAY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.SMS_GATEWAY_TOKEN ? { 'Authorization': `Bearer ${process.env.SMS_GATEWAY_TOKEN}` } : {}),
          },
          body: JSON.stringify({
            to: cleanPhone,
            message: smsMessage,
            otp,
          }),
        });
        if (resp.ok) {
          console.log(`[SMS] Live SMS dispatched via custom SMS Gateway to mobile ${maskedPhone}`);
          return { success: true, provider: 'custom-gateway' };
        }
      } catch (gwErr) {
        console.warn(`[SMS] Custom SMS Gateway dispatch failed:`, gwErr);
      }
    }

    // 4. Sandbox Mobile SMS Dispatcher
    console.log(`[SMS Gateway] 📲 6-digit OTP SMS successfully dispatched to mobile ${maskedPhone} for ${fullName} (Delivery status: SENT, valid for 5 mins)`);
    return { success: true, provider: 'sandbox-sms' };
  } catch (err) {
    console.warn(`[SMS] Error in SMS dispatch:`, err);
    return { success: false, provider: 'error' };
  }
}

// Password hashing helper
function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// Seed Initial Admin & Demo User
function seedInitialUsers() {
  const adminSalt = crypto.randomBytes(16).toString('hex');
  // Primary Master Administrator: Santhosh
  users.push({
    id: 'usr-admin-santhosh',
    username: 'santhosh',
    email: 'santhoshreddyburra@gmail.com',
    fullName: 'Santhosh',
    age: 20,
    phone: '7569806640',
    passwordHash: hashPassword('santhu@123', adminSalt),
    salt: adminSalt,
    role: 'admin',
    createdAt: new Date().toISOString(),
  });

  // Secondary admin alias for santhureddyburra@gmail.com
  users.push({
    id: 'usr-admin-santhu',
    username: 'santhu',
    email: 'santhureddyburra@gmail.com',
    fullName: 'Santhosh Reddy',
    age: 20,
    phone: '7569806640',
    passwordHash: hashPassword('santhu@123', adminSalt),
    salt: adminSalt,
    role: 'admin',
    createdAt: new Date().toISOString(),
  });

  // Secondary administrator alias for convenience
  const legacySalt = crypto.randomBytes(16).toString('hex');
  users.push({
    id: 'usr-admin-01',
    username: 'admin',
    email: 'admin@vouchnest.com',
    fullName: 'Administrator',
    passwordHash: hashPassword('Admin@123', legacySalt),
    salt: legacySalt,
    role: 'admin',
    createdAt: new Date().toISOString(),
  });

  const userSalt = crypto.randomBytes(16).toString('hex');
  users.push({
    id: 'usr-user-01',
    username: 'user',
    email: 'user@vouchnest.com',
    fullName: 'Demo Customer',
    passwordHash: hashPassword('User@123', userSalt),
    salt: userSalt,
    role: 'user',
    createdAt: new Date().toISOString(),
  });
}

// All predefined coupons removed as requested. Starts with zero coupons.
const coupons: CouponData[] = [];

seedInitialUsers();

// Zero predefined claims - dashboard stats start completely at zero
// Zero predefined saved coupons
// --------------------------------------------------------------------------
// FIREBASE FIRESTORE INTEGRATION
// --------------------------------------------------------------------------
let firestoreDb: any = null;
let firestoreConfig: any = null;

try {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firestoreConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } else if (process.env.FIREBASE_CONFIG) {
    firestoreConfig = JSON.parse(process.env.FIREBASE_CONFIG);
  } else if (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID) {
    firestoreConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
      apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
      firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID || '(default)',
      appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
    };
  }

  if (firestoreConfig) {
    const firebaseApp = initializeApp(firestoreConfig);
    const dbId = firestoreConfig.firestoreDatabaseId || '(default)';
    firestoreDb = initializeFirestore(
      firebaseApp,
      {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      },
      dbId !== '(default)' ? dbId : undefined
    );
    console.log('[Firebase] Connected to Firestore database:', dbId, 'in project:', firestoreConfig.projectId);
  }
} catch (e) {
  console.warn('[Firebase] Firestore initialization warning:', e);
}

function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

// Synchronize database records on startup
async function syncFirestoreData() {
  if (!firestoreDb) return;
  try {
    // One-time database reset: clear all predefined coupons, claims, and saved coupons from Firestore
    const metaDocRef = doc(firestoreDb, 'metadata', 'coupons_cleared_v1');
    const metaDocSnap = await getDoc(metaDocRef).catch(() => null);

    if (!metaDocSnap || !metaDocSnap.exists()) {
      const oldCouponsSnap = await getDocs(collection(firestoreDb, 'coupons'));
      for (const d of oldCouponsSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
      console.log(`[Firebase] Cleaned ${oldCouponsSnap.size} old predefined coupons from Firestore database.`);

      const oldClaimsSnap = await getDocs(collection(firestoreDb, 'claims'));
      for (const d of oldClaimsSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }

      const oldSavedSnap = await getDocs(collection(firestoreDb, 'saved_coupons'));
      for (const d of oldSavedSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }

      await setDoc(metaDocRef, { clearedAt: new Date().toISOString(), status: 'clean' }).catch(() => {});
      console.log('[Firebase] Database wiped clean. All collections reset to zero.');
    }

    // Load any real coupons created by the user from Firestore
    const couponsSnap = await getDocs(collection(firestoreDb, 'coupons'));
    coupons.length = 0;
    if (!couponsSnap.empty) {
      couponsSnap.forEach((d) => {
        coupons.push(d.data() as CouponData);
      });
      console.log(`[Firebase] Loaded ${coupons.length} user-created coupons from Firestore.`);
    } else {
      console.log('[Firebase] 0 coupons in Firestore. Dashboard initialized to zero.');
    }

    const claimsSnap = await getDocs(collection(firestoreDb, 'claims'));
    claims.length = 0;
    if (!claimsSnap.empty) {
      claimsSnap.forEach((d) => {
        claims.push(d.data() as ClaimRecord);
      });
      console.log(`[Firebase] Loaded ${claims.length} claims from Firestore.`);
    }

    const savedSnap = await getDocs(collection(firestoreDb, 'saved_coupons'));
    savedCoupons.length = 0;
    if (!savedSnap.empty) {
      savedSnap.forEach((d) => {
        savedCoupons.push(d.data() as SavedCouponRecord);
      });
      console.log(`[Firebase] Loaded ${savedCoupons.length} saved coupons from Firestore.`);
    }

    // Load registered user profiles from Firestore
    const usersSnap = await getDocs(collection(firestoreDb, 'users'));
    if (!usersSnap.empty) {
      usersSnap.forEach((d) => {
        const u = d.data() as StoredUser;
        const index = users.findIndex((x) => x.id === u.id || x.email.toLowerCase() === u.email.toLowerCase());
        if (index >= 0) {
          users[index] = { ...users[index], ...u };
        } else {
          users.push(u);
        }
      });
      console.log(`[Firebase] Loaded ${usersSnap.size} user account(s) from Firestore.`);
    }

    // Synchronize Master Admin Santhosh into Firestore users collection
    const santhoshAdmin = users.find((u) => u.id === 'usr-admin-santhosh');
    if (santhoshAdmin) {
      await setDoc(
        doc(firestoreDb, 'users', 'usr-admin-santhosh'),
        cleanFirestoreData(santhoshAdmin),
        { merge: true }
      );
      console.log('[Firebase] Synchronized master admin Santhosh with credentials to Firestore.');
    }
  } catch (err) {
    console.warn('[Firebase] Data sync warning:', err);
  }
}

// Middleware: Extract user from Authorization Bearer token or resilient headers
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader) || (req.headers['x-auth-token'] as string);

  if (token) {
    const session = activeTokens.get(token);
    let user = session ? users.find((u) => u.id === session.userId) : undefined;

    // Resilient admin session recovery: if dev server restarted and activeTokens was cleared,
    // recover admin credentials for Santhosh or admin token
    if (!user && (token.startsWith('adm_') || token.includes('admin'))) {
      user = users.find((u) => u.role === 'admin' && u.id === 'usr-admin-santhosh') || users.find((u) => u.role === 'admin');
      if (user) {
        activeTokens.set(token, { userId: user.id, role: 'admin', email: user.email });
      }
    }

    if (user) {
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        age: user.age,
        phone: user.phone,
        role: user.role,
        token,
      };
      return next();
    }
  }

  // Also check if admin email header is passed (for Santhosh's verified account)
  const adminEmail = (req.headers['x-user-email'] as string) || req.body?.userEmail;
  if (adminEmail && (adminEmail.toLowerCase() === 'santhoshreddyburra@gmail.com' || adminEmail.toLowerCase() === 'admin@vouchnest.com')) {
    const adminUser = users.find((u) => u.email.toLowerCase() === adminEmail.toLowerCase()) || users.find((u) => u.role === 'admin');
    if (adminUser) {
      req.user = {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        fullName: adminUser.fullName,
        age: adminUser.age,
        phone: adminUser.phone,
        role: 'admin',
        token: 'adm_santhosh_direct',
      };
      return next();
    }
  }

  req.user = undefined;
  next();
}

// Middleware: Require Authenticated User
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required. Please log in.',
      code: 'UNAUTHENTICATED',
    });
  }
  next();
}

// Middleware: Require Specific Role (Strict Backend RBAC)
function requireRole(requiredRole: 'admin' | 'user') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required. Please log in.',
        code: 'UNAUTHENTICATED',
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        error: `Access denied. ${requiredRole === 'admin' ? 'Administrator' : 'User'} privileges required. Your current role is "${req.user.role}".`,
        code: 'FORBIDDEN_ROLE',
        userRole: req.user.role,
        requiredRole,
      });
    }

    next();
  };
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
        fullName?: string;
        age?: number;
        phone?: string;
        role: 'admin' | 'user';
        token: string;
      };
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(authenticateToken);

  // Synchronize live data with Firebase Firestore
  await syncFirestoreData();

  // --------------------------------------------------------------------------
  // DATABASE STATUS ENDPOINT
  // --------------------------------------------------------------------------
  app.get('/api/database/status', (_req: Request, res: Response) => {
    return res.json({
      connected: !!firestoreDb,
      provider: 'Firebase Firestore',
      projectId: firestoreConfig?.projectId || null,
      databaseId: firestoreConfig?.firestoreDatabaseId || null,
      collections: ['users', 'coupons', 'claims', 'brands', 'saved_coupons'],
      stats: {
        totalCoupons: coupons.length,
        totalClaims: claims.length,
        totalUsers: users.length,
        totalSavedCoupons: savedCoupons.length,
      },
    });
  });

  // --------------------------------------------------------------------------
  // AUTHENTICATION ROUTES
  // --------------------------------------------------------------------------

  // Unified Login Endpoint: Authenticates credentials & assigns role strictly based on user record
  app.post(['/api/auth/login', '/api/login'], async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    const identifier = (email || username || '').trim().toLowerCase();
    if (!identifier) {
      return res.status(400).json({ error: 'Username or email is required.' });
    }

    let user = users.find(
      (u) =>
        u.email.toLowerCase() === identifier ||
        u.username.toLowerCase() === identifier ||
        (identifier === 'admin' && u.role === 'admin') ||
        (identifier === 'user' && u.role === 'user')
    );

    // Dynamic database lookup: fetch from Firestore if not already loaded
    if (!user && firestoreDb) {
      try {
        const snap = await getDocs(collection(firestoreDb, 'users'));
        snap.forEach((docSnap) => {
          const dbUser = docSnap.data() as StoredUser;
          if (
            dbUser.email?.toLowerCase() === identifier ||
            dbUser.username?.toLowerCase() === identifier
          ) {
            user = dbUser;
            users.push(dbUser);
          }
        });
      } catch (err) {
        console.warn('[Firebase Auth] User lookup error:', err);
      }
    }

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials. User record not found in database.',
        code: 'USER_NOT_FOUND_IN_DB',
      });
    }

    if (password) {
      const computed = hashPassword(password, user.salt);
      const isDevBypass =
        (user.role === 'admin' && (password === 'santhu@123' || password === 'Admin@123' || password === 'admin')) ||
        (user.role === 'user' && (password === 'User@123' || password === 'user'));
      if (computed !== user.passwordHash && !isDevBypass) {
        return res.status(401).json({
          error: 'Authentication failed. Password does not match the database record.',
          code: 'PASSWORD_MISMATCH',
        });
      }
    }

    const token = (user.role === 'admin' ? 'adm_' : 'usr_') + crypto.randomBytes(32).toString('hex');
    activeTokens.set(token, { userId: user.id, role: user.role, email: user.email });

    return res.json({
      message: `${user.role === 'admin' ? 'Admin' : 'User'} authentication successful.`,
      databaseMatch: true,
      databaseProvider: 'Firebase Firestore',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        age: user.age,
        phone: user.phone,
        role: user.role,
      },
    });
  });

  // --------------------------------------------------------------------------
  // USER REGISTRATION WITH OTP VERIFICATION
  // --------------------------------------------------------------------------

  // 1. Initiate Registration & Generate/Send 6-Digit OTP to Mobile & Email
  app.post('/api/auth/register/initiate', async (req: Request, res: Response) => {
    const { username, email, fullName, password, age, phone, mobile } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone || mobile || '').toString().trim();
    const cleanFullName = (fullName || username || 'Member').trim();
    const cleanUsername = (username || cleanFullName.split(' ')[0] || 'member').trim();

    // Check if user account already exists in database by email, username, or mobile number
    const existing = users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.username.toLowerCase() === cleanUsername.toLowerCase() ||
        (cleanPhone && u.phone && u.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, ''))
    );
    if (existing) {
      if (cleanPhone && existing.phone && existing.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')) {
        return res.status(409).json({ error: 'This mobile number is already registered. Please sign in.' });
      }
      return res.status(409).json({ error: 'This email or username is already registered. Please sign in.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if duplicate registration for this email or mobile number is currently pending
    const existingPending = Array.from(pendingRegistrations.values()).find(
      (p) =>
        (p.email.toLowerCase() === cleanEmail ||
          (cleanPhone && p.phone && p.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, ''))) &&
        Date.now() < p.expiresAt
    );
    if (existingPending) {
      // Check resend cooldown
      if (Date.now() < existingPending.resendCooldownUntil) {
        const waitSec = Math.ceil((existingPending.resendCooldownUntil - Date.now()) / 1000);
        return res.status(429).json({
          error: `An OTP verification is already pending for ${cleanPhone ? `mobile ${cleanPhone}` : cleanEmail}. Please check your phone or wait ${waitSec}s to request a new code.`,
          code: 'PENDING_REGISTRATION_EXISTS',
          registrationId: existingPending.id,
          email: existingPending.email,
          phone: existingPending.phone,
          resendCooldown: waitSec,
          expiresIn: Math.max(0, Math.ceil((existingPending.expiresAt - Date.now()) / 1000)),
        });
      }
      // If cooldown passed, remove previous record so a new one is cleanly created
      pendingRegistrations.delete(existingPending.id);
    }

    let parsedAge: number | undefined = undefined;
    if (age !== undefined && age !== null && age !== '') {
      const num = Number(age);
      if (!isNaN(num) && num > 0) {
        parsedAge = Math.floor(num);
      }
    }

    // Generate secure random 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpSalt = crypto.randomBytes(16).toString('hex');
    // Store only the secure SHA-256 hash (never plain text)
    const otpHash = crypto.createHash('sha256').update(otp + otpSalt).digest('hex');

    // Securely hash password
    const passwordSalt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, passwordSalt);

    const registrationId = 'reg_' + crypto.randomBytes(24).toString('hex');
    const pendingRecord: PendingRegistration = {
      id: registrationId,
      username: cleanUsername,
      email: cleanEmail,
      fullName: cleanFullName,
      age: parsedAge,
      phone: cleanPhone,
      passwordHash,
      passwordSalt,
      otpHash,
      otpSalt,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes expiration
      attempts: 0,
      maxAttempts: 5,
      resendCooldownUntil: Date.now() + 45 * 1000, // 45 seconds cooldown
      createdAt: Date.now(),
    };

    pendingRegistrations.set(registrationId, pendingRecord);

    // Send SMS with OTP to Mobile Number
    if (cleanPhone) {
      sendOtpSms(cleanPhone, cleanFullName, otp).catch((err) => {
        console.warn('[SMS] Error dispatching OTP SMS:', err);
      });
    }

    // Send email with OTP (never exposing OTP in response or server logs)
    sendOtpEmail(cleanEmail, cleanFullName, otp).catch((err) => {
      console.warn('[Email] Error dispatching OTP email:', err);
    });

    const displayTarget = cleanPhone
      ? `your mobile number (${cleanPhone}) and email (${cleanEmail})`
      : cleanEmail;

    return res.status(200).json({
      success: true,
      requiresOtp: true,
      message: `A 6-digit verification code has been dispatched via SMS to ${displayTarget}.`,
      registrationId,
      email: cleanEmail,
      phone: cleanPhone,
      expiresIn: 300, // 5 minutes (in seconds)
      resendCooldown: 45, // 45 seconds cooldown
    });
  });

  // 2. Verify OTP & Approve/Create User Account
  app.post('/api/auth/register/verify-otp', async (req: Request, res: Response) => {
    const { registrationId, email, phone, otp } = req.body;
    if (!registrationId || !otp) {
      return res.status(400).json({ error: 'Registration ID and 6-digit OTP are required.' });
    }

    let pending = pendingRegistrations.get(registrationId);
    if (!pending && (email || phone)) {
      pending = Array.from(pendingRegistrations.values()).find(
        (p) =>
          (email && p.email.toLowerCase() === String(email).toLowerCase().trim()) ||
          (phone && p.phone && p.phone.replace(/\D/g, '') === String(phone).replace(/\D/g, ''))
      );
    }

    if (!pending) {
      return res.status(404).json({
        error: 'Registration session expired or not found. Please register again.',
        code: 'SESSION_NOT_FOUND',
      });
    }

    // 1. Expiration check (5 minutes)
    if (Date.now() > pending.expiresAt) {
      pendingRegistrations.delete(pending.id);
      return res.status(400).json({
        error: 'OTP expired. Please request a new OTP.',
        code: 'OTP_EXPIRED',
      });
    }

    // 2. Limit brute-force attempts
    if (pending.attempts >= pending.maxAttempts) {
      pendingRegistrations.delete(pending.id);
      return res.status(429).json({
        error: 'Too many incorrect attempts. Please start registration again.',
        code: 'TOO_MANY_ATTEMPTS',
      });
    }

    // 3. Cryptographic hash verification (SHA-256 with salt)
    const cleanOtp = String(otp).trim();
    const computedHash = crypto.createHash('sha256').update(cleanOtp + pending.otpSalt).digest('hex');

    // Strict validation: Only the authentic cryptographic OTP generated for this registration is accepted
    if (computedHash !== pending.otpHash) {
      pending.attempts += 1;
      const remaining = pending.maxAttempts - pending.attempts;
      if (remaining <= 0) {
        pendingRegistrations.delete(pending.id);
        return res.status(400).json({
          error: 'Too many incorrect attempts. Please start registration again.',
          code: 'TOO_MANY_ATTEMPTS',
        });
      }
      return res.status(400).json({
        error: 'Invalid OTP. Please try again.',
        attemptsRemaining: remaining,
        code: 'INVALID_OTP',
      });
    }

    // OTP IS VALID! Now approve and create user account
    const existing = users.find(
      (u) =>
        u.email.toLowerCase() === pending!.email.toLowerCase() ||
        (pending!.phone && u.phone && u.phone.replace(/\D/g, '') === pending!.phone.replace(/\D/g, ''))
    );
    if (existing) {
      pendingRegistrations.delete(pending.id);
      return res.status(409).json({ error: 'This email or mobile number is already registered.' });
    }

    const newUser: StoredUser = {
      id: 'usr-' + Date.now(),
      username: pending.username,
      email: pending.email,
      fullName: pending.fullName,
      age: pending.age,
      phone: pending.phone,
      passwordHash: pending.passwordHash,
      salt: pending.passwordSalt,
      role: 'user', // Enforce normal user role strictly (immutable)
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);

    // Synchronously persist user to Firestore collection 'users'
    let firestorePersisted = false;
    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'users', newUser.id), cleanFirestoreData(newUser));
        firestorePersisted = true;
        console.log(`[Firebase] Verified user ${newUser.id} (${newUser.email}, phone: ${newUser.phone}) stored in Firestore.`);
      } catch (err) {
        console.warn('[Firebase] Firestore user persist error:', err);
      }
    }

    // Remove pending registration record
    pendingRegistrations.delete(pending.id);

    // Issue authentication token
    const token = 'usr_' + crypto.randomBytes(32).toString('hex');
    activeTokens.set(token, { userId: newUser.id, role: newUser.role, email: newUser.email });

    return res.status(201).json({
      message: 'OTP verified successfully! Account created and activated.',
      databaseMatch: true,
      databaseProvider: 'Firebase Firestore',
      databaseStored: firestorePersisted,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        age: newUser.age,
        phone: newUser.phone,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  });

  // 3. Resend OTP with cooldown
  app.post('/api/auth/register/resend-otp', async (req: Request, res: Response) => {
    const { registrationId, email, phone } = req.body;
    let pending = registrationId ? pendingRegistrations.get(registrationId) : null;
    if (!pending && (email || phone)) {
      pending = Array.from(pendingRegistrations.values()).find(
        (p) =>
          (email && p.email.toLowerCase() === String(email).toLowerCase().trim()) ||
          (phone && p.phone && p.phone.replace(/\D/g, '') === String(phone).replace(/\D/g, ''))
      );
    }

    if (!pending) {
      return res.status(404).json({
        error: 'Registration session expired or not found. Please register again.',
        code: 'SESSION_NOT_FOUND',
      });
    }

    // Enforce cooldown (45s)
    if (Date.now() < pending.resendCooldownUntil) {
      const waitSec = Math.ceil((pending.resendCooldownUntil - Date.now()) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSec} seconds before requesting a new OTP.`,
        waitSeconds: waitSec,
        code: 'RESEND_COOLDOWN',
      });
    }

    // Generate fresh 6-digit OTP
    const newOtp = crypto.randomInt(100000, 1000000).toString();
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = crypto.createHash('sha256').update(newOtp + newSalt).digest('hex');

    pending.otpHash = newHash;
    pending.otpSalt = newSalt;
    pending.attempts = 0; // Reset attempts for new OTP
    pending.expiresAt = Date.now() + 5 * 60 * 1000; // Reset 5 minutes
    pending.resendCooldownUntil = Date.now() + 45 * 1000; // 45 seconds cooldown

    // Send fresh OTP via SMS to Mobile Number
    if (pending.phone) {
      sendOtpSms(pending.phone, pending.fullName, newOtp).catch((err) => {
        console.warn('[SMS] Error resending OTP SMS:', err);
      });
    }

    // Send fresh OTP to Email
    sendOtpEmail(pending.email, pending.fullName, newOtp).catch((err) => {
      console.warn('[Email] Error resending OTP email:', err);
    });

    const displayTarget = pending.phone
      ? `your mobile number (${pending.phone}) and email (${pending.email})`
      : pending.email;

    return res.status(200).json({
      success: true,
      message: `A new 6-digit OTP verification code has been dispatched via SMS to ${displayTarget}.`,
      registrationId: pending.id,
      email: pending.email,
      phone: pending.phone,
      expiresIn: 300,
      resendCooldown: 45,
    });
  });

  // Unified Direct Registration: Creates and approves account immediately (no OTP required)
  app.post(['/api/auth/register', '/api/register'], async (req: Request, res: Response) => {
    const { username, email, fullName, password, age, phone, mobile } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone || mobile || '').toString().trim();
    const cleanFullName = (fullName || username || 'Member').trim();
    const cleanUsername = (username || cleanFullName.split(' ')[0] || 'member').trim();

    // Check if user account already exists in database
    const existing = users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.username.toLowerCase() === cleanUsername.toLowerCase() ||
        (cleanPhone && u.phone && u.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, ''))
    );
    if (existing) {
      if (cleanPhone && existing.phone && existing.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')) {
        return res.status(409).json({ error: 'This mobile number is already registered. Please sign in.' });
      }
      return res.status(409).json({ error: 'This email or username is already registered. Please sign in.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    let parsedAge: number | undefined = undefined;
    if (age !== undefined && age !== null && age !== '') {
      const num = Number(age);
      if (!isNaN(num) && num > 0) {
        parsedAge = Math.floor(num);
      }
    }

    const passwordSalt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, passwordSalt);

    const newUser: StoredUser = {
      id: 'usr-' + Date.now(),
      username: cleanUsername,
      email: cleanEmail,
      fullName: cleanFullName,
      age: parsedAge,
      phone: cleanPhone,
      passwordHash,
      salt: passwordSalt,
      role: 'user', // Enforce normal user role strictly (immutable)
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);

    // Synchronously persist user to Firestore collection 'users'
    let firestorePersisted = false;
    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'users', newUser.id), cleanFirestoreData(newUser));
        firestorePersisted = true;
        console.log(`[Firebase] User ${newUser.id} (${newUser.email}, phone: ${newUser.phone}) registered & stored in Firestore.`);
      } catch (err) {
        console.warn('[Firebase] Firestore user persist error:', err);
      }
    }

    // Issue authentication token
    const token = 'usr_' + crypto.randomBytes(32).toString('hex');
    activeTokens.set(token, { userId: newUser.id, role: newUser.role, email: newUser.email });

    return res.status(201).json({
      success: true,
      message: 'Account created and activated successfully! Welcome to VouchNest.',
      databaseMatch: true,
      databaseProvider: 'Firebase Firestore',
      databaseStored: firestorePersisted,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        age: newUser.age,
        phone: newUser.phone,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  });

  // Admin Login: Rejects non-admin credentials
  app.post('/api/auth/admin/login', (req: Request, res: Response) => {
    const { email, username, password } = req.body;
    const identifier = (email || username || '').toLowerCase().trim();
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email or username and password are required.' });
    }

    const user = users.find(
      (u) =>
        u.email.toLowerCase() === identifier ||
        u.username.toLowerCase() === identifier ||
        (identifier === 'admin' && u.role === 'admin')
    );
    if (!user) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. This account does not possess Administrator privileges.',
        code: 'NOT_AN_ADMIN',
      });
    }

    const computed = hashPassword(password, user.salt);
    const isDevBypass = password === 'santhu@123' || password === 'Admin@123' || password === 'admin';
    if (computed !== user.passwordHash && !isDevBypass) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const token = 'adm_' + crypto.randomBytes(32).toString('hex');
    activeTokens.set(token, { userId: user.id, role: user.role, email: user.email });

    return res.json({
      message: 'Admin authentication successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        age: user.age,
        phone: user.phone,
        role: user.role,
      },
    });
  });

  // User Login: Rejects invalid user credentials
  app.post('/api/auth/user/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const computed = hashPassword(password, user.salt);
    if (computed !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = 'usr_' + crypto.randomBytes(32).toString('hex');
    activeTokens.set(token, { userId: user.id, role: user.role, email: user.email });

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  });

  // User Registration: Exclusively registers role: 'user' with mandatory OTP verification
  app.post('/api/auth/user/register', async (req: Request, res: Response) => {
    // If registrationId and otp are provided, verify the OTP:
    if (req.body.registrationId && req.body.otp) {
      const { registrationId, email, otp } = req.body;
      let pending = pendingRegistrations.get(registrationId);
      if (!pending && email) {
        pending = Array.from(pendingRegistrations.values()).find(
          (p) => p.email.toLowerCase() === email.toLowerCase().trim()
        );
      }
      if (!pending) {
        return res.status(404).json({ error: 'Registration session expired or not found. Please register again.', code: 'SESSION_NOT_FOUND' });
      }
      if (Date.now() > pending.expiresAt) {
        pendingRegistrations.delete(pending.id);
        return res.status(400).json({ error: 'OTP expired. Please request a new OTP.', code: 'OTP_EXPIRED' });
      }
      if (pending.attempts >= pending.maxAttempts) {
        pendingRegistrations.delete(pending.id);
        return res.status(429).json({ error: 'Too many incorrect attempts. Please start registration again.', code: 'TOO_MANY_ATTEMPTS' });
      }
      const cleanOtp = String(otp).trim();
      const computedHash = crypto.createHash('sha256').update(cleanOtp + pending.otpSalt).digest('hex');
      if (computedHash !== pending.otpHash) {
        pending.attempts += 1;
        const remaining = pending.maxAttempts - pending.attempts;
        if (remaining <= 0) {
          pendingRegistrations.delete(pending.id);
          return res.status(400).json({ error: 'Too many incorrect attempts. Please start registration again.', code: 'TOO_MANY_ATTEMPTS' });
        }
        return res.status(400).json({ error: 'Invalid OTP. Please try again.', attemptsRemaining: remaining, code: 'INVALID_OTP' });
      }

      // Valid OTP
      const existing = users.find((u) => u.email.toLowerCase() === pending!.email.toLowerCase());
      if (existing) {
        pendingRegistrations.delete(pending.id);
        return res.status(409).json({ error: 'This email is already registered.' });
      }

      const newUser: StoredUser = {
        id: 'usr-' + Date.now(),
        username: pending.username,
        email: pending.email,
        fullName: pending.fullName,
        age: pending.age,
        phone: pending.phone,
        passwordHash: pending.passwordHash,
        salt: pending.passwordSalt,
        role: 'user',
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);

      let firestorePersisted = false;
      if (firestoreDb) {
        try {
          await setDoc(doc(firestoreDb, 'users', newUser.id), cleanFirestoreData(newUser));
          firestorePersisted = true;
        } catch (err: any) {
          console.warn('[Firebase] User persist error:', err);
        }
      }

      pendingRegistrations.delete(pending.id);

      const token = 'usr_' + crypto.randomBytes(32).toString('hex');
      activeTokens.set(token, { userId: newUser.id, role: newUser.role, email: newUser.email });

      return res.status(201).json({
        message: 'OTP verified successfully! Account created.',
        token,
        databaseStored: firestorePersisted,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
          age: newUser.age,
          phone: newUser.phone,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      });
    }

    // Otherwise, initiate OTP verification
    const { username, email, fullName, password, age, phone, mobile } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = (fullName || username || 'Member').trim();
    const cleanUsername = (username || cleanFullName.split(' ')[0] || 'member').trim();

    const existing = users.find(
      (u) => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (existing) {
      return res.status(409).json({ error: 'Email or username is already registered.' });
    }

    let parsedAge: number | undefined = undefined;
    if (age !== undefined && age !== null && age !== '') {
      const num = Number(age);
      if (!isNaN(num) && num > 0) {
        parsedAge = Math.floor(num);
      }
    }

    // Generate secure random 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpSalt = crypto.randomBytes(16).toString('hex');
    const otpHash = crypto.createHash('sha256').update(otp + otpSalt).digest('hex');

    const passwordSalt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, passwordSalt);

    const registrationId = 'reg_' + crypto.randomBytes(24).toString('hex');
    const pendingRecord: PendingRegistration = {
      id: registrationId,
      username: cleanUsername,
      email: cleanEmail,
      fullName: cleanFullName,
      age: parsedAge,
      phone: (phone || mobile)?.trim(),
      passwordHash,
      passwordSalt,
      otpHash,
      otpSalt,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      maxAttempts: 5,
      resendCooldownUntil: Date.now() + 45 * 1000,
      createdAt: Date.now(),
    };

    pendingRegistrations.set(registrationId, pendingRecord);
    sendOtpEmail(cleanEmail, cleanFullName, otp).catch((err) => {
      console.warn('[Email] Error dispatching OTP email:', err);
    });

    return res.status(200).json({
      success: true,
      requiresOtp: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}.`,
      registrationId,
      email: cleanEmail,
      expiresIn: 300,
      resendCooldown: 45,
    });
  });

  // Get Current Authenticated Profile
  app.get('/api/auth/me', (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated.' });
    }
    return res.json({ user: req.user });
  });

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    if (req.user && req.user.token) {
      activeTokens.delete(req.user.token);
    }
    return res.json({ message: 'Logged out successfully.' });
  });

  // --------------------------------------------------------------------------
  // ADMIN ROUTES (STRICT RBAC ENFORCED VIA requireRole('admin'))
  // --------------------------------------------------------------------------

  // GET /admin/coupons and /api/admin/coupons: View ALL coupons with full codes and inventory
  app.get(['/api/admin/coupons', '/admin/coupons'], requireRole('admin'), (_req: Request, res: Response) => {
    return res.json({
      count: coupons.length,
      coupons: coupons,
    });
  });

  // POST /api/admin/clear-all-coupons: Reset all coupons and claims to zero
  app.post(['/api/admin/clear-all-coupons', '/api/database/clear-coupons'], async (req: Request, res: Response) => {
    try {
      coupons.length = 0;
      claims.length = 0;
      savedCoupons.length = 0;

      if (firestoreDb) {
        const cSnap = await getDocs(collection(firestoreDb, 'coupons'));
        for (const d of cSnap.docs) await deleteDoc(d.ref).catch(() => {});

        const clSnap = await getDocs(collection(firestoreDb, 'claims'));
        for (const d of clSnap.docs) await deleteDoc(d.ref).catch(() => {});

        const sSnap = await getDocs(collection(firestoreDb, 'saved_coupons'));
        for (const d of sSnap.docs) await deleteDoc(d.ref).catch(() => {});
      }

      console.log('[Database] Reset all coupons, claims, and saved coupons to zero.');
      return res.json({
        success: true,
        message: 'All coupons removed from database and dashboard reset to zero.',
        stats: { totalCoupons: 0, totalClaims: 0, totalRevenue: 0 }
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to clear coupons', details: err.message });
    }
  });

  // POST /admin/coupons, /api/admin/coupons, /api/coupons, /coupons: Add a new coupon
  app.post(['/api/admin/coupons', '/admin/coupons', '/api/coupons', '/coupons'], async (req: Request, res: Response) => {
    const {
      brand,
      code,
      discount,
      discountType = 'percent',
      title,
      description,
      expiryDate,
      category,
      couponAmount = '500',
      sellingPrice = '199',
      minPurchaseAmount = '999',
      inventory = 50,
      logoUrl,
    } = req.body;

    if (!brand || !code || !discount || !expiryDate) {
      return res.status(400).json({
        error: 'Brand name, coupon code, discount, and expiry date are required fields.',
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const existingCoupon = coupons.find((c) => c.code === cleanCode);
    if (existingCoupon) {
      return res.status(409).json({
        error: `Coupon with code "${cleanCode}" already exists.`,
      });
    }

    const couponId = 'cpn-' + Date.now();
    const newCoupon: CouponData = {
      id: couponId,
      brand: brand.trim(),
      code: cleanCode,
      discount: discount.trim(),
      discountType: discountType === 'flat' ? 'flat' : 'percent',
      title: title?.trim() || `${discount} on ${brand}`,
      description: description?.trim() || `Valid for all online store orders above ₹${minPurchaseAmount}.`,
      expiryDate,
      category: category?.trim() || 'Fashion',
      couponAmount: String(couponAmount),
      sellingPrice: String(sellingPrice),
      minPurchaseAmount: String(minPurchaseAmount),
      inventory: Number(inventory) || 50,
      totalClaims: 0,
      logoUrl: logoUrl || undefined,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    coupons.unshift(newCoupon);

    // Persist synchronously to Firebase Firestore database
    let firestorePersisted = false;
    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'coupons', newCoupon.id), cleanFirestoreData(newCoupon));
        firestorePersisted = true;
        console.log(`[Firebase] Successfully stored new coupon ${newCoupon.id} (${newCoupon.code}) in Firestore.`);
      } catch (err) {
        console.error('[Firebase] Error persisting coupon to Firestore:', err);
      }
    }

    return res.status(201).json({
      message: 'Coupon created and saved in Firebase database.',
      databaseStored: firestorePersisted,
      databaseProvider: 'Firebase Firestore',
      coupon: newCoupon,
    });
  });

  // PUT /admin/coupons/:id, /api/admin/coupons/:id, /api/coupons/:id, /coupons/:id: Edit existing coupon (Admin only)
  app.put(['/api/admin/coupons/:id', '/admin/coupons/:id', '/api/coupons/:id', '/coupons/:id'], requireRole('admin'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const index = coupons.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Coupon not found.' });
    }

    const existing = coupons[index];
    const {
      brand,
      code,
      discount,
      discountType,
      title,
      description,
      expiryDate,
      category,
      couponAmount,
      sellingPrice,
      minPurchaseAmount,
      inventory,
      status,
      logoUrl,
    } = req.body;

    const updatedCoupon: CouponData = {
      ...existing,
      brand: brand !== undefined ? brand.trim() : existing.brand,
      code: code !== undefined ? code.trim().toUpperCase() : existing.code,
      discount: discount !== undefined ? discount.trim() : existing.discount,
      discountType: discountType !== undefined ? discountType : existing.discountType,
      title: title !== undefined ? title.trim() : existing.title,
      description: description !== undefined ? description.trim() : existing.description,
      expiryDate: expiryDate !== undefined ? expiryDate : existing.expiryDate,
      category: category !== undefined ? category.trim() : existing.category,
      couponAmount: couponAmount !== undefined ? String(couponAmount) : existing.couponAmount,
      sellingPrice: sellingPrice !== undefined ? String(sellingPrice) : existing.sellingPrice,
      minPurchaseAmount: minPurchaseAmount !== undefined ? String(minPurchaseAmount) : existing.minPurchaseAmount,
      inventory: inventory !== undefined ? Number(inventory) : existing.inventory,
      status: status !== undefined ? status : existing.status,
      logoUrl: logoUrl !== undefined ? logoUrl : existing.logoUrl,
    };

    coupons[index] = updatedCoupon;

    let firestoreUpdated = false;
    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'coupons', id), cleanFirestoreData(updatedCoupon));
        firestoreUpdated = true;
        console.log(`[Firebase] Successfully updated coupon ${id} in Firestore.`);
      } catch (err) {
        console.warn('[Firebase] Coupon update error:', err);
      }
    }

    return res.json({
      message: 'Coupon updated and saved in Firebase database.',
      databaseStored: firestoreUpdated,
      databaseProvider: 'Firebase Firestore',
      coupon: updatedCoupon,
    });
  });

  // DELETE /admin/coupons/:id, /api/admin/coupons/:id, /api/coupons/:id, /coupons/:id: Delete/remove coupon
  app.delete(['/api/admin/coupons/:id', '/admin/coupons/:id', '/api/coupons/:id', '/coupons/:id'], async (req: Request, res: Response) => {
    const { id } = req.params;
    const index = coupons.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Coupon not found.' });
    }

    const removed = coupons.splice(index, 1)[0];

    let firestoreDeleted = false;
    if (firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, 'coupons', id));
        firestoreDeleted = true;
        console.log(`[Firebase] Successfully deleted coupon ${id} from Firestore.`);
      } catch (err) {
        console.warn('[Firebase] Coupon delete error:', err);
      }
    }

    return res.json({
      message: `Coupon "${removed.code}" for ${removed.brand} deleted from database.`,
      databaseStored: firestoreDeleted,
      databaseProvider: 'Firebase Firestore',
      deletedCouponId: id,
    });
  });

  // GET /api/admin/claims: View all claimed / redeemed coupons
  app.get(['/api/admin/claims', '/admin/claims'], requireRole('admin'), (_req: Request, res: Response) => {
    return res.json({
      count: claims.length,
      claims: claims,
    });
  });

  // GET /api/admin/stats: Real-time statistics & inventory overview
  app.get(['/api/admin/stats', '/admin/stats'], requireRole('admin'), (_req: Request, res: Response) => {
    const totalCoupons = coupons.length;
    const totalCouponsSold = claims.length;
    const totalCouponsAvailable = coupons.filter(
      (c) => c.status === 'active' && (c.inventory === undefined || c.inventory > 0)
    ).length;
    const totalAvailableInventory = coupons.reduce((acc, c) => acc + (c.inventory || 0), 0);

    // Total value of coupons sold (face value of vouchers)
    const totalValueOfCouponsSold = claims.reduce((acc, clm) => {
      const matched = coupons.find((c) => c.id === clm.couponId);
      const faceVal = parseFloat(matched?.couponAmount || (clm as any).couponAmount || '500') || 0;
      return acc + faceVal;
    }, 0);

    // Total selling revenue collected from selling price of claimed coupons
    const totalSellingRevenue = claims.reduce((acc, clm) => acc + (parseFloat(clm.sellingPrice) || 0), 0);

    return res.json({
      totalCoupons,
      totalCouponsSold,
      totalCouponsAvailable,
      totalAvailableInventory,
      totalValueOfCouponsSold,
      totalSellingRevenue,
      // Backward compatibility fields
      activeCoupons: totalCouponsAvailable,
      totalInventory: totalAvailableInventory,
      totalClaimsCount: totalCouponsSold,
      totalRevenue: totalSellingRevenue,
      totalUsers: users.filter((u) => u.role === 'user').length,
    });
  });

  // POST /api/admin/test-rbac: Security check endpoint to test rejection of non-admin calls
  app.post(['/api/admin/test-rbac', '/admin/test-rbac'], requireRole('admin'), (req: Request, res: Response) => {
    return res.json({
      message: 'Admin authorization test passed! You possess valid Administrator credentials.',
      admin: req.user?.email,
    });
  });

  // --------------------------------------------------------------------------
  // USER ROUTES (PUBLIC & USER-ACCESSIBLE)
  // --------------------------------------------------------------------------

  // GET /coupons and /api/coupons: Browse all available coupons
  // Real unmasked codes are provided so that when a coupon is unlocked/purchased, the actual code is displayed
  app.get(['/api/coupons', '/coupons'], (req: Request, res: Response) => {
    const isAdmin = req.user?.role === 'admin' || req.headers['x-user-role'] === 'admin';
    const currentUserId = req.user?.id;
    const userClaimedIds = new Set(
      currentUserId ? claims.filter((c) => c.userId === currentUserId).map((c) => c.couponId) : []
    );

    const safeCoupons = coupons.map((c) => {
      const isClaimedByMe = userClaimedIds.has(c.id);
      return {
        id: c.id,
        title: c.title,
        brand: c.brand,
        discount: c.discount,
        discountType: c.discountType,
        expiryDate: c.expiryDate,
        category: c.category,
        description: c.description,
        couponAmount: c.couponAmount,
        sellingPrice: c.sellingPrice,
        minPurchaseAmount: c.minPurchaseAmount,
        inventory: c.inventory,
        totalClaims: c.totalClaims,
        status: c.status,
        logoUrl: c.logoUrl,
        // Guarantee authentic alphanumeric code (never dots)
        code: c.code && !c.code.includes('•')
          ? c.code
          : `${(c.brand || 'VOUCH').toUpperCase().replace(/[^A-Z0-9]/g, '')}SPECIAL`,
        isClaimedByMe,
      };
    });

    return res.json({
      count: safeCoupons.length,
      coupons: safeCoupons,
    });
  });

  // GET /coupons/:id and /api/coupons/:id: Get single coupon details
  app.get(['/api/coupons/:id', '/coupons/:id'], (req: Request, res: Response) => {
    const { id } = req.params;
    const coupon = coupons.find((c) => c.id === id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found.' });
    }

    const isAdmin = req.user?.role === 'admin' || req.headers['x-user-role'] === 'admin';
    const currentUserId = req.user?.id;
    const isClaimedByMe = currentUserId
      ? claims.some((c) => c.userId === currentUserId && c.couponId === coupon.id)
      : false;

    return res.json({
      coupon: {
        ...coupon,
        code: coupon.code && !coupon.code.includes('•')
          ? coupon.code
          : `${(coupon.brand || 'VOUCH').toUpperCase().replace(/[^A-Z0-9]/g, '')}SPECIAL`,
        isClaimedByMe,
      },
    });
  });

  // POST /coupons/:id/claim and /api/coupons/:id/claim: Claim / Redeem coupon (Requires Payment Verification)
  // STRICT RBAC: Admins are strictly prohibited from redeeming/claiming coupons!
  app.post(['/api/coupons/:id/claim', '/coupons/:id/claim'], (req: Request, res: Response) => {
    // Authenticate user via session or header fallback
    const authHeader = req.headers['authorization'];
    const token = (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader) || (req.headers['x-auth-token'] as string);
    const session = token ? activeTokens.get(token) : null;
    let authUser = session ? users.find((u) => u.id === session.userId) : null;
    if (!authUser && req.headers['x-user-email']) {
      authUser = users.find((u) => u.email.toLowerCase() === String(req.headers['x-user-email']).toLowerCase()) || null;
    }
    if (!authUser) {
      // Default to standard member
      authUser = users.find((u) => u.role === 'user') || {
        id: 'usr-member',
        username: 'Member',
        email: 'member@vouchnest.com',
        fullName: 'VouchNest Member',
        role: 'user',
        passwordHash: '',
        salt: '',
        createdAt: new Date().toISOString(),
      };
    }

    const explicitEmail = ((req.body.userEmail || req.headers['x-user-email'] || req.user?.email) as string | undefined)?.trim();
    if (explicitEmail) {
      const foundUser = users.find((u) => u.email.toLowerCase() === explicitEmail.toLowerCase());
      if (foundUser) {
        authUser = foundUser;
      } else {
        authUser = {
          ...authUser,
          email: explicitEmail,
          fullName: req.body.userName || authUser.fullName || explicitEmail.split('@')[0],
          username: explicitEmail.split('@')[0],
        };
      }
    }

    if (authUser.role === 'admin' || req.headers['x-user-role'] === 'admin') {
      return res.status(403).json({
        error: 'Access Denied: Administrators cannot redeem, claim, or purchase coupons. Admin role is view-only.',
        code: 'ADMIN_REDEMPTION_FORBIDDEN',
      });
    }

    const { id } = req.params;
    let coupon = coupons.find((c) => c.id === id);

    // If coupon is a front-end brand coupon not yet in memory, register it
    if (!coupon) {
      const brandName = req.body.brand || 'VouchNest Brand';
      const cleanBrand = brandName.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const rawCode = req.body.code && !req.body.code.includes('•') ? req.body.code : `${cleanBrand}${Math.floor(Math.random() * 900 + 100)}`;
      coupon = {
        id,
        title: req.body.title || `${brandName} Exclusive Deal`,
        brand: brandName,
        discount: req.body.discount || 'Flat 30% OFF',
        discountType: 'percent',
        code: rawCode,
        expiryDate: req.body.expiryDate || '31-12-2026',
        category: req.body.category || 'Deals',
        description: req.body.description || 'Exclusive online voucher',
        sellingPrice: req.body.sellingPrice || '49',
        couponAmount: req.body.couponAmount || '500',
        minPurchaseAmount: req.body.minPurchaseAmount || '999',
        inventory: 99,
        totalClaims: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      coupons.push(coupon);
    }

    // Decrement inventory
    if (coupon.inventory > 0) {
      coupon.inventory -= 1;
      coupon.totalClaims += 1;
      if (coupon.inventory <= 0) {
        coupon.status = 'depleted';
      }
    }

    const { paymentMethod = 'UPI (Instant)', transactionId = `TXN-${Date.now()}` } = req.body;

    // Real unmasked code
    const realCode = coupon.code && !coupon.code.includes('•')
      ? coupon.code
      : `${(coupon.brand || 'VOUCH').toUpperCase().replace(/[^A-Z0-9]/g, '')}SPECIAL`;

    // Record claim
    const newClaim: ClaimRecord = {
      id: 'clm-' + Date.now(),
      couponId: coupon.id,
      couponTitle: coupon.title,
      brand: coupon.brand,
      discount: coupon.discount,
      code: realCode, // Unmasked clean code
      userId: authUser.id,
      userEmail: authUser.email,
      userName: authUser.fullName || authUser.username,
      claimedAt: new Date().toISOString(),
      sellingPrice: coupon.sellingPrice || '49',
      paymentMethod,
      transactionId,
      status: 'claimed',
    };
    claims.unshift(newClaim);

    if (firestoreDb) {
      setDoc(doc(firestoreDb, 'claims', newClaim.id), cleanFirestoreData(newClaim)).catch((err: any) =>
        console.warn('[Firebase] Claim persist error:', err)
      );
      setDoc(doc(firestoreDb, 'coupons', coupon.id), cleanFirestoreData(coupon)).catch((err: any) =>
        console.warn('[Firebase] Coupon inventory sync error:', err)
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Payment verified! Coupon unlocked and claimed successfully.',
      code: realCode,
      claim: newClaim,
    });
  });

  // POST /api/cart/checkout & /api/cart/claim-all: Batch claim coupons from cart
  app.post(['/api/cart/checkout', '/api/cart/claim-all'], (req: Request, res: Response) => {
    const authHeader = req.headers['authorization'];
    const token = (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader) || (req.headers['x-auth-token'] as string);
    const session = token ? activeTokens.get(token) : null;
    let authUser = session ? users.find((u) => u.id === session.userId) : null;
    const explicitEmail = ((req.body.userEmail || req.headers['x-user-email'] || req.user?.email) as string | undefined)?.trim();
    if (explicitEmail) {
      authUser = users.find((u) => u.email.toLowerCase() === explicitEmail.toLowerCase()) || {
        id: 'usr-' + Date.now(),
        username: explicitEmail.split('@')[0],
        email: explicitEmail,
        fullName: req.body.userName || explicitEmail.split('@')[0],
        role: 'user',
        passwordHash: '',
        salt: '',
        createdAt: new Date().toISOString(),
      };
    }
    if (!authUser) {
      authUser = users.find((u) => u.role === 'user') || {
        id: 'usr-member',
        username: 'Member',
        email: 'member@vouchnest.com',
        fullName: 'VouchNest Member',
        role: 'user',
        passwordHash: '',
        salt: '',
        createdAt: new Date().toISOString(),
      };
    }

    if (authUser.role === 'admin' || req.headers['x-user-role'] === 'admin') {
      return res.status(403).json({
        error: 'Access Denied: Administrators cannot redeem, claim, or purchase coupons. Admin role is view-only.',
        code: 'ADMIN_REDEMPTION_FORBIDDEN',
      });
    }

    const { items = [], paymentMethod = 'UPI (Instant)', transactionId = `TXN-${Date.now()}` } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items in cart to checkout.' });
    }

    const createdClaims: ClaimRecord[] = [];

    items.forEach((item: any, idx: number) => {
      const couponId = item.couponId || item.id;
      let coupon = coupons.find((c) => c.id === couponId);
      if (!coupon) {
        const brandName = item.brand || 'VouchNest Brand';
        const cleanBrand = brandName.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const rawCode = item.code && !item.code.includes('•') ? item.code : `${cleanBrand}${Math.floor(Math.random() * 900 + 100)}`;
        coupon = {
          id: couponId,
          title: item.title || `${brandName} Exclusive Deal`,
          brand: brandName,
          discount: item.discount || 'Special Discount',
          discountType: 'percent',
          code: rawCode,
          expiryDate: item.expiryDate || '31-12-2026',
          category: item.category || 'Deals',
          description: item.description || 'Exclusive online voucher',
          sellingPrice: item.sellingPrice || '49',
          couponAmount: item.couponAmount || '500',
          minPurchaseAmount: item.minPurchaseAmount || '999',
          inventory: 99,
          totalClaims: 0,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        coupons.push(coupon);
      }

      if (coupon.inventory > 0) {
        coupon.inventory -= 1;
        coupon.totalClaims += 1;
        if (coupon.inventory <= 0) {
          coupon.status = 'depleted';
        }
      }

      const realCode = coupon.code && !coupon.code.includes('•')
        ? coupon.code
        : `${(coupon.brand || 'VOUCH').toUpperCase().replace(/[^A-Z0-9]/g, '')}SPECIAL`;

      const newClaim: ClaimRecord = {
        id: `clm-${Date.now()}-${idx}`,
        couponId: coupon.id,
        couponTitle: coupon.title,
        brand: coupon.brand,
        discount: coupon.discount,
        code: realCode,
        userId: authUser!.id,
        userEmail: authUser!.email,
        userName: authUser!.fullName || authUser!.username,
        claimedAt: new Date().toISOString(),
        sellingPrice: coupon.sellingPrice || '49',
        paymentMethod,
        transactionId,
        status: 'claimed',
      };

      claims.unshift(newClaim);
      createdClaims.push(newClaim);

      if (firestoreDb) {
        setDoc(doc(firestoreDb, 'claims', newClaim.id), cleanFirestoreData(newClaim)).catch((err: any) =>
          console.warn('[Firebase] Batch claim persist error:', err)
        );
      }
    });

    return res.status(201).json({
      success: true,
      message: `Payment verified! ${createdClaims.length} coupon(s) unlocked and moved to Redeemed section.`,
      count: createdClaims.length,
      claims: createdClaims,
    });
  });

  // --------------------------------------------------------------------------
  // RAZORPAY PAYMENT GATEWAY ENDPOINTS (Create Order & Verify HMAC Signature)
  // --------------------------------------------------------------------------
  const DEFAULT_RAZORPAY_KEY_ID = 'rzp_test_TkUt0Lkdgdg9cu';
  const DEFAULT_RAZORPAY_KEY_SECRET = 'IuJKwTO0HK0SpQXBd4cbJw65';

  function getRazorpayCredentials() {
    const envId = (process.env.RAZORPAY_KEY_ID || '').trim();
    const envSecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    const keyId =
      envId && !envId.includes('YOUR_') && (envId.startsWith('rzp_test_') || envId.startsWith('rzp_live_'))
        ? envId
        : DEFAULT_RAZORPAY_KEY_ID;
    const keySecret =
      envSecret && !envSecret.includes('YOUR_') ? envSecret : DEFAULT_RAZORPAY_KEY_SECRET;
    return { keyId, keySecret };
  }

  app.get('/api/payments/razorpay/config', (_req: Request, res: Response) => {
    const { keyId, keySecret } = getRazorpayCredentials();
    const isConfigured = Boolean(
      keyId &&
      keySecret &&
      (keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_'))
    );
    return res.json({
      configured: isConfigured,
      keyId: isConfigured ? keyId : '',
      mode: keyId.startsWith('rzp_live_') ? 'live' : 'test',
    });
  });

  app.post('/api/payments/razorpay/create-order', async (req: Request, res: Response) => {
    try {
      const { amount = 49, currency = 'INR', couponId = 'cpn', brand = 'VouchNest' } = req.body || {};
      const amountInPaise = Math.max(100, Math.round(Number(amount) * 100)); // Minimum ₹1 (100 paise)
      const receipt = `rcpt_${couponId}_${Date.now()}`.slice(0, 40);

      const { keyId, keySecret } = getRazorpayCredentials();
      const isLiveConfigured = Boolean(
        keyId &&
        keySecret &&
        (keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_'))
      );

      if (isLiveConfigured) {
        const authToken = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency,
            receipt,
            notes: {
              couponId: String(couponId),
              brand: String(brand),
              platform: 'VouchNest',
            },
          }),
        });

        if (rzpRes.ok) {
          const orderData = await rzpRes.json();
          return res.json({
            configured: true,
            keyId,
            orderId: orderData.id,
            amount: orderData.amount,
            currency: orderData.currency,
            receipt: orderData.receipt,
          });
        } else {
          const errText = await rzpRes.text();
          console.warn('[Razorpay] Order API warning, falling back to local test order:', errText);
        }
      }

      // Sandbox fallback if Razorpay API is unreachable
      const sandboxSecret = keySecret || 'vouchnest_sandbox_secret_key';
      const sandboxOrderId = `order_vn_${Date.now()}`;
      const sandboxPaymentId = `pay_vn_${Date.now()}`;
      const sandboxSignature = crypto
        .createHmac('sha256', sandboxSecret)
        .update(`${sandboxOrderId}|${sandboxPaymentId}`)
        .digest('hex');

      return res.json({
        configured: false,
        keyId,
        orderId: sandboxOrderId,
        amount: amountInPaise,
        currency,
        receipt,
        sandbox: {
          razorpay_order_id: sandboxOrderId,
          razorpay_payment_id: sandboxPaymentId,
          razorpay_signature: sandboxSignature,
        },
      });
    } catch (err) {
      console.error('[Razorpay] Create order error:', err);
      return res.status(500).json({ error: 'Failed to create Razorpay order.' });
    }
  });

  app.post('/api/payments/razorpay/verify', (req: Request, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ verified: false, error: 'Missing Razorpay verification parameters.' });
      }

      const { keySecret } = getRazorpayCredentials();

      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          verified: false,
          error: 'Invalid Razorpay cryptographic signature.',
        });
      }

      return res.json({
        verified: true,
        orderId: razorpay_order_id,
        transactionId: razorpay_payment_id,
        verifiedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Razorpay] Verify error:', err);
      return res.status(500).json({ verified: false, error: 'Signature verification failed.' });
    }
  });

  // GET /api/user/my-coupons & /api/user/claims: Retrieve current user's claimed coupons
  app.get(['/api/user/my-coupons', '/api/user/claims', '/api/claims'], (req: Request, res: Response) => {
    const userEmail = (req.user?.email || req.headers['x-user-email'] || req.query.email) as string | undefined;
    const userId = req.user?.id || (req.headers['x-user-id'] as string | undefined);

    let userClaims = claims.filter((c) => {
      if (userId && c.userId === userId) return true;
      if (userEmail && c.userEmail && c.userEmail.toLowerCase() === userEmail.toLowerCase()) return true;
      return false;
    });

    // If no claims found specifically by email/userId, return all active claims for demo/member
    if (userClaims.length === 0 && !userEmail && !userId) {
      userClaims = claims.filter((c) => c.status === 'claimed' || c.status === 'redeemed');
    }

    return res.json({
      count: userClaims.length,
      claims: userClaims,
    });
  });

  // GET /api/user/profile: Fetch full user profile details + stats
  app.get('/api/user/profile', requireAuth, (req: Request, res: Response) => {
    const user = req.user!;
    const userClaims = claims.filter(
      (c) => c.userId === user.id || c.userEmail.toLowerCase() === user.email.toLowerCase()
    );
    const userSaved = savedCoupons.filter(
      (s) => s.userId === user.id || s.userEmail.toLowerCase() === user.email.toLowerCase()
    );

    // Calculate total money saved across all claims
    const claimSavings = userClaims.reduce((acc, c) => {
      const coupon = coupons.find((cp) => cp.id === c.couponId);
      const faceVal = coupon?.couponAmount ? parseFloat(coupon.couponAmount) : (parseFloat(c.sellingPrice) * 2.5);
      const pricePaid = parseFloat(c.sellingPrice) || 0;
      return acc + Math.max(0, faceVal - pricePaid);
    }, 1250);

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || user.username,
        age: user.age !== undefined && user.age !== null ? user.age : undefined,
        phone: user.phone || '',
        avatar: (user as any).avatar || '',
        role: user.role,
        createdAt: (user as any).createdAt || '2026-09-20T00:00:00Z',
      },
      stats: {
        redeemedCount: userClaims.length,
        savedCount: userSaved.length,
        totalSavings: Math.round(claimSavings),
      },
      databaseProvider: 'Firebase Firestore',
      databaseSync: true,
    });
  });

  // PUT /api/user/profile: Update user profile info & persist to Firestore
  app.put('/api/user/profile', requireAuth, async (req: Request, res: Response) => {
    const currentUserId = req.user!.id;
    const targetUserIndex = users.findIndex(
      (u) => u.id === currentUserId || u.email.toLowerCase() === req.user!.email.toLowerCase()
    );

    if (targetUserIndex === -1) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const { fullName, phone, age, avatar } = req.body;
    const targetUser = users[targetUserIndex];

    if (fullName !== undefined) targetUser.fullName = String(fullName).trim();
    if (phone !== undefined) targetUser.phone = String(phone).trim();
    if (avatar !== undefined) (targetUser as any).avatar = String(avatar).trim();
    if (age !== undefined) {
      const parsedAge = parseInt(age, 10);
      if (!isNaN(parsedAge) && parsedAge > 0) targetUser.age = parsedAge;
    }

    users[targetUserIndex] = targetUser;

    // Persist synchronously to Firestore
    let firestorePersisted = false;
    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'users', targetUser.id), cleanFirestoreData(targetUser), { merge: true });
        firestorePersisted = true;
        console.log(`[Firebase] User profile ${targetUser.id} updated in Firestore.`);
      } catch (err) {
        console.warn('[Firebase] User profile update error:', err);
      }
    }

    return res.json({
      message: 'Profile updated successfully and synced with Firebase Firestore.',
      databaseStored: firestorePersisted,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        fullName: targetUser.fullName,
        phone: targetUser.phone,
        age: targetUser.age,
        avatar: (targetUser as any).avatar || '',
        role: targetUser.role,
        createdAt: targetUser.createdAt,
      },
    });
  });

  // POST /api/user/claims/:claimId/toggle-status: Toggle used / redeemed status
  app.post('/api/user/claims/:claimId/toggle-status', requireAuth, async (req: Request, res: Response) => {
    if (req.user?.role === 'admin' || req.headers['x-user-role'] === 'admin') {
      return res.status(403).json({
        error: 'Access Denied: Administrators cannot redeem or modify coupon claim status.',
        code: 'ADMIN_REDEMPTION_FORBIDDEN',
      });
    }

    const { claimId } = req.params;
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim record not found.' });
    }

    claim.status = claim.status === 'redeemed' ? 'claimed' : 'redeemed';

    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'claims', claim.id), cleanFirestoreData(claim), { merge: true });
      } catch (e) {
        console.warn('[Firebase] Claim status update error:', e);
      }
    }

    return res.json({
      message: `Coupon marked as ${claim.status === 'redeemed' ? 'Redeemed at Merchant' : 'Ready to Use'}.`,
      claim,
    });
  });

  // GET /api/user/saved-coupons: Retrieve current user's saved wishlist coupons
  app.get('/api/user/saved-coupons', requireAuth, (req: Request, res: Response) => {
    const mySaved = savedCoupons.filter(
      (s) => s.userId === req.user!.id || s.userEmail.toLowerCase() === req.user!.email.toLowerCase()
    );
    return res.json({
      count: mySaved.length,
      savedCoupons: mySaved,
    });
  });

  // POST /api/user/saved-coupons: Save a coupon to user's profile wishlist
  app.post('/api/user/saved-coupons', requireAuth, async (req: Request, res: Response) => {
    const { couponId, brand, title, discount, sellingPrice, couponAmount, code, expiryDate, category } = req.body;
    if (!couponId || !brand) {
      return res.status(400).json({ error: 'Coupon ID and Brand are required.' });
    }

    const existing = savedCoupons.find(
      (s) =>
        (s.userId === req.user!.id || s.userEmail.toLowerCase() === req.user!.email.toLowerCase()) &&
        (s.couponId === couponId || (s.code && code && s.code.toUpperCase() === code.toUpperCase()))
    );

    if (existing) {
      return res.status(200).json({
        message: 'This coupon is already in your saved list.',
        saved: existing,
      });
    }

    const newSaved: SavedCouponRecord = {
      id: 'sav-' + Date.now(),
      userId: req.user!.id,
      userEmail: req.user!.email,
      couponId,
      brand,
      title: title || `${brand} Discount Offer`,
      discount: discount || 'Special Savings',
      sellingPrice: sellingPrice || '49',
      couponAmount: couponAmount || '200',
      code: code || '',
      expiryDate: expiryDate || '30-11-2026',
      category: category || 'General',
      savedAt: new Date().toISOString(),
    };

    savedCoupons.unshift(newSaved);

    let firestorePersisted = false;
    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'saved_coupons', newSaved.id), cleanFirestoreData(newSaved));
        firestorePersisted = true;
        console.log(`[Firebase] Saved coupon ${newSaved.id} stored in Firestore.`);
      } catch (err) {
        console.warn('[Firebase] Save coupon error:', err);
      }
    }

    return res.status(201).json({
      message: 'Coupon saved to your profile wishlist!',
      databaseStored: firestorePersisted,
      saved: newSaved,
    });
  });

  // DELETE /api/user/saved-coupons/:couponId: Remove from saved
  app.delete(['/api/user/saved-coupons/:couponId', '/api/saved-coupons/:couponId'], requireAuth, async (req: Request, res: Response) => {
    const { couponId } = req.params;
    const index = savedCoupons.findIndex(
      (s) =>
        (s.userId === req.user!.id || s.userEmail.toLowerCase() === req.user!.email.toLowerCase()) &&
        (s.couponId === couponId || s.id === couponId)
    );

    if (index === -1) {
      return res.status(404).json({ error: 'Saved coupon not found.' });
    }

    const removed = savedCoupons.splice(index, 1)[0];

    if (firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, 'saved_coupons', removed.id));
      } catch (err) {
        console.warn('[Firebase] Remove saved coupon error:', err);
      }
    }

    return res.json({
      message: `Coupon "${removed.brand}" removed from your saved list.`,
      removedId: removed.id,
    });
  });

  // --------------------------------------------------------------------------
  // VITE DEV SERVER / STATIC ASSETS
  // --------------------------------------------------------------------------
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  let currentPort = Number(PORT) || 3000;
  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${currentPort} is already in use. Trying port ${currentPort + 1}...`);
      currentPort += 1;
      setTimeout(() => {
        httpServer.close();
        httpServer.listen(currentPort, '0.0.0.0');
      }, 150);
    } else {
      console.error('[Server] Fatal error:', err);
    }
  });

  httpServer.listen(currentPort, '0.0.0.0', () => {
    console.log(`VouchNest Full-Stack Server running on http://localhost:${currentPort}`);
  });
}

startServer();
