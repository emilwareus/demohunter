import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "bin/demohunter": "src/bin/demohunter.ts",
  },
  format: ["esm"],
  target: "node20",
  platform: "node",
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  shims: false,
  noExternal: [/^@demohunter\//],
  external: ["playwright", "typescript"],
});
