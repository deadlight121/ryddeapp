// Innlogging. Backend (/api/login) lages senere med express-session og bcrypt.

const skjema = document.getElementById("loginSkjema");
const feil = document.getElementById("feil");

skjema.addEventListener("submit", async (e) => {
  e.preventDefault();          // hindrer at siden lastes på nytt
  feil.textContent = "";

  const brukernavn = document.getElementById("brukernavn").value.trim();
  const passord = document.getElementById("passord").value;

  // Sjekk på klientsiden (serveren må sjekke igjen!)
  if (brukernavn === "" || passord === "") {
    feil.textContent = "Fyll inn både brukernavn og passord.";
    return;
  }

  try {
    const svar = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brukernavn, passord }),
    });

    if (svar.ok) {
      window.location.href = "index.html";   // innlogget: gå til hovedsiden
    } else {
      feil.textContent = "Feil brukernavn eller passord. Freya er ikke imponert.";
    }
  } catch (err) {
    feil.textContent = "Får ikke kontakt med serveren. Prøv igjen.";
  }
});
