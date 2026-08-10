import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stylesDir = path.resolve(__dirname, "../src/styles");
const outputFile = path.join(stylesDir, "generated.css");

const ignoredFiles = new Set(["generated.css"]);

const orderRules = [
  { match: "tokens.css", weight: 0 },
  { match: "base.css", weight: 10 },
  { match: "typography.css", weight: 20 },
  { match: "layout.css", weight: 30 },

  { match: "components/", weight: 40 },

  { match: "effects/parallax.css", weight: 50 },
  { match: "effects/decorative.css", weight: 60 },
  { match: "effects/background.css", weight: 70 },

  { match: "accessibility.css", weight: 90 },
  { match: "responsive.css", weight: 100 },
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(absolutePath)));
      continue;
    }

    if (!entry.name.endsWith(".css")) continue;
    if (entry.name.endsWith(".module.css")) continue;
    if (ignoredFiles.has(entry.name)) continue;

    files.push(absolutePath);
  }

  return files;
}

function normalizePath(filePath) {
  return path.relative(stylesDir, filePath).replaceAll(path.sep, "/");
}

function getWeight(relativePath) {
  const rule = orderRules.find((item) => relativePath.includes(item.match));
  return rule?.weight ?? 80;
}

const files = await walk(stylesDir);

const sortedFiles = files
  .map((file) => normalizePath(file))
  .sort((a, b) => {
    const weightDiff = getWeight(a) - getWeight(b);
    if (weightDiff !== 0) return weightDiff;

    return a.localeCompare(b);
  });

const content = [
  "/* AUTO-GENERATED FILE. DO NOT EDIT BY HAND. */",
  "/* Run: npm run styles:generate */",
  "",
  ...sortedFiles.map((file) => `@import "./${file}";`),
  "",
].join("\n");

await writeFile(outputFile, content, "utf8");

console.log(`Generated ${path.relative(process.cwd(), outputFile)}`);
console.log(sortedFiles.map((file) => `- ${file}`).join("\n"));