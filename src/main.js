import "./style.css";
import { log } from "./utils.js";

(function () {
  "use strict";

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
      navigator.clipboard
        .writeText(text)
        .then(() => {
          onCopyToClipboardSuccess();
        })
        .catch((err) => {
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
    }, 4000);
  }

  function showFormatDialog() {
    const buttons = [
      { text: "Cookie String", enabled: true, format: "cookie-string" },
      { text: "Cookie JSON", enabled: true, format: "cookie-json" },
      { text: "Origins JSON", enabled: false, format: "origins-json" },
      { text: "State JSON", enabled: false, format: "state-json" },
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

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "cookie-chyan-dialog-buttons";

    // Create buttons
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
          copyToClipboardGM(formattedCookies) ||
            copyToClipboardNav(formattedCookies);
          return;
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
      copyToClipboardGM(formattedCookies) ||
        copyToClipboardNav(formattedCookies);
    } else {
      log("🚮 No cookies found.");
      showNotification("No cookies found.", "#bd741488");
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
    }
    // TODO: Implement other formats
    return cookieData;
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
