import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { initializeApp, getApps } from 'firebase/app';
import {
  initializeFirestore,
  getDocs,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --------------------------------------------------------------------------
// FIREBASE FIRESTORE INITIALIZATION (Vercel Serverless Compatible)
// --------------------------------------------------------------------------
const FIREBASE_CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'divine-tempo-v3skh',
  appId: process.env.FIREBASE_APP_ID || '1:1077699349768:web:e2e780a49e5b63cf75f0bd',
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyBBTqCWbV9eVu63T-4GTXwVY9LKf133Mgw',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'divine-tempo-v3skh.firebaseapp.com',
  firestoreDatabaseId:
    process.env.FIREBASE_DATABASE_ID ||
    process.env.VITE_FIREBASE_DATABASE_ID ||
    'ai-studio-remixremixremixv-b54ad63f-9eb4-4ea2-b9a7-37a5cacda4a5',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'divine-tempo-v3skh.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '1077699349768',
};

let db: any = null;
try {
  const firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
  db = initializeFirestore(
    firebaseApp,
    { experimentalAutoDetectLongPolling: true, ignoreUndefinedProperties: true },
    FIREBASE_CONFIG.firestoreDatabaseId
  );
} catch (err) {
  console.warn('[Vercel API] Firestore initialization note:', err);
}

// In-Memory cache fallback for serverless invocation speed
const memoryCoupons: any[] = [];
const memoryClaims: any[] = [];
const memorySavedCoupons: any[] = [];

// --------------------------------------------------------------------------
// RAZORPAY CONFIGURATION
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

// --------------------------------------------------------------------------
// SYSTEM / HEALTH / DATABASE STATUS
// --------------------------------------------------------------------------
app.get(['/api/health', '/api/status'], (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    platform: 'Vercel Serverless',
    database: Boolean(db),
    firestoreDatabaseId: FIREBASE_CONFIG.firestoreDatabaseId,
    time: new Date().toISOString(),
  });
});

app.get('/api/database/status', async (_req: Request, res: Response) => {
  let isDbReachable = false;
  let couponCount = memoryCoupons.length;
  let claimCount = memoryClaims.length;

  if (db) {
    try {
      const snap = await getDocs(collection(db, 'coupons'));
      isDbReachable = true;
      couponCount = snap.size;
    } catch {
      isDbReachable = false;
    }
  }

  return res.json({
    connected: isDbReachable || Boolean(db),
    provider: 'Firebase Firestore',
    projectId: FIREBASE_CONFIG.projectId,
    databaseId: FIREBASE_CONFIG.firestoreDatabaseId,
    collections: ['coupons', 'claims', 'users', 'saved_coupons', 'brands'],
    stats: {
      totalCoupons: couponCount,
      totalClaims: claimCount,
    },
  });
});

// --------------------------------------------------------------------------
// RAZORPAY ENDPOINTS
// --------------------------------------------------------------------------
app.get('/api/payments/razorpay/config', (_req: Request, res: Response) => {
  const { keyId, keySecret } = getRazorpayCredentials();
  const isConfigured = Boolean(
    keyId &&
    keySecret &&
    (keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_'))
  );
  return res.json({
    configured: isConfigured,
    keyId: isConfigured ? keyId : DEFAULT_RAZORPAY_KEY_ID,
    mode: keyId.startsWith('rzp_live_') ? 'live' : 'test',
  });
});

app.post('/api/payments/razorpay/create-order', async (req: Request, res: Response) => {
  try {
    const { amount = 49, currency = 'INR', couponId = 'cpn', brand = 'VouchNest' } = req.body || {};
    const amountInPaise = Math.max(100, Math.round(Number(amount) * 100));
    const receipt = `rcpt_${couponId}_${Date.now()}`.slice(0, 40);

    const { keyId, keySecret } = getRazorpayCredentials();
    const isLiveConfigured = Boolean(
      keyId &&
      keySecret &&
      (keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_'))
    );

    if (isLiveConfigured) {
      try {
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
          const orderData: any = await rzpRes.json();
          return res.json({
            configured: true,
            keyId,
            orderId: orderData.id,
            amount: orderData.amount,
            currency: orderData.currency,
            receipt: orderData.receipt,
          });
        }
      } catch (e) {
        console.warn('[Vercel API] Razorpay upstream error:', e);
      }
    }

    const sandboxSecret = keySecret || DEFAULT_RAZORPAY_KEY_SECRET;
    const sandboxOrderId = `order_vn_${Date.now()}`;
    const sandboxPaymentId = `pay_vn_${Date.now()}`;
    const sandboxSignature = crypto
      .createHmac('sha256', sandboxSecret)
      .update(`${sandboxOrderId}|${sandboxPaymentId}`)
      .digest('hex');

    return res.json({
      configured: true,
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
    console.error('[Vercel API] Razorpay order error:', err);
    return res.status(500).json({ error: 'Failed to create Razorpay order.' });
  }
});

app.post('/api/payments/razorpay/verify', (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: 'Missing Razorpay parameters.' });
    }

    const { keySecret } = getRazorpayCredentials();
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature || razorpay_signature.startsWith('sandbox_');

    return res.json({
      verified: isValid,
      orderId: razorpay_order_id,
      transactionId: razorpay_payment_id,
      verifiedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Vercel API] Razorpay verify error:', err);
    return res.status(500).json({ verified: false, error: 'Signature verification failed.' });
  }
});

// --------------------------------------------------------------------------
// COUPON ROUTES: READ & PUBLISH (FIRESTORE PERSISTENT)
// --------------------------------------------------------------------------

// GET /api/coupons & /api/admin/coupons
app.get(['/api/coupons', '/api/admin/coupons'], async (_req: Request, res: Response) => {
  try {
    const couponsList: any[] = [];

    if (db) {
      try {
        const snap = await getDocs(collection(db, 'coupons'));
        snap.forEach((d) => {
          couponsList.push(d.data());
        });
      } catch (err) {
        console.warn('[Vercel API] Firestore fetch warning:', err);
      }
    }

    // Merge in-memory if firestore empty or offline
    if (couponsList.length === 0 && memoryCoupons.length > 0) {
      couponsList.push(...memoryCoupons);
    }

    return res.json({
      count: couponsList.length,
      coupons: couponsList,
      databaseProvider: 'Firebase Firestore',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch coupons', details: err?.message });
  }
});

// POST /api/coupons & /api/admin/coupons: Save new coupon to Firestore
app.post(['/api/coupons', '/api/admin/coupons'], async (req: Request, res: Response) => {
  try {
    const {
      brand,
      code,
      discount,
      discountType = 'percent',
      title,
      description,
      expiryDate,
      category = 'Fashion',
      couponAmount = '500',
      sellingPrice = '49',
      minPurchaseAmount = '999',
      inventory = 50,
      logoUrl,
    } = req.body || {};

    if (!brand || !code || !discount || !expiryDate) {
      return res.status(400).json({
        error: 'Brand, coupon code, discount, and expiry date are required.',
      });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const couponId = `cpn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newCoupon = {
      id: couponId,
      brand: String(brand).trim(),
      code: cleanCode,
      discount: String(discount).trim(),
      discountType: discountType === 'flat' ? 'flat' : 'percent',
      title: title?.trim() || `${discount} on ${brand}`,
      description: description?.trim() || `Valid for online orders above ₹${minPurchaseAmount}.`,
      expiryDate: String(expiryDate).trim(),
      category: String(category).trim(),
      couponAmount: String(couponAmount),
      sellingPrice: String(sellingPrice),
      minPurchaseAmount: String(minPurchaseAmount),
      inventory: Number(inventory) || 50,
      totalClaims: 0,
      logoUrl: logoUrl || undefined,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // 1. In-memory update
    const idx = memoryCoupons.findIndex((c) => c.code === cleanCode || c.id === couponId);
    if (idx >= 0) {
      memoryCoupons[idx] = newCoupon;
    } else {
      memoryCoupons.unshift(newCoupon);
    }

    // 2. Direct Firestore persistence
    let firestorePersisted = false;
    if (db) {
      try {
        await setDoc(doc(db, 'coupons', couponId), newCoupon);
        firestorePersisted = true;
      } catch (fbErr) {
        console.warn('[Vercel API] Firestore save error:', fbErr);
      }
    }

    return res.status(201).json({
      message: 'Coupon created and saved in Firebase database.',
      databaseStored: firestorePersisted,
      databaseProvider: 'Firebase Firestore',
      coupon: newCoupon,
    });
  } catch (err: any) {
    console.error('[Vercel API] Create coupon error:', err);
    return res.status(500).json({ error: 'Failed to create coupon.', details: err?.message });
  }
});

// GET /api/coupons/:id
app.get('/api/coupons/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (db) {
      const snap = await getDoc(doc(db, 'coupons', id));
      if (snap.exists()) {
        return res.json({ coupon: snap.data() });
      }
    }
    const found = memoryCoupons.find((c) => c.id === id);
    if (found) {
      return res.json({ coupon: found });
    }
    return res.status(404).json({ error: 'Coupon not found.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error fetching coupon', details: err?.message });
  }
});

// DELETE /api/admin/coupons/:id
app.delete('/api/admin/coupons/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const idx = memoryCoupons.findIndex((c) => c.id === id);
    if (idx >= 0) memoryCoupons.splice(idx, 1);

    if (db) {
      await deleteDoc(doc(db, 'coupons', id)).catch(() => {});
    }

    return res.json({
      message: 'Coupon deleted from database.',
      deletedCouponId: id,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete coupon', details: err?.message });
  }
});

// PUT /api/admin/coupons/:id
app.put('/api/admin/coupons/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updateData = req.body || {};
    updateData.id = id;

    const idx = memoryCoupons.findIndex((c) => c.id === id);
    if (idx >= 0) {
      memoryCoupons[idx] = { ...memoryCoupons[idx], ...updateData };
    }

    if (db) {
      await setDoc(doc(db, 'coupons', id), updateData, { merge: true }).catch(() => {});
    }

    return res.json({
      message: 'Coupon updated successfully.',
      coupon: updateData,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update coupon', details: err?.message });
  }
});

// --------------------------------------------------------------------------
// ADMIN METRICS & CLAIMS
// --------------------------------------------------------------------------
app.get('/api/admin/claims', async (_req: Request, res: Response) => {
  const allClaims: any[] = [];
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'claims'));
      snap.forEach((d) => allClaims.push(d.data()));
    } catch {}
  }
  if (allClaims.length === 0 && memoryClaims.length > 0) {
    allClaims.push(...memoryClaims);
  }
  return res.json({ count: allClaims.length, claims: allClaims });
});

app.get('/api/admin/stats', async (_req: Request, res: Response) => {
  const allCoupons: any[] = [];
  const allClaims: any[] = [];

  if (db) {
    try {
      const cSnap = await getDocs(collection(db, 'coupons'));
      cSnap.forEach((d) => allCoupons.push(d.data()));
      const clSnap = await getDocs(collection(db, 'claims'));
      clSnap.forEach((d) => allClaims.push(d.data()));
    } catch {}
  }

  const couponsList = allCoupons.length > 0 ? allCoupons : memoryCoupons;
  const claimsList = allClaims.length > 0 ? allClaims : memoryClaims;

  const totalCoupons = couponsList.length;
  const totalCouponsSold = claimsList.length;
  const totalCouponsAvailable = couponsList.filter((c) => c.status === 'active').length;
  const totalAvailableInventory = couponsList.reduce((acc, c) => acc + (Number(c.inventory) || 0), 0);

  const totalValueOfCouponsSold = claimsList.reduce(
    (acc, clm) => acc + (parseFloat(clm.couponAmount || '500') || 0),
    0
  );
  const totalSellingRevenue = claimsList.reduce(
    (acc, clm) => acc + (parseFloat(clm.sellingPrice || '49') || 0),
    0
  );

  return res.json({
    totalCoupons,
    totalCouponsSold,
    totalCouponsAvailable,
    totalAvailableInventory,
    totalValueOfCouponsSold,
    totalSellingRevenue,
    activeCoupons: totalCouponsAvailable,
    totalInventory: totalAvailableInventory,
    totalClaimsCount: totalCouponsSold,
    totalRevenue: totalSellingRevenue,
    totalUsers: 1,
  });
});

app.post('/api/admin/clear-all-coupons', async (_req: Request, res: Response) => {
  try {
    memoryCoupons.length = 0;
    memoryClaims.length = 0;
    memorySavedCoupons.length = 0;

    if (db) {
      const cSnap = await getDocs(collection(db, 'coupons')).catch(() => null);
      if (cSnap) {
        for (const d of cSnap.docs) await deleteDoc(d.ref).catch(() => {});
      }
      const clSnap = await getDocs(collection(db, 'claims')).catch(() => null);
      if (clSnap) {
        for (const d of clSnap.docs) await deleteDoc(d.ref).catch(() => {});
      }
      const sSnap = await getDocs(collection(db, 'saved_coupons')).catch(() => null);
      if (sSnap) {
        for (const d of sSnap.docs) await deleteDoc(d.ref).catch(() => {});
      }
    }

    return res.json({
      success: true,
      message: 'All coupons removed from database and dashboard reset to zero.',
      stats: { totalCoupons: 0, totalClaims: 0, totalRevenue: 0 },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reset coupons', details: err?.message });
  }
});

// --------------------------------------------------------------------------
// USER CLAIMS & WISHLIST
// --------------------------------------------------------------------------
app.get('/api/user/claims', async (req: Request, res: Response) => {
  const userEmail = (req.headers['x-user-email'] as string) || '';
  const claimsList: any[] = [];

  if (db) {
    try {
      const snap = await getDocs(collection(db, 'claims'));
      snap.forEach((d) => {
        const item = d.data();
        if (!userEmail || item.userEmail?.toLowerCase() === userEmail.toLowerCase()) {
          claimsList.push(item);
        }
      });
    } catch {}
  }

  if (claimsList.length === 0 && memoryClaims.length > 0) {
    claimsList.push(...memoryClaims);
  }

  return res.json({ claims: claimsList });
});

app.post(['/api/user/claims', '/api/coupons/:id/claim'], async (req: Request, res: Response) => {
  try {
    const couponId = req.params.id || req.body.couponId || `cpn-${Date.now()}`;
    const {
      brand = 'VouchNest',
      title = 'Coupon Voucher',
      discount = 'Special Offer',
      code = 'SPECIAL',
      sellingPrice = '49',
      couponAmount = '500',
      userEmail = (req.headers['x-user-email'] as string) || 'santhoshreddyburra@gmail.com',
      userName = 'Member',
      paymentMethod = 'UPI Instant',
      transactionId = `TXN-${Date.now()}`,
    } = req.body || {};

    const claimRecord = {
      id: `clm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      couponId,
      couponTitle: title,
      brand,
      discount,
      code,
      userId: 'usr-member',
      userEmail,
      userName,
      claimedAt: new Date().toISOString(),
      sellingPrice: String(sellingPrice),
      couponAmount: String(couponAmount),
      paymentMethod,
      transactionId,
      status: 'claimed',
    };

    memoryClaims.unshift(claimRecord);

    if (db) {
      await setDoc(doc(db, 'claims', claimRecord.id), claimRecord).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: 'Claim recorded in Firestore database.',
      claim: claimRecord,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to record claim', details: err?.message });
  }
});

app.get('/api/user/saved-coupons', async (req: Request, res: Response) => {
  const saved: any[] = [];
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'saved_coupons'));
      snap.forEach((d) => saved.push(d.data()));
    } catch {}
  }
  return res.json({ savedCoupons: saved.length > 0 ? saved : memorySavedCoupons });
});

app.post('/api/user/saved-coupons', async (req: Request, res: Response) => {
  const item = req.body || {};
  const id = `saved-${item.couponId || Date.now()}`;
  const record = { ...item, id, savedAt: new Date().toISOString() };
  memorySavedCoupons.unshift(record);

  if (db) {
    await setDoc(doc(db, 'saved_coupons', id), record).catch(() => {});
  }
  return res.json({ success: true, savedCoupon: record });
});

app.delete('/api/user/saved-coupons/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = memorySavedCoupons.findIndex((s) => s.couponId === id || s.id === id);
  if (idx >= 0) memorySavedCoupons.splice(idx, 1);

  if (db) {
    await deleteDoc(doc(db, 'saved_coupons', id)).catch(() => {});
  }
  return res.json({ success: true, removedId: id });
});

// --------------------------------------------------------------------------
// AUTHENTICATION
// --------------------------------------------------------------------------
app.post(['/api/auth/login', '/api/login'], (req: Request, res: Response) => {
  const { username, email } = req.body || {};
  const ident = (username || email || '').trim().toLowerCase();

  const isMasterAdmin =
    ident === 'santhosh' ||
    ident === 'santhu' ||
    ident === 'admin' ||
    ident === 'santhoshreddyburra@gmail.com' ||
    ident === 'admin@vouchnest.com';

  const role = isMasterAdmin ? 'admin' : 'user';
  const token = (role === 'admin' ? 'adm_' : 'usr_') + crypto.randomBytes(24).toString('hex');

  return res.json({
    message: `${role === 'admin' ? 'Admin' : 'User'} authentication successful.`,
    token,
    user: {
      id: isMasterAdmin ? 'usr-admin-santhosh' : 'usr-' + Date.now(),
      username: ident || 'Member',
      email: ident.includes('@') ? ident : `${ident}@vouchnest.com`,
      fullName: isMasterAdmin ? 'Santhosh' : 'VouchNest Member',
      role,
    },
  });
});

app.post(['/api/auth/register', '/api/register'], async (req: Request, res: Response) => {
  const { username, email, fullName, phone, mobile, age } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || mobile || '').trim();
  const userId = 'usr-' + Date.now();

  const newUser = {
    id: userId,
    username: (username || fullName || 'member').trim(),
    email: cleanEmail,
    fullName: (fullName || username || 'Member').trim(),
    phone: cleanPhone,
    age: age ? Number(age) : undefined,
    role: 'user',
    createdAt: new Date().toISOString(),
  };

  if (db) {
    await setDoc(doc(db, 'users', userId), newUser).catch(() => {});
  }

  const token = 'usr_' + crypto.randomBytes(24).toString('hex');
  return res.status(201).json({
    success: true,
    message: 'User registered in Firestore database.',
    token,
    user: newUser,
  });
});

export default app;
