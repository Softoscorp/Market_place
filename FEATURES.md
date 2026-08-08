# House Agent — Complete Feature List

> North Cyprus housing rental platform.
> **Web:** Next.js frontend (Vercel) + FastAPI backend (Railway) + Supabase (storage).
> **Android APK:** Capacitor wrapper that loads the live web URL, so every feature below is also inside the APK automatically.
> **Last verified:** from live code scan of `frontend/` and `backend/`.

---

## 1. Accounts & Authentication

- **Sign up** (`/signup`) with role selection: **renter (student)** or **agent** — 2-step registration form.
- **Device fingerprinting** via FingerprintJS — `device_id` is sent at signup to bind accounts to a device (part of anti-scam).
- **Login** (`/login`), **logout**, **forgot password / reset password** flow.
- **Session persistence** — token stored in `localStorage`, auto session-expiry check every 4h.
- **Roles**: `student` (renter) · `agent` · `admin` · `customer_care`.
- **Presence (online/offline)** — the app pings the server every 60s; drives online/offline dots across the app.

## 2. Homepage (`/`)

- Hero banner.
- **Trending properties**.
- **University/area highlights** (e.g. campus areas) with quick-search links.
- **Top agents** row.

## 3. Property Search & Listing (`/search`)

- **Filters**: location (city/area), property type, min/max price, bedrooms, plus toggles for **furnished**, **generator**, **pool**, **gym**, **parking**, **pets allowed**.
- **Sorting**: recommended / price (low-high) / newest.
- Results as **card grid** with price, key specs and "move-in" badge.
- **Loading skeletons** while fetching.

## 4. Property Detail (`/property/[id]`)

- **Photo gallery** (Swiper carousel, swipeable).
- **Save to wishlist** (heart) — appears later in `/saved`.
- **Share** button (native share).
- **Move-In Calculator** — estimates the total move-in cost (rent + deposit + fees) and shows the affordable "move-in" figure.
- **Agent card on the listing** with **verified / international-verified** badges.
- **Start chat** with the agent directly from the listing.
- **Reviews & ratings** — read reviews + leave star ratings.
- **Duplicate / untaken offers** section (same property posted by different agents, grouped).
- **Report listing** — reasons: fake listing / wrong price / unavailable / other.

## 5. Agents & Verification

- **Agents directory** (`/agents`): all agents, **online-first** sorting, live-refreshed every 30s.
- **Agent profile** (`/agents/[id]`): avatar, tier badge, rating, response rate, online status, chat button, reviews.
- **Verification tiers** (explained in a popup modal):
  - **International verified** (gold badge) — top tier.
  - **Local verified** — identity/business check.
  - **Not yet verified** — new agent.
- **Apply for verification** (in the agent dashboard): upload **identity proof** and **business proof**, with pending / approved / rejected status shown.
- **Admin reviews** verification applications.

## 6. Agent Dashboard (`/agent-dashboard`)

Agent-only area with:
- **Overview**: stats (listings, views, leads), recent activity.
- **My listings**: manage posted properties, go to account edits, delete.
- **Client leads**: people who messaged you, contact info.
- **Settings**: edit agent details, save changes.
- **Danger zone**: account deactivation/management.
- **Verification application flow** (tiers + proof upload).

## 7. Chat & Messaging (`/messages`, ChatPanel)

- **Sliding chat panel** available site-wide (floating button).
- **Conversation thread** list (`/messages`) with unread counts.
- **Messages**: send/receive, auto-scroll to newest, contact avatar + online status + last-seen (EN/TR).
- **Message push notifications** (in-app toast).
- **Anti-scam contact filtering** — phone numbers (10+ digits), WhatsApp, Telegram, Viber references are **scrubbed from chat messages** automatically.
- **Auto-translation** of posted messages.

## 8. Roommates & Housemates (`/roommates`)

- **Full open listing** of roommate/roommate offers.
- **Filters**: taste, timezone, budget, gender, profile type.
- **Compatibility matching** — a 3-step wizard (lifestyle / cleanliness / schedule) that produces a **match score** shown on roommate cards.
- Roomsmate card with profile summary; message the person directly.

## 9. Saved / Wishlist (`/saved`)

- View all saved properties in one place.
- Quick actions: explore listings / explore roommates.

## 10. Post a Listing (`/post-listing`) — Agent only

- Full property form: title, description, location, price, type, bedrooms.
- **Photo upload** (up to 8 photos; PNG/JPG/WEBP, max 10MB each) → Supabase storage.
- Live **Move-In Calculator** preview while creating.
- Publish; success/error messaging.

## 11. Profile (`/profile`)

- Edit **name, phone, occupation**, avatar upload.
- **Identity Verification** and **Business Verification** status cards.
- **Wishlist** access.
- **Logout**.
- **Danger Zone**: deactivate account.
- **Chat history** entry points.

## 12. Admin Panel (`/admin`)

Moderation suite:
- **Listings moderation**.
- **Report review queue**.
- **Agent verification approvals** (approve / reject).
- **Online status** monitoring of agents (green/grey dots).
- **Conversation viewer** + **email a user** (customer care tools).

## 13. Notifications & Push

- **Web push** (FCM): permission prompt, subscribe, token registration.
- Server notifications for new messages, etc.
- **PWA manifest** + service worker (`sw.js`) for push display.
- In-app notification polling (`GET /notifications`).
- **APK**: `google-services.json` + `@capacitor/push-notifications` already wired — native push works in the installed app (Android 13+ needs `POST_NOTIFICATIONS`, already declared).

## 14. Security & Anti-Scam features

| Layer | Measure |
|---|---|
| Auth | token in localStorage, 4h expiry, device ID at signup |
| Chat | **contact-filter** strips phone numbers / WhatsApp / Telegram / Viber from messages |
| Verification | identity + business proof required for trusted tiers |
| Reports | any user can report fake / wrong-price / unavailable / other |
| Image protection | `ProtectedImage` blocks long-press/save & context menu & drag |
| Admin | moderation of listings, reports, verifications |
| App install | install PWA / APK prompt |

## 15. Internationalization

- Full support for **English** and **Turkish** (~200 keys each, fallback EN).
- Language persisted across sessions.

## 16. Tech notes

- Next.js 16 App Router · React 19 · Zustand · CSS Modules · Framer Motion · Swiper · Sentry.
- API base: `https://marketplace-production-2905.up.railway.app`.
- Chat is poll-based (no websocket): conversations refresh ~20–30s, open chats poll messages every 5s.
- Known gap: `capacitor.config.json` still uses `com.softoscorp.houseagent` while the built app uses `com.houseagent.app` — waiting to be aligned.

---

## APK = Web (important)

Because the APK loads the live Vercel URL, **every feature in this list ships to the APK automatically when you push to `main`.** You only rebuild the APK when changing **native** config: permissions, push plugin config, screenshots blocking (`FLAG_SECURE`), appId, or app name.