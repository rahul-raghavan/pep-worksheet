# PEP Worksheet Generator

A web application for PEP Schoolv2 staff to generate printable math problem sets and answer keys.

## Requirements

- Node.js >= 18.18
- npm

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in the required values
4. Run the development server:
   ```bash
   npm run dev
   ```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Testing

Tests are written using Jest and React Testing Library. Run tests with:
```bash
npm run test
```

Coverage threshold is set to 85% as per project requirements.

## Contributing

Follow the conventional commits specification for all commit messages:
- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code
- refactor: A code change that neither fixes a bug nor adds a feature
- perf: A code change that improves performance
- test: Adding missing tests or correcting existing tests
- build: Changes that affect the build system or external dependencies
- ci: Changes to our CI configuration files and scripts

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

## Manual Sync

To manually update the local question bank from Google Sheets:

1. Ensure your `.env.local` contains:
   - `GOOGLE_SHEETS_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
2. Run:
   ```bash
   npm run sync
   ```
3. This will fetch, validate, and write the latest questions to `data/questions.json`.

For automated weekly sync, see `.github/workflows/weekly-sync.yml`.

## Programmatic usage

You can use the core generator utility in your own scripts:

```ts
import { generate } from './lib/generate';

const { problems, answers } = generate({
  topics: ['Fractions', 'Decimals'],
  minLevel: 2,
  maxLevel: 4,
  count: 10,
  seed: 'optional-seed', // for deterministic output
});

console.log(problems);
console.log(answers);
```

- The generator will sample unique questions matching your filters.
- If the pool is too small, it will throw a `TooSmallPoolError` with details.

## API Reference

### POST /api/worksheet

Generate a worksheet with filtered, unique, and optionally seeded questions.

**Request Body:**
```json
{
  "topics": ["Fractions", "Decimals"],
  "minLevel": 2,
  "maxLevel": 4,
  "count": 10,
  "seed": "optional-seed"
}
```

**Response:**
```json
{
  "problems": [
    { "id": "...", "Topic": "Fractions", "Difficulty": 2, "Front": "...", "Back": "..." },
    // ...
  ],
  "answers": [
    { "id": "...", "Topic": "Fractions", "Difficulty": 2, "Front": "...", "Back": "..." },
    // ...
  ]
}
```

- Returns 400 for invalid input (e.g. empty topics).
- Returns 401 if not authenticated as a PEP teacher or Rahul.
- Returns 422 if not enough questions match the filter.
- Rate-limited to 5 requests/minute/user.
- Only POST is allowed; other methods return 405.

## Print / Save as PDF Workflow

You can print or save worksheets as PDF directly from your browser:

1. Go to the Worksheet Builder and select your topics, counts, and levels.
2. Click Preview to see the worksheet.
3. In the preview modal, click **Print / Save as PDF** (for problems) or **Print Answers** (for answers).
4. This opens a new tab with a print-optimized A4 page. Use your browser's Print dialog (Cmd+P or Ctrl+P) to print or save as PDF.

![Print Preview Screenshot](docs/print-preview.png)

- The print page is always single-page A4 portrait, with adaptive spacing.
- No special PDF engine or downloads required—just use your browser's built-in print/save.

### Local Development

To run the print workflow locally:

```bash
npm run print:dev
```

This starts the dev server on port 3000 for easy access to the print preview.
