# Awal — Learn Amazigh, one word at a time

Awal is a small, leveled Amazigh (Tamazight) ↔ English dictionary for learners. It has:

- Two-way instant search (type in English or Amazigh)
- 5 difficulty levels, from greetings/numbers up to more abstract vocabulary
- A dialect toggle (Standard Tamazight / Tashelhit / Tassousiyt / Tarifit) — words fall back to the
  standard form with a clear label when a verified dialect-specific form isn't available yet
- Browsing by category (Greetings, Numbers, Family, Body, Colors, Food & Drink, Nature, Weather,
  Days, Descriptive Words, Verbs, Abstract, Everyday)
- A "Word of the Day" on the homepage
- Favorites ("My Words"), saved in your browser
- Two practice modes: flashcards, and a 4-option multiple-choice quiz
- A stats bar (total words, words practiced, favorites saved) and per-level progress bars
- A daily visit streak counter
- A dark mode toggle (persisted between visits)
- An "About Tamazight" page with a short introduction to the language, its dialects, and the
  Tifinagh script

## About the word data

The ~122 word pairs are drawn primarily from Standard/Central Atlas Tamazight sources, plus a
handful of verified Tashelhit and Tarifit variants. Amazigh is spoken across many dialects with real
regional differences, so treat this as a learner's starter set, not an authoritative reference —
it's meant to be corrected and expanded over time (see "Extending the word list" below).

Tifinagh script is shown for the words where it's included in `data/words.json`, using a font stack
that names known Tifinagh-capable fonts (Noto Sans Tifinagh, Windows' Ebrima, etc.) before falling
back to the system default. Whether it renders as proper Tifinagh glyphs depends on the visitor's
own device/OS having one of those fonts — most current macOS, iOS, and Windows systems do.

## Running it locally

You'll need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

## Project structure

```
awal-app/
├── package.json      → project config + dependencies (just Express)
├── server.js          → tiny Express server (serves public/ and the word data)
├── data/
│   └── words.json      → the word dataset (source of truth — edit this one)
├── public/
│   ├── index.html       → app layout
│   ├── style.css        → styling
│   └── script.js        → interactive logic (search, levels, dialects, favorites, practice) — fetches /api/words
├── docs/
│   └── (same app, plus its own words.json copy) → a fully static build for GitHub Pages,
│      which has no server at all, so it fetches words.json as a plain file instead of an API route
└── README.md
```

`public/` (used with `server.js`) and `docs/` (used by GitHub Pages) are two copies of the same app
for two different hosting styles. If you edit `public/index.html`, `style.css`, or `script.js`, copy
the same change into `docs/` if you're using GitHub Pages — and if you edit `data/words.json`, also
copy it to `docs/words.json`.

## Extending the word list

Open `data/words.json`. Each entry looks like this:

```json
{
  "id": "hello",
  "english": "hello",
  "tifinagh": "ⴰⵣⵓⵍ",
  "phonetic": "ah-ZOOL",
  "category": "greetings",
  "level": 1,
  "dialects": {
    "standard": "azul",
    "tashelhit": "azul flak",
    "tassousiyt": "azul flak",
    "tarifit": null
  }
}
```

To add a word: add a new object with a unique `id`. Any `dialects` value you leave as `null` will
automatically fall back to the `standard` form in the app, labeled "general Tamazight." No code
changes are needed — the frontend reads this file directly.

## Deploying it for free (GitHub Pages — no card, ever)

Awal's server barely does anything — it just serves static files and one JSON file. That means it
can run with **no server at all**, which sidesteps the card-verification prompts that Render and
Railway now show even on their "free" tiers (see note below). The `docs/` folder in this repo is a
ready-to-go static build for exactly this.

1. **Push this project to a new GitHub repository.**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Awal dictionary app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. On GitHub, go to your repo's **Settings → Pages**.
3. Under "Build and deployment", set **Source** to "Deploy from a branch".
4. Set **Branch** to `main` and the folder to **`/docs`**, then click **Save**.
5. GitHub will build and publish the site — after a minute or two you'll get a public URL at
   `https://<your-username>.github.io/<your-repo>/`.
6. From then on, every `git push` to `main` automatically redeploys the site. No account
   verification, no card, no usage limits to worry about — it's a permanent feature of any public
   GitHub repo.

If you ever change `data/words.json`, `public/index.html`, `public/style.css`, or `public/script.js`,
copy the same changes into the matching files in `docs/` (see "Project structure" above) and push —
the two folders are kept in sync manually, not automatically.

### Alternative: Render or Railway (may ask for a card)

Render and Railway both offer a real, usable free tier and will auto-deploy a Node app like this one
straight from GitHub (Build Command `npm install`, Start Command `npm start`). In practice, though,
**both now ask for credit card verification on many accounts** — Render sometimes prompts for a card
even when the free "Instance Type" is correctly selected (an anti-fraud check, not a hidden charge —
you won't be billed as long as you stay on the free tier), and Railway has required a card since
2023. If you don't want to hand over a card at all, GitHub Pages above is the reliable no-card route
for this app.

## Notes on scope

This is a deliberately simple MVP: no user accounts, no database — favorites and level selection
live in your browser's local storage. That keeps it fast, free to host, and easy to read and extend.
