import fs from "fs";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "s2xtA7B2CTXPPlJzch1v";
const LAT = process.env.SKILBREI_LAT;
const LON = process.env.SKILBREI_LON;

async function getWeather() {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=no`;
  console.log("[DEBUG] Hentar vêrdata frå:", url);

  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`Feil frå OpenWeather (${res.status}): ${text}`);

  const data = JSON.parse(text);
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
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Feil frå ElevenLabs (${res.status}): ${errorText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync("velkomst.mp3", Buffer.from(arrayBuffer));
  console.log("✅ Lyd lagra som velkomst.mp3");
}

async function main() {
  try {
    const weatherText = await getWeather();
    const fullText = `Velkommen heim til Skilbrei. ${weatherText}`;
    await makeMp3(fullText);
  } catch (err) {
    console.error("❌ Feil:", err);
    process.exit(1);
  }
}

main();
