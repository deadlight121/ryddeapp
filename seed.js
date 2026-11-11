// Lager databasen og legger inn testdata.
// Kjør med:  node seed.js   (kan kjøres flere ganger, alt starter på nytt)

const Database = require("better-sqlite3");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const db = new Database(path.join(__dirname, "ryddeapp.db"));
db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

// ----- Brukere (alle har passordet "passord123" i testdataene) -----
const leggTilBruker = db.prepare(
  "INSERT INTO bruker (navn, brukernavn, passordhash, rolle, farge) VALUES (?, ?, ?, ?, ?)"
);
const hash = bcrypt.hashSync("passord123", 10);   // 10 = hvor tung hashingen er

leggTilBruker.run("Ola",  "ola",  hash, "admin",  "#A9C4DE");  // id 1
leggTilBruker.run("Kari", "kari", hash, "medlem", "#F4D08A");  // id 2
leggTilBruker.run("Per",  "per",  hash, "medlem", "#B8D4C6");  // id 3

// ----- Oppgaver -----
// ledige
const ledig = db.prepare("INSERT INTO oppgave (tittel, poeng, opprettet_av) VALUES (?, ?, ?)");
ledig.run("Ta ut søppelet", 1, 1);
ledig.run("Støvsuge stua", 3, 1);
ledig.run("Vaske bad", 5, 2);
ledig.run("Vaske vinduer", 10, 1);

// tatt (booket, men ikke gjort)
db.prepare(
  "INSERT INTO oppgave (tittel, poeng, status, opprettet_av, tatt_av, tatt_tid) VALUES (?, ?, 'tatt', ?, ?, datetime('now', '-1 day'))"
).run("Rydde garasjen", 10, 1, 2);

// ferdige (denne måneden, så statistikken har noe å vise)
const ferdig = db.prepare(
  `INSERT INTO oppgave (tittel, poeng, status, opprettet_av, tatt_av, tatt_tid, utfort_av, utfort_tid)
   VALUES (?, ?, 'ferdig', ?, ?, datetime('now', ?), ?, datetime('now', ?))`
);
ferdig.run("Tømme oppvaskmaskinen", 1, 1, 3, "-1 day", 3, "-1 day");
ferdig.run("Vaske gulv i kjøkkenet", 5, 1, 1, "-2 days", 1, "-2 days");
ferdig.run("Handle mat", 5, 2, 2, "-3 days", 2, "-3 days");
ferdig.run("Vaske klær", 3, 1, 3, "-4 days", 3, "-4 days");
ferdig.run("Rydde kjellerboden", 10, 2, 1, "-5 days", 1, "-5 days");

console.log("Databasen er laget: ryddeapp.db");
