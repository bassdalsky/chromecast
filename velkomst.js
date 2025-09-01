import fs from "fs";
import fetch from "node-fetch";
import "dotenv/config";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "s2xtA7B2CTXPPlJzch1v";
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const LAT = process.env.SKILBREI_LAT;
const LON = process.env.SKILBREI_LON;

async function getWeather() {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=no`;
  console.log("[DEBUG] Hentar vêrdata frå:", url);

  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Feil frå OpenWeather (${res.status}): ${txt}`);
  }

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
      text,
      voice_settings: { stability: 0.7, similarity_boost: 0.7 },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Feil frå ElevenLabs (${res.status}): ${txt}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync("velkomst.mp3", Buffer.from(arrayBuffer));
  console.log("✅ Lagde fil: velkomst.mp3");
}

async function main() {
  try {
    const weather = await getWeather();
    const melding = `Velkommen heim til Skilbrei. ${weather}`;
    await makeMp3(melding);
  } catch (err) {
    console.error("❌ Feil:", err);
    process.exit(1);
  }
}

main();
