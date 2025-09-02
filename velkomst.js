import fs from "fs";
import fetch from "node-fetch";

// === ENV fra GitHub Secrets ===
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const LAT = process.env.SKILBREI_LAT;
const LON = process.env.SKILBREI_LON;
const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

// === Hjelpefunksjoner ===
function nowInOslo() {
  const tz = "Europe/Oslo";
  const d = new Date();
  const time = d.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit", timeZone: tz });
  const weekday = d.toLocaleDateString("no-NO", { weekday: "long", timeZone: tz }).toLowerCase();
  return { time, weekday };
}

async function getWeather() {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=no`;
  // Masker nøkkel i logg
  console.log("[DEBUG] Henter værdata fra:", url.replace(OPENWEATHER_API_KEY, "***"));
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Feil fra OpenWeather (${res.status}): ${txt}`);
  }
  const data = await res.json();
  return {
    temp: Math.round(data.main?.temp),
    desc: data.weather?.[0]?.description || "",
  };
}

function reminderForDay(weekday) {
  // bruker bokmål, men beholder "boss"-fraser slik du liker det
  if (weekday === "mandag") return "Husk papirbosset i dag.";
  if (weekday === "onsdag") return "Husk at bossplassen på Sande er åpen fra 12:00 til 18:00.";
  if (weekday === "torsdag") return "Husk å ta ned boss-spannet.";
  return "";
}

function pickGreeting() {
  const list = [
    "Velkommen hjem",
    "Hei og velkommen hjem",
    "Godt å ha deg hjemme igjen",
    "Velkommen tilbake",
    "Hyggelig å se deg hjemme"
  ];
  return list[Math.floor(Math.random() * list.length)];
}

function buildMessage({ time, weekday }, { temp, desc }) {
  const greet = pickGreeting();
  const reminder = reminderForDay(weekday);
  // Fast innetemp 22°C og “slår på lys”
  let parts = [
    `${greet} til Skilbrei.`,
    `Klokken er ${time}.`,
    `Ute er det ${temp} grader og ${desc}.`,
    `Inne holder vi 22 grader.`,
    `Jeg slår på lysene for deg.`,
  ];
  if (reminder) parts.push(reminder);
  parts.push("Ta deg gjerne en kaffekopp og pust litt ut. Ha en fin dag!");
  return parts.join(" ");
}

async function makeMp3(text) {
  console.log("[DEBUG] Sender tekst til ElevenLabs (v3):", text);

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": ELEVEN_API_KEY
    },
    body: JSON.stringify({
      // Ikke angi model_id manuelt: v3 (alpha) brukes automatisk for stemmen
      text,
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.8
      }
    })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Feil fra ElevenLabs (${res.status}): ${txt}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync("velkomst.mp3", buf);
  console.log("✅ Lagret velkomst.mp3");
}

// === Main ===
(async () => {
  try {
    const t = nowInOslo();
    const w = await getWeather();
    const text = buildMessage(t, w);
    await makeMp3(text);
  } catch (err) {
    console.error("❌ Feil:", err);
    process.exit(1);
  }
})();
