# BayMatt's Kitchen

**Your recipes. Your kitchen. All in one place.**

_A BayMatt Labs project._

## Overview

BayMatt's Kitchen is a personal recipe and kitchen management application designed to bring organization, convenience, and a little technology into everyday cooking.

At its heart, the application is about preserving recipes worth keeping. Whether it's a handwritten family favorite, a recipe passed along by a friend, or something discovered and perfected over time, BayMatt's Kitchen provides a centralized home to store, organize, and revisit those recipes.

But a recipe collection is just the beginning.

The long-term vision is to build a connected kitchen experience where recipes, meal planning, pantry inventory, and grocery shopping work together to make cooking simpler and more enjoyable.

## Features

### Phase 1 — Recipe Library

The foundation of BayMatt's Kitchen is a structured, searchable collection of recipes.

- **Recipe Preservation:** Digitize handwritten, printed, and digital recipes while retaining their original sources.
- **Structured Ingredients:** Store ingredient quantities, measurements, and preparation details.
- **Step-by-Step Instructions:** Follow clearly organized cooking directions.
- **Recipe Attribution:** Preserve the people, families, and sources behind treasured recipes.
- **Nutrition Information:** Track estimated calories, protein, carbohydrates, and fats, with support for per-serving calculations.
- **Allergen Awareness:** Identify known and potential allergens within recipes.
- **Recipe Versioning:** Preserve original recipes while documenting personal modifications and improvements.
- **Recipe Scaling:** Adjust ingredient quantities to accommodate different serving sizes.

### Future Possibilities

BayMatt's Kitchen is designed to expand beyond a traditional digital cookbook.

#### Meal Planning

- Organize meals across a weekly or monthly calendar.
- Select meals directly from the recipe library.
- Generate grocery lists based on planned meals.

#### Pantry Management

- Track ingredients and pantry inventory.
- Monitor quantities and expiration dates.
- Identify recipes that can be prepared with ingredients already on hand.

#### Smarter Cooking

- Discover recipes based on available ingredients.
- Estimate nutritional information for meals.
- Organize personal favorites and recipe collections.
- Streamline shopping and ingredient preparation.

These capabilities represent the product vision rather than features currently implemented.

## Technology

BayMatt's Kitchen is developed under the **BayMatt Labs** umbrella, following its shared visual identity and design system.

The application uses **PostgreSQL hosted on Neon** for structured recipe storage, including ingredients, instructions, nutritional estimates, allergens, and recipe history.

The broader application architecture and user interface will evolve as development progresses.

## Philosophy

BayMatt's Kitchen is guided by a few simple principles:

1. **Preserve what matters.** Recipes often carry memories, traditions, and connections worth keeping.
2. **Keep cooking approachable.** Technology should make using recipes easier, not introduce unnecessary complexity.
3. **Build for everyday use.** Features should solve practical problems in the kitchen.
4. **Grow intentionally.** Start with a dependable recipe library and expand as new needs emerge.
5. **Own your recipes.** Recipe information should remain structured, portable, and accessible.

---

**BayMatt's Kitchen**  
_Made with care by BayMatt Labs._

## Running the app

Requires Node.js 22.13 or newer (Node 22 LTS recommended).

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000. Development runs the API and Vite together on one port.
The initial recipe library is empty. Choose **Try an example recipe** to add the
included sample, or **Add a recipe** to start your own collection.

The default local mode stores recipes in `data/kitchen.sqlite`. Back up that file
while the app is stopped, or use **Export** for a portable JSON copy including
recipe history. The JSON export is a backup/interchange format; import is not yet
implemented. Local files and credentials are excluded from Git.

### Neon PostgreSQL

Copy `.env.example` to `.env`, set `DATABASE_URL` to your Neon pooled connection
string, and set `DATABASE_URL_UNPOOLED` to the direct connection string for
migrations. Apply the versioned schema before starting the app.

```bash
npm run db:migrate
npm run dev
```

The server checks the schema at startup. Configured database failures stop startup
so that a connection problem cannot silently switch your storage. Local and Neon
collections are independent; switching the connection does not migrate existing
local recipes. PostgreSQL connections use the TLS settings in the connection URL.

### Verification and production build

```bash
npm test
npm run check
npm run build
npm start
```

The API regression test covers creation, editing, revision history, stale edits,
validation, cross-origin write rejection, persistence across restart, and deletion.
`npm run check` checks the React TypeScript frontend. `npm start` serves the built
frontend and API on one port. The default listener is `127.0.0.1`; this first
release is a personal, local application. Authentication and access control must
be added before exposing a shared or public deployment. `HOST`, `PORT`, and
`DATA_FILE` can be set in `.env` when required.

### Phase 1 behavior

- Create, edit, search, favorite, and delete recipes with structured ingredients,
  ordered steps, attribution, original source URL/text, notes, nutrition, and
  recorded allergens.
- Scale ingredient quantities to any positive serving count. Nutrition estimates
  are entered per serving, with totals calculated for the selected yield.
- Each edit saves a complete previous version. Inspect and restore a version
  without erasing subsequent history. Conflicting edits from another window are
  rejected until the recipe is reloaded.
- Original recipe cards can be transcribed into the original-text field. Image
  upload, OCR, automated nutrition/allergen detection, accounts, meal planning,
  and pantry management remain future work.

The interface uses Google Fonts and an Unsplash kitchen photograph. All recipe
operations work with local assets and system font fallbacks when those services
are unavailable.
