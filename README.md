# VouchNest - Your Savings Hub

A modern, responsive full-stack coupon and voucher platform built with **React**, **Vite**, **Express**, **Tailwind CSS**, and **Firebase Firestore**.

---

## 🚀 Running in Visual Studio Code (Local Setup)

The application is pre-configured to connect to the Firebase Firestore database directly out of the box.

### Step 1: Prerequisites
- Install **Node.js** (v18, v20, or v22 recommended): [https://nodejs.org/](https://nodejs.org/)
- Verify in your terminal:
  ```bash
  node -v
  npm -v
  ```

### Step 2: Open in VS Code
1. Open **Visual Studio Code**.
2. Go to **File** > **Open Folder...** and choose the root folder of this project.

### Step 3: Install Dependencies
Open the VS Code Integrated Terminal (`Ctrl + ~` on Windows/Linux or `Cmd + ~` on macOS) and run:
```bash
npm install
```

### Step 4: Start the Full-Stack Dev Server
Run:
```bash
npm run dev
```

The application will start on:
👉 **`http://localhost:3000`**

- **Frontend**: Serves the React SPA with Tailwind CSS styling and live updates.
- **Backend API & Database**: Express routes handle `/api/*`, connected to your cloud **Firebase Firestore** database (`applied-fabric-nsmzh`).
- **Database Status**: Visit `http://localhost:3000/api/database/status` in your browser to verify database connectivity.

---

## 🗄️ How the Database is Connected

1. **`firebase-applet-config.json`**:
   Contains project credentials, API keys, and database ID:
   ```json
   {
     "projectId": "applied-fabric-nsmzh",
     "firestoreDatabaseId": "ai-studio-remixremixvouchn-14e04412-85b8-489e-b798-e3ec48baa463",
     "apiKey": "AIzaSyCT7Mxwn9o6rkjFLwkXJg4tdW-erCLCInI"
   }
   ```
2. **Backend Sync (`server.ts`)**:
   Automatically reads `firebase-applet-config.json` (or `.env` variables) on startup, connects to Firestore, synchronizes coupons, claims, users, and saved wishlists.
3. **Frontend Client (`src/firebase.ts`)**:
   Provides direct Firestore client access when needed.
4. **Security Rules (`firestore.rules`)**:
   Configured to permit application data read/write securely.

---

## 💳 Razorpay Payment Gateway (Pre-Configured)

- **Key ID**: `rzp_test_TkUt0Lkdgdg9cu` (Pre-configured in `server.ts`, or override via `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`).
- **Direct Gateway Flow**: Clicking **Get Coupon** or **Pay & Unlock** immediately creates a Razorpay Order (`POST /api/payments/razorpay/create-order`) and opens the official **Razorpay Checkout** modal without any intermediate payment page.
- **Signature Verification**: Upon payment, `POST /api/payments/razorpay/verify` validates the `HMAC-SHA256` signature, reveals the coupon code in plain text, and syncs the transaction to **Firebase Firestore**.

---

## 🌐 How to Deploy from VS Code

### Option A: Deploy to Render / Railway / Fly.io (Recommended Full-Stack)

Since this app uses an Express + Vite full-stack server (`server.ts`):

1. **Push your code to GitHub from VS Code**:
   - In VS Code, open the **Source Control** tab (`Ctrl + Shift + G`).
   - Stage all changes, type a commit message, and click **Commit**.
   - Click **Publish Branch** or push to your GitHub repository:
     ```bash
     git add .
     git commit -m "feat: complete vouch-nest application"
     git push origin main
     ```

2. **Deploy on Render**:
   - Go to [Render.com](https://render.com/) and click **New Web Service**.
   - Connect your GitHub repository.
   - Set the following settings:
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm run start`
   - Under **Environment Variables**, add:
     - `NODE_ENV`: `production`
     - `PORT`: `3000` (or leave default assigned by Render)
   - Click **Deploy Web Service**!

3. **Deploy on Railway**:
   - Go to [Railway.app](https://railway.app/) and select **Deploy from GitHub repo**.
   - Railway will auto-detect Node.js.
   - It will run `npm install`, `npm run build`, and `npm start`.

---

### Option B: Deploy to Firebase Hosting

To host both rules and frontend on Firebase:

1. **Install Firebase CLI** in your VS Code terminal:
   ```bash
   npm install -g firebase-tools
   ```

2. **Log in to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (select Firestore and Hosting):
   ```bash
   firebase init
   ```
   - Select **Firestore** and **Hosting**.
   - Use existing project: `applied-fabric-nsmzh`.
   - Set public directory to: `dist`.
   - Configure as single-page app: `Yes`.
   - Set automatic builds: `No`.

4. **Build and Deploy**:
   ```bash
   npm run build
   firebase deploy
   ```

---

### Option C: Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Build and deploy:
   ```bash
   vercel
   ```

---

## 🛠 Available NPM Scripts

| Command | Action |
|---|---|
| `npm run dev` | Runs the full-stack server (Vite + Express) in development mode on port 3000 |
| `npm run build` | Builds the production bundle using Vite into `/dist` |
| `npm run start` | Runs the production Node server serving static `/dist` bundle and API endpoints |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run preview` | Runs Vite production preview server |

---

## 💡 Recommended VS Code Extensions

1. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
2. **ESLint** (`dbaeumer.vscode-eslint`)
3. **Prettier - Code formatter** (`esbenp.prettier-vscode`)
