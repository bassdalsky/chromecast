import fetch from "node-fetch";
import fs from "fs";

// Leser secrets frå miljøvariablar (GitHub Actions → Settings → Secrets)
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const LAT = process.env.SKILBREI_LAT;
const LON = process.env.SKILBREI_LON;
const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVEN_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const ELEVEN_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2.5"; // Bokmål-støtte

// Hentar vêrdata frå OpenWeather
async function getWeather() {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${WEATHER_API_KEY}&units=metric&lang=no`;
  console.log("[DEBUG] Hentar vêrdata frå:", url.replace(WEATHER_API_KEY, "***"));

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Feil frå OpenWeather (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

// Genererer MP3 frå tekst via ElevenLabs
async function makeMp3(text) {
  console.log("[DEBUG] Sender tekst til ElevenLabs:", text);

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVEN_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: ELEVEN_MODEL_ID,
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.85,
      },
      text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Feil frå ElevenLabs (${res.status}): ${await res.text()}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync("velkomst.mp3", buffer);
  console.log("[DEBUG] Lagra velkomst.mp3 (", buffer.length, "bytes )");
}

// Hovudfunksjon
async function main() {
  try {
    const weather = await getWeather();
    const temp = Math.round(weather.main.temp);
    const desc = weather.weather[0].description;
    const klokkeslett = new Date().toLocaleTimeString("no-NO", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Bokmål-vennleg melding
    const tekst = `Velkommen hjem til Skilbrei. Klokken er ${klokkeslett}. Temperaturen er ${temp} grader, og været er ${desc}.`;

    await makeMp3(tekst);
    console.log("✅ Ferdig! MP3-fil klar til bruk på Homey/Chromecast.");
  } catch (err) {
    console.error("❌ Feil:", err);
    process.exit(1);
  }
}

main();
