This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

For an overview of the technical foundations and planned improvements, see [AGENTS.md](./AGENTS.md).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Features

- Chapter reader with lazy-loaded images, blurred placeholders and preloads up to five upcoming pages.
- Improved scraping logic using custom lazy-load steps.
- Fixed image aspect ratio warnings using Next.js `fill` layout for responsive images.
- Blur placeholder ensures images reserve their space and fade in smoothly.
- Hook `useChapterNavigation` to manage chapter navigation.
- Progress indicator showing loaded pages vs total while reading.
- Asynchronous API routes with proper parameter handling.
- Timestamped error logs for easier debugging.
- Consistent `logger.log('error')` calls replace `console.error` for structured logging.
- Unified API response with `pageCount` and `pages` array.
- Stronger type safety with explicit interfaces replacing `any`.
- Logger interface cleaned up to remove duplicate fields.
- Header visibility responds to scroll direction while reading.
- Client-side state initialization avoids hydration mismatches.
- Global `FavoritesProvider` context shares the favorites list across pages.
- LocalStorage updates occur synchronously when modifying favorites.
- Configuration unified under `next.config.ts` with custom image patterns and API rewrites.

- Chapter images fetched via the MangaDex API with cached results (fallback to scraping).
- Chapter API endpoint `/api/manga/[id]/chapter/[chapterId]` replaces the deprecated `route-old.ts` file.
- Manga details cached for an hour to minimize API calls.
- Browser instance reused across chapter searches for faster scraping.
- Common Puppeteer launch arguments moved to a `launchBrowser` utility.
- Scraping diagnostics available via `app/scripts/test-scraping.ts` for easier selector tuning.
- New "Nouveautés" section shows latest manga using the MangaDex API.
- Personalized recommendations via `/api/recommendations` with local caching.

- Unit tests verify favorites persistence and recommendation caching.
- Tests for `useFavorites` wrap the hook with `FavoritesProvider` to mirror app usage.
- Favorites loaded from `localStorage` on initial render prevent empty favorites
  pages and ensure your list persists across sessions.
- Graceful localStorage fallback avoids errors if saved favorites are malformed.
- Recently read manga IDs stored in the `reading_history` cookie (last 20).

- Rate limiter on `/api/scraper` prevents abusive calls.
- Search queries are sanitized and only HTTPS requests are allowed.
- The `Strict-Transport-Security` header enforces HTTPS for two years across all subdomains.
- MangaDex API requests automatically retry up to three times on network errors.
- In-memory cache automatically prunes expired entries to limit memory usage.
- Multi-source search aggregates MangaDex, Kitsu and Komga before falling back to scraping.
- Connection pooling via `undici` enables HTTP/2 requests with configurable concurrency.


## Usage

When you open a chapter, a progress bar at the top indicates how many pages have
finished loading compared to the total number of pages. This helps you monitor
the loading status as you read
and relies on the `pageCount`/`pages` values returned by the API.

Use the `useRecommendations` hook to display manga suggestions. The
`reading_history` cookie tracks your last 20 mangas and is sent to the API for
personalized results. Recommendations are cached in `localStorage` for one hour.

## Project Setup

### Installation

Install dependencies after cloning the repository:

```bash
npm install
```

### Environment variables

Create a `.env.local` file to configure your Redis instance. The application uses `REDIS_URL`, falling back to `redis://localhost:6379` if not provided:

```bash
# .env.local
REDIS_URL=redis://localhost:6379
CONCURRENT_SOURCES=2
CONCURRENT_PAGES=6
```

## Testing

### Integration script

Run the provided script to check chapter reading and API responses:

```bash
bash test-reading.sh
```

Ensure the development server is running (`npm run dev`) so the script can reach `http://localhost:3001`.

### Vitest suite

Execute unit tests with [Vitest](https://vitest.dev):

```bash
npx vitest
```

### Standalone test scripts

These scripts validate client logic without a browser. Run them with Node:

```bash
node test-chapters-sorting.js
node test-language-navigation.js
node test-reading-logic.js
```

`test-chapters-sorting.js` checks chapter sorting and pagination from the API.
`test-language-navigation.js` verifies the `useChapterNavigation` logic with
multiple languages.
`test-reading-logic.js` ensures the reading order is correct even when chapters
are unsorted.

## Contributing

Before committing, lint the project and check for vulnerabilities:

```bash
npm run lint
npm audit
npx vitest run
```

Use the commit message format `<type>(<scope>): <description>` (e.g. `feat(reader): add lazy loading`). Allowed types are `feat`, `fix`, `docs`, `style`, `refactor`, `test`, and `chore`.

## Security Audit

Dependencies are checked regularly with `npm audit`. As of **June 7, 2025**, the audit reports **0 vulnerabilities**. If future audits reveal advisories, apply `npm audit fix` and document any remaining issues here.
