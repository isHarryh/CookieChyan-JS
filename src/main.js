import "./style.css";
import { log, copyToClipboardGM, copyToClipboardNav } from "./utils.js";

(function () {
  "use strict";

  function showFormatDialog() {
    const buttons = [
      { text: "Cookie String", format: "cookie-string" },
      { text: "Cookie JSON", format: "cookie-json" },
      { text: "Origins JSON", format: "origins-json" },
      { text: "State JSON", format: "state-json" },
    ];

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "cookie-chyan-overlay";

    // Create dialog
    const dialog = document.createElement("div");
    dialog.className = "cookie-chyan-dialog";

    // Create title
    const title = document.createElement("div");
    title.className = "cookie-chyan-dialog-title";
    title.textContent = "Select Cookie Format";
    dialog.appendChild(title);

    // Create status div
    const statusDiv = document.createElement("div");
    statusDiv.className = "cookie-chyan-dialog-status";
    dialog.appendChild(statusDiv);

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "cookie-chyan-dialog-buttons";

    // Create buttons
    buttons.forEach((btn) => {
      const button = document.createElement("button");
      button.className = "cookie-chyan-dialog-button";
      button.textContent = btn.text;

      button.addEventListener("click", async () => {
        const success = await handleCookieCopy(btn.format);
        if (success) {
          statusDiv.textContent = "Cookies successfully copied!";
          statusDiv.style.color = "green";
        } else {
          statusDiv.textContent = "Failed to copy cookies.";
          statusDiv.style.color = "red";
        }
      });

      buttonContainer.appendChild(button);
    });

    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);

    // Close dialog when clicking overlay
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    // Close dialog with Escape key
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

    // Try to get cookies via GM.cookie API (supports HttpOnly)
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
          const success =
            copyToClipboardGM(formattedCookies) ||
            (await copyToClipboardNav(formattedCookies));
          return success;
        }
      } catch (err) {
        log("⚠️ GM.cookie API failed, falling back to document.cookie");
        console.error(err);
      }
    }

    // Fallback to document.cookie (cannot get HttpOnly cookies)
    log("🔍 Fetching cookies via document.cookie (HttpOnly excluded)");
    const cookies = document.cookie;
    if (cookies) {
      const formattedCookies = formatCookies(cookies, format);
      const success =
        copyToClipboardGM(formattedCookies) ||
        (await copyToClipboardNav(formattedCookies));
      return success;
    } else {
      log("🚮 No cookies found.");
      return false;
    }
  }

  function normalizeCookie(cookie) {
    // Centralized default values
    const defaultExpires = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;

    return {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      expires: cookie.expirationDate || defaultExpires,
      httpOnly: cookie.httpOnly || false,
      secure: cookie.secure || false,
      sameSite: cookie.sameSite || "Lax",
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
        // Parse from document.cookie string
        cookieList = parseCookiesFromString(cookieData);
      } else if (Array.isArray(cookieData)) {
        // Already have cookie list from GM_cookie API
        cookieList = cookieData;
      } else {
        return "[]";
      }

      return JSON.stringify(cookieList.map(normalizeCookie), null, 2);
    } else if (format === "origins-json") {
      const origin = window.location.origin;
      const localStorage = getLocalStorage();

      const originsData = [
        {
          origin: origin,
          localStorage: localStorage,
        },
      ];

      return JSON.stringify(originsData, null, 2);
    } else if (format === "state-json") {
      // Get cookies
      let cookieList;
      if (typeof cookieData === "string") {
        cookieList = parseCookiesFromString(cookieData);
      } else if (Array.isArray(cookieData)) {
        cookieList = cookieData;
      } else {
        cookieList = [];
      }

      const normalizedCookies = cookieList.map(normalizeCookie);

      // Get origins data
      const origin = window.location.origin;
      const localStorage = getLocalStorage();
      const originsData = [
        {
          origin: origin,
          localStorage: localStorage,
        },
      ];

      // Combine into state object
      const stateData = {
        cookies: normalizedCookies,
        origins: originsData,
      };

      return JSON.stringify(stateData, null, 2);
    }
    log("❌ Unsupported format requested:", format);
    throw new Error("Unsupported format: " + format);
  }

  function getLocalStorage() {
    const storageItems = [];

    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        const value = window.localStorage.getItem(key);
        storageItems.push({
          name: key,
          value: value,
        });
      }
    } catch (err) {
      log("⚠️ Failed to read localStorage:", err);
    }

    return storageItems;
  }

  function parseCookiesFromString(cookieString) {
    if (!cookieString) {
      return [];
    }

    const cookiePairs = cookieString.split(";");
    const cookieArray = [];

    cookiePairs.forEach((pair) => {
      const [name, value] = pair
        .trim()
        .split("=")
        .map((s) => s.trim());

      if (name) {
        cookieArray.push({
          name: name,
          value: value || "",
          domain: window.location.hostname,
          expirationDate: null,
          httpOnly: null,
          secure: null,
          sameSite: null,
        });
      }
    });

    return cookieArray;
  }

  async function handleKeyPress(event) {
    // Ctrl + Alt + C
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      showFormatDialog();
    }
  }

  document.addEventListener("keydown", handleKeyPress);

  log("🚀 CookieChyan-JS script successfully loaded!");
})();
