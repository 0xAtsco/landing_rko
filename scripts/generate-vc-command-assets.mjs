import { spawn } from "node:child_process";
import { access, mkdir, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const outputDir = resolve(root, "public/generated");
let baseUrl = process.env.VC_COMMAND_URL || "http://127.0.0.1:3000";
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const captures = [
  { showcase: "dialog", file: "vc-command-dialog.png", width: 1440, height: 900 },
  { showcase: "dashboard", file: "vc-command-dashboard.png", width: 1440, height: 900 },
  { showcase: "chat", file: "vc-command-chat.png", width: 1440, height: 900 },
  { showcase: "crm", file: "vc-command-crm.png", width: 1440, height: 900 },
  { showcase: "agent", file: "vc-command-agent.png", width: 1440, height: 900 },
  { showcase: "radar", file: "vc-command-radar.png", width: 1440, height: 900 },
  { showcase: "dialog", file: "vc-command-og.png", width: 1200, height: 630 },
];

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    try {
      return await import("/Users/absq/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/index.mjs");
    } catch (error) {
      throw new Error(
        `Playwright is not available. Install it with: pnpm add -D playwright && npx playwright install chromium\n${error}`,
      );
    }
  }
}

async function canReach(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(900) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (await canReach(url)) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  }
  throw new Error(`VC Command server did not become ready at ${url}`);
}

async function ensureServer() {
  if (await canReach(`${baseUrl}/demo/vc-command?showcase=dialog`)) return undefined;

  if (!process.env.VC_COMMAND_URL) {
    baseUrl = "http://127.0.0.1:3014";
    if (await canReach(`${baseUrl}/demo/vc-command?showcase=dialog`)) return undefined;
  }

  const node = process.execPath;
  const nextBin = resolve(root, "node_modules/next/dist/bin/next");
  const port = new URL(baseUrl).port || "3000";
  const child = spawn(node, [nextBin, "dev", "--webpack", "-p", port], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  await waitForServer(`${baseUrl}/demo/vc-command?showcase=dialog`);
  return child;
}

async function maybeCompressPng(filePath) {
  try {
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default ?? sharpModule;
    const buffer = await sharp(filePath).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    await writeFile(filePath, buffer);
  } catch {
    // Sharp is optional; screenshots are valid PNGs without compression.
  }
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const server = await ensureServer();
  const { chromium } = await importPlaywright();
  const launchOptions = { headless: true };

  try {
    await access(chromePath);
    launchOptions.executablePath = chromePath;
  } catch {
    // Fall back to Playwright-managed Chromium when it is installed.
  }

  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const generated = [];

  try {
    for (const capture of captures) {
      await page.setViewportSize({ width: capture.width, height: capture.height });
      await page.goto(`${baseUrl}/demo/vc-command?showcase=${capture.showcase}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      const filePath = resolve(outputDir, capture.file);
      await page.screenshot({ path: filePath, fullPage: false, animations: "disabled" });
      await maybeCompressPng(filePath);
      const info = await stat(filePath);
      generated.push({ file: capture.file, size: info.size });
      console.log(`generated ${capture.file} (${Math.round(info.size / 1024)} KB)`);
    }
  } finally {
    await browser.close();
    if (server) server.kill("SIGTERM");
  }

  console.log(JSON.stringify(generated, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
