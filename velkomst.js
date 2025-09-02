import fs from "fs";
import fetch from "node-fetch";

// 🔑 Secrets (må ligge i GitHub → Settings → Secrets and variables → Actions)
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const ELEVENLABS_API_KEY  = process.env.ELEVENLABS_API_KEY;
const VOICE_ID            = process.env.ELEVENLABS_VOICE_ID || "s2xtA7B2CTXPPlJzch1v";
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_v3"; // Alpha 3.0 som du ville
const LAT                 = process.env.SKILBREI_LAT;
const LON                 = process.env.SKILBREI_LON;

// 🧪 Sjekk at alt er på plass
for (const [k,v] of Object.entries({
  OPENWEATHER_API_KEY, ELEVENLABS_API_KEY, VOICE_ID, LAT, LON
})) { if (!v) throw new Error(`Mangler secret: ${k}`); }

// Hjelpefunksjonar
const nnDays = ["sundag","måndag","tysdag","onsdag","torsdag","fredag","laurdag"];
function osloNow() {
  const fmt = new Intl.DateTimeFormat("no-NO", { timeZone: "Europe/Oslo", hour: "2-digit", minute: "2-digit", hour12: false });
  const parts = fmt.formatToParts(new Date());
  const hh = parts.find(p=>p.type==="hour")?.value ?? "00";
  const mm = parts.find(p=>p.type==="minute")?.value ?? "00";
  const dayIndex = new Date().toLocaleString("en-GB", { timeZone: "Europe/Oslo", weekday: "short" });
  // Map en-GB short to our nn list:
  const map = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  const d = map[dayIndex] ?? 0;
  return { hh, mm, dayIndex: d, dayName: nnDays[d] };
}
const pick = (arr)=>arr[Math.floor(Math.random()*arr.length)];

async function getWeather() {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=no`;
  console.log("[DEBUG] Hentar vêr:", url.replace(OPENWEATHER_API_KEY,"***"));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Feil frå OpenWeather (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const t = Math.round(data?.main?.temp);
  const desc = (data?.weather?.[0]?.description || "ukjent vêr").toLowerCase();
  return { t, desc };
}

function dayReminder(dayIdx) {
  // 0=sundag, 1=måndag, ... 4=torsdag
  if (dayIdx === 1) return "I dag er det måndag – hugs papirbosset.";
  if (dayIdx === 3) return "I dag er det onsdag – hugs at bossplassen på Sande er open frå klokka 12.00 til 18.00.";
  if (dayIdx === 4) return "I dag er det torsdag – hugs å ta ned bosspannet.";
  return ""; // andre dagar: ingen spesiell påminning
}

function buildMessage({ t, desc }) {
  const { hh, mm, dayName, dayIndex } = osloNow();

  const greetings = [
    "Hei og velkomen heim!",
    "Velkomen heim, godt å ha deg tilbake!",
    "Heisann – velkomen heim!",
    "Så kjekt å sjå deg – velkomen heim!",
    "Velkomen heim, vennen!"
  ];
  const lights = [
    "Eg skrur på lysa dine med det same.",
    "Eg set på alt lyset for deg.",
    "Lysa blir skrudde på no – klart og triveleg.",
    "Eg slår på lysa – velkomen inn."
  ];
  const closers = [
    "I dag kan det passe bra med ein kaffikopp.",
    "Ta deg fem minutt på sofaen – det er heilt lov.",
    "Hugs å puste med magen – resten tek vi seinare.",
    "Kanskje ei lita spilleliste set stemninga?",
    "La skuldrene falle – huset er på lag med deg."
  ];

  const greet = pick(greetings);
  const lightLine = pick(lights);
  const closer = pick(closers);
  const reminder = dayReminder(dayIndex);

  // Sett saman ~20 sekund med naturleg tempo
  const parts = [
    `${greet}`,
    `Klokka er ${hh}:${mm}, og det er ${dayName}. ${lightLine}`,
    `Ute er det ${t} grader og ${desc}.`,
    `Inne held vi det på 22 grader – akkurat passe.`,
    reminder ? `${reminder}` : ``,
    `Kos deg heime no. ${closer}`
  ].filter(Boolean);

  // Litt mjuk fylltekst for lengde (~20s avhengig av stemme)
  const filler = " Eg er her om du treng noko.";
  const base = parts.join(" ");

  // Om teksten er for kort, legg til litt vennleg fyll
  const targetChars = 420; // ca 18–22s i normal norsk fart
  let finalText = base;
  while (finalText.length < targetChars) finalText += filler;

  return finalText.trim();
}

async function makeMp3(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
  console.log("[DEBUG] Sender tekst til ElevenLabs (kort vist):", text.slice(0, 160), "...");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": ELEVENLABS_API_KEY
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL_ID, // "eleven_v3" (Alpha 3.0)
      // Nokså naturleg, roleg leveranse
      voice_settings: { stability: 0.5, similarity_boost: 0.8 }
    })
  });

  if (!res.ok) throw new Error(`Feil frå ElevenLabs (${res.status}): ${await res.text()}`);

  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync("velkomst.mp3", buf); // ⚠️ same filnamn kvar gong
  console.log("✅ Lagra: velkomst.mp3");
}

async function main() {
  try {
    const weather = await getWeather();
    const text = buildMessage(weather);
    await makeMp3(text);
  } catch (e) {
    console.error("❌ Feil:", e);
    process.exit(1);
  }
}

main();
