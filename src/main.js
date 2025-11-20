import "./style.css";
import { log, copyToClipboardGM, copyToClipboardNav } from "./utils.js";
import { ConfigHandler } from "./config.js";

(function () {
  "use strict";

  // Iframes only
  if (window.top !== window.self) {
    window.addEventListener("message", (event) => {
      if (event.data && event.data.type === "COOKIE_CHYAN_GET_STORAGE") {
        try {
          const items = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            items.push({ name: k, value: window.localStorage.getItem(k) });
          }
          window.top.postMessage(
            {
              type: "COOKIE_CHYAN_STORAGE_RESPONSE",
              origin: window.location.origin,
              localStorage: items,
            },
            "*"
          );
        } catch (e) {}
      }
    });
    return;
  }

  const injectedUrls = new Set();
  const configHandler = new ConfigHandler();

  async function injectCrossDomainFrames() {
    const hostname = window.location.hostname;

    (await configHandler.loadMappings()).forEach((rule) => {
      if (hostname.includes(rule.trigger) && !injectedUrls.has(rule.inject)) {
        log(`🎥 Trigger matched: ${rule.trigger}, injecting ${rule.inject}`);
        try {
          const iframe = document.createElement("iframe");
          iframe.src = rule.inject;
          iframe.style.display = "none";
          document.body.appendChild(iframe);
          injectedUrls.add(rule.inject);
        } catch (e) {
          log(`❌ Failed to inject iframe for ${rule.inject}: ${e.message}`);
        }
      }
    });
  }

  async function showActionsDialog() {
    // Prevent multiple dialogs
    if (document.querySelector(".cookie-chyan-overlay")) {
      log("🙂 CookieChyan-JS dialog is already open.");
      return;
    }

    // Inject iframes
    injectCrossDomainFrames();

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
        const allBtns = buttonContainer.querySelectorAll("button");
        allBtns.forEach((b) => (b.disabled = true));

        const ok = await handleAction(act.action, statusDiv);
        statusDiv.style.color = ok ? "green" : "red";

        if (ok) {
          setTimeout(() => {
            overlay.classList.add("exit");
            setTimeout(() => overlay.remove(), 250);
          }, 250);
        } else {
          allBtns.forEach((b) => (b.disabled = false));
        }
      });
      buttonContainer.appendChild(btn);
    });

    dialog.appendChild(buttonContainer);

    // Add table UI
    const tableUI = configHandler.createTableUI(
      await configHandler.loadMappings(),
      async (updatedMappings) => {
        // Filter out empty mappings
        const validMappings = updatedMappings.filter(
          (m) => m.trigger.trim() && m.inject.trim()
        );
        await configHandler.saveMappings(validMappings);
        log(`✏️ Updated domain mappings: ${validMappings.length} entries`);
      }
    );
    dialog.appendChild(tableUI);

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
        statusEl.textContent = "Scanning...";
        const origins = await getOriginsData();
        output = JSON.stringify(origins, null, 2);
      } else if (type === "state-json") {
        statusEl.textContent = "Scanning...";
        const cookies = await getCookiesData();
        const origins = await getOriginsData();
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

  async function getOriginsData() {
    return new Promise((resolve) => {
      const results = [];

      try {
        const localItems = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          localItems.push({ name: k, value: window.localStorage.getItem(k) });
        }
        results.push({
          origin: window.location.origin,
          localStorage: localItems,
        });
      } catch (e) {}

      const messageHandler = (event) => {
        if (event.data && event.data.type === "COOKIE_CHYAN_STORAGE_RESPONSE") {
          const exists = results.some((r) => r.origin === event.data.origin);
          if (!exists) {
            log(`📦 Received storage data from: ${event.data.origin}`);
            results.push({
              origin: event.data.origin,
              localStorage: event.data.localStorage,
            });
          }
        }
      };

      window.addEventListener("message", messageHandler);

      const frames = document.querySelectorAll("iframe");
      log(`📡 Broadcasting storage request to ${frames.length} frames...`);

      frames.forEach((f) => {
        try {
          f.contentWindow.postMessage(
            { type: "COOKIE_CHYAN_GET_STORAGE" },
            "*"
          );
        } catch (e) {}
      });

      setTimeout(() => {
        window.removeEventListener("message", messageHandler);
        resolve(results);
      }, 500);
    });
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
