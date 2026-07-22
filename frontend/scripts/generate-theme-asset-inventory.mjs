import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const assetRoot = resolve(scriptDirectory, "../public/assets/themes");
const outputPath = join(assetRoot, "manifest.json");
const checkOnly = process.argv.includes("--check");

const dimensions = {
  patagonia: [
    [449, 360],
    [226, 360],
    [368, 360],
    [419, 360],
    [184, 215],
    [193, 215],
    [188, 215],
    [197, 215],
    [193, 215],
    [194, 215],
    [234, 215],
  ],
  chiloe: [
    [362, 231],
    [290, 231],
    [311, 231],
    [480, 231],
    [261, 170],
    [348, 170],
    [296, 170],
    [309, 170],
    [261, 177],
    [306, 177],
    [284, 177],
  ],
  cordillera: [
    [336, 245],
    [293, 245],
    [400, 245],
    [420, 245],
    [270, 182],
    [358, 182],
    [316, 182],
    [295, 182],
    [257, 153],
    [322, 153],
    [275, 153],
  ],
  "san-pedro": [
    [450, 263],
    [241, 263],
    [387, 263],
    [361, 263],
    [166, 105],
    [205, 172],
    [149, 182],
    [153, 128],
    [155, 128],
    [158, 145],
    [158, 145],
  ],
};

const webpFiles = [
  "app-background.webp",
  "auth-background.webp",
  "onboarding-hero.webp",
  "home-hero.webp",
  "theme-preview.webp",
  "footer-decoration.webp",
  "subtle-pattern.webp",
  "empty-expenses.webp",
  "empty-absences.webp",
  "empty-tasks.webp",
  "empty-house.webp",
];

const svgFiles = [
  ["home-icon.svg", 24, 24],
  ["rules-empty.svg", 320, 240],
  ["header-decoration.svg", 1200, 96],
  ["modal-decoration.svg", 1200, 160],
];

const themes = Object.entries(dimensions).map(([themeId, themeDimensions]) => {
  const themeRoot = join(assetRoot, themeId);
  const expectedFiles = [
    ...webpFiles,
    ...svgFiles.map(([file]) => file),
  ].sort();
  const actualFiles = readdirSync(themeRoot)
    .filter((file) => !file.startsWith("."))
    .sort();
  const missing = expectedFiles.filter((file) => !actualFiles.includes(file));
  const unexpected = actualFiles.filter(
    (file) => !expectedFiles.includes(file),
  );
  if (missing.length || unexpected.length) {
    throw new Error(
      `${themeId}: missing [${missing.join(", ")}], unexpected [${unexpected.join(", ")}]`,
    );
  }

  const files = webpFiles.map((file, index) => {
    const filePath = join(themeRoot, file);
    const header = readFileSync(filePath).subarray(0, 12).toString("ascii");
    if (!header.startsWith("RIFF") || !header.endsWith("WEBP")) {
      throw new Error(
        `${relative(assetRoot, filePath)} is not a valid WebP container`,
      );
    }
    const [width, height] = themeDimensions[index];
    return {
      file,
      format: "webp",
      width,
      height,
      bytes: statSync(filePath).size,
    };
  });

  for (const [file, width, height] of svgFiles) {
    const filePath = join(themeRoot, file);
    const source = readFileSync(filePath, "utf8");
    if (!source.includes("<svg") || !source.includes("viewBox=")) {
      throw new Error(
        `${relative(assetRoot, filePath)} is not a valid scalable SVG`,
      );
    }
    if (file === "home-icon.svg" && !source.includes("currentColor")) {
      throw new Error(`${relative(assetRoot, filePath)} must use currentColor`);
    }
    files.push({
      file,
      format: "svg",
      width,
      height,
      bytes: statSync(filePath).size,
    });
  }

  return { themeId, complete: true, files };
});

const manifest = {
  version: 2,
  source: "casa_viva_all_theme_packs",
  license:
    "Casa Viva self-authored assets; no external visual sources declared by the source packs.",
  runtimePolicy:
    "WebP illustrations and backgrounds; SVG Home icons; PNG source exports excluded.",
  themes,
};
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;

if (checkOnly) {
  if (readFileSync(outputPath, "utf8") !== serialized) {
    throw new Error(
      "Theme asset manifest is stale. Run npm run assets:inventory.",
    );
  }
} else {
  writeFileSync(outputPath, serialized);
}
