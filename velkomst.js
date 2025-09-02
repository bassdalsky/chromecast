import fs from "fs";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const WEATHER_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${process.env.SKILBREI_LAT}&lon=${process.env.SKILBREI_LON}&appid=${process.env.OPENWEATHER_KEY}&units=metric&lang=no`;

async function getWeather() {
  const res = await fetch(WEATHER_URL);
  if (!res.ok) throw new Error("Feil ved henting av værdata");
  const data = await res.json();
  return {
    temp: Math.round(data.main.temp),
    desc: data.weather[0].description,
  };
}

async function makeMp3(text) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Feil frå ElevenLabs (${res.status}): ${errText}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync("velkomst.mp3", buffer);
  console.log("✅ Lydfil lagra: velkomst.mp3");
}

async function main() {
  const { temp, desc } = await getWeather();
  const tekst = `Velkommen hjem til Skilbrei. Temperaturen er ${temp} grader og været er ${desc}.`;
  console.log("[DEBUG] Sender tekst til ElevenLabs:", tekst);
  await makeMp3(tekst);
}

main().catch((err) => {
  console.error("❌ Feil:", err);
  process.exit(1);
});
