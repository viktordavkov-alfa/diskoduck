# Disko Duck

Interactive paper duck, music player, story, and merchandise previews. Production domain: https://diskoduck.com.

## Hosting

The website is static. Vercel serves `dist/` and runs `npm run check` before deployment. No dependency installation, backend, or runtime secrets are required. The production branch is `main`; Vercel deploys updates from GitHub. The `www` domain redirects to the apex domain.

## Files

- `dist/index.html` and `dist/style.css`: responsive page and controls.
- `dist/app.js` and `dist/puppet.js`: pointer interaction and WebGL animation.
- `dist/music.js`, `dist/player.js`, and `dist/assets/audio/`: local audio playback.
- `dist/music-credits.html` and the audio credits files: track attribution.
- `dist/commerce.js`: current support and merchandise UI; payment links remain unconfigured.
- `dist/vendor/`: vendored Three.js and its license.
- `scripts/check.mjs` and `scripts/playback-check.mjs`: asset, layout, spring, picking, and playback validation.
- `.openai/hosting.json`: original Sites project provenance, retained for the existing checks.

## Development

Serve `dist/` with a local static server. Sound starts after a user gesture. Run `npm run check` before pushing.

Imported from Sites source commit `35d27253f028ad73af152d910188a8847313d22f` (published version 8). The original design and interactions are preserved.
