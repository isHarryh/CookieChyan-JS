import { log } from "./utils.js";

export class ConfigHandler {
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
        // Trim whitespace and filter out invalid entries
        const validMappings = mappings
          .map((m) => ({
            trigger: m.trigger.trim(),
            inject: m.inject.trim(),
          }))
          .filter((m) => this.isValidMapping(m.trigger, m.inject));

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

  /**
   * Validate mapping entry
   * Invalid if: empty after trim, or contains whitespace after trim
   */
  isValidMapping(trigger, inject) {
    const trimmedTrigger = trigger.trim();
    const trimmedInject = inject.trim();

    // Empty check
    if (!trimmedTrigger || !trimmedInject) {
      return false;
    }

    // Whitespace check (contains space, tab, newline, etc.)
    if (/\s/.test(trimmedTrigger) || /\s/.test(trimmedInject)) {
      return false;
    }

    return true;
  }

  createTableUI(mappings, onUpdate) {
    const container = document.createElement("div");
    container.className = "cookie-chyan-table-container";

    // Title
    const title = document.createElement("div");
    title.className = "cookie-chyan-table-title";
    title.textContent = "Advanced Settings";
    container.appendChild(title);

    // Table wrapper
    const tableWrapper = document.createElement("div");
    tableWrapper.className = "cookie-chyan-table-wrapper";

    const table = document.createElement("table");
    table.className = "cookie-chyan-table";

    // Header
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

    // Body
    const tbody = document.createElement("tbody");
    tbody.className = "cookie-chyan-table-body";
    table.appendChild(tbody);

    tableWrapper.appendChild(table);
    container.appendChild(tableWrapper);

    // Add button
    const addButton = document.createElement("button");
    addButton.className = "cookie-chyan-table-add-btn";
    addButton.textContent = "+ Add New Mapping";
    addButton.addEventListener("click", () => {
      mappings.push({ trigger: "", inject: "" });
      this.renderTableRows(tbody, mappings, onUpdate);
    });
    container.appendChild(addButton);

    // Render initial rows
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
        const isEmpty = !trimmedTrigger || !trimmedInject;
        const isValid = this.isValidMapping(mapping.trigger, mapping.inject);

        // Update input background color
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

        // Delete button is always enabled
      };

      // Trigger column
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

      // Inject column
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

      // Actions column
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

      // Initial validation
      updateValidation();

      tbody.appendChild(row);
    });

    // Show empty state if no mappings
    if (mappings.length === 0) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = 3;
      emptyCell.className = "cookie-chyan-table-empty";
      emptyCell.textContent =
        "No mappings configured. Click 'Add New Mapping' to create one.";
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    }
  }
}
