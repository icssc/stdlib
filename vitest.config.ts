import { defineConfig } from "vitest/config";

const config: ReturnType<typeof defineConfig> = defineConfig({
  test: { coverage: { provider: "v8", exclude: ["*.cjs"] } },
});

export default config;
