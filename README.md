# Ping Pong

[![Verify Game](https://github.com/Tusharsharma420/ping-pong/actions/workflows/verify.yml/badge.svg)](https://github.com/Tusharsharma420/ping-pong/actions/workflows/verify.yml)

A lightweight browser ping pong game built with HTML canvas, CSS, and JavaScript.

## Version

Current version: `0.1.0`

See [CHANGELOG.md](CHANGELOG.md) for release notes.

## Play Locally

Open `index.html` directly in a browser, or run the local static server:

```bash
npm install
npm start
```

Then visit:

```text
http://127.0.0.1:8000/index.html
```

## Controls

- `Space` or click: serve
- `W` / `S` or arrow keys: move paddle
- Mouse: move paddle
- `P`: pause or resume
- `R`: restart
- `F`: fullscreen

First side to 7 points wins.

## Project Structure

```text
.
├── index.html
├── style.css
├── game.js
├── package.json
├── VERSION
├── CHANGELOG.md
├── LICENSE
├── .github/workflows/verify.yml
└── tools/
    ├── local-server.mjs
    └── verify-game.mjs
```

## Scripts

```bash
npm start
```

Starts the local static server on port `8000`.

```bash
npm run verify
```

Runs a Playwright smoke test that checks the menu, serve, pause/resume, moving ball state, console errors, and captures a screenshot at `output/web-game/chrome-verify.png`.

If Playwright cannot find a browser automatically, set `CHROME_EXECUTABLE_PATH` before running verification.

## Release Process

1. Update `VERSION` and the `version` field in `package.json`.
2. Add release notes to `CHANGELOG.md`.
3. Commit with a clear message, for example `Release v0.2.0`.
4. Tag the commit with the same version, for example `v0.2.0`.

## License

This project is licensed under the [MIT License](LICENSE).
