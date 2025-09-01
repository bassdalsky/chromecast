# Velkomst Prosjekt

Dette prosjektet lager en velkomstmelding som MP3-fil basert på værdata og ElevenLabs TTS.

## Kom i gang

1. Lag en `.env` fil eller legg inn secrets i GitHub:
   ```env
   OPENWEATHER_API_KEY=din_nokkel
   ELEVENLABS_API_KEY=din_nokkel
   ELEVENLABS_VOICE_ID=s2xtA7B2CTXPPlJzch1v
   SKILBREI_LAT=61.45
   SKILBREI_LON=5.85
   ```

2. Kjør lokalt:
   ```bash
   npm install
   node velkomst.js
   ```

3. GitHub Actions lager `velkomst.mp3` automatisk og publiserer på GitHub Pages.

URL-en blir:
```
https://DITT_BRUKERNAVN.github.io/DITT_REPO/velkomst.mp3
```
