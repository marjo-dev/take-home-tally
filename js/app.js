// Main application entry point - orchestrates all modules

// Storage
import { initStorage, loadSettings, saveSettings, loadEntries, saveEntries, clearAllData, backfillSettingsSnapshots } from "./storage.js";

// Settings
import { getDefaultSettings, refreshRoleSelect, renderRolesTable, renderSettings, createSettingsSnapshot } from "./settings.js";

// Utils
import { toISO } from "./utils.js";

// UI
import { syncYtdLabels, refreshWeekTable } from "./ui/renderers.js";
import { showModal } from "./ui/modal.js";
import { applyTheme } from "./ui/theme.js";
import { initNavigation } from "./ui/navigation.js";
import { initToggles } from "./ui/toggles.js";

// Export
import { exportData, exportCSV, importData } from "./export.js";

// App State
let settings = getDefaultSettings();
let entries = [];
let currentMonthFilter = "all";

// Role management handlers (defined before DOMContentLoaded so they're available during init)
function handleDeleteRole(roleName) {
  if (confirm(`Delete role "${roleName}"?`)) {
    delete settings.roles[roleName];
    saveSettings(settings).then(() => {
      renderSettings(settings);
      renderRolesTable(settings, handleDeleteRole, handleEditRole);
      refreshRoleSelect(settings);
      currentMonthFilter = refreshWeekTable(entries, settings, currentMonthFilter);
    });
  }
}

function handleEditRole(roleName, roleRate) {
  const nameEl = document.getElementById("role-name");
  const rateEl = document.getElementById("role-rate");
  if (nameEl && rateEl) {
    nameEl.value = roleName;
    rateEl.value = roleRate;
    nameEl.focus();
    nameEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// Initialize app
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initStorage();
    const storedSettings = await loadSettings();
    const defaults = getDefaultSettings();
    settings = storedSettings
      ? {
        ...defaults,
        ...storedSettings,
        roles: { ...defaults.roles, ...(storedSettings.roles || {}) }
      }
      : defaults;

    const storedEntries = await loadEntries();
    entries = Array.isArray(storedEntries) ? storedEntries : [];

    // Backfill settings snapshots for existing entries
    const wasBackfilled = await backfillSettingsSnapshots(entries, settings);
    if (wasBackfilled) {
      await saveEntries(entries);
    }

    if (!settings.theme) settings.theme = "light";

    syncYtdLabels();
    renderSettings(settings);
    renderRolesTable(settings, handleDeleteRole, handleEditRole);
    applyTheme(settings.theme);
    currentMonthFilter = refreshWeekTable(entries, settings, currentMonthFilter);
    refreshRoleSelect(settings);

    // Initialize UI components
    initNavigation();
    initToggles();

    setupEventHandlers();
  } catch (err) {
    console.error("Failed to initialize storage", err);
    alert("Could not load saved data. Using defaults for this session.");
    settings = getDefaultSettings();
    entries = [];
    syncYtdLabels();
    renderSettings(settings);
    renderRolesTable(settings, handleDeleteRole, handleEditRole);
    applyTheme(settings.theme);
    currentMonthFilter = refreshWeekTable(entries, settings, currentMonthFilter);
    refreshRoleSelect(settings);
    initNavigation();
    initToggles();
    setupEventHandlers();
  }
});

function setupEventHandlers() {
  // Role Management
  const addRoleBtn = document.getElementById("add-role");
  if (addRoleBtn) {
    addRoleBtn.addEventListener("click", async () => {
      const nameEl = document.getElementById("role-name");
      const rateEl = document.getElementById("role-rate");
      if (!nameEl || !rateEl) return;

      const name = nameEl.value.trim();
      const rate = parseFloat(rateEl.value);
      if (!name || !(rate >= 0)) return alert("Enter valid role + rate.");

      settings.roles[name] = rate;
      await saveSettings(settings);
      nameEl.value = "";
      rateEl.value = "";
      renderSettings(settings);
      renderRolesTable(settings, handleDeleteRole, handleEditRole);
      refreshRoleSelect(settings);
    });
  }

  // Settings Save
  const saveSettingsBtn = document.getElementById("save-settings");
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", async () => {
      const taxEl = document.getElementById("set-tax");
      const k401El = document.getElementById("set-k401");
      const roth401kEl = document.getElementById("set-roth401k");
      const matchEl = document.getElementById("set-match");
      const otherEl = document.getElementById("set-other");
      const themeEl = document.getElementById("set-theme");

      settings.taxRate = parseFloat(taxEl?.value) || 0;
      settings.k401Rate = parseFloat(k401El?.value) || 0;
      settings.roth401kRate = parseFloat(roth401kEl?.value) || 0;
      settings.employerMatch = parseFloat(matchEl?.value) || 0;
      settings.otherDeductions = parseFloat(otherEl?.value) || 0;
      settings.theme = themeEl?.value || "light";

      await saveSettings(settings);
      currentMonthFilter = refreshWeekTable(entries, settings, currentMonthFilter);
      applyTheme(settings.theme);
      alert("Settings saved.");
    });
  }

  // Daily Entry
  const addEntryBtn = document.getElementById("add-entry");
  if (addEntryBtn) {
    addEntryBtn.addEventListener("click", async () => {
      const dateEl = document.getElementById("entry-date");
      const roleEl = document.getElementById("entry-role");
      const hoursEl = document.getElementById("entry-hours");
      const tipsEl = document.getElementById("entry-tips");
      const cashEl = document.getElementById("entry-cash");
      const tipoutsEl = document.getElementById("entry-tipouts");

      const date = dateEl?.value;
      const role = roleEl?.value;
      const hours = parseFloat(hoursEl?.value);
      const tips = parseFloat(tipsEl?.value) || 0;
      const cashTips = parseFloat(cashEl?.value) || 0;
      const tipOuts = parseFloat(tipoutsEl?.value) || 0;

      if (!date || !role || !(hours > 0)) return alert("Complete all fields!");

      // Create entry with settings snapshot
      const entry = {
        id: crypto.randomUUID(),
        date,
        role,
        hours,
        tips,
        cashTips,
        tipOuts,
        settingsSnapshot: createSettingsSnapshot(settings, role)
      };

      entries.push(entry);
      await saveEntries(entries);

      if (hoursEl) hoursEl.value = "";
      if (tipsEl) tipsEl.value = "";
      if (cashEl) cashEl.value = "";
      if (tipoutsEl) tipoutsEl.value = "";
      if (roleEl) roleEl.selectedIndex = 0; // Reset to placeholder

      currentMonthFilter = refreshWeekTable(entries, settings, currentMonthFilter);
    });
  }

  // Autofocus chain
  const dateEl = document.getElementById("entry-date");
  const roleEl = document.getElementById("entry-role");
  const hoursEl = document.getElementById("entry-hours");
  const tipsEl = document.getElementById("entry-tips");

  if (dateEl) {
    dateEl.addEventListener("change", () => {
      if (roleEl) roleEl.focus();
    });
  }

  if (roleEl) {
    roleEl.addEventListener("change", () => {
      if (hoursEl) hoursEl.focus();
    });
  }

  if (hoursEl) {
    hoursEl.addEventListener("keyup", (e) => {
      if (e.key === "Enter" && tipsEl) tipsEl.focus();
    });
  }

  if (tipsEl) {
    tipsEl.addEventListener("keyup", (e) => {
      if (e.key === "Enter" && addEntryBtn) addEntryBtn.click();
    });
  }

  // Today shortcut
  const todayBtn = document.getElementById("today-btn");
  if (todayBtn) {
    todayBtn.addEventListener("click", () => {
      if (dateEl) {
        dateEl.value = toISO(new Date());
        if (roleEl) roleEl.focus();
      }
    });
  }

  // Week toggle and details toggle
  document.addEventListener("click", e => {
    const button = e.target.closest(".week-toggle");
    const summaryKey = button?.getAttribute("data-summary");
    if (summaryKey) {
      const row = button.closest("tr");
      if (!row) return;
      const open = row.classList.toggle("mobile-summary-open");
      if (button instanceof HTMLElement) {
        button.setAttribute("aria-expanded", open ? "true" : "false");
        button.classList.toggle("expanded", open);
        const hint = button.querySelector(".toggle-hint");
        if (hint) {
          hint.textContent = open ? "tap to hide" : "tap to expand";
        }
      }
      return;
    }

    const key = e.target?.getAttribute("data-toggle");
    if (key) {
      const row = e.target.closest("tr");
      const details = row?.nextElementSibling;
      if (!details || !details.classList.contains("week-details")) return;

      const isOpen = details.classList.contains("details-expanded");

      if (isOpen) {
        details.classList.remove("details-expanded");
        details.hidden = true;
        if (e.target instanceof HTMLElement) {
          e.target.textContent = "Details";
          e.target.setAttribute("aria-expanded", "false");
        }
      } else {
        details.hidden = false;
        details.classList.add("details-expanded");
        if (e.target instanceof HTMLElement) {
          e.target.textContent = "Hide Details";
          e.target.setAttribute("aria-expanded", "true");
        }
      }
    }
  });

  // Delete entry
  document.addEventListener("click", async e => {
    const id = e.target?.getAttribute("data-del");
    if (id && confirm("Delete this entry?")) {
      entries = entries.filter(x => x.id !== id);
      await saveEntries(entries);
      currentMonthFilter = refreshWeekTable(entries, settings, currentMonthFilter);
    }
  });

  // Info button (modal)
  document.addEventListener("click", e => {
    const btn = e.target?.closest(".info-btn");
    if (btn) {
      const help = btn.getAttribute("data-help");
      if (help) showModal(help);
    }
  });

  // Export/Import
  const exportDataBtn = document.getElementById("export-data");
  if (exportDataBtn) {
    exportDataBtn.addEventListener("click", exportData);
  }

  const exportCSVBtn = document.getElementById("export-csv");
  if (exportCSVBtn) {
    exportCSVBtn.addEventListener("click", () => exportCSV(entries, settings));
  }

  const importJsonInput = document.getElementById("import-json");
  if (importJsonInput) {
    importJsonInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const { settings: importedSettings, entries: importedEntries } = await importData(file, async (mergedSettings, sanitizedEntries) => {
          settings = mergedSettings;
          entries = sanitizedEntries;
          await saveSettings(settings);
          await saveEntries(entries);
        });

        applyTheme(settings.theme);
        renderSettings(settings);
        currentMonthFilter = refreshWeekTable(entries, settings, currentMonthFilter);
        refreshRoleSelect(settings);

        alert(`Restored ${importedEntries.length} entries from backup.`);
      } catch (err) {
        console.error("Import failed", err);
      } finally {
        e.target.value = "";
      }
    });
  }

  const resetDataBtn = document.getElementById("reset-data");
  if (resetDataBtn) {
    resetDataBtn.addEventListener("click", async () => {
      if (confirm("Reset ALL data?")) {
        try {
          await clearAllData();
          settings = getDefaultSettings();
          entries = [];
          await saveSettings(settings);
          await saveEntries(entries);
          applyTheme(settings.theme);
          renderSettings(settings);
          renderRolesTable(settings, handleDeleteRole, handleEditRole);
          refreshRoleSelect(settings);
          // Clear role input fields
          const roleNameEl = document.getElementById("role-name");
          const roleRateEl = document.getElementById("role-rate");
          if (roleNameEl) roleNameEl.value = "";
          if (roleRateEl) roleRateEl.value = "";
          currentMonthFilter = refreshWeekTable(entries, settings, currentMonthFilter);
          alert("All data has been reset.");
        } catch (err) {
          console.error("Failed to reset data", err);
          alert("Could not reset data. Please reload and try again.");
        }
      }
    });
  }

  // Theme change
  const themeSelectEl = document.getElementById("set-theme");
  if (themeSelectEl) {
    themeSelectEl.addEventListener("change", async (e) => {
      const theme = e.target.value;
      applyTheme(theme);
      settings.theme = theme;
      await saveSettings(settings);
    });
  }

  // Month filter
  const monthFilterEl = document.getElementById("month-filter");
  if (monthFilterEl) {
    monthFilterEl.addEventListener("change", () => {
      currentMonthFilter = monthFilterEl.value || "all";
      currentMonthFilter = refreshWeekTable(entries, settings, currentMonthFilter);
    });
  }
}

