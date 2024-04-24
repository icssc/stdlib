import { defineConfig } from "tsup";

const config: ReturnType<typeof defineConfig> = defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts", "src/**/*.ts"],
  format: ["esm"],
  minify: true,
  skipNodeModulesBundle: true,
  splitting: true,
  target: "es2022",
});

export default config;
