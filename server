// server.js — Proxy PISTE pour Légifrance et Judilibre
// Usage : node server.js
// Nécessite : npm install express cors

const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(".")); // Sert index.html depuis le même dossier

// ══════════════════════════════════════════
// CONFIGURATION — Variables d'environnement (recommandé)
// En local, vous pouvez remplacer par vos identifiants en dur
// Sur Vercel/production, utilisez les Environment Variables
// ══════════════════════════════════════════
const PISTE_CLIENT_ID = process.env.PISTE_CLIENT_ID || "VOTRE_CLIENT_ID_ICI";
const PISTE_CLIENT_SECRET = process.env.PISTE_CLIENT_SECRET || "VOTRE_CLIENT_SECRET_ICI";
// ══════════════════════════════════════════

const TOKEN_URL = "https://oauth.piste.gouv.fr/api/oauth/token";
const LEGIFRANCE_BASE = "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app";
const JUDILIBRE_BASE = "https://api.piste.gouv.fr/cassation/judilibre/v1.0";

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: PISTE_CLIENT_ID,
    client_secret: PISTE_CLIENT_SECRET,
    scope: "openid"
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });
  const data = await res.json();
  if (data.access_token) {
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    console.log("[PISTE] Token obtenu, expire dans", data.expires_in, "s");
    return cachedToken;
  }
  throw new Error("Échec authentification PISTE: " + JSON.stringify(data));
}

// ── Légifrance : récupérer un article par ID ──
app.post("/api/legifrance/article", async (req, res) => {
  try {
    const token = await getToken();
    const r = await fetch(`${LEGIFRANCE_BASE}/consult/getArticle`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: req.body.id })
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Légifrance : recherche d'articles ──
app.post("/api/legifrance/search", async (req, res) => {
  try {
    const token = await getToken();
    const r = await fetch(`${LEGIFRANCE_BASE}/search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Légifrance : table des matières d'un code ──
app.post("/api/legifrance/toc", async (req, res) => {
  try {
    const token = await getToken();
    const r = await fetch(`${LEGIFRANCE_BASE}/consult/code/tableMatieres`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Judilibre : recherche de jurisprudence ──
app.get("/api/judilibre/search", async (req, res) => {
  try {
    const token = await getToken();
    const params = new URLSearchParams(req.query);
    const r = await fetch(`${JUDILIBRE_BASE}/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Judilibre : détail d'une décision ──
app.get("/api/judilibre/decision", async (req, res) => {
  try {
    const token = await getToken();
    const r = await fetch(`${JUDILIBRE_BASE}/decision?id=${req.query.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Santé ──
app.get("/api/health", async (req, res) => {
  try {
    await getToken();
    res.json({ status: "ok", token: "valid", articles: 132 });
  } catch (e) {
    res.json({ status: "error", message: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║  Proxy PISTE démarré sur http://localhost:${PORT}    ║
║                                                  ║
║  Endpoints :                                     ║
║    POST /api/legifrance/article                  ║
║    POST /api/legifrance/search                   ║
║    POST /api/legifrance/toc                      ║
║    GET  /api/judilibre/search?query=...          ║
║    GET  /api/judilibre/decision?id=...           ║
║    GET  /api/health                              ║
║                                                  ║
║  Page : http://localhost:${PORT}/index.html          ║
╚══════════════════════════════════════════════════╝
  `);
});
