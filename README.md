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
│   └── words.json      → the word dataset
├── public/
│   ├── index.html       → app layout
│   ├── style.css        → styling
│   └── script.js        → all the interactive logic (search, levels, dialects, favorites, practice)
└── README.md
```

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

## Deploying it for free (GitHub → Render)

1. **Push this project to a new GitHub repository.**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Awal dictionary app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. **Create a free account at [render.com](https://render.com)** and connect your GitHub account.
3. Click **New → Web Service**, pick your repository.
4. Render will detect it's a Node app. Use these settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Click **Create Web Service**. Render will build and deploy automatically, and gives you a public
   URL (e.g. `https://awal-app.onrender.com`).
6. From then on, every `git push` to `main` automatically redeploys the site.

(Railway works the same way: connect the GitHub repo, it auto-detects `npm start`, and gives you a
public URL. Either is a good free option for a small app like this.)

## Notes on scope

This is a deliberately simple MVP: no user accounts, no database — favorites and level selection
live in your browser's local storage. That keeps it fast, free to host, and easy to read and extend.
