const express = require("express");
const Database = require("better-sqlite3");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const db = new Database(path.join(__dirname, "ryddeapp.db"));

app.use(express.json());                                      // lar oss lese JSON fra fetch()
app.use(express.static(path.join(__dirname, "public")));      // serverer html/css/js

// ----- Sesjoner: serveren husker hvem som er innlogget via en cookie -----
app.use(session({
  secret: process.env.SESSION_SECRET || "bytt-denne-i-ekte-bruk",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 dager
}));

// ----- Vakt: stopper alle som ikke er innlogget -----
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ feil: "Du må logge inn" });
  }
  next();
}

// ----- Innlogging -----
app.post("/api/login", (req, res) => {
  const { brukernavn, passord } = req.body;

  // Validering: må være tekst og ikke tomt
  if (typeof brukernavn !== "string" || typeof passord !== "string" || brukernavn === "" || passord === "") {
    return res.status(400).json({ feil: "Fyll inn brukernavn og passord" });
  }

  const bruker = db.prepare("SELECT * FROM bruker WHERE brukernavn = ?").get(brukernavn);

  // Samme feilmelding om brukeren ikke finnes eller passordet er feil,
  // så ingen kan finne ut hvilke brukernavn som er registrert
  if (!bruker || !bcrypt.compareSync(passord, bruker.passordhash)) {
    return res.status(401).json({ feil: "Feil brukernavn eller passord" });
  }

  req.session.userId = bruker.id;   // dette er "innlogget"
  res.json({ id: bruker.id, navn: bruker.navn });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

// Hvem er jeg? Siden bruker denne for å sjekke om man er innlogget
app.get("/api/me", requireLogin, (req, res) => {
  const bruker = db.prepare("SELECT id, navn, rolle FROM bruker WHERE id = ?").get(req.session.userId);
  res.json(bruker);
});

// ----- Familie med poeng for denne måneden -----
app.get("/api/familie", requireLogin, (req, res) => {
  const familie = db.prepare(`
    SELECT b.id, b.navn, b.farge, COALESCE(SUM(o.poeng), 0) AS poeng
    FROM bruker b
    LEFT JOIN oppgave o ON o.utfort_av = b.id
      AND o.status = 'ferdig'
      AND strftime('%Y-%m', o.utfort_tid) = strftime('%Y-%m', 'now')
    GROUP BY b.id
    ORDER BY b.id`).all();
  res.json(familie);
});

// GET /api/oppgaver            alle oppgaver
// GET /api/oppgaver?status=ledig   bare ledige (eller tatt / ferdig)
app.get("/api/oppgaver", requireLogin, (req, res) => {
  const gyldige = ["ledig", "tatt", "ferdig"];
  const status = req.query.status;

  // Validering på serversiden: ugyldig status gir feilmelding
  if (status !== undefined && !gyldige.includes(status)) {
    return res.status(400).json({ feil: "Ugyldig status" });
  }

  // "AS" gir kolonnene samme navn som script.js bruker
  let sql = `SELECT id, tittel, poeng, status,
                    tatt_av AS tattAv, utfort_av AS utfortAv, utfort_tid AS tid
             FROM oppgave`;
  const oppgaver = status
    ? db.prepare(sql + " WHERE status = ? ORDER BY id DESC").all(status)
    : db.prepare(sql + " ORDER BY id DESC").all();

  res.json(oppgaver);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server kjører på http://localhost:${PORT}`));
