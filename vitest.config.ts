import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,ts}"],
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      root: path.resolve(__dirname, "./"),
    },
  },
});
