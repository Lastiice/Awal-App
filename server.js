// Awal - simple Express server
// This server has one job: serve the frontend (public/) and the word
// dataset (data/words.json). All the search/filter/practice logic runs
// in the browser (see public/script.js) since the dataset is small
// enough to load once. There is no database and no login here on purpose -
// it keeps the app simple, fast, and easy to deploy.

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve everything in public/ (index.html, style.css, script.js, audio/*)
app.use(express.static(path.join(__dirname, "public")));

// Serve the word dataset as JSON at a predictable URL.
// Kept as its own route (rather than just a static file) so it's easy to
// swap for a real database later without changing the frontend at all.
app.get("/api/words", (req, res) => {
  res.sendFile(path.join(__dirname, "data", "words.json"));
});

// Basic health check - useful when deploying to Render/Railway.
app.get("/healthz", (req, res) => {
  res.status(200).send("ok");
});

app.listen(PORT, () => {
  console.log(`Awal is running at http://localhost:${PORT}`);
});
