// Facultatif. Dans une vraie app, ce fichier n'est utile que pour passer
// une config Next additionnelle : export default { next: { ... } };
import { fileURLToPath } from "node:url";

// Racine du dépôt : Vercel y cherche `.next/` et y résout les fichiers tracés.
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default {
  library: "..", // lib en source (src/) au lieu du package publié
  next: {
    distDir: "../../../.next", // relatif à src/examples/.alula
    outputFileTracingRoot: repoRoot,
  },
};
