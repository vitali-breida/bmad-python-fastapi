import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, "..");
const distAssets = join(frontendRoot, "dist", "assets");
const packageJsonPath = join(frontendRoot, "package.json");

function readBudgetLimitKb() {
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const limit = pkg.budgets?.totalJsGzipKb;
  if (typeof limit !== "number" || limit <= 0) {
    console.error(
      "Missing or invalid budgets.totalJsGzipKb in frontend/package.json",
    );
    process.exit(1);
  }
  return limit;
}

function collectJsAssets() {
  let entries;
  try {
    entries = readdirSync(distAssets);
  } catch {
    console.error(
      "dist/assets not found — run `npm run build` before `npm run check:budget`",
    );
    process.exit(1);
  }

  const jsFiles = entries.filter((name) => name.endsWith(".js"));
  if (jsFiles.length === 0) {
    console.error("No .js files found in dist/assets");
    process.exit(1);
  }

  return jsFiles.map((name) => {
    const path = join(distAssets, name);
    const raw = readFileSync(path);
    const gzipBytes = gzipSync(raw).length;
    return { name, gzipBytes, gzipKb: gzipBytes / 1024 };
  });
}

const limitKb = readBudgetLimitKb();
const assets = collectJsAssets();
const totalKb = assets.reduce((sum, a) => sum + a.gzipKb, 0);
const roundedTotal = Math.round(totalKb * 100) / 100;

if (totalKb > limitKb) {
  const sorted = [...assets].sort((a, b) => b.gzipKb - a.gzipKb);
  console.error(
    `Bundle budget exceeded: ${roundedTotal} KB gzip (limit ${limitKb} KB)`,
  );
  console.error("Largest JS assets:");
  for (const asset of sorted.slice(0, 3)) {
    console.error(`  ${asset.name}: ${asset.gzipKb.toFixed(2)} KB gzip`);
  }
  process.exit(1);
}

console.log(
  `Bundle budget OK: ${roundedTotal} KB gzip of JS (limit ${limitKb} KB)`,
);
