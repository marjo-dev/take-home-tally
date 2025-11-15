// Backup/restore, CSV export, data import

import { snapshotSettings, snapshotEntries } from "./storage.js";
import { getDefaultSettings } from "./settings.js";
import { calculatePaycheck } from "./calculations/paycheck/paycheckEngine.js";

export function sanitizeBackupEntry(raw) {
  if (!raw || typeof raw !== "object") return null;
  const date = typeof raw.date === "string" ? raw.date : null;
  const role = typeof raw.role === "string" ? raw.role : null;
  const hours = Number(raw.hours);
  if (!date || !role || Number.isNaN(hours)) return null;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : crypto.randomUUID(),
    date,
    role,
    hours,
    tips: Number(raw.tips) || 0,
    cashTips: Number(raw.cashTips) || 0,
    tipOuts: Number(raw.tipOuts) || 0,
    settingsSnapshot: raw.settingsSnapshot || null
  };
}

export async function exportData() {
  try {
    const [settingsSnapshot, entriesSnapshot] = await Promise.all([
      snapshotSettings(),
      snapshotEntries()
    ]);

    const payload = {
      settings: settingsSnapshot ?? getDefaultSettings(),
      entries: entriesSnapshot ?? []
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "income_tracker_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export failed", err);
    alert("Could not export data. Please try again.");
  }
}

export function exportCSV(entries, settings) {
  if (!entries.length) {
    alert("No entries!");
    return;
  }
  
  const header = [
    "Date", "Role", "Hours", "Credit Tips", "Cash Tips", "Tip-Outs", "Hourly Pay", "Gross", "401k", "Taxable Income", "Tax", "Other", "Net", "Take-Home", "Employer Match", "Retirement"
  ];
  
  const rows = entries.map(e => {
    const calc = calculatePaycheck(e, settings);
    const rate = e.settingsSnapshot?.roleRate ?? settings.roles[e.role] ?? 0;
    return [
      e.date, e.role,
      e.hours.toFixed(2), (e.tips || 0).toFixed(2),
      (e.cashTips || 0).toFixed(2), (e.tipOuts || 0).toFixed(2),
      rate.toFixed(2), calc.gross.toFixed(2),
      calc.k401.toFixed(2), calc.taxableIncome.toFixed(2),
      calc.federalTax.toFixed(2), "0.00", calc.netIncome.toFixed(2), // otherDeductions removed
      calc.takeHome.toFixed(2), calc.employerMatch.toFixed(2), calc.totalRetirement.toFixed(2)
    ];
  });
  
  const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "income_tracker_export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(file, onSuccess) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed || typeof parsed !== "object") throw new Error("Invalid JSON structure.");

        const defaults = getDefaultSettings();
        const incomingSettings = parsed.settings && typeof parsed.settings === "object" ? parsed.settings : {};
        const mergedSettings = {
          ...defaults,
          ...incomingSettings,
          roles: { ...defaults.roles, ...(incomingSettings.roles || {}) }
        };

        const incomingEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
        const sanitizedEntries = [];
        for (const rawEntry of incomingEntries) {
          const clean = sanitizeBackupEntry(rawEntry);
          if (clean) sanitizedEntries.push(clean);
        }

        if (onSuccess) {
          await onSuccess(mergedSettings, sanitizedEntries);
        }

        resolve({ settings: mergedSettings, entries: sanitizedEntries });
      } catch (err) {
        console.error("Restore failed", err);
        alert("Could not restore from JSON: " + err.message);
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

