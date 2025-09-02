import fetch from "node-fetch";
import fs from "fs";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID; // Må ligge i Secrets
const LAT = process.env.SKILBREI_LAT;
const LON = process.env.SKILBREI_LON;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

async function getWeather() {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=no`;
  console.log("[DEBUG] Henter værdata fra:", url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Feil frå OpenWeather (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function makeMp3(text) {
  console.log("[DEBUG] Sender tekst til ElevenLabs:", text);
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        model_id: "eleven_multilingual_v3_alpha",
        text,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Feil frå ElevenLabs (${res.status}): ${await res.text()}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync("velkomst.mp3", Buffer.from(arrayBuffer));
  console.log("✅ Lagde velkomst.mp3");
}

async function main() {
  const weather = await getWeather();
  const temp = Math.round(weather.main.temp);
  const description = weather.weather[0].description;

  const tekst = `Velkommen hjem til Skilbrei. Temperaturen er ${temp} grader og været er ${description}.`;

  await makeMp3(tekst);
}

main().catch((err) => {
  console.error("❌ Feil:", err);
  process.exit(1);
});
