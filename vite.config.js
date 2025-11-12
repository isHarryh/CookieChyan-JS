import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: "src/main.js",
      userscript: {
        name: "CookieChyan-JS",
        version: "0.1.0",
        description: "A Convenience Tool to Retrieve Cookies in Any Webpage",
        author: "Harry Huang",
        license: "MIT",
        match: ["https://*/*", "http://*/*"],
        grant: ["GM_setClipboard", "GM_cookie"],
        source: "https://github.com/isHarryh/CookieChyan-JS",
        namespace: "https://github.com/isHarryh/CookieChyan-JS",
      },
    }),
  ],
});
