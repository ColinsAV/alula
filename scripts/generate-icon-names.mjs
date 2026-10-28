#!/usr/bin/env node
// Génère src/core/widgets/iconNames.ts : les noms d'icônes façon Flutter
// (`arrow_back`, `home_outlined`…) tirés des fichiers de @mui/icons-material.
//   node scripts/generate-icon-names.mjs
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const muiDir = path.dirname(require.resolve("@mui/icons-material/package.json"));
const out = path.join(path.dirname(new URL(import.meta.url).pathname), "../src/core/widgets/iconNames.ts");

/** `Grid3x3` → `grid_3x_3`, `ArrowBackOutlined` → `arrow_back_outlined` (réversible, voir iconComponentName). */
const snake = (name) => name.match(/[A-Z][a-z]*|\d+[a-z]*/g).join("_").toLowerCase();

const names = fs
  .readdirSync(muiDir)
  .filter((file) => /^[A-Z]\w*\.js$/.test(file))
  .map((file) => snake(file.slice(0, -3)))
  .sort();

fs.writeFileSync(
  out,
  `// GÉNÉRÉ par scripts/generate-icon-names.mjs depuis @mui/icons-material — ne pas modifier.

/** Nom d'une icône Material, comme \`Icons.xxx\` en Flutter. */
export type IconName =
${names.map((name) => `  | "${name}"`).join("\n")};
`
);
console.log(`${names.length} icônes → ${path.relative(process.cwd(), out)}`);
