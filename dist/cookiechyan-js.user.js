// ==UserScript==
// @name         CookieChyan-JS
// @namespace    https://github.com/isHarryh/CookieChyan-JS
// @version      0.2.0
// @author       Harry Huang
// @description  A Convenience Tool to Retrieve Cookies in Any Webpage
// @license      MIT
// @source       https://github.com/isHarryh/CookieChyan-JS
// @match        https://*/*
// @match        http://*/*
// @grant        GM_addStyle
// @grant        GM_cookie
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  'use strict';

  const d=new Set;const importCSS = async e=>{d.has(e)||(d.add(e),(t=>{typeof GM_addStyle=="function"?GM_addStyle(t):document.head.appendChild(document.createElement("style")).append(t);})(e));};

  const styleCss = "@keyframes cookieChyanSlideIn{0%{transform:translate(400px);opacity:0}to{transform:translate(0);opacity:1}}@keyframes cookieChyanSlideOut{0%{transform:translate(0);opacity:1}to{transform:translate(400px);opacity:0}}.cookie-chyan-notification{position:fixed;top:20px;right:20px;padding:15px 25px;color:#fff;border-radius:5px;box-shadow:0 4px 6px #0000001a;font-family:Consolas;font-size:14px;font-weight:700;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}.cookie-chyan-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:#00000080;display:flex;justify-content:center;align-items:center;z-index:999999}.cookie-chyan-dialog{background-color:#fff;border-radius:8px;padding:30px;box-shadow:0 8px 32px #0000004d;min-width:400px}.cookie-chyan-dialog-title{font-family:Consolas;font-size:20px;font-weight:700;color:#333;margin-bottom:20px;text-align:center}.cookie-chyan-dialog-buttons{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cookie-chyan-dialog-button{padding:12px 20px;font-family:Consolas;font-size:16px;font-weight:500;color:#fff;background-color:#4caf50;border:none;border-radius:5px;cursor:pointer;transition:background-color .3s,transform .1s}.cookie-chyan-dialog-button:hover:not(:disabled){background-color:#45a049;transform:translateY(-1px)}.cookie-chyan-dialog-button:active:not(:disabled){transform:translateY(0)}";
  importCSS(styleCss);
  function log(msg) {
    console.log(`[CookieChyan-JS] ${msg}`);
  }
  (function() {
    function onCopyToClipboardSuccess() {
      log("✅ Copied cookies to clipboard successfully.");
      showNotification("Cookies successfully copied!", "#27b92788");
    }
    function onCopyToClipboardError(err) {
      log("❌ Failed to copy cookies to clipboard, details show below.");
      console.error(err);
      showNotification("Cookies failed to copy!", "#cc2a2a88");
    }
    function copyToClipboardGM(text) {
      if (typeof GM_setClipboard !== "undefined") {
        log("📄 Copying cookies to clipboard via GM API");
        GM_setClipboard(text, "text");
        onCopyToClipboardSuccess();
        return true;
      }
      return false;
    }
    function copyToClipboardNav(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        log("📄 Copying cookies to clipboard via Navigator API");
        navigator.clipboard.writeText(text).then(() => {
          onCopyToClipboardSuccess();
        }).catch((err) => {
          onCopyToClipboardError(err);
        });
        return true;
      }
      return false;
    }
    function showNotification(message, color) {
      const notification = document.createElement("div");
      notification.textContent = message;
      notification.className = "cookie-chyan-notification";
      notification.style.backgroundColor = color;
      notification.style.animation = "cookieChyanSlideIn 0.3s ease-out";
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.animation = "cookieChyanSlideOut 0.3s ease-out";
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 200);
      }, 4e3);
    }
    function showFormatDialog() {
      const buttons = [
        { text: "Cookie String", enabled: true, format: "cookie-string" },
        { text: "Cookie JSON", enabled: true, format: "cookie-json" },
        { text: "Origins JSON", enabled: false, format: "origins-json" },
        { text: "State JSON", enabled: false, format: "state-json" }
      ];
      const overlay = document.createElement("div");
      overlay.className = "cookie-chyan-overlay";
      const dialog = document.createElement("div");
      dialog.className = "cookie-chyan-dialog";
      const title = document.createElement("div");
      title.className = "cookie-chyan-dialog-title";
      title.textContent = "Select Cookie Format";
      dialog.appendChild(title);
      const buttonContainer = document.createElement("div");
      buttonContainer.className = "cookie-chyan-dialog-buttons";
      buttons.forEach((btn) => {
        const button = document.createElement("button");
        button.className = "cookie-chyan-dialog-button";
        button.textContent = btn.text;
        button.disabled = !btn.enabled;
        if (!btn.enabled) {
          button.style.backgroundColor = "#cccccc";
          button.style.cursor = "not-allowed";
        }
        button.addEventListener("click", () => {
          if (btn.enabled) {
            overlay.remove();
            handleCookieCopy(btn.format);
          }
        });
        buttonContainer.appendChild(button);
      });
      dialog.appendChild(buttonContainer);
      overlay.appendChild(dialog);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      });
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          overlay.remove();
          document.removeEventListener("keydown", handleEscape);
        }
      };
      document.addEventListener("keydown", handleEscape);
      document.body.appendChild(overlay);
    }
    async function handleCookieCopy(format) {
      let cookieList = null;
      if (typeof GM_Cookie !== "undefined") {
        try {
          log("🔍 Fetching all cookies (including HttpOnly)");
          cookieList = await GM_Cookie.list({ url: window.location.href });
          if (cookieList && cookieList.length > 0) {
            const httpOnlyCount = cookieList.filter((c) => c.httpOnly).length;
            log(
              `✅ Got ${cookieList.length} cookies (${httpOnlyCount} HttpOnly)`
            );
            const formattedCookies = formatCookies(cookieList, format);
            copyToClipboardGM(formattedCookies) || copyToClipboardNav(formattedCookies);
            return;
          }
        } catch (err) {
          log("⚠️ GM.cookie API failed, falling back to document.cookie");
          console.error(err);
        }
      }
      log("🔍 Fetching cookies via document.cookie (HttpOnly excluded)");
      const cookies = document.cookie;
      if (cookies) {
        const formattedCookies = formatCookies(cookies, format);
        copyToClipboardGM(formattedCookies) || copyToClipboardNav(formattedCookies);
      } else {
        log("🚮 No cookies found.");
        showNotification("No cookies found.", "#bd741488");
      }
    }
    function normalizeCookie(cookie) {
      const defaultExpires = Math.floor(Date.now() / 1e3) + 7 * 24 * 3600;
      return {
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        expires: cookie.expirationDate || defaultExpires,
        httpOnly: cookie.httpOnly || false,
        secure: cookie.secure || false,
        sameSite: cookie.sameSite || "Lax"
      };
    }
    function formatCookies(cookieData, format) {
      if (format === "cookie-string") {
        if (typeof cookieData === "string") {
          return cookieData;
        } else if (Array.isArray(cookieData)) {
          return cookieData.map((c) => `${c.name}=${c.value}`).join("; ");
        }
      } else if (format === "cookie-json") {
        let cookieList;
        if (typeof cookieData === "string") {
          cookieList = parseCookiesFromString(cookieData);
        } else if (Array.isArray(cookieData)) {
          cookieList = cookieData;
        } else {
          return "[]";
        }
        return JSON.stringify(cookieList.map(normalizeCookie), null, 2);
      }
      return cookieData;
    }
    function parseCookiesFromString(cookieString) {
      if (!cookieString) {
        return [];
      }
      const cookiePairs = cookieString.split(";");
      const cookieArray = [];
      cookiePairs.forEach((pair) => {
        const [name, value] = pair.trim().split("=").map((s) => s.trim());
        if (name) {
          cookieArray.push({
            name,
            value: value || "",
            domain: window.location.hostname,
            expirationDate: null,
            httpOnly: null,
            secure: null,
            sameSite: null
          });
        }
      });
      return cookieArray;
    }
    async function handleKeyPress(event) {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "c") {
        event.preventDefault();
        showFormatDialog();
      }
    }
    document.addEventListener("keydown", handleKeyPress);
    log("🚀 CookieChyan-JS script successfully loaded!");
  })();

})();