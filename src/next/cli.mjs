#!/usr/bin/env node
// CLI de @keetlab/better — volontairement en JS pur (aucun import relatif)
// pour être exécutée telle quelle, sans compilation.
//
//   better dev | build | start [...options next]
//
// Génère le projet Next dans .better/ (comme .dart_tool/ en Flutter) à partir
// de lib/main.tsx, puis lance `next <commande> .better`.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const HEADER = "// GÉNÉRÉ par @keetlab/better — ne pas modifier.\n";

/**
 * Config facultative : `better.config.mjs` à la racine du projet.
 *
 * @typedef {object} BetterConfig
 * @property {string} [entry] Point d'entrée, relatif à la racine. Par défaut `"lib/main.tsx"`.
 * @property {import("next").NextConfig} [next] Config Next additionnelle.
 * @property {number | false} [revalidate] Durée de cache des pages en secondes
 *   (régénérées au plus une fois par période). Par défaut `false` : jamais
 *   régénérées avant le prochain build.
 * @property {string} [library] Développement de la lib uniquement : dossier source de
 *   la lib, importé en relatif au lieu de `@keetlab/better`.
 */

const root = process.cwd();
const outDir = path.join(root, ".better");
const configFile = path.join(root, "better.config.mjs");

/** @type {BetterConfig} */
const config = fs.existsSync(configFile)
  ? (await import(pathToFileURL(configFile).href)).default ?? {}
  : {};

const entry = path.resolve(root, config.entry ?? "lib/main.tsx");
const library = config.library ? path.resolve(root, config.library) : null;

if (!fs.existsSync(entry)) {
  console.error(`[better] Point d'entrée introuvable : ${entry}`);
  process.exit(1);
}

/** Spécificateur d'import de `target` (sans extension) depuis le dossier `fromDir`. */
function relativeImport(fromDir, target) {
  const withoutExt = target.replace(/\.(tsx?|jsx?|mjs)$/, "");
  const rel = path.relative(fromDir, withoutExt).split(path.sep).join("/");
  return rel.startsWith(".") ? rel : "./" + rel;
}

function libImport(fromDir, subpath) {
  return library
    ? relativeImport(fromDir, path.join(library, subpath))
    : `@keetlab/better/${subpath}`;
}

function writeIfChanged(file, content) {
  // N'écrit que si le contenu change, pour ne pas déclencher de rechargement inutile.
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === content) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

/** Import de la racine de la lib (`@keetlab/better` ou son index en source). */
function libRootImport(fromDir) {
  return library ? relativeImport(fromDir, path.join(library, "index")) : "@keetlab/better";
}

const libDir = path.dirname(entry);

/** Tous les fichiers .ts/.tsx de lib/, sauf le point d'entrée. */
function sourceFiles(dir = libDir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((dirent) => {
    const file = path.join(dir, dirent.name);
    if (dirent.isDirectory()) return dirent.name === "node_modules" ? [] : sourceFiles(file);
    if (!/\.tsx?$/.test(dirent.name) || dirent.name.endsWith(".d.ts") || file === entry) return [];
    return [file];
  });
}

/**
 * Trouve les pages : les classes exportées portant `static route = "..."`.
 * Lecture textuelle, sans exécuter le code : la route doit être une chaîne écrite en dur.
 *
 * `hasLoad` : la classe déclare aussi un `static load` (données chargées côté serveur).
 *
 * @returns {{ name: string, route: string, file: string, hasLoad: boolean }[]}
 */
function findPages() {
  const pages = [];
  for (const file of sourceFiles()) {
    const source = fs.readFileSync(file, "utf8");
    const classes = [...source.matchAll(/(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g)];
    const routes = source.matchAll(/static\s+(?:readonly\s+)?route\s*(?::[^=]+)?=\s*(["'`])([^"'`]*)\1/g);
    for (const match of routes) {
      // La route appartient à la dernière classe déclarée avant elle…
      const index = classes.findLastIndex((c) => c.index < match.index);
      const owner = classes[index];
      if (!owner || !/^export\b/.test(owner[0])) continue;
      // … et son `static load` éventuel se trouve avant la classe suivante.
      const body = source.slice(owner.index, classes[index + 1]?.index ?? source.length);
      const hasLoad = /static\s+(?:readonly\s+)?(?:async\s+)?load\b/.test(body);
      pages.push({ name: owner[1], route: match[2], file, hasLoad });
    }
  }

  const seen = new Map();
  for (const page of pages) {
    if (seen.has(page.route)) {
      console.warn(`[better] Route en double "${page.route}" : ${seen.get(page.route)} et ${page.name}`);
    }
    seen.set(page.route, page.name);
  }
  if (pages.length === 0) console.warn(`[better] Aucune page (static route) trouvée dans ${libDir}`);
  return pages;
}

/** Lien `.better/<name>` → `<racine>/<name>`, si la source existe. */
function linkFromRoot(name) {
  const source = path.join(root, name);
  const link = path.join(outDir, name);
  if (!fs.existsSync(source) || fs.existsSync(link)) return;
  fs.symlinkSync(path.relative(outDir, source), link);
}

function generate() {
  const appDir = path.join(outDir, "app");
  const catchAllDir = path.join(appDir, "[[...path]]");
  const clientDir = path.join(appDir, "_better");

  writeIfChanged(
    path.join(outDir, "next.config.mjs"),
    `${HEADER}
${fs.existsSync(configFile) ? `import config from "${relativeImport(outDir, configFile)}.mjs";` : "const config = {};"}

const next = config.next ?? {};

export default {
  ...next,
  // Le code de l'app (lib/) est hors de .better/.
  experimental: { ...next.experimental, externalDir: true },
};
`
  );

  writeIfChanged(
    path.join(appDir, "layout.tsx"),
    `${HEADER}
import app from "${relativeImport(appDir, entry)}";
import { createRootLayout } from "${libImport(appDir, "next/server")}";

const layout = createRootLayout(app);
export const metadata = layout.metadata;
export default layout.RootLayout;
`
  );

  const pages = findPages();

  // Manifeste serveur : imports normaux (métadonnées, sitemap, 404).
  writeIfChanged(
    path.join(clientDir, "routes.server.ts"),
    `${HEADER}
${pages.map((p, i) => `import { ${p.name} as Page${i} } from "${relativeImport(clientDir, p.file)}";`).join("\n")}

export const pages = [${pages.map((_, i) => `Page${i}`).join(", ")}];
`
  );

  // Server Action : exécute le `static load` d'une page lors d'une navigation
  // côté client. Toujours sur le serveur : base de données, secrets…
  writeIfChanged(
    path.join(clientDir, "actions.ts"),
    `"use server";
${HEADER}
import { loadRouteData } from "${libImport(clientDir, "next/server")}";
import { pages } from "./routes.server";

export async function loadData(path: string) {
  return loadRouteData(pages, path);
}
`
  );

  // Manifeste client : chaque page dans son propre chunk, chargé à la demande.
  writeIfChanged(
    path.join(clientDir, "routes.client.tsx"),
    `"use client";
${HEADER}
import dynamic from "next/dynamic";
import { widgetComponent } from "${libRootImport(clientDir)}";
import { lazyRoute } from "${libImport(clientDir, "next/client")}";
import { loadData } from "./actions";

export const routes = {
${pages
  .map((p) => {
    const spec = relativeImport(clientDir, p.file);
    return `  ${JSON.stringify(p.route)}: lazyRoute(
    dynamic(() => import("${spec}").then((m) => widgetComponent(m.${p.name}))),
    () => import("${spec}").then((m) => m.${p.name})${p.hasLoad ? ",\n    loadData" : ""}
  ),`;
  })
  .join("\n")}
};
`
  );

  writeIfChanged(
    path.join(clientDir, "client.tsx"),
    `"use client";
${HEADER}
import { cloneElement } from "react";
import app from "${relativeImport(clientDir, entry)}";
import { routes } from "./routes.client";

export function BetterClient({ initialPath, initialData }: { initialPath: string; initialData?: unknown }) {
  return cloneElement(app, { initialPath, initialData, routeTable: routes });
}
`
  );

  writeIfChanged(
    path.join(catchAllDir, "page.tsx"),
    `${HEADER}
import app from "${relativeImport(catchAllDir, entry)}";
import { createPage } from "${libImport(catchAllDir, "next/server")}";
import { BetterClient } from "../_better/client";
import { pages } from "../_better/routes.server";

const page = createPage(app, pages, BetterClient);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;
${
  // Écrit en dur : Next lit cette valeur par analyse statique du fichier.
  config.revalidate !== undefined ? `\nexport const revalidate = ${JSON.stringify(config.revalidate)};\n` : ""
}`
  );

  writeIfChanged(
    path.join(appDir, "sitemap.ts"),
    `${HEADER}
import app from "${relativeImport(appDir, entry)}";
import { createSitemap } from "${libImport(appDir, "next/server")}";
import { pages } from "./_better/routes.server";

export default createSitemap(app, pages);
`
  );

  writeIfChanged(
    path.join(appDir, "robots.ts"),
    `${HEADER}
import app from "${relativeImport(appDir, entry)}";
import { createRobots } from "${libImport(appDir, "next/server")}";

export default createRobots(app);
`
  );

  // Next lit public/ et les .env depuis son dossier de projet.
  linkFromRoot("public");
  for (const name of fs.readdirSync(root)) {
    if (name.startsWith(".env")) linkFromRoot(name);
  }
}

const [command = "dev", ...args] = process.argv.slice(2);
if (!["dev", "build", "start"].includes(command)) {
  console.error(`[better] Commande inconnue : ${command} (dev | build | start)`);
  process.exit(1);
}

if (command !== "start") generate();

// En dev : régénère quand une page est ajoutée ou qu'une route change.
if (command === "dev") {
  let timer;
  fs.watch(libDir, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        generate();
      } catch (error) {
        console.error("[better] Génération impossible :", error);
      }
    }, 100);
  });
}

const nextBin = createRequire(path.join(root, "package.json")).resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, command, outDir, ...args], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 0));
