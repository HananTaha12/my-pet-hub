## PetPal — Smart Pet Store Web App

A modern minimal web app that centralizes everything a pet owner needs: pet profiles, appointment booking, product shop, smart reminders, AI chat, and personalized recommendations. Backed by Lovable Cloud (auth + database) and Lovable AI for the chatbot/recommendations.

Note: The source MVP doc targets iOS/Android. We'll deliver the same feature set as a responsive web app (mobile-first), which serves as both the customer app and the staff dashboard.

### Design direction
- Modern minimal: white/neutral surfaces, generous whitespace, clean typography, subtle borders, soft shadows
- Single restrained accent color for primary actions
- Rounded cards, simple iconography (lucide), no heavy illustration

### Pages & navigation
Mobile-first bottom tab nav for owners (Home, Book, Shop, Chat, Profile). Desktop sidebar. Staff routes live under `/staff`.

Owner routes:
- `/` — Landing/marketing for logged-out visitors; redirects to `/home` when signed in
- `/login`, `/signup`
- `/onboarding` — add first pet
- `/home` — greeting, "Recommended for [Pet]" carousel, upcoming appointments, due reminders
- `/pets`, `/pets/$id` — list & detail (species, breed, DOB, weight, vaccination & treatment records)
- `/book` — service picker (grooming, vet check, training), calendar slot grid, pet selector, special instructions
- `/appointments` — upcoming + history, cancel/reschedule (≥4h rule)
- `/shop`, `/shop/$productId` — categories, search, filters, product detail
- `/cart`, `/checkout` — address, payment method (Card / Apple-Google Pay / COD — UI only, mocked), order confirmation
- `/orders`, `/orders/$id` — status tracking
- `/reminders` — vaccinations, flea/tick/deworming, food restock; mark done / snooze
- `/chat` — AI assistant with pet context
- `/profile` — account, saved addresses, payment methods, notification prefs

Staff routes (role-gated):
- `/staff` — today's appointments dashboard
- `/staff/appointments` — all bookings, status changes (Confirmed → In Progress → Done)
- `/staff/orders` — order queue, COD confirmation
- `/staff/products` — CRUD + featured/pinned
- `/staff/reminders` — configure trigger templates

### Core features (mapped to MVP doc)
1. **Pet Profiles** — multiple pets per user, vaccination & treatment records (records drive reminders)
2. **Appointment Booking** — services, real-time slot availability, 24h/2h reminders, cancel ≥4h, special instructions
3. **Product Shop & Cart** — catalog, search, categories, cart, saved methods (tokenized mock)
4. **Smart Reminders** — auto-generated from pet records (vaccines, treatments) + low-stock food reorders; push-style in-app + email-ready
5. **AI Chatbot** — Lovable AI (Gemini via gateway), receives active pet profile as system context, markdown rendering, full conversation history
6. **AI Personalized Recommendations** — "Recommended for [Pet Name]" carousel on home, generated from pet attributes + purchase history; staff can pin featured products
7. **Checkout & Payments** — Card / Apple-Google Pay / COD flows (UI complete, payment provider integration deferred to a later step)

### Backend (Lovable Cloud)
Tables: `profiles`, `user_roles` (separate table, enum: owner/staff/admin), `pets`, `vaccination_records`, `treatment_records`, `services`, `appointments`, `products`, `product_categories`, `featured_products`, `cart_items`, `orders`, `order_items`, `addresses`, `reminders`, `chat_conversations`, `chat_messages`. RLS on every table; staff role checked via `has_role()` security-definer function.

Auth: email + password and Google sign-in (Lovable Cloud defaults).

AI: server function calling Lovable AI Gateway (`google/gemini-2.5-flash`) for chat and for generating recommendation rationales; full conversation history sent each call.

### Out of scope (matches MVP doc exclusions)
Loyalty/rewards, telemedicine, in-app staff chat, photo gallery, multi-store marketplace, A/B testing, BNPL. Real payment processor — wire up later via Lovable's built-in payments.

### Build order
1. Cloud + auth + roles + profiles + onboarding
2. Pets + records
3. Services + appointment booking + reminders engine
4. Shop catalog + cart + checkout (mocked payment)
5. AI chat + recommendations
6. Staff dashboard
7. Polish, empty states, mobile nav, landing page
