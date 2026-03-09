# QAVRA — Pathak Sons Services Platform

A modern, full-featured local services marketplace built with **Next.js 16 + React 19**.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔑 Demo Credentials

| Role | Phone / Email | Password |
|------|--------------|---------|
| Admin | admin@qavra.com | admin@123 |
| Customer | 9876543210 | any |
| Provider | 9765432100 | any |

## ✨ Features

### Customer
- Book verified service professionals nearby
- Live provider tracking (OpenStreetMap + Haversine distance/ETA)
- SOS emergency button, share booking, in-app chat
- Report provider (auto-suspends at 3+ complaints)
- Escrow payment system — release payment on job completion
- 5-star reviews

### Provider
- 5-step signup with profile photo, gov ID, address proof upload
- Work portfolio: 8 photos + 2 videos (max 30 seconds each)
- Liability agreement acceptance (mandatory)
- OTP phone verification with 60s cooldown
- Job management: accept, start (OTP), complete with before/after photos
- Earnings dashboard

### Admin
- Approve / reject / suspend providers
- View all bookings, users, revenue
- AI Fraud Detection logs
- Provider complaints management (auto-flags at ≥3 complaints)
- Full admin dashboard with charts

## 🛡️ Security
- File upload MIME type + size validation
- Image compression via Canvas API (max 800px, quality 0.72)
- Video duration check (≤30 seconds)
- Signup rate limiting: 3 attempts per device per 10 minutes
- Login failure rate limiting: 5 failures per phone per 5 minutes
- Phone & email uniqueness enforcement
- OTP phone verification

## 🗺️ Maps
- OpenStreetMap embed (no API key required)
- Real browser geolocation for customers
- Simulated provider movement with Haversine formula
- ETA at urban speed (~17 km/h)

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (dark/light mode)
- **Data**: localStorage (Firestore-ready schema)
- **Maps**: OpenStreetMap (free, no API key)
- **Auth**: Custom (free, no Firebase billing)
- **Images**: Canvas API compression (free, client-side)

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Signup
│   ├── admin/           # Admin dashboard pages
│   ├── customer/        # Customer-facing pages
│   ├── provider/        # Provider dashboard pages
│   ├── providers/       # Public provider listing
│   ├── legal/           # Terms, Privacy, Liability pages
│   └── services/        # Services listing
├── components/
│   ├── layout/          # Sidebar, PublicHeader
│   └── brand/           # BrandLogo
├── context/
│   └── AuthContext.tsx  # Auth + rate limiting
└── lib/
    └── localStore.ts    # localStorage data layer
```

## 📄 Legal

- Terms & Conditions
- Provider Agreement (independent contractor, liability clause)
- Privacy Policy
- Liability Disclaimer

---

Built by **Pathak Sons** · Powered by open-source tools
