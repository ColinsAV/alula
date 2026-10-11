import { defineConfig } from "tsup";

export default defineConfig({
  // Un fichier de sortie par fichier source (bundle: false) : préserve les
  // directives "use client" module par module, indispensables pour Next.
  entry: ["src/**/*.{ts,tsx}", "!src/examples/**", "!src/**/*.test.{ts,tsx}"],
  bundle: false,
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  // La CLI est du JS pur, copiée telle quelle.
  async onSuccess() {
    const { copyFile, chmod } = await import("node:fs/promises");
    await copyFile("src/next/cli.mjs", "dist/next/cli.mjs");
    await chmod("dist/next/cli.mjs", 0o755);
  },
});
