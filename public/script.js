// ----- Data (hentes fra serveren) -----
let jegErId = null;   // settes fra /api/me
let familie = [];     // settes fra /api/familie
let oppgaver = [];    // settes fra /api/oppgaver

let valgtFane = "ledig";

// ----- Hjelpefunksjoner -----
const finnPerson = (id) => familie.find((p) => p.id === id);
const el = (id) => document.getElementById(id);

function tegnFamilie() {
  el("familieliste").innerHTML = familie.map((p) => `
    <li class="person ${p.id === jegErId ? "meg" : ""}">
      <span class="ball" style="background:${p.farge}">${p.navn[0]}</span>
      <span class="navn">${p.navn}</span>
      <span class="poeng">${p.poeng} <small>p</small></span>
    </li>`).join("");
}

function knapperFor(o) {
  if (o.status === "ledig") {
    return `<button class="knapp fylt" data-handling="ta" data-id="${o.id}">Ta den</button>
            <button class="knapp" data-handling="ferdig" data-id="${o.id}">Gjort nå</button>`;
  }
  if (o.status === "tatt" && o.tattAv === jegErId) {
    return `<button class="knapp fylt" data-handling="ferdig" data-id="${o.id}">Ferdig, fint!</button>
            <button class="knapp tekst" data-handling="slipp" data-id="${o.id}">Slipp</button>`;
  }
  return ""; // andres bookinger og ferdige oppgaver har ingen knapper
}

function infoFor(o) {
  if (o.status === "tatt")   return `Tatt av ${finnPerson(o.tattAv).navn}`;
  if (o.status === "ferdig") return `Gjort av ${finnPerson(o.utfortAv).navn}, ${o.tid.slice(0, 16)}`;
  return "Ingen har tatt den ennå";
}

function tegnOppgaver() {
  const liste = oppgaver.filter((o) => o.status === valgtFane);
  if (liste.length === 0) {
    el("oppgaveliste").innerHTML = `<p class="tom">Ingen oppgaver her. Nå kan du slappe av.</p>`;
    return;
  }
  el("oppgaveliste").innerHTML = liste.map((o) => `
    <article class="kort ${o.status}">
      <div>
        <h3>${o.tittel}</h3>
        <p class="info"><span class="status-tekst">${o.status[0].toUpperCase() + o.status.slice(1)}</span>${infoFor(o)}</p>
      </div>
      <div class="handlinger">
        <span class="poeng">${o.poeng} p</span>
        ${knapperFor(o)}
      </div>
    </article>`).join("");
}

function tegnAlt() { tegnFamilie(); tegnOppgaver(); }

// ----- Faner -----
document.querySelectorAll(".fane").forEach((knapp) => {
  knapp.addEventListener("click", () => {
    valgtFane = knapp.dataset.status;
    document.querySelectorAll(".fane").forEach((k) => k.classList.toggle("aktiv", k === knapp));
    tegnOppgaver();
  });
});

// ----- Knapper på oppgavekort -----
el("oppgaveliste").addEventListener("click", (e) => {
  const knapp = e.target.closest("button[data-handling]");
  if (!knapp) return;
  const o = oppgaver.find((x) => x.id === Number(knapp.dataset.id));

  if (knapp.dataset.handling === "ta")   { o.status = "tatt"; o.tattAv = jegErId; }
  if (knapp.dataset.handling === "slipp") { o.status = "ledig"; delete o.tattAv; }
  if (knapp.dataset.handling === "ferdig") {
    o.status = "ferdig"; o.utfortAv = jegErId; o.tid = "nå";
    finnPerson(jegErId).poeng += o.poeng;
  }
  tegnAlt();
});

// ----- Dialoger -----
document.querySelectorAll("[data-lukk]").forEach((k) =>
  k.addEventListener("click", () => k.closest("dialog").close()));

el("apneNy").addEventListener("click", () => { el("tittel").value = ""; el("nyDialog").showModal(); el("tittel").focus(); });

el("leggTil").addEventListener("click", () => {
  const tittel = el("tittel").value.trim();
  const poeng = Number(document.querySelector('input[name="poeng"]:checked').value);
  if (tittel === "") { el("tittel").focus(); return; }
  oppgaver.push({ id: Date.now(), tittel, poeng, status: "ledig" });
  el("nyDialog").close();
  valgtFane = "ledig";
  document.querySelectorAll(".fane").forEach((k) => k.classList.toggle("aktiv", k.dataset.status === "ledig"));
  tegnAlt();
});

el("apneStatistikk").addEventListener("click", () => {
  const maks = Math.max(...familie.map((p) => p.poeng), 1);
  el("statListe").innerHTML = familie.map((p) => `
    <div class="stolperad">
      <div class="topplinje"><span>${p.navn}</span><span>${p.poeng} p</span></div>
      <div class="stolpe"><div style="width:${(p.poeng / maks) * 100}%; background:${p.farge}"></div></div>
    </div>`).join("");
  el("statDialog").showModal();
});

// ----- Henter oppgaver fra serveren -----
async function hentOppgaver() {
  const svar = await fetch("/api/oppgaver");
  oppgaver = await svar.json();
  tegnAlt();
}

async function hentFamilie() {
  const svar = await fetch("/api/familie");
  familie = await svar.json();
}

// ----- Logg ut -----
el("loggUt").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "login.html";
});

// ----- Oppstart: er jeg innlogget? Hvis ikke, send til innloggingssiden -----
async function start() {
  const svar = await fetch("/api/me");
  if (svar.status === 401) {
    window.location.href = "login.html";
    return;
  }
  jegErId = (await svar.json()).id;
  await hentFamilie();
  await hentOppgaver();
}

start();
