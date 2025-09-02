import fs from "fs";
import fetch from "node-fetch";

const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID; // setter via Secrets
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const LAT = process.env.SKILBREI_LAT;
const LON = process.env.SKILBREI_LON;

async function getWeather() {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=no`;
  console.log("[DEBUG] Vær-URL:", url.replace(OPENWEATHER_API_KEY, "***"));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Vær-API feilet (${res.status})`);
  return res.json();
}

async function makeMp3(text) {
  console.log("[DEBUG] Sender til v3:", text);

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "xi-api-key": ELEVEN_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8
      }
      // La model_id ligge – Eleven v3 velger selv
    })
  });

  if (!res.ok) throw new Error(`ElevenLabs v3 feilet (${res.status}): ${await res.text()}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync("velkomst.mp3", buffer);
  console.log("✅ velkomst.mp3 lagret!");
}

async function main() {
  try {
    const data = await getWeather();
    const temp = Math.round(data.main.temp);
    const desc = data.weather[0].description;
    const kl = new Date().toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" });

    let tekst = `Velkommen hjem til Skilbrei. Klokken er ${kl}, og temperaturen er ${temp} grader med ${desc}. `;
    tekst += "Nå er huset klart for deg, lysene slås på, og det er bare å slappe av. ";
    tekst += "[whispers] Husk å ta en kaffekopp, det er du vel verdt!";

    await makeMp3(tekst);
  } catch (err) {
    console.error("Feil:", err);
    process.exit(1);
  }
}

main();
