# NC Rentals — North Cyprus Rental Listing Platform

A rough, functional mockup connecting agents/landlords with renters — FastAPI +
PostgreSQL backend, Next.js frontend. Communication is designed to stay
entirely in-platform: no phone/WhatsApp numbers are ever exposed in the API,
and a content filter rejects listings/messages that look like they contain
external contact info.

## What's included

**Backend** — FastAPI + PostgreSQL
- Three account types: Renter, Agent, Admin (no public admin registration —
  see `create_admin.py`)
- Listings: CRUD (agents only), up to 8 photos, amenities, status
  (active/rented/inactive)
- Search/filter: house type, price range, location, keyword; sort by price
  or newest; pagination
- In-platform messaging: text + voice messages, tied to a listing, between
  one renter and the agent
- Auto-translation of text messages between users with different profile
  languages, with per-message translation caching
- Two separate rating systems: apartment ratings and agent ratings, each
  gated on having actually messaged first
- Admin: ban/suspend/reactivate any account, verify agents, view & review
  reports
- A content filter that rejects listing text and messages containing
  phone-number-like patterns or references to WhatsApp/Telegram/etc.

**Frontend** — Next.js (App Router), plain CSS, deliberately unpolished
- Browse/search (public, no login needed)
- Login / Register with role selection
- Listing detail: photo gallery, agent card with verified badge, message
  form, apartment reviews + rating form
- Create/edit listing, with photo upload
- Agent public profile: rating, active listings, agent rating form
- Messages: conversation list + thread (text, and in-browser voice
  recording via MediaRecorder, played back inline)
- My Profile (name/phone/language)
- Admin dashboard: user table (verify/suspend/ban/reactivate), reports table

**Explicitly not built** (per spec): premium saved-search alerts, any
payment processing.

## Translation — important caveat

`app/translation.py` implements a real integration against Google Cloud
Translation API v2 (`GoogleTranslateService`), used automatically once you
set `GOOGLE_TRANSLATE_API_KEY`. **This sandbox has no network access to
Google's API** (egress here is restricted to package registries only), so
that code path could not be tested against the live API — it's written
correctly against Google's documented REST format, but you should verify it
yourself once you have a key.

Without a key, the app falls back to `MockTranslationService`, which clearly
labels its output (`[tr, untranslated — no translation API key configured] ...`)
rather than silently pretending to translate. Everything *around* the
translation call — language routing, per-message caching so the same
message isn't re-translated on every read, same-language passthrough — is
real and tested (via the mock).

## What's actually been tested (not just "it runs")

`backend/e2e_test.py` — 60+ assertions covering: registration for both
roles (and rejection of self-registered admins), duplicate email / wrong
password, listing CRUD with ownership checks, the contact-info filter
(phone numbers and WhatsApp mentions rejected in listing titles/descriptions
*and* in chat messages), search/filter/sort, the full messaging flow
including translation and unread counts, voice message upload, both rating
systems correctly gated on "must have messaged first" and correctly
rejecting duplicates, admin verify/suspend/ban/reactivate (including that a
suspended user's *existing* token stops working, not just fresh logins),
reports, and that phone/email never leak through any public-facing endpoint.

**Run against both SQLite and a real PostgreSQL instance.** This mattered:
Postgres's `AVG()` on an integer column returns a `Decimal`, not a `float`
the way SQLite's does — `round(avg, 2)` on a `Decimal` stays a `Decimal`,
which then serializes as a JSON *string* (`"5.00"`) instead of a number
(`5.0`). SQLite's behavior masked this completely; only testing against
real Postgres caught it. Fixed in `models.py` by casting to `float()` before
rounding.

**Frontend**: a real `next build` compiles cleanly across all 12 routes,
and every route was booted and hit at runtime (not just build-checked) with
no server errors. CORS was verified with actual cross-origin curl requests
(preflight + real request) between the two ports. Every frontend API call's
field names were manually cross-checked against the actual backend response
schemas.

**What wasn't tested**: actual browser interactivity (clicking through
forms, the MediaRecorder voice flow, real translation quality). This
sandbox has no network access to download a headless browser (Playwright's
Chromium download is blocked by the same egress restrictions as the
translation API), so there's no way to script a full click-through here.
Treat your first real run — register both account types, post a listing,
message across them, record a voice note — as the actual first test of the
UI layer, and see the checklist below.

## Running it

**Backend:**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
docker compose up -d              # local Postgres

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Create your first admin (there's no public admin signup):
```bash
ADMIN_BOOTSTRAP_EMAIL=admin@example.com ADMIN_BOOTSTRAP_PASSWORD=changeme123 \
python3 create_admin.py
```

To rerun the test suite yourself:
```bash
python3 e2e_test.py                                              # SQLite, no setup needed
DATABASE_URL="postgresql+psycopg2://rental:rental@localhost:5432/rental" \
SECRET_KEY="test-secret" python3 e2e_test.py                     # against your real Postgres
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000`. It talks to `http://localhost:8000` by
default — override with `NEXT_PUBLIC_API_BASE_URL` if your backend runs
elsewhere.

## First-run checklist

1. Register one Agent account and one Renter account.
2. As the agent: create a listing, add a couple of photos.
3. As the renter: browse, filter by house type/price/location, open the
   listing, send a text message.
4. Try sending a message containing a phone number or "whatsapp" — confirm
   it's rejected with the platform-policy message.
5. Reply as the agent (use a different browser/incognito tab, or log out
   and back in) — confirm the conversation and unread badge work both ways.
6. Try recording a voice message (needs mic permission) and play it back.
7. If the agent and renter have different `language` settings at
   registration, confirm the translated-label placeholder shows up (real
   translation requires a `GOOGLE_TRANSLATE_API_KEY`).
8. As the renter, rate the apartment and the agent — confirm both are
   blocked until you've actually messaged, and blocked a second time after
   the first rating.
9. Bootstrap an admin (`create_admin.py`), log in, verify the agent, then
   suspend and reactivate their account from `/admin`.

## Data model

- `User`: id, email, password_hash, name, phone, role (renter/agent/admin),
  language, account_status (active/suspended/banned), status_reason,
  is_verified (agents only), created_at
- `Listing`: id, agent_id, title, description, price, house_type, location,
  furnished, parking, pet_friendly, status, created_at, updated_at
- `ListingPhoto`: id, listing_id, url, order
- `Conversation`: id, listing_id, renter_id, agent_id, created_at
- `Message`: id, conversation_id, sender_id, message_type (text/voice),
  original_text, original_language, translations (JSON cache), audio_url,
  audio_duration_seconds, is_read, created_at
- `ApartmentRating` / `AgentRating`: id, listing_id or agent_id, renter_id,
  stars, comment, created_at (one per renter per listing/agent)
- `Report`: id, reporter_id, target_type, target_id, reason, status,
  created_at

## Known simplifications (intentional for this scope)

- JWT stored in `localStorage` on the frontend — fine for a mockup, an
  httpOnly cookie would be the production-grade choice.
- The contact-info filter is a heuristic (phone-number-shaped digit runs +
  a short keyword list for WhatsApp/Telegram/etc). It won't catch someone
  spelling digits out as words or splitting characters up — that's a
  genuine, unsolved cat-and-mouse problem on every platform with this
  policy, not something fully solvable in a v1 filter.
- Voice messages aren't transcribed or translated — only text messages go
  through the translation pipeline. Transcription (speech-to-text) would be
  a separate, substantial integration.
- "Rate the agent" only requires having messaged them on *any* listing, not
  necessarily the one you're currently viewing — intentional, since the
  point is rating the agent as a person to deal with, not tying it to a
  specific transaction.
- No image resizing/compression on upload — photos are stored as-is.
- Admin ban/suspend takes effect immediately, including invalidating a
  user's *existing* session (checked on every request, not just at login).
