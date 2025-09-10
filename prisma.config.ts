import { defineConfig } from "@prisma/config";

export default defineConfig({
  seeds: {
    run: "ts-node prisma/seed.ts",
  },
});
