// ==UserScript==
// @name         CookieChyan-JS
// @namespace    https://github.com/isHarryh/CookieChyan-JS
// @version      0.4.0
// @author       Harry Huang
// @description  A Convenience Tool to Retrieve Cookies in Any Webpage
// @license      MIT
// @source       https://github.com/isHarryh/CookieChyan-JS
// @downloadURL  https://github.com/isHarryh/CookieChyan-JS/raw/refs/heads/main/dist/cookiechyan-js.user.js
// @updateURL    https://github.com/isHarryh/CookieChyan-JS/raw/refs/heads/main/dist/cookiechyan-js.user.js
// @match        https://*/*
// @match        http://*/*
// @grant        GM.cookie
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        GM_setValue
// ==/UserScript==

(function () {
  'use strict';

  const d=new Set;const importCSS = async e=>{d.has(e)||(d.add(e),(t=>{typeof GM_addStyle=="function"?GM_addStyle(t):document.head.appendChild(document.createElement("style")).append(t);})(e));};

  const styleCss = ".cookie-chyan-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:#00000080;display:flex;justify-content:center;align-items:center;z-index:999999}.cookie-chyan-dialog{background-color:#fff;border-radius:8px;padding:30px;box-shadow:0 8px 32px #0000004d;min-width:600px;max-width:800px;max-height:90vh;overflow-y:auto}.cookie-chyan-dialog-title{font-family:Consolas;font-size:20px;font-weight:700;color:#333;margin-bottom:20px;text-align:center}.cookie-chyan-dialog-buttons{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cookie-chyan-dialog-button{padding:12px 20px;font-family:Consolas;font-size:16px;font-weight:500;color:#fff;background-color:#4caf50;border:none;border-radius:5px;cursor:pointer;transition:background-color .3s,transform .1s}.cookie-chyan-dialog-button:hover:not(:disabled){background-color:#45a049;transform:translateY(-1px)}.cookie-chyan-dialog-button:active:not(:disabled){transform:translateY(0)}.cookie-chyan-dialog-status{font-family:Consolas;font-size:14px;color:#888;margin-bottom:20px;text-align:center;min-height:20px}@keyframes fadeOut{0%{opacity:1}to{opacity:0}}.cookie-chyan-overlay.exit{animation:fadeOut .3s ease-out}.cookie-chyan-table-container{margin-top:30px;padding-top:20px;border-top:2px solid #e0e0e0}.cookie-chyan-table-title{font-family:Consolas;font-size:16px;font-weight:700;color:#555;margin-bottom:15px}.cookie-chyan-table-wrapper{max-height:300px;overflow-y:auto;border:1px solid #ddd;border-radius:4px;margin-bottom:10px}.cookie-chyan-table{width:100%;border-collapse:collapse;font-family:Consolas;font-size:14px}.cookie-chyan-table thead{background-color:#f5f5f5;position:sticky;top:0;z-index:1}.cookie-chyan-table th{padding:10px;text-align:left;font-size:14px;font-weight:600;color:#333;border-bottom:2px solid #ddd}.cookie-chyan-table td{padding:10px;font-size:13px;color:#333;border-bottom:1px solid #eee}.cookie-chyan-table-body tr:hover{background-color:#f9f9f9}.cookie-chyan-table-input{width:100%;padding:4px 8px;font-family:Consolas;font-size:13px;color:#333;border:1px solid #ccc;border-radius:3px;background-color:transparent;box-sizing:border-box}.cookie-chyan-table-input{outline:none;border-color:#4caf50}.cookie-chyan-table-input:focus{box-shadow:0 0 0 2px #4caf5033}.cookie-chyan-table-input-invalid{outline:none;border-color:#ef5350}.cookie-chyan-table-input-invalid:focus{border-color:#ef5350;box-shadow:0 0 0 2px #ef535033}.cookie-chyan-table-delete-btn{padding:6px 12px;font-family:Consolas;font-size:13px;color:#fff;background-color:#f44336;border:none;border-radius:3px;cursor:pointer;transition:background-color .2s}.cookie-chyan-table-delete-btn:hover{background-color:#d32f2f}.cookie-chyan-table-add-btn{width:100%;padding:10px;font-family:Consolas;font-size:14px;color:#fff;background-color:#2196f3;border:none;border-radius:4px;cursor:pointer;transition:background-color .2s}.cookie-chyan-table-add-btn:hover{background-color:#1976d2}.cookie-chyan-table-empty{text-align:center;color:#999;padding:20px;font-style:italic}";
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
  class ConfigHandler {
    constructor() {
      this.storageKey = "cookie_chyan_domain_mappings";
      this.defaultMappings = [];
    }
    async loadMappings() {
      try {
        if (typeof GM_getValue !== "undefined") {
          const stored = await GM_getValue(this.storageKey, null);
          if (stored) {
            const parsed = JSON.parse(stored);
            log(`🚚 Loaded ${parsed.length} domain mappings from storage`);
            return parsed;
          }
        }
      } catch (e) {
        log("⚠️ Failed to load mappings from storage: " + e.message);
      }
      return [...this.defaultMappings];
    }
    async saveMappings(mappings) {
      try {
        if (typeof GM_setValue !== "undefined") {
          const validMappings = mappings.map((m) => ({
            trigger: m.trigger.trim(),
            inject: m.inject.trim()
          })).filter((m) => this.isValidMapping(m.trigger, m.inject));
          await GM_setValue(this.storageKey, JSON.stringify(validMappings));
          log(`💾 Saved ${validMappings.length} domain mappings to storage`);
          return true;
        } else {
          log("⚠️ GM_setValue is not available");
          return false;
        }
      } catch (e) {
        log("❌ Failed to save mappings: " + e.message);
        return false;
      }
    }
isValidMapping(trigger, inject) {
      const trimmedTrigger = trigger.trim();
      const trimmedInject = inject.trim();
      if (!trimmedTrigger || !trimmedInject) {
        return false;
      }
      if (/\s/.test(trimmedTrigger) || /\s/.test(trimmedInject)) {
        return false;
      }
      return true;
    }
    createTableUI(mappings, onUpdate) {
      const container = document.createElement("div");
      container.className = "cookie-chyan-table-container";
      const title = document.createElement("div");
      title.className = "cookie-chyan-table-title";
      title.textContent = "Advanced Settings";
      container.appendChild(title);
      const tableWrapper = document.createElement("div");
      tableWrapper.className = "cookie-chyan-table-wrapper";
      const table = document.createElement("table");
      table.className = "cookie-chyan-table";
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      ["Additive Retrieval Target Domain", "Addition URL", "Actions"].forEach(
        (text) => {
          const th = document.createElement("th");
          th.textContent = text;
          headerRow.appendChild(th);
        }
      );
      thead.appendChild(headerRow);
      table.appendChild(thead);
      const tbody = document.createElement("tbody");
      tbody.className = "cookie-chyan-table-body";
      table.appendChild(tbody);
      tableWrapper.appendChild(table);
      container.appendChild(tableWrapper);
      const addButton = document.createElement("button");
      addButton.className = "cookie-chyan-table-add-btn";
      addButton.textContent = "+ Add New Mapping";
      addButton.addEventListener("click", () => {
        mappings.push({ trigger: "", inject: "" });
        this.renderTableRows(tbody, mappings, onUpdate);
      });
      container.appendChild(addButton);
      this.renderTableRows(tbody, mappings, onUpdate);
      return container;
    }
    renderTableRows(tbody, mappings, onUpdate) {
      tbody.innerHTML = "";
      mappings.forEach((mapping, index) => {
        const row = document.createElement("tr");
        const updateValidation = () => {
          const trimmedTrigger = mapping.trigger.trim();
          const trimmedInject = mapping.inject.trim();
          this.isValidMapping(mapping.trigger, mapping.inject);
          if (!trimmedTrigger || /\s/.test(trimmedTrigger)) {
            triggerInput.classList.add("cookie-chyan-table-input-invalid");
          } else {
            triggerInput.classList.remove("cookie-chyan-table-input-invalid");
          }
          if (!trimmedInject || /\s/.test(trimmedInject)) {
            injectInput.classList.add("cookie-chyan-table-input-invalid");
          } else {
            injectInput.classList.remove("cookie-chyan-table-input-invalid");
          }
        };
        const triggerCell = document.createElement("td");
        const triggerInput = document.createElement("input");
        triggerInput.type = "text";
        triggerInput.className = "cookie-chyan-table-input";
        triggerInput.value = mapping.trigger;
        triggerInput.placeholder = "e.g., example.com";
        triggerInput.addEventListener("input", (e) => {
          mappings[index].trigger = e.target.value;
          updateValidation();
          onUpdate(mappings);
        });
        triggerCell.appendChild(triggerInput);
        row.appendChild(triggerCell);
        const injectCell = document.createElement("td");
        const injectInput = document.createElement("input");
        injectInput.type = "text";
        injectInput.className = "cookie-chyan-table-input";
        injectInput.value = mapping.inject;
        injectInput.placeholder = "e.g., https://example.com/";
        injectInput.addEventListener("input", (e) => {
          mappings[index].inject = e.target.value;
          updateValidation();
          onUpdate(mappings);
        });
        injectCell.appendChild(injectInput);
        row.appendChild(injectCell);
        const actionsCell = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.className = "cookie-chyan-table-delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
          mappings.splice(index, 1);
          this.renderTableRows(tbody, mappings, onUpdate);
          onUpdate(mappings);
        });
        actionsCell.appendChild(deleteButton);
        row.appendChild(actionsCell);
        updateValidation();
        tbody.appendChild(row);
      });
      if (mappings.length === 0) {
        const emptyRow = document.createElement("tr");
        const emptyCell = document.createElement("td");
        emptyCell.colSpan = 3;
        emptyCell.className = "cookie-chyan-table-empty";
        emptyCell.textContent = "No mappings configured. Click 'Add New Mapping' to create one.";
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
      }
    }
  }
  (function() {
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
                localStorage: items
              },
              "*"
            );
          } catch (e) {
          }
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
      if (document.querySelector(".cookie-chyan-overlay")) {
        log("🙂 CookieChyan-JS dialog is already open.");
        return;
      }
      injectCrossDomainFrames();
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
          const allBtns = buttonContainer.querySelectorAll("button");
          allBtns.forEach((b) => b.disabled = true);
          const ok = await handleAction(act.action, statusDiv);
          statusDiv.style.color = ok ? "green" : "red";
          if (ok) {
            setTimeout(() => {
              overlay.classList.add("exit");
              setTimeout(() => overlay.remove(), 250);
            }, 250);
          } else {
            allBtns.forEach((b) => b.disabled = false);
          }
        });
        buttonContainer.appendChild(btn);
      });
      dialog.appendChild(buttonContainer);
      const tableUI = configHandler.createTableUI(
        await configHandler.loadMappings(),
        async (updatedMappings) => {
          const validMappings = updatedMappings.filter(
            (m) => m.trigger.trim() && m.inject.trim()
          );
          await configHandler.saveMappings(validMappings);
          log(`✏️ Updated domain mappings: ${validMappings.length} entries`);
        }
      );
      dialog.appendChild(tableUI);
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
        })(c.sameSite)
      });
      if (typeof GM !== "undefined" && typeof GM.cookie !== "undefined") {
        try {
          const list = await GM.cookie.list({ url: window.location.href });
          if (Array.isArray(list) && list.length) {
            log("😊 Retrieved cookies via GM API");
            return list.map(normalize);
          }
        } catch {
        }
      }
      log("😕 Invoke GM_Cookie list failed, using fallback.");
      const raw = document.cookie || "";
      if (!raw) return [];
      return raw.split(";").map((p) => {
        const [name, value] = p.trim().split("=");
        return normalize({
          name,
          value: value || "",
          domain: window.location.hostname
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
            localStorage: localItems
          });
        } catch (e) {
        }
        const messageHandler = (event) => {
          if (event.data && event.data.type === "COOKIE_CHYAN_STORAGE_RESPONSE") {
            const exists = results.some((r) => r.origin === event.data.origin);
            if (!exists) {
              log(`📦 Received storage data from: ${event.data.origin}`);
              results.push({
                origin: event.data.origin,
                localStorage: event.data.localStorage
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
          } catch (e) {
          }
        });
        setTimeout(() => {
          window.removeEventListener("message", messageHandler);
          resolve(results);
        }, 500);
      });
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