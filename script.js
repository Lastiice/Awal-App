// Awal — frontend logic.
// The whole word list is small, so we load it once from /api/words and do
// all searching/filtering/practice logic here in the browser. Favorites
// persist in localStorage so no account or backend database is needed.

const CATEGORY_META = {
  greetings:  { label: "Greetings",         icon: "👋" },
  numbers:    { label: "Numbers",           icon: "🔢" },
  family:     { label: "Family",            icon: "👪" },
  body:       { label: "Body",              icon: "🖐️" },
  colors:     { label: "Colors",            icon: "🎨" },
  food:       { label: "Food & Drink",      icon: "🍞" },
  nature:     { label: "Nature",            icon: "⛰️" },
  weather:    { label: "Weather",           icon: "🌦️" },
  days:       { label: "Days of the Week",  icon: "📅" },
  adjectives: { label: "Descriptive Words", icon: "✨" },
  verbs:      { label: "Verbs",             icon: "🏃" },
  abstract:   { label: "Abstract",          icon: "💭" },
  everyday:   { label: "Everyday",          icon: "🏠" },
};

const DIALECT_LABELS = {
  standard: "Standard Tamazight",
  tashelhit: "Tashelhit",
  tassousiyt: "Tassousiyt",
  tarifit: "Tarifit",
};

const FAVORITES_KEY = "awal:favorites";
const STATS_KEY = "awal:stats";
const THEME_KEY = "awal:theme";
const STREAK_KEY = "awal:streak"; // { lastVisit: "YYYY-MM-DD", count: number }

const state = {
  words: [],
  view: "browse",
  level: "all",
  dialect: "standard",
  category: null,
  query: "",
  favorites: new Set(loadFavorites()),
  practiceMode: "flashcards", // "flashcards" | "quiz"
  practiceDeck: [],
  practiceIndex: 0,
  quizDeck: [],
  quizIndex: 0,
  quizScore: 0,
  practicedCount: loadStats(),
  streak: 0,
};

// ---------------- Init ----------------

async function init() {
  try {
    const res = await fetch("/api/words");
    state.words = await res.json();
  } catch (err) {
    console.error("Could not load word data", err);
    state.words = [];
  }

  applyTheme(localStorage.getItem(THEME_KEY) || "light");
  state.streak = updateStreak();
  renderWordOfDay();
  renderCategoryGrid();
  updateFavCount();
  renderStatsBar();
  renderProgress();
  bindEvents();
}

// ---------------- Daily streak ----------------

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// Called once per page load. If the last visit was yesterday, the streak
// continues; if it was today already, it's unchanged; otherwise it resets.
function updateStreak() {
  let data;
  try {
    data = JSON.parse(localStorage.getItem(STREAK_KEY) || "null");
  } catch {
    data = null;
  }

  const today = todayStr();
  if (!data) data = { lastVisit: null, count: 0 };

  if (data.lastVisit === today) {
    // already counted today
  } else {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    data.count = data.lastVisit === yesterday ? data.count + 1 : 1;
    data.lastVisit = today;
  }

  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  return data.count;
}

// ---------------- Level progress ----------------

function renderProgress() {
  const container = document.getElementById("progress-bars");
  if (!container || !state.words.length) return;
  container.innerHTML = "";

  for (let level = 1; level <= 5; level++) {
    const wordsAtLevel = state.words.filter(w => w.level === level);
    const savedAtLevel = wordsAtLevel.filter(w => state.favorites.has(w.id));
    const pct = wordsAtLevel.length ? Math.round((savedAtLevel.length / wordsAtLevel.length) * 100) : 0;

    const item = document.createElement("div");
    item.className = "progress-item";
    item.innerHTML = `
      <div class="progress-item-label"><span>Level ${level}</span><span>${pct}%</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    `;
    container.appendChild(item);
  }
}

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...state.favorites]));
}

function loadStats() {
  try {
    return Number(localStorage.getItem(STATS_KEY) || "0") || 0;
  } catch {
    return 0;
  }
}

function bumpPracticedCount(by) {
  state.practicedCount += by;
  localStorage.setItem(STATS_KEY, String(state.practicedCount));
  renderStatsBar();
}

function renderStatsBar() {
  const totalEl = document.getElementById("stat-total");
  const practicedEl = document.getElementById("stat-practiced");
  const favEl = document.getElementById("stat-favorites");
  const streakEl = document.getElementById("stat-streak");
  if (totalEl) totalEl.textContent = state.words.length;
  if (practicedEl) practicedEl.textContent = state.practicedCount;
  if (favEl) favEl.textContent = state.favorites.size;
  if (streakEl) streakEl.textContent = state.streak;
}

// ---------------- Theme (dark mode) ----------------

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

// ---------------- Dialect helper ----------------

// Returns { text, isFallback } for a word in the currently selected dialect.
function getDialectForm(word) {
  const dialects = word.dialects || {};
  const value = dialects[state.dialect];
  if (state.dialect !== "standard" && value) {
    return { text: value, isFallback: false };
  }
  return { text: dialects.standard, isFallback: state.dialect !== "standard" };
}

// ---------------- Word of the Day ----------------

function renderWordOfDay() {
  if (!state.words.length) return;
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = new Date() - start;
  const dayOfYear = Math.floor(diff / 86400000);
  const word = state.words[dayOfYear % state.words.length];
  const form = getDialectForm(word);

  document.getElementById("wod-amazigh").textContent = form.text;
  document.getElementById("wod-tifinagh").textContent = word.tifinagh || "";
  document.getElementById("wod-english").textContent = `= ${word.english}`;
}

// ---------------- Category grid ----------------

function renderCategoryGrid() {
  const grid = document.getElementById("category-grid");
  grid.innerHTML = "";

  const byLevel = state.words.filter(w => state.level === "all" || w.level === Number(state.level));
  const counts = {};
  byLevel.forEach(w => { counts[w.category] = (counts[w.category] || 0) + 1; });

  Object.keys(CATEGORY_META).forEach(key => {
    const count = counts[key] || 0;
    if (!count) return; // hide empty categories for current level filter
    const meta = CATEGORY_META[key];
    const card = document.createElement("div");
    card.className = "category-card";
    card.innerHTML = `
      <span class="category-icon">${meta.icon}</span>
      <p class="category-name">${meta.label}</p>
      <p class="category-count">${count} word${count === 1 ? "" : "s"}</p>
    `;
    card.addEventListener("click", () => {
      state.category = key;
      state.query = "";
      document.getElementById("search-input").value = "";
      showResults();
    });
    grid.appendChild(card);
  });
}

// ---------------- Filtering ----------------

function filteredWords() {
  return state.words.filter(w => {
    if (state.level !== "all" && w.level !== Number(state.level)) return false;
    if (state.category && w.category !== state.category) return false;
    if (state.query) {
      const q = state.query.toLowerCase();
      const englishMatch = w.english.toLowerCase().includes(q);
      const dialectMatch = Object.values(w.dialects || {})
        .filter(Boolean)
        .some(v => v.toLowerCase().includes(q));
      if (!englishMatch && !dialectMatch) return false;
    }
    return true;
  });
}

function showResults() {
  const grid = document.getElementById("category-grid");
  const header = document.getElementById("results-header");
  const resultsGrid = document.getElementById("results-grid");
  const noResults = document.getElementById("no-results");
  const title = document.getElementById("results-title");

  const list = filteredWords();

  if (state.query) {
    title.textContent = `Search results for "${state.query}"`;
  } else if (state.category) {
    title.textContent = CATEGORY_META[state.category]?.label || "Results";
  } else {
    title.textContent = "Results";
  }

  grid.hidden = true;
  header.hidden = false;
  resultsGrid.innerHTML = "";
  noResults.hidden = list.length !== 0;

  list.forEach(word => resultsGrid.appendChild(createWordCard(word)));
}

function backToCategories() {
  state.category = null;
  state.query = "";
  document.getElementById("search-input").value = "";
  document.getElementById("category-grid").hidden = false;
  document.getElementById("results-header").hidden = true;
  document.getElementById("results-grid").innerHTML = "";
  document.getElementById("no-results").hidden = true;
}

// ---------------- Word card ----------------

function createWordCard(word) {
  const tpl = document.getElementById("word-card-template");
  const node = tpl.content.cloneNode(true);
  const card = node.querySelector(".word-card");

  const form = getDialectForm(word);

  card.querySelector(".level-badge").textContent = `Level ${word.level}`;
  card.querySelector(".word-amazigh").textContent = form.text;
  card.querySelector(".word-dialect-note").textContent = form.isFallback
    ? `(general Tamazight — no verified ${DIALECT_LABELS[state.dialect]} form yet)`
    : (state.dialect !== "standard" ? DIALECT_LABELS[state.dialect] : "");
  card.querySelector(".word-tifinagh").textContent = word.tifinagh || "";
  card.querySelector(".word-phonetic").textContent = word.phonetic ? `/ ${word.phonetic} /` : "";
  card.querySelector(".word-english").textContent = word.english;
  card.querySelector(".category-tag").textContent = CATEGORY_META[word.category]?.label || word.category;

  const favBtn = card.querySelector(".fav-btn");
  const isFav = state.favorites.has(word.id);
  favBtn.textContent = isFav ? "♥" : "♡";
  favBtn.classList.toggle("active", isFav);
  favBtn.addEventListener("click", () => {
    toggleFavorite(word.id);
    favBtn.textContent = state.favorites.has(word.id) ? "♥" : "♡";
    favBtn.classList.toggle("active", state.favorites.has(word.id));
  });

  return node;
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }
  saveFavorites();
  updateFavCount();
  renderStatsBar();
  renderProgress();
  if (state.view === "favorites") renderFavoritesView();
}

function updateFavCount() {
  document.getElementById("fav-count").textContent = state.favorites.size;
}

// ---------------- Favorites view ----------------

function renderFavoritesView() {
  const grid = document.getElementById("favorites-grid");
  const empty = document.getElementById("no-favorites");
  grid.innerHTML = "";
  const favWords = state.words.filter(w => state.favorites.has(w.id));
  empty.hidden = favWords.length !== 0;
  favWords.forEach(word => grid.appendChild(createWordCard(word)));
}

// ---------------- View switching ----------------

function setView(view) {
  state.view = view;
  document.querySelectorAll(".view").forEach(el => el.hidden = true);
  document.getElementById(`view-${view}`).hidden = false;
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  if (view === "favorites") renderFavoritesView();
  if (view === "browse") backToCategories(); // reset to category grid each time
  if (view === "practice") resetPracticeView(); // always start from the setup screen
}

// Puts the Practice tab back to its initial "choose mode / start" screen.
// Without this, leaving mid-practice and coming back would show whatever
// leftover state (or a blank screen) the last session left behind.
function resetPracticeView() {
  document.querySelector(".practice-setup").hidden = false;
  document.getElementById("practice-area").hidden = true;
  document.getElementById("practice-done").hidden = true;
  document.getElementById("quiz-area").hidden = true;
  document.getElementById("quiz-done").hidden = true;
}

function setPracticeMode(mode) {
  state.practiceMode = mode;
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  document.getElementById("practice-mode-desc").textContent = mode === "quiz"
    ? "Pick the right translation from four choices. Uses your current level & dialect filters."
    : "Flip the card, test yourself, and keep going. Uses your current level & dialect filters.";
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function currentPool() {
  return state.words.filter(w => state.level === "all" || w.level === Number(state.level));
}

// ---------------- Flashcards ----------------

function startPractice() {
  const pool = currentPool();
  state.practiceDeck = shuffle([...pool]);
  state.practiceIndex = 0;

  document.getElementById("practice-area").hidden = state.practiceDeck.length === 0;
  document.getElementById("practice-done").hidden = true;

  if (state.practiceDeck.length === 0) return;
  renderPracticeCard();
}

function renderPracticeCard() {
  const word = state.practiceDeck[state.practiceIndex];
  const form = getDialectForm(word);
  const flashcard = document.getElementById("flashcard");
  flashcard.classList.remove("flipped");

  document.getElementById("card-front-text").textContent = word.english;
  document.getElementById("card-back-text").textContent = form.text;
  document.getElementById("card-back-tifinagh").textContent = word.tifinagh || "";
  document.getElementById("card-back-phonetic").textContent = word.phonetic ? `/ ${word.phonetic} /` : "";

  document.getElementById("practice-index").textContent = state.practiceIndex + 1;
  document.getElementById("practice-total").textContent = state.practiceDeck.length;
}

function nextPracticeCard() {
  bumpPracticedCount(1);
  state.practiceIndex++;
  if (state.practiceIndex >= state.practiceDeck.length) {
    document.getElementById("practice-area").hidden = true;
    document.getElementById("practice-done").hidden = false;
    return;
  }
  renderPracticeCard();
}

// ---------------- Quiz mode ----------------

function startQuiz() {
  const pool = currentPool();
  const size = Math.min(10, pool.length);
  state.quizDeck = shuffle([...pool]).slice(0, size);
  state.quizIndex = 0;
  state.quizScore = 0;

  document.getElementById("quiz-area").hidden = state.quizDeck.length === 0;
  document.getElementById("quiz-done").hidden = true;
  document.getElementById("quiz-score").textContent = "0";

  if (state.quizDeck.length === 0) return;
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const word = state.quizDeck[state.quizIndex];
  const form = getDialectForm(word);
  // Randomize direction each question: English -> Amazigh, or Amazigh -> English.
  const askAmazigh = Math.random() < 0.5;

  const pool = currentPool();
  const distractorPool = pool.filter(w => w.id !== word.id);
  const distractors = shuffle([...distractorPool]).slice(0, 3);
  const options = shuffle([word, ...distractors]);

  document.getElementById("quiz-prompt-label").textContent = askAmazigh
    ? "How do you say this in Amazigh?"
    : "What does this word mean?";
  document.getElementById("quiz-prompt-text").textContent = askAmazigh ? word.english : form.text;

  const optionsEl = document.getElementById("quiz-options");
  optionsEl.innerHTML = "";
  options.forEach(opt => {
    const optForm = getDialectForm(opt);
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.textContent = askAmazigh ? optForm.text : opt.english;
    btn.dataset.optionId = opt.id;
    btn.addEventListener("click", () => selectQuizAnswer(btn, opt.id === word.id, word.id));
    optionsEl.appendChild(btn);
  });

  document.getElementById("quiz-index").textContent = state.quizIndex + 1;
  document.getElementById("quiz-total").textContent = state.quizDeck.length;
}

function selectQuizAnswer(button, isCorrect, correctId) {
  const buttons = document.querySelectorAll(".quiz-option");
  buttons.forEach(b => { b.disabled = true; });
  button.classList.add(isCorrect ? "correct" : "incorrect");
  if (isCorrect) {
    state.quizScore++;
    document.getElementById("quiz-score").textContent = state.quizScore;
  } else {
    // reveal whichever option was the correct one
    buttons.forEach(b => {
      if (b !== button && b.dataset.optionId === correctId) b.classList.add("correct");
    });
  }
  bumpPracticedCount(1);
  setTimeout(nextQuizQuestion, 900);
}

function nextQuizQuestion() {
  state.quizIndex++;
  if (state.quizIndex >= state.quizDeck.length) {
    document.getElementById("quiz-area").hidden = true;
    document.getElementById("quiz-done").hidden = false;
    document.getElementById("quiz-final-score").textContent = state.quizScore;
    document.getElementById("quiz-final-total").textContent = state.quizDeck.length;
    return;
  }
  renderQuizQuestion();
}

// ---------------- Event bindings ----------------

function bindEvents() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });

  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("input", () => {
    state.query = searchInput.value.trim();
    state.category = null;
    if (state.query) {
      showResults();
    } else {
      backToCategories();
    }
  });

  document.getElementById("clear-search").addEventListener("click", () => {
    searchInput.value = "";
    state.query = "";
    backToCategories();
  });

  document.getElementById("back-to-categories").addEventListener("click", backToCategories);

  document.querySelectorAll(".pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.level = pill.dataset.level;
      renderCategoryGrid();
      renderWordOfDay();
      if (state.category || state.query) showResults();
    });
  });

  document.getElementById("dialect-select").addEventListener("change", (e) => {
    state.dialect = e.target.value;
    renderWordOfDay();
    if (state.category || state.query) showResults();
    if (state.view === "favorites") renderFavoritesView();
  });

  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => setPracticeMode(btn.dataset.mode));
  });

  document.getElementById("start-practice").addEventListener("click", () => {
    document.querySelector(".practice-setup").hidden = true;
    if (state.practiceMode === "quiz") {
      startQuiz();
    } else {
      startPractice();
    }
  });

  document.getElementById("restart-practice").addEventListener("click", () => {
    document.getElementById("practice-done").hidden = true;
    startPractice();
  });

  document.getElementById("restart-quiz").addEventListener("click", () => {
    document.getElementById("quiz-done").hidden = true;
    startQuiz();
  });

  document.getElementById("flashcard").addEventListener("click", () => {
    document.getElementById("flashcard").classList.toggle("flipped");
  });

  // Keyboard support (Enter / Space) for the flashcard, since it acts as a button.
  document.getElementById("flashcard").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      document.getElementById("flashcard").classList.toggle("flipped");
    }
  });

  document.getElementById("practice-next").addEventListener("click", (e) => {
    e.stopPropagation();
    nextPracticeCard();
  });

  document.getElementById("practice-again").addEventListener("click", (e) => {
    e.stopPropagation();
    // "Still learning" just moves on too, but keeps the word for a future session
    // (kept intentionally simple — no spaced-repetition bookkeeping in v1).
    nextPracticeCard();
  });

  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
}

init();
