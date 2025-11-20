import "./style.css";
import { log, copyToClipboardGM, copyToClipboardNav } from "./utils.js";

(function () {
  "use strict";

  function showActionsDialog() {
    // Prevent multiple dialogs
    if (document.querySelector(".cookie-chyan-overlay")) {
      log("🙂 CookieChyan-JS dialog is already open.");
      return;
    }

    const actions = [
      { text: "Cookie String", action: "cookie-string" },
      { text: "Cookie JSON", action: "cookie-json" },
      { text: "Origins JSON", action: "origins-json" },
      { text: "State JSON", action: "state-json" },
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
    title.textContent = "Select Format to Copy";
    dialog.appendChild(title);

    // Create status div
    const statusDiv = document.createElement("div");
    statusDiv.className = "cookie-chyan-dialog-status";
    dialog.appendChild(statusDiv);

    // Create button container
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
          }, 1000);
        }
      });
      buttonContainer.appendChild(btn);
    });

    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);

    // Overlay click handler
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // Escape key handler
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

      const ok =
        copyToClipboardGM(output) || (await copyToClipboardNav(output));
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
    // Note that this is a fast path; accurate cookie retrieval is in getCookiesData.
    return document.cookie ? document.cookie : "";
  }

  async function getCookiesData() {
    const defaultExpires = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
    const normalize = (c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path || "/",
      expires: c.expirationDate || defaultExpires,
      httpOnly: !!c.httpOnly,
      secure: !!c.secure,
      sameSite: ((s) => {
        if (!s) return "Lax";
        switch (s.toLowerCase()) {
          case "none":
            return "None";
          case "strict":
            return "Strict";
          default:
            return "Lax";
        }
      })(c.sameSite),
    });

    if (typeof GM !== "undefined" && typeof GM.cookie !== "undefined") {
      try {
        const list = await GM.cookie.list({ url: window.location.href });
        if (Array.isArray(list) && list.length) {
          log("😊 Retrieved cookies via GM API");
          return list.map(normalize);
        }
      } catch {}
    }

    log("😕 Invoke GM_Cookie list failed, using fallback.");

    // Fallback
    const raw = document.cookie || "";
    if (!raw) return [];
    return raw.split(";").map((p) => {
      const [name, value] = p.trim().split("=");
      return normalize({
        name: name,
        value: value || "",
        domain: window.location.hostname,
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
        localStorage: items,
      },
    ];
  }

  document.addEventListener("keydown", (e) => {
    // Ctrl + Alt + C
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      showActionsDialog();
    }
  });

  // Expose to window (for console usage)
  window.CookieChyanJS = {
    showActionsDialog,
    handleAction,
    getCookieString,
    getCookiesData,
    getOriginsData,
  };

  log("🚀 CookieChyan-JS script successfully loaded!");
})();
