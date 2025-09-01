import fs from "fs";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "s2xtA7B2CTXPPlJzch1v";

async function getWeather() {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${process.env.SKILBREI_LAT}&lon=${process.env.SKILBREI_LON}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=no`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Feil frå OpenWeather (" + res.status + ")");
  const data = await res.json();
  return `Temperaturen er ${Math.round(data.main.temp)} grader og været er ${data.weather[0].description}.`;
}

async function makeMp3(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v3",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    }),
  });
  if (!res.ok) throw new Error("Feil frå ElevenLabs (" + res.status + ")");
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync("velkomst.mp3", buffer);
}

async function main() {
  try {
    const weather = await getWeather();
    const melding = `Hei, velkommen heim. ${weather} Hugs å sjå bossdunken.`;
    await makeMp3(melding);
    console.log("✅ velkomst.mp3 er klar!");
  } catch (err) {
    console.error("❌ Feil:", err);
    process.exit(1);
  }
}

main();
