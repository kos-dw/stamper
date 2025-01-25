import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      enabled: true,
      include: ["src/**/*.{test,spec}.{js,ts}"],
      exclude: ["e2e/**", "**/node_modules/**"],
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
});
