import { spawn } from "node:child_process";
import { access, copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const outputDir = resolve(root, "public/generated");
let baseUrl = process.env.ASSET_STUDIO_URL || "http://127.0.0.1:3000";
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const assets = [
  { key: "hero", file: "hero-command-center.png", aliases: ["hero-command-center-v2.png"], width: 1800, height: 1200 },
  { key: "telegram-funnel", file: "case-telegram-funnel.png", width: 1600, height: 1000 },
  { key: "rko-pipeline", file: "case-rko-pipeline.png", width: 1600, height: 1000 },
  { key: "sales-agents", file: "case-sales-agents.png", width: 1600, height: 1000 },
  { key: "shorts-factory", file: "case-shorts-factory.png", width: 1600, height: 1000 },
  { key: "custom-crm", file: "case-custom-crm.png", width: 1600, height: 1000 },
  { key: "business-landing", file: "case-business-landing.png", width: 1600, height: 1000 },
  { key: "og", file: "og-vibecamp-rko.png", width: 1200, height: 630 },
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
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await canReach(url)) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  }
  throw new Error(`Asset studio server did not become ready at ${url}`);
}

async function ensureServer() {
  if (await canReach(`${baseUrl}/asset-studio?asset=hero`)) return undefined;

  if (!process.env.ASSET_STUDIO_URL) {
    baseUrl = "http://127.0.0.1:3013";
    if (await canReach(`${baseUrl}/asset-studio?asset=hero`)) return undefined;
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
  await waitForServer(`${baseUrl}/asset-studio?asset=hero`);
  return child;
}

async function maybeCompressPng(filePath) {
  try {
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default ?? sharpModule;
    const buffer = await sharp(filePath).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    await writeFile(filePath, buffer);
  } catch {
    // Sharp is optional for this script; screenshots are still valid PNGs without it.
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
    for (const asset of assets) {
      await page.setViewportSize({ width: asset.width, height: asset.height });
      await page.goto(`${baseUrl}/asset-studio?asset=${asset.key}`, { waitUntil: "networkidle" });
      const frame = page.locator(".asset-frame");
      const filePath = resolve(outputDir, asset.file);
      await frame.screenshot({ path: filePath, animations: "disabled" });
      await maybeCompressPng(filePath);
      const info = await stat(filePath);
      generated.push({ file: asset.file, size: info.size });
      console.log(`generated ${asset.file} (${Math.round(info.size / 1024)} KB)`);
      for (const alias of asset.aliases ?? []) {
        const aliasPath = resolve(outputDir, alias);
        await copyFile(filePath, aliasPath);
        generated.push({ file: alias, size: info.size });
        console.log(`generated ${alias} (${Math.round(info.size / 1024)} KB)`);
      }
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
