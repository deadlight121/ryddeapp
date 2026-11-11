-- Sletter gamle tabeller slik at seed.js kan kjøres på nytt
DROP TABLE IF EXISTS oppgave;
DROP TABLE IF EXISTS bruker;

CREATE TABLE bruker (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  navn        TEXT NOT NULL,
  brukernavn  TEXT NOT NULL UNIQUE,
  passordhash TEXT NOT NULL,
  rolle       TEXT NOT NULL DEFAULT 'medlem' CHECK (rolle IN ('admin', 'medlem')),
  farge       TEXT NOT NULL DEFAULT '#A9C4DE'
);

CREATE TABLE oppgave (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tittel        TEXT NOT NULL,
  poeng         INTEGER NOT NULL CHECK (poeng IN (1, 3, 5, 10)),
  status        TEXT NOT NULL DEFAULT 'ledig' CHECK (status IN ('ledig', 'tatt', 'ferdig')),
  opprettet_av  INTEGER NOT NULL REFERENCES bruker(id),
  opprettet_tid TEXT NOT NULL DEFAULT (datetime('now')),
  tatt_av       INTEGER REFERENCES bruker(id),
  tatt_tid      TEXT,
  utfort_av     INTEGER REFERENCES bruker(id),
  utfort_tid    TEXT
);
