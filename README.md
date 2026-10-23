# Disko Duck

Interactive paper duck, music player, story, and merchandise previews. Production domain: https://diskoduck.com.

## Hosting

The website is static. Vercel serves `dist/` and runs `npm run check` before deployment. No dependency installation, backend, or runtime secrets are required. The source branch is `main`. The `www` domain redirects to the apex domain.

The live domain is assigned to Vercel project `diskoduck` in team `viktordavkov-5502s-projects`. Its production deployment was created from GitHub through the Vercel connector. DNS remains at Namecheap.

Automatic GitHub deployments are prepared in the separate `diskoduck-live` project, but the custom domains still belong to `diskoduck`. Automatic publishing to `diskoduck.com` remains pending Vercel dashboard authentication: connect the production `diskoduck` project to this repository under Settings → Git, or move both domains to the linked project. Until then, publish production updates explicitly through the Vercel connector using the latest `main` commit.

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
