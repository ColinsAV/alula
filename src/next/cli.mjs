#!/usr/bin/env node
// CLI de @colinsavenue/alula — volontairement en JS pur (aucun import relatif)
// pour être exécutée telle quelle, sans compilation.
//
//   alula dev | build | start [--native] [...options next / expo]
//   alula create <dossier> [--native | --web]
//
// Génère le projet Next dans .alula/ (comme .dart_tool/ en Flutter) à partir
// de lib/main.tsx, puis lance `next <commande> .alula`.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const HEADER = "// GÉNÉRÉ par @colinsavenue/alula — ne pas modifier.\n";

// --- alula create -----------------------------------------------------------
// Avant tout le reste : il n'y a pas encore de projet (ni lib/main.tsx).

if (process.argv[2] === "create") {
  await create(process.argv.slice(3));
  process.exit(0);
}

/**
 * `alula create <dossier> [--native | --web] [--from <spec>] [--no-install] [--no-git]`
 *
 * Crée un projet à partir de template/ (comme `flutter create`). `--from`
 * remplace la version de la lib dans les dépendances (fichier .tgz, `github:…`)
 * pour tester avant publication.
 */
async function create(argv) {
  const { createInterface } = await import("node:readline/promises");
  const { execSync } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");

  const flag = (name) => argv.includes(name);
  const option = (name) => {
    const index = argv.indexOf(name);
    return index === -1 ? undefined : argv[index + 1];
  };
  const from = option("--from");
  const positional = argv.filter((arg, i) => !arg.startsWith("--") && argv[i - 1] !== "--from");

  const ask = async (question) => {
    if (!process.stdin.isTTY) return "";
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(question);
    rl.close();
    return answer.trim();
  };

  const dirName = positional[0] || (await ask("Nom du projet : ")) || "mon-app";
  const target = path.resolve(dirName);
  if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
    console.error(`[alula] Le dossier ${target} existe déjà et n'est pas vide.`);
    process.exit(1);
  }
  const native = flag("--native") || (!flag("--web") && !/^n/i.test(await ask("Ajouter l'app mobile (Expo) ? (O/n) ")));

  const title = path.basename(target);
  const slug = title.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "app";

  // template/ et package.json sont à la racine du paquet (cli.mjs est dans src/next/ ou dist/next/).
  const packageRoot = new URL("../../", import.meta.url);
  const templateDir = new URL("template/", packageRoot);
  const self = JSON.parse(fs.readFileSync(new URL("package.json", packageRoot), "utf8"));

  const copy = (from, to) => {
    fs.mkdirSync(to, { recursive: true });
    for (const dirent of fs.readdirSync(from, { withFileTypes: true })) {
      const source = path.join(from, dirent.name);
      // npm ne publie pas les .gitignore : le modèle le nomme `gitignore`.
      const dest = path.join(to, dirent.name === "gitignore" ? ".gitignore" : dirent.name);
      if (dirent.isDirectory()) copy(source, dest);
      else fs.writeFileSync(dest, fs.readFileSync(source, "utf8").replaceAll("{{title}}", title));
    }
  };
  copy(fileURLToPath(templateDir), target);

  // Mêmes versions que celles avec lesquelles la lib est développée.
  const version = (name) => self.devDependencies[name];
  const pick = (names) => Object.fromEntries(names.map((name) => [name, version(name)]));
  const web = ["react", "react-dom", "next", "@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled", "@emotion/cache"];
  const mobile = [
    "expo",
    "react-native",
    "expo-image",
    "expo-linear-gradient",
    "@expo/vector-icons",
    "react-native-paper",
    "@react-native-community/slider",
    "@react-navigation/native",
    "@react-navigation/native-stack",
    "react-native-safe-area-context",
    "react-native-screens",
  ];

  const pkg = {
    name: slug,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      dev: "alula dev",
      ...(native && { "dev:native": "alula dev --native" }),
      build: "alula build",
      start: "alula start",
      typecheck: "tsc --noEmit",
    },
    dependencies: {
      [self.name]: from ?? `^${self.version}`,
      ...pick(web),
      ...(native && pick(mobile)),
    },
    devDependencies: {
      typescript: version("typescript"),
      "@types/react": version("@types/react"),
      "@types/react-dom": version("@types/react-dom"),
      "@types/node": "^22.0.0",
    },
  };
  fs.writeFileSync(path.join(target, "package.json"), JSON.stringify(pkg, null, 2) + "\n");

  fs.writeFileSync(
    path.join(target, "alula.config.mjs"),
    `// Config de alula (facultative) : point d'entrée, config Next, cache des pages…
export default {
${native ? `  native: { name: ${JSON.stringify(title)}, slug: ${JSON.stringify(slug)}, scheme: ${JSON.stringify(slug)} },\n` : ""}};
`
  );

  const agent = process.env.npm_config_user_agent ?? "";
  const pm = ["pnpm", "yarn", "bun"].find((name) => agent.startsWith(name)) ?? "npm";
  const run = (command) => execSync(command, { cwd: target, stdio: "inherit" });

  if (!flag("--no-install")) {
    console.log(`\n[alula] Installation des dépendances (${pm} install)…\n`);
    run(`${pm} install`);
  }
  if (!flag("--no-git")) {
    try {
      run("git init -q");
    } catch {
      console.warn("[alula] git introuvable : dépôt non initialisé.");
    }
  }

  const runScript = pm === "npm" ? "npm run" : pm;
  console.log(`
[alula] Projet créé dans ${target}

  cd ${path.relative(process.cwd(), target) || "."}
  ${runScript} dev${native ? `           # site web\n  ${runScript} dev:native    # app mobile (Expo Go)` : ""}
`);
}

/**
 * Config facultative : `alula.config.mjs` à la racine du projet.
 *
 * @typedef {object} AlulaConfig
 * @property {string} [entry] Point d'entrée, relatif à la racine. Par défaut `"lib/main.tsx"`.
 * @property {import("next").NextConfig} [next] Config Next additionnelle.
 * @property {number | false} [revalidate] Durée de cache des pages en secondes
 *   (régénérées au plus une fois par période). Par défaut `false` : jamais
 *   régénérées avant le prochain build.
 * @property {{ name?: string, slug?: string, scheme?: string }} [native] App mobile
 *   (`alula dev --native`) : nom affiché, identifiant Expo, schéma des liens profonds.
 * @property {string} [library] Développement de la lib uniquement : dossier source de
 *   la lib, importé en relatif au lieu de `@colinsavenue/alula`.
 */

const root = process.cwd();
const outDir = path.join(root, ".alula");
const configFile = path.join(root, "alula.config.mjs");

/** @type {AlulaConfig} */
const config = fs.existsSync(configFile)
  ? (await import(pathToFileURL(configFile).href)).default ?? {}
  : {};

const entry = path.resolve(root, config.entry ?? "lib/main.tsx");
const library = config.library ? path.resolve(root, config.library) : null;

if (!fs.existsSync(entry)) {
  console.error(`[alula] Point d'entrée introuvable : ${entry}`);
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
    : `@colinsavenue/alula/${subpath}`;
}

function writeIfChanged(file, content) {
  // N'écrit que si le contenu change, pour ne pas déclencher de rechargement inutile.
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === content) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

/** Import de la racine de la lib (`@colinsavenue/alula` ou son index en source). */
function libRootImport(fromDir) {
  return library ? relativeImport(fromDir, path.join(library, "index")) : "@colinsavenue/alula";
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
      console.warn(`[alula] Route en double "${page.route}" : ${seen.get(page.route)} et ${page.name}`);
    }
    seen.set(page.route, page.name);
  }
  if (pages.length === 0) console.warn(`[alula] Aucune page (static route) trouvée dans ${libDir}`);
  return pages;
}

const requireFromRoot = createRequire(path.join(root, "package.json"));

/** `arrow_back` → `ArrowBack` (même règle que iconComponentName dans la lib). */
const iconComponentName = (name) =>
  name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

/**
 * Les icônes utilisées dans lib/ (`Icons.xxx` écrit en toutes lettres) et
 * leur composant MUI. Seules celles-ci sont embarquées dans le site.
 *
 * @returns {{ name: string, component: string }[]}
 */
function findIcons() {
  const names = new Set();
  for (const file of [entry, ...sourceFiles()]) {
    for (const match of fs.readFileSync(file, "utf8").matchAll(/\bIcons\.(\w+)/g)) names.add(match[1]);
  }
  const icons = [];
  for (const name of [...names].sort()) {
    const component = iconComponentName(name);
    try {
      requireFromRoot.resolve(`@mui/icons-material/${component}`);
      icons.push({ name, component });
    } catch {
      console.warn(`[alula] Icône inconnue : Icons.${name} (aucun @mui/icons-material/${component})`);
    }
  }
  return icons;
}

/** Lien `.alula/<name>` → `<racine>/<name>`, si la source existe. */
function linkFromRoot(name) {
  const source = path.join(root, name);
  const link = path.join(outDir, name);
  if (!fs.existsSync(source) || fs.existsSync(link)) return;
  fs.symlinkSync(path.relative(outDir, source), link);
}

/** Dossier commun à la racine du projet et, en développement de la lib, à son source. */
function tracingRoot() {
  if (!library) return root;
  let dir = root;
  while (path.relative(dir, library).startsWith("..")) dir = path.dirname(dir);
  return dir;
}

function generate() {
  const appDir = path.join(outDir, "app");
  const catchAllDir = path.join(appDir, "[[...path]]");
  const clientDir = path.join(appDir, "_alula");

  writeIfChanged(
    path.join(outDir, "next.config.mjs"),
    `${HEADER}
${fs.existsSync(configFile) ? `import config from "${relativeImport(outDir, configFile)}.mjs";` : "const config = {};"}

const next = config.next ?? {};

export default {
  // Racine du projet : sans elle, Next la devine d'après les lockfiles trouvés
  // plus haut (un package-lock.json oublié dans le dossier personnel…).
  outputFileTracingRoot: ${JSON.stringify(tracingRoot())},
  ...next,
  // Le code de l'app (lib/) est hors de .alula/.
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

  // Icônes : uniquement celles écrites `Icons.xxx` dans lib/.
  const icons = findIcons();
  writeIfChanged(
    path.join(clientDir, "icons.ts"),
    `${HEADER}
import { registerIcons } from "${libRootImport(clientDir)}";
${icons.map((icon) => `import ${icon.component} from "@mui/icons-material/${icon.component}";`).join("\n")}

registerIcons({
${icons.map((icon) => `  ${icon.name}: ${icon.component},`).join("\n")}
});
`
  );

  writeIfChanged(
    path.join(clientDir, "client.tsx"),
    `"use client";
${HEADER}
import "./icons";
import { cloneElement } from "react";
import app from "${relativeImport(clientDir, entry)}";
import { routes } from "./routes.client";

export function AlulaClient({ initialPath, initialData }: { initialPath: string; initialData?: unknown }) {
  return cloneElement(app, { initialPath, initialData, routeTable: routes });
}
`
  );

  writeIfChanged(
    path.join(catchAllDir, "page.tsx"),
    `${HEADER}
import app from "${relativeImport(catchAllDir, entry)}";
import { createPage } from "${libImport(catchAllDir, "next/server")}";
import { AlulaClient } from "../_alula/client";
import { pages } from "../_alula/routes.server";

const page = createPage(app, pages, AlulaClient);
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
import { pages } from "./_alula/routes.server";

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

// --- Mobile (React Native / Expo) --------------------------------------------

const nativeDir = path.join(root, ".alula-native");

/**
 * Génère l'app Expo dans .alula-native/ : même lib/, mêmes pages, rendues
 * par les fichiers `.native.tsx` de la lib (React Native).
 */
function generateNative() {
  const expoPackage = requireFromRoot.resolve("expo/package.json");
  // Dossier qui contient node_modules/expo : Metro doit pouvoir y lire.
  const workspace = path.dirname(path.dirname(path.dirname(expoPackage)));
  const expoVersion = JSON.parse(fs.readFileSync(expoPackage, "utf8")).version;
  const title = path.basename(root);

  writeIfChanged(
    path.join(nativeDir, "package.json"),
    JSON.stringify(
      { name: "alula-native-app", private: true, main: "index.ts", dependencies: { expo: expoVersion } },
      null,
      2
    ) + "\n"
  );

  writeIfChanged(
    path.join(nativeDir, "app.json"),
    JSON.stringify(
      {
        expo: {
          name: config.native?.name ?? title,
          slug: config.native?.slug ?? title,
          scheme: config.native?.scheme ?? "alula",
          // Suit le réglage clair / sombre de l'appareil.
          userInterfaceStyle: "automatic",
          newArchEnabled: true,
          platforms: ["ios", "android"],
        },
      },
      null,
      2
    ) + "\n"
  );

  const watchFolders = [root, workspace, ...(library ? [library] : [])];
  writeIfChanged(
    path.join(nativeDir, "metro.config.js"),
    `${HEADER}
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
// Le code de l'app (lib/) et node_modules sont hors de .alula-native/.
config.watchFolders = [...new Set([...(config.watchFolders ?? []), ${watchFolders.map((f) => JSON.stringify(f)).join(", ")}])];
config.resolver.nodeModulesPaths = [${JSON.stringify(path.join(workspace, "node_modules"))}];

module.exports = config;
`
  );

  writeIfChanged(
    path.join(nativeDir, "babel.config.js"),
    `${HEADER}
module.exports = function (api) {
  api.cache(true);
  return { presets: ["babel-preset-expo"] };
};
`
  );

  // Toutes les pages, importées directement (pas de chargement à la demande sur mobile).
  const pages = findPages();
  writeIfChanged(
    path.join(nativeDir, "routes.ts"),
    `${HEADER}
import { routesFromPages } from "${libRootImport(nativeDir)}";
${pages.map((p, i) => `import { ${p.name} as Page${i} } from "${relativeImport(nativeDir, p.file)}";`).join("\n")}

export const routes = routesFromPages([${pages.map((_, i) => `Page${i}`).join(", ")}]);
`
  );

  writeIfChanged(
    path.join(nativeDir, "index.ts"),
    `${HEADER}
import { registerRootComponent } from "expo";
import { cloneElement } from "react";
import app from "${relativeImport(nativeDir, entry)}";
import { routes } from "./routes";

function Root() {
  return cloneElement(app, { routeTable: routes });
}

registerRootComponent(Root);
`
  );
}

/** Régénère à chaque modification de lib/ (pages ajoutées, routes, icônes…). */
function watch(regenerate) {
  let timer;
  fs.watch(libDir, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        regenerate();
      } catch (error) {
        console.error("[alula] Génération impossible :", error);
      }
    }, 100);
  });
}

// --- Commandes ----------------------------------------------------------------

const [command = "dev", ...rawArgs] = process.argv.slice(2);
const native = rawArgs.includes("--native");
const args = rawArgs.filter((arg) => arg !== "--native");

if (!["dev", "build", "start"].includes(command)) {
  console.error(`[alula] Commande inconnue : ${command} (create | dev | build | start) [--native]`);
  process.exit(1);
}

if (native) {
  if (command !== "dev") {
    console.error("[alula] Sur mobile, seule `alula dev --native` existe pour l'instant (build : bientôt, via EAS).");
    process.exit(1);
  }
  generateNative();
  watch(generateNative);
  // Expo : QR code à scanner avec l'app Expo Go, ou simulateur (touches i / a).
  const expoBin = requireFromRoot.resolve("expo/bin/cli");
  const child = spawn(process.execPath, [expoBin, "start", ...args], { stdio: "inherit", cwd: nativeDir });
  child.on("exit", (code) => process.exit(code ?? 0));
} else {
  if (command !== "start") generate();
  if (command === "dev") watch(generate);

  const nextBin = requireFromRoot.resolve("next/dist/bin/next");
  const child = spawn(process.execPath, [nextBin, command, outDir, ...args], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code ?? 0));
}
