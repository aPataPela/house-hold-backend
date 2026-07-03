import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@app": new URL("./src/app", import.meta.url).pathname,
      "@context": new URL("./src/context", import.meta.url).pathname,
      "@root": new URL("./", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["src/app/**/*.ts", "src/context/**/*.ts"],
      exclude: [
        "src/app/config/env.ts",
        "src/app/server/Index.ts",
        "src/app/server/Run.ts",
        "src/app/http/middlewares/async-handler.ts",
        "src/app/http/middlewares/error.middleware.ts",
        "src/app/http/middlewares/not-found.middleware.ts",
        "src/context/**/models/*.ts",
        "src/context/shared/types/*.ts",
      ],
      thresholds: { statements: 80, branches: 70, functions: 80, lines: 80 },
    },
  },
});
