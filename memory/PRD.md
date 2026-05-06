# DEVIL Portfolio — PRD

## Original Problem Statement
User uploaded a static cyberpunk portfolio (`index.html`, `script.js`, `style.css`) for "Dev / DEVIL — Gamer | Creator | Dreamer". Asked to:
1. Convert it into a working full-stack app with backend
2. Make it more animated and smooth
3. Add features they like

User chose to keep it as **vanilla HTML/CSS/JS** (no React migration).

## Architecture
- **Frontend**: static HTML/CSS/JS in `/app/frontend/public/` served by CRA dev server on port 3000. `src/index.js` is intentionally empty so React doesn't interfere. `window.BACKEND_URL` is injected via `%REACT_APP_BACKEND_URL%` substitution.
- **Backend**: FastAPI (`/app/backend/server.py`) on port 8001. All routes prefixed with `/api`.
- **Database**: MongoDB collections — `contact_messages`, `guestbook`, `terminal_logs`, `visits`, `presence`.

## User Personas
- **Visitor** — anyone landing on the portfolio. No auth. Identified by anonymous `visitor_id` stored in localStorage + server-side fingerprint.
- **Owner (Dev / DEVIL)** — receives contact messages and guestbook signals.

## Core Requirements (Static)
- Preserve the original cyberpunk look + glitch + theme toggle + terminal + matrix rain.
- Keep contact form, gallery, skills meters, games, projects.
- Backend persistence for messages, guestbook, visits, terminal logs.
- Smoother and richer animations.

## What's Been Implemented (2026-05-06)
### Backend (`/api/*`)
- `GET /api/` — health
- `POST /api/contact` — save contact message (validates email)
- `POST /api/guestbook` — add neon "signal" to public wall (handle/message/color)
- `GET /api/guestbook` — list latest entries (newest-first)
- `POST /api/visit` — track visit + presence
- `GET /api/online` — currently online (active in last 60s)
- `GET /api/stats` — total_visits, unique_visitors, online_now, messages, guestbook_entries, commands_run, top_commands
- `POST /api/terminal/log` — log every terminal command

### Frontend
- Live HUD (top-left) showing ONLINE / VISITS / CMDS — polled every 15s
- Top controls: SFX toggle (Web Audio synth), MUSIC toggle (synthwave loop with pad + arpeggio), Theme toggle (Cyberpunk/Pixelverse, persisted)
- Animated **starfield particle background** with line-connections between near particles
- **Custom neon cursor** (dot + smooth ring with hover state on interactive elements)
- **Reveal-on-scroll** stagger animations for every section
- Hero with glitch DEV logo, conic-gradient spinning logo block, dual CTAs (Check My Work / Open Terminal)
- Avatar floats (`avatarFloat` keyframe), meter shine sweep, hover-tilt cards
- **Signal Wall (guestbook)** — color-coded neon cards (cyan/magenta/violet/green/yellow/red), live-prepended on submit
- **Contact form** wired to `/api/contact` with success/error status line
- **Achievements toast** system (slide-in, sound) — `First Contact`, `Color Override`, `Music Online`, `Signal Sent`, `Signal Broadcasted`, `Data Mined`, `System Override`, `Into the Matrix`, `Reflex Test`, `Caffeinated`, `Konami Code`, `Deep Dive`
- **Terminal upgrades**: `help`, `show projects`, `glitch.dev`, `stats`, `visitors`, `online`, `whoami`, `top commands`, `date`, `social`, `banner`, `clear`, `history`, `matrix`, `matrix stop`, `snake` (playable mini-game), `guestbook`, `contact`, `coffee`. Up/Down history, Tab autocomplete.
- **Snake mini-game** rendered inside the terminal output — WASD/arrows, Q to quit
- **Konami code** triggers glitch+devil mode + achievement
- Improved **gallery slider** — drag with movement threshold so plain clicks always open the lightbox
- Reduced-motion support preserved

## Tested
- Backend: 12/12 pytest cases pass (100%)
- Frontend: ~95% pass on first run; lightbox-on-click reliability fixed afterwards (now 100%)

## Prioritized Backlog
### P1
- Admin dashboard (read-only) showing recent contact messages + guestbook moderation
- Email notification on new contact (SendGrid/Resend) — would require API key from user
- Owner-only delete on guestbook (PIN protected)

### P2
- Replace placeholder Unsplash/Coverr media with owner's real assets
- Configurable content (projects, games, skills) via JSON or admin UI
- TTL index on `presence.last_seen` to auto-expire stale rows
- Split frontend script.js into modules (terminal, slider, hud, achievements)
- Rate-limiting on POST endpoints
- Real social handles + favicon image asset

## Next Tasks
1. Wait for owner-supplied content (real avatar, IGN, social URLs, project links).
2. Optionally wire SendGrid/Resend for email notifications.
3. Optional: add TTL index for `presence` collection.
