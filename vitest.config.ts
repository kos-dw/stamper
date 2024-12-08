import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        coverage: {
            enabled: true,
            include: ["src/**/*.ts"],
            exclude: ["src/**/*.test.ts", "src/types/*.ts", "src/index*.ts"],
        },
    },
    resolve: {
        alias: {
            "~": path.resolve(__dirname, "src"),
        },
    },
});
