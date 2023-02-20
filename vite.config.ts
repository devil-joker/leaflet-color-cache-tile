import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    build: {
      lib: {
        entry: "src/main.ts",
        name: "createApp",
      },
    },
  };
});
