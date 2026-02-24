# Patente AB Quiz + Vocabulary Booster

Mobile-first React + Vite app for Italian driving-license study with quiz practice, vocabulary drills, adaptive review, and offline usage.

## Run locally
```bash
npm install
npm run dev
npm run build
npm run preview
```

## Data sources
- Quiz questions: `src/services/questions.json`
- Chapters/topics: `src/services/chapters.json`
- Hints/explanations: `src/services/hints.json`
- Vocabulary dataset: `patente_vocab_it_en.json`

`patente_vocab_it_en.json` uses:
- root fields: `schema_version`, `generated_at_utc`, `repo`, `image_naming`, `cards`
- each card: `id`, `term_it`, `term_en`, `pos`, `definition_it`, `definition_en`, `category`, `tags`, `difficulty`, `example_it`, `example_en`, `images`, `aliases_it`, `aliases_en`

## Adaptive scheduler (brief)
- Mastery score range is `[0..1]`, initialized at `0.2`.
- Correct answer update: `mastery += 0.08 * (1 - mastery)`.
- Wrong answer update: `mastery -= 0.18 * mastery`.
- Daily queue composition: 70% review (lowest mastery + low recency), 30% new/low-attempt.
- Error pattern boost:
  - high wrong-rate topics are boosted in quiz scheduling;
  - vocab linked from mistaken question text + hint text (keyword match with `term_it`/`aliases_it`) receives extra weight.

## Export / Import progress
- Go to **Settings → Data**.
- **Export progress JSON** downloads one progress blob.
- **Import progress JSON** merges IDs safely (`questionStats`, `vocabStats`, settings) without deleting all existing history.
- **Reset progress** restores default local state.

## PWA / Offline
- App registers `public/sw.js` and includes `public/manifest.webmanifest`.
- After first load, cached routes and data assets are available offline.

## Optional Android packaging
Use a wrapper such as Capacitor or Trusted Web Activity around the built PWA if needed.
