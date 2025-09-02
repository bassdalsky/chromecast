import fs from "fs";
import fetch from "node-fetch";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "s2xtA7B2CTXPPlJzch1v"; // Standard stemme
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v3"; // v3.0

async function getWeather() {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${process.env.SKILBREI_LAT}&lon=${process.env.SKILBREI_LON}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=no`;
  console.log("[DEBUG] Henter værdata fra:", url);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Feil frå OpenWeather (" + res.status + ")");
  const data = await res.json();
  return `Temperaturen er ${Math.round(data.main.temp)} grader og været er ${data.weather[0].description}.`;
}

async function makeMp3(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
  console.log("[DEBUG] Sender tekst til ElevenLabs:", text);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.8,
      },
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Feil frå ElevenLabs (" + res.status + "): " + err);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync("velkomst.mp3", buffer);
  console.log("✅ velkomst.mp3 oppretta!");
}

async function main() {
  try {
    const weather = await getWeather();
    const tekst = `Velkommen hjem til Skilbrei. ${weather}`;
    await makeMp3(tekst);
  } catch (err) {
    console.error("❌ Feil:", err);
    process.exit(1);
  }
}

main();
