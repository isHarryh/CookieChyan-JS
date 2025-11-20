import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: "src/main.js",
      userscript: {
        name: "CookieChyan-JS",
        version: "0.3.1",
        description: "A Convenience Tool to Retrieve Cookies in Any Webpage",
        author: "Harry Huang",
        license: "MIT",
        match: ["https://*/*", "http://*/*"],
        grant: ["GM_setClipboard", "GM.cookie"],
        source: "https://github.com/isHarryh/CookieChyan-JS",
        namespace: "https://github.com/isHarryh/CookieChyan-JS",
        updateURL:
          "https://github.com/isHarryh/CookieChyan-JS/raw/refs/heads/main/dist/cookiechyan-js.user.js",
        downloadURL:
          "https://github.com/isHarryh/CookieChyan-JS/raw/refs/heads/main/dist/cookiechyan-js.user.js",
      },
      server: {
        mountGmApi: true,
      },
    }),
  ],
});
