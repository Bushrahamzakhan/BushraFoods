# Halal Market Online - Deployment Guide

This project is a full-stack e-commerce marketplace built with React, Vite, Express, and SQLite. It is prepared for both web hosting and Android testing.

## 🚀 Online Deployment

### 1. Google Cloud Run (Recommended for AI Studio)
The easiest way to deploy is using the **"Deploy"** button in the AI Studio Build interface. This will package your app and host it on Google Cloud.

### 2. Render / Railway / Heroku
These platforms are excellent for full-stack applications.
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment Variables:**
  - `NODE_ENV=production`
  - `JWT_SECRET`: A secure random string for authentication.
  - `ADMIN_SECRET_KEY`: `HALAL_ADMIN_2026` (or your preferred key).
  - `DATABASE_PATH`: If using persistent storage, set this to the path of your mounted volume (e.g., `/app/data/database.sqlite`).

**Note on SQLite Persistence:**
When deploying to platforms like Render or Railway, you **must** use a "Persistent Disk" or "Volume" to ensure your database is not wiped when the server restarts. Mount the volume at `/app/data` and set `DATABASE_PATH=/app/data/database.sqlite`.

---

## 📱 Android Testing

This project uses **Capacitor** to turn the web app into a native Android app.

### Prerequisites
- [Android Studio](https://developer.android.com/studio) installed on your local machine.
- Node.js and npm installed.

### Steps to Generate APK
1. **Export Code:** Use the **Settings > Export to ZIP** menu in AI Studio.
2. **Local Setup:**
   ```bash
   npm install
   npm run build
   ```
3. **Android Platform:**
   ```bash
   npm run cap:add    # Adds the Android platform (first time only)
   npm run cap:sync   # Syncs your web code to the Android project
   ```
4. **Build APK:**
   ```bash
   npm run cap:open   # Opens the project in Android Studio
   ```
   In Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

### Distribution
- **Firebase App Distribution:** Upload the generated APK to the Firebase Console and invite testers via email.
- **Google Play Internal Testing:** Upload the APK to the Google Play Console under the "Internal Testing" track.

---

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend:** Express.js, Socket.IO, Better-SQLite3.
- **Mobile:** Capacitor.
