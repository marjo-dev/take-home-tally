// Settings management and role operations

import { fmtMoney } from "./utils.js";

export function getDefaultSettings() {
  return {
    taxRate: 20,
    k401Rate: 0,
    roth401kRate: 0,
    employerMatch: 0,
    otherDeductions: 0,
    theme: "light",
    roles: { "Server": 10.00, "Host": 15.00, "Expo": 15.00, "Bartender": 15.00 }
  };
}

export function refreshRoleSelect(settings) {
  const sel = document.getElementById("entry-role");
  if (!sel) return;
  
  sel.innerHTML = "";
  // Add placeholder option
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select role here";
  placeholder.disabled = true;
  placeholder.selected = true;
  sel.appendChild(placeholder);
  // Add role options
  for (const r of Object.keys(settings.roles).sort()) {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = `${r} (${fmtMoney(settings.roles[r])}/hr)`;
    sel.appendChild(opt);
  }
}

export function renderRolesTable(settings, onDeleteRole, onEditRole) {
  const tbody = document.querySelector("#roles-table tbody");
  if (!tbody) return;
  
  tbody.innerHTML = "";
  for (const [name, rate] of Object.entries(settings.roles)) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${name}</td>
      <td class="num">${fmtMoney(rate)}</td>
      <td>
        <button data-edit-role="${name}" data-edit-rate="${rate}">Edit</button>
        <button class="btn-danger" data-role="${name}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  }
  
  tbody.querySelectorAll("button[data-role]").forEach(btn => {
    btn.addEventListener("click", () => {
      const r = btn.getAttribute("data-role");
      onDeleteRole(r);
    });
  });
  
  tbody.querySelectorAll("button[data-edit-role]").forEach(btn => {
    btn.addEventListener("click", () => {
      const roleName = btn.getAttribute("data-edit-role");
      const roleRate = btn.getAttribute("data-edit-rate");
      onEditRole(roleName, roleRate);
    });
  });
}

export function renderSettings(settings) {
  const taxEl = document.getElementById("set-tax");
  const k401El = document.getElementById("set-k401");
  const roth401kEl = document.getElementById("set-roth401k");
  const matchEl = document.getElementById("set-match");
  const otherEl = document.getElementById("set-other");
  const themeSelect = document.getElementById("set-theme");
  
  if (taxEl) taxEl.value = settings.taxRate;
  if (k401El) k401El.value = settings.k401Rate;
  if (roth401kEl) roth401kEl.value = settings.roth401kRate || 0;
  if (matchEl) matchEl.value = settings.employerMatch;
  if (otherEl) otherEl.value = settings.otherDeductions;
  if (themeSelect) themeSelect.value = settings.theme || "light";
}

export function createSettingsSnapshot(settings, role) {
  // Create a snapshot of relevant settings for an entry
  return {
    roleRate: settings.roles[role] || 0,
    k401Rate: settings.k401Rate || 0,
    roth401kRate: settings.roth401kRate || 0,
    employerMatch: settings.employerMatch || 0,
    taxRate: settings.taxRate || 20
  };
}

