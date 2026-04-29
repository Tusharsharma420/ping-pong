import { chromium } from "playwright";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const browserExecutable = process.env.CHROME_EXECUTABLE_PATH;
const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
]);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }

    const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = normalize(join(root, requestedPath));
    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const body = await readFile(filePath);
    response.writeHead(200, { "content-type": types.get(extname(filePath)) ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();

const browser = await chromium.launch({
  headless: true,
  ...(browserExecutable ? { executablePath: browserExecutable } : {}),
});

const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "networkidle" });

const initial = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
await page.keyboard.press("Space");
await page.evaluate(() => window.advanceTime(120));
await page.keyboard.down("ArrowDown");
await page.evaluate(() => window.advanceTime(160));
await page.keyboard.up("ArrowDown");
await page.keyboard.down("ArrowUp");
await page.evaluate(() => window.advanceTime(120));
await page.keyboard.up("ArrowUp");
await page.keyboard.press("KeyP");
const paused = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
await page.keyboard.press("KeyP");
await page.evaluate(() => window.advanceTime(180));
const playing = JSON.parse(await page.evaluate(() => window.render_game_to_text()));

await mkdir("output/web-game", { recursive: true });
await page.screenshot({ path: "output/web-game/chrome-verify.png", fullPage: true });
await browser.close();
server.close();

const failures = [];
if (initial.mode !== "menu") failures.push("Expected initial menu mode.");
if (paused.mode !== "paused") failures.push("Expected P key to pause the game.");
if (playing.mode !== "playing") failures.push("Expected P key to resume the game.");
if (playing.ball.vx === 0) failures.push("Expected ball to move after serve.");
if (consoleErrors.length > 0) failures.push(`Console errors: ${consoleErrors.join("; ")}`);

const result = { initial, paused, playing, screenshot: "output/web-game/chrome-verify.png", consoleErrors, failures };
console.log(JSON.stringify(result, null, 2));

if (failures.length > 0) {
  process.exitCode = 1;
}
