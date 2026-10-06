# IBA Executive Alumni Forum

Web portal built from *UI screens v1.6*: the mobile-first member app (sections 1–8) and the desktop admin panel (section 9).

## Run it

```bash
python portal/serve.py
```

- Member app: http://localhost:8080
- Admin panel: http://localhost:8080/admin.html

Demo logins (sample data):
- Member: `farhana.rahman@gmail.com` / `demo1234`
- Admin: `admin@ibaexecutivemba.com` / `admin1234`
- To try joining by invitation, open the **Demo** button → *Open Rafiq's invite email*. The one-time code is shown on screen.

## What's in it

| Spec section | Where |
|---|---|
| 1 Splash | shown on every load, then routes to sign in / directory |
| 2 Joining by invitation | links valid 30 days; `#/i/<code>` → confirm email (OTP) → create password; email and WhatsApp invite previews under `#/demo/...` |
| 3 Profile set-up | 3-step wizard, skippable; batches 1–45; country and city (no area); photo crop/compress; per-field privacy switches |
| 4 Registration fee | ৳200 fee → Bangla QR (red, scannable, Save QR, 10-min expiry) → receipt download |
| 5 Directory | one search box with typo tolerance, filter sheet with live count, removable chips, infinite scroll (20 at a time) |
| 6 Profile and contact | contact buttons only for fields the member shares; WhatsApp with pre-filled greeting; portal email with daily limit; report profile |
| 7 Blood finder | donors by group and city, eligibility from last donation (never shown), urgent request with notified-donor count, offers, mark as fulfilled |
| Groups (added) | 5th footer tab: official groups with a platform icon (WhatsApp, Facebook, Messenger, Telegram, LinkedIn, Viber, Signal, Discord, website); tapping opens the group in its app. Admin → Groups to add, edit, reorder, enable, disable, hide or delete |
| 8 Privacy and account | completeness meter, privacy switches, preview as others see you, pause listing, download data, delete account |
| 9 Admin | dashboard, members (filters, pagination, enable/disable with reason, CSV export), member profile, bulk invite (dedupe, typo check, skip existing), payments (mark paid manually, look up transaction ID), approvals, reports, blood requests, announcements, audit log, settings |

## How it's built

Plain HTML/CSS/JS, no build step. `assets/js/data.js` is a **simulated backend** that stores everything in the browser's `localStorage`, so the member app and admin panel share data when opened in the same browser. Screens only call the `API` object, so it can be replaced with real HTTP calls.

`publicView()` in `data.js` is where hidden fields are stripped before anything reaches another member. On the real server this must happen server-side.

## Needed before going live

These are simulated in the prototype and need a real backend:
- Server and database (accounts, sessions, password hashing; passwords are stored in plain text in this prototype)
- Email delivery for invites, one-time codes, portal emails, receipts and announcements
- Bangla QR payment gateway and its payment-confirmation webhook (the screen polls for status; the demo has a "simulate payment" link)
- Server-side enforcement of privacy, message limits and admin permissions
