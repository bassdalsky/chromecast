import fs from "fs";
import fetch from "node-fetch";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB"; // typisk norsk/bokmål-stemme
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

async function getWeather() {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${process.env.SKILBREI_LAT}&lon=${process.env.SKILBREI_LON}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=no`;
  console.log("[DEBUG] Henter værdata fra:", url);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Feil frå OpenWeather (" + res.status + "): " + (await res.text()));
  const data = await res.json();
  return `Temperaturen er ${Math.round(data.main.temp)} grader og været er ${data.weather[0].description}.`;
}

async function makeMp3(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
  console.log("[DEBUG] Sender tekst til ElevenLabs:", text);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2", // stabil modell, ikke alpha
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!res.ok) throw new Error("Feil frå ElevenLabs (" + res.status + "): " + (await res.text()));
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync("velkomst.mp3", buffer);
  console.log("✅ Lagret velkomst.mp3");
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
