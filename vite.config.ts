// TODO: vite本地使用demo，暂时未开发配置
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
