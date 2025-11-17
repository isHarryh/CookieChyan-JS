// ==UserScript==
// @name         CookieChyan-JS
// @namespace    https://github.com/isHarryh/CookieChyan-JS
// @version      0.3.1
// @author       Harry Huang
// @description  A Convenience Tool to Retrieve Cookies in Any Webpage
// @license      MIT
// @source       https://github.com/isHarryh/CookieChyan-JS
// @downloadURL  https://github.com/isHarryh/CookieChyan-JS/raw/refs/heads/main/dist/cookiechyan-js.user.js
// @updateURL    https://github.com/isHarryh/CookieChyan-JS/raw/refs/heads/main/dist/cookiechyan-js.user.js
// @match        https://*/*
// @match        http://*/*
// @grant        GM_addStyle
// @grant        GM_cookie
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  'use strict';

  const d=new Set;const importCSS = async e=>{d.has(e)||(d.add(e),(t=>{typeof GM_addStyle=="function"?GM_addStyle(t):document.head.appendChild(document.createElement("style")).append(t);})(e));};

  const styleCss = ".cookie-chyan-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:#00000080;display:flex;justify-content:center;align-items:center;z-index:999999}.cookie-chyan-dialog{background-color:#fff;border-radius:8px;padding:30px;box-shadow:0 8px 32px #0000004d;min-width:400px}.cookie-chyan-dialog-title{font-family:Consolas;font-size:20px;font-weight:700;color:#333;margin-bottom:20px;text-align:center}.cookie-chyan-dialog-buttons{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cookie-chyan-dialog-button{padding:12px 20px;font-family:Consolas;font-size:16px;font-weight:500;color:#fff;background-color:#4caf50;border:none;border-radius:5px;cursor:pointer;transition:background-color .3s,transform .1s}.cookie-chyan-dialog-button:hover:not(:disabled){background-color:#45a049;transform:translateY(-1px)}.cookie-chyan-dialog-button:active:not(:disabled){transform:translateY(0)}@keyframes fadeOut{0%{opacity:1}to{opacity:0}}.cookie-chyan-overlay.exit{animation:fadeOut .3s ease-out}";
  importCSS(styleCss);
  function log(msg) {
    console.log(`[CookieChyan-JS] ${msg}`);
  }
  function copyToClipboardGM(text) {
    if (typeof GM_setClipboard !== "undefined") {
      log("📄 Copying cookies to clipboard via GM API");
      GM_setClipboard(text, "text");
      return true;
    }
    return false;
  }
  function copyToClipboardNav(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      log("📄 Copying cookies to clipboard via Navigator API");
      return navigator.clipboard.writeText(text).then(() => {
        return true;
      }).catch((err) => {
        log("❌ Failed to copy cookies to clipboard, details show below.");
        console.error(err);
        return false;
      });
    }
    return false;
  }
  (function() {
    function showActionsDialog() {
      if (document.querySelector(".cookie-chyan-overlay")) {
        log("🙂 CookieChyan-JS dialog is already open.");
        return;
      }
      const actions = [
        { text: "Cookie String", action: "cookie-string" },
        { text: "Cookie JSON", action: "cookie-json" },
        { text: "Origins JSON", action: "origins-json" },
        { text: "State JSON", action: "state-json" }
      ];
      const overlay = document.createElement("div");
      overlay.className = "cookie-chyan-overlay";
      const dialog = document.createElement("div");
      dialog.className = "cookie-chyan-dialog";
      const title = document.createElement("div");
      title.className = "cookie-chyan-dialog-title";
      title.textContent = "Select Format to Copy";
      dialog.appendChild(title);
      const statusDiv = document.createElement("div");
      statusDiv.className = "cookie-chyan-dialog-status";
      dialog.appendChild(statusDiv);
      const buttonContainer = document.createElement("div");
      buttonContainer.className = "cookie-chyan-dialog-buttons";
      actions.forEach((act) => {
        const btn = document.createElement("button");
        btn.className = "cookie-chyan-dialog-button";
        btn.textContent = act.text;
        btn.addEventListener("click", async () => {
          const ok = await handleAction(act.action, statusDiv);
          statusDiv.style.color = ok ? "green" : "red";
          if (ok) {
            setTimeout(() => {
              overlay.classList.add("exit");
              setTimeout(() => overlay.remove(), 300);
            }, 1e3);
          }
        });
        buttonContainer.appendChild(btn);
      });
      dialog.appendChild(buttonContainer);
      overlay.appendChild(dialog);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          overlay.remove();
          document.removeEventListener("keydown", escHandler);
        }
      });
      document.body.appendChild(overlay);
    }
    async function handleAction(type, statusEl) {
      try {
        let output = "";
        if (type === "cookie-string") {
          output = getCookieString();
        } else if (type === "cookie-json") {
          const cookies = await getCookiesData();
          output = JSON.stringify(cookies, null, 2);
        } else if (type === "origins-json") {
          const origins = getOriginsData();
          output = JSON.stringify(origins, null, 2);
        } else if (type === "state-json") {
          const cookies = await getCookiesData();
          const origins = getOriginsData();
          output = JSON.stringify({ cookies, origins }, null, 2);
        } else {
          log("❌ Unsupported copy format: " + type);
          statusEl.textContent = "Unsupported action.";
          return false;
        }
        const ok = copyToClipboardGM(output) || await copyToClipboardNav(output);
        log("✅ Copy action '" + type + "' completed, okay=" + ok);
        statusEl.textContent = ok ? "Copied successfully." : "Copy failed.";
        return ok;
      } catch (e) {
        log("❌ Handle copy action failed, details show below.");
        console.error(e);
        statusEl.textContent = "Error: " + e.message;
        return false;
      }
    }
    function getCookieString() {
      return document.cookie ? document.cookie : "";
    }
    async function getCookiesData() {
      const defaultExpires = Math.floor(Date.now() / 1e3) + 7 * 24 * 3600;
      const normalize = (c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path || "/",
        expires: c.expirationDate || defaultExpires,
        httpOnly: !!c.httpOnly,
        secure: !!c.secure,
        sameSite: c.sameSite || "Lax"
      });
      if (typeof GM_Cookie !== "undefined") {
        try {
          const list = await GM_Cookie.list({ url: window.location.href });
          if (Array.isArray(list) && list.length) {
            return list.map(normalize);
          }
        } catch (e) {
          log("❌ Invoke GM_Cookie list failed, using fallback.");
        }
      }
      const raw = document.cookie || "";
      if (!raw) return [];
      return raw.split(";").map((p) => {
        const [name, value] = p.trim().split("=");
        return normalize({
          name,
          value: value || "",
          domain: window.location.hostname,
          path: "/",
          expirationDate: null,
          httpOnly: false,
          secure: false,
          sameSite: "Lax"
        });
      });
    }
    function getOriginsData() {
      const items = [];
      try {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          items.push({ name: k, value: window.localStorage.getItem(k) });
        }
      } catch (e) {
        log("❌ Read localStorage failed, details show below.");
        console.error(e);
      }
      return [
        {
          origin: window.location.origin,
          localStorage: items
        }
      ];
    }
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        showActionsDialog();
      }
    });
    window.CookieChyanJS = {
      showActionsDialog,
      handleAction,
      getCookieString,
      getCookiesData,
      getOriginsData
    };
    log("🚀 CookieChyan-JS script successfully loaded!");
  })();

})();