// ==UserScript==
// @name         CookieChyan-JS
// @namespace    https://github.com/isHarryh/CookieChyan-JS
// @version      0.1.0
// @author       Harry Huang
// @description  A Convenience Tool to Retrieve Cookies in Any Webpage
// @license      MIT
// @source       https://github.com/isHarryh/CookieChyan-JS
// @match        https://*/*
// @match        http://*/*
// @grant        GM.cookie
// @grant        GM_addStyle
// @grant        GM_cookie
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  'use strict';

  const d=new Set;const importCSS = async e=>{d.has(e)||(d.add(e),(t=>{typeof GM_addStyle=="function"?GM_addStyle(t):document.head.appendChild(document.createElement("style")).append(t);})(e));};

  const styleCss = "@keyframes cookieChyanSlideIn{0%{transform:translate(400px);opacity:0}to{transform:translate(0);opacity:1}}@keyframes cookieChyanSlideOut{0%{transform:translate(0);opacity:1}to{transform:translate(400px);opacity:0}}.cookie-chyan-notification{position:fixed;top:20px;right:20px;padding:15px 25px;color:#fff;border-radius:5px;box-shadow:0 4px 6px #0000001a;font-family:Consolas;font-size:14px;font-weight:700;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}";
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
    async function handleKeyPress(event) {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "c") {
        event.preventDefault();
        let cookieList = null;
        if (typeof GM !== "undefined" && GM.cookie && typeof GM.cookie.list === "function") {
          try {
            log("🔍 Fetching all cookies (including HttpOnly)");
            cookieList = await GM.cookie.list({ url: window.location.href });
            if (cookieList && cookieList.length > 0) {
              const httpOnlyCount = cookieList.filter((c) => c.httpOnly).length;
              const cookiesString = cookieList.map((c) => `${c.name}=${c.value}`).join("; ");
              log(`✅ Got ${cookieList.length} cookies (${httpOnlyCount} HttpOnly)`);
              copyToClipboardGM(cookiesString) || copyToClipboardNav(cookiesString);
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
          copyToClipboardGM(cookies) || copyToClipboardNav(cookies);
        } else {
          log("🚮 No cookies found.");
          showNotification("No cookies found.", "#bd741488");
        }
      }
    }
    document.addEventListener("keydown", handleKeyPress);
    log("🚀 CookieChyan-JS script successfully loaded!");
  })();

})();