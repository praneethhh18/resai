# Recipe Studio

An AI-assisted recipe discovery experience built with Next.js 15, Firebase, and Google Gemini. The app blends multiple recipe sources, prioritising AI-generated ideas while gracefully falling back to public APIs and user submissions.

## Highlights

- **AI-first search** – Gemini suggests up to three structured recipes per query, with MealDB and user-created recipes filling gaps.
- **Smart fallbacks** – Timeout, cooldown, and per-query caching keep the app responsive even when Gemini is slow or rate limited.
- **Firebase integration** – Client SDK for real-time user recipes and a server-side Admin SDK for secure lookups and notifications.
- **Tailored UI** – App Router, shadcn/ui components, animated loaders, and mobile-friendly layouts deliver a polished feel.

## Architecture Overview

```text
Next.js App Router
├─ src/app/page.tsx           # Main search and browsing experience
├─ src/lib/actions.ts         # Server actions (search, suggestions, trending)
├─ src/ai/flows/*             # Genkit flows for Gemini interactions
├─ src/firebase/*             # Firebase client/admin bootstrapping
└─ src/components/app/*       # Feature-rich UI components
```

### Search Flow

1. Receive a query (`dish` or `ingredient` mode).
2. Check the in-memory Gemini cache; reuse results if still fresh (5 minutes).
3. Respect throttle (10 seconds) and cooldown windows before calling Gemini.
4. Run MealDB and user Firestore lookups in parallel.
5. Merge results with Gemini first, then user recipes, then MealDB, deduping by name.
6. Return structured `Recipe` objects to the client; surface origin metadata for UI badging.

If Gemini returns quota errors, the app enters a cooldown and immediately shows non-AI results instead of failing the search.

## Requirements

- Node.js 18+
- npm (or pnpm/yarn if you adapt the scripts)
- Firebase project with Firestore and Storage enabled
- Google AI Studio (Gemini) API key with sufficient quota

## Environment Variables

Create a `.env` file based on the following keys:

```env
GOOGLE_GENAI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_SERVICE_ACCOUNT_JSON={...}  # Raw JSON or base64 string

# Optional
NEXT_PUBLIC_ENABLE_AI_SUGGESTIONS=true  # enables inline search hints
```

> **Note:** The admin service-account JSON must be valid JSON (or a base64-encoded string) so the server actions can load it on the fly.

## Getting Started

```bash
npm install
npm run dev -- --port 9004   # or omit --port to use the default 3000
```

Visit `http://localhost:9004` (or the default port) to explore the app.

### Useful Scripts

- `npm run lint` – ESLint (shadcn/ui configuration)
- `npm run typecheck` – TypeScript project-wide validation
- `npm run dev` – Next.js dev server with Turbopack

## Handling Gemini Quotas

- Gemini free tier is limited (often 10 requests/minute). The app throttles calls and caches results, but you may still hit 429 errors during heavy usage.
- Upgrading to a paid plan or requesting a quota increase in Google AI Studio is recommended for production.
- Search suggestions are disabled by default; enable via `NEXT_PUBLIC_ENABLE_AI_SUGGESTIONS=true` if your quota allows.

## Contributing / Customising

- Update UI components under `src/components/app` to change layout or theming.
- Adjust throttling or cache behaviour in `src/lib/actions.ts` by editing `GEMINI_THROTTLE_INTERVAL_MS` and `GEMINI_CACHE_TTL_MS`.
- Swap data sources by extending the fetchers within `searchRecipes`.

## Deployment Notes

- Ensure environment variables are configured for both the Next.js runtime and any serverless adapters.
- Service-account credentials should be provisioned through your hosting platform’s secret manager (Vercel, Firebase Hosting, Cloud Run, etc.).
- Firestore security rules live in `firestore.rules`; remember to deploy them alongside the application.

## Support

If you run into issues with the project:

- Check the console/log output for quota or JSON parsing errors.
- Verify the `.env` file is loaded (Next.js prints `Environments: .env` on boot).
- Reach out by filing an issue or contact the maintainer specified in your deployment notes.

Happy cooking (and coding)! 🍳
