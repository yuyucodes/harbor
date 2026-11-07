import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: "postgresql://harbor:harbor@localhost:5432/harbor_test",
      NODE_ENV: "test",
    },
    fileParallelism: false, // test files share one database, so run them one at a time
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});