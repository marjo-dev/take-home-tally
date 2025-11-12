document.addEventListener("DOMContentLoaded", () => {

  // ---------- Storage Keys ----------
  const LS_SETTINGS = "it_settings_v2";
  const LS_ENTRIES = "it_entries_v2";

  // ---------- IndexedDB ----------
  const DB_NAME = "incomeTrackerDB";
  const DB_VERSION = 1;
  const STORE_SETTINGS = "settings";
  const STORE_ENTRIES = "entries";
  const SETTINGS_KEY = "current";

  let dbPromise;

  function getDefaultSettings() {
    return {
      taxRate: 20,
      k401Rate: 0,
      roth401kRate: 0,
      employerMatch: 3,
      otherDeductions: 0,
      theme: "dark",
      roles: { "Server": 10.00, "Host": 15.00, "Expo": 15.00, "Bartender": 15.00 }
    };
  }

  function deepClone(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function getDb() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
            db.createObjectStore(STORE_SETTINGS, { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
            db.createObjectStore(STORE_ENTRIES, { keyPath: "id" });
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => {
            db.close();
          };
          resolve(db);
        };
        request.onerror = () => reject(request.error);
      });
    }
    return dbPromise;
  }

  async function initStorage() {
    const db = await getDb();
    await migrateLocalStorageIfNeeded(db);
    return db;
  }

  async function migrateLocalStorageIfNeeded(db) {
    const hasLegacySettings = localStorage.getItem(LS_SETTINGS);
    const hasLegacyEntries = localStorage.getItem(LS_ENTRIES);

    if (!hasLegacySettings && !hasLegacyEntries) return;

    const tx = db.transaction([STORE_SETTINGS, STORE_ENTRIES], "readwrite");
    const settingsStore = tx.objectStore(STORE_SETTINGS);
    const entriesStore = tx.objectStore(STORE_ENTRIES);

    const existingSettings = await promisifyRequest(settingsStore.get(SETTINGS_KEY));
    const entryCount = await promisifyRequest(entriesStore.count());

    if (!existingSettings && hasLegacySettings) {
      try {
        const parsed = JSON.parse(hasLegacySettings);
        if (parsed && typeof parsed === "object") {
          await promisifyRequest(settingsStore.put({ id: SETTINGS_KEY, value: parsed }));
        }
      } catch (err) {
        console.error("Failed to migrate legacy settings", err);
      }
    }

    if (!entryCount && hasLegacyEntries) {
      try {
        const parsedEntries = JSON.parse(hasLegacyEntries);
        if (Array.isArray(parsedEntries)) {
          for (const entry of parsedEntries) {
            if (entry && entry.id) {
              await promisifyRequest(entriesStore.put(entry));
            }
          }
        }
      } catch (err) {
        console.error("Failed to migrate legacy entries", err);
      }
    }

    tx.commit?.();

    localStorage.removeItem(LS_SETTINGS);
    localStorage.removeItem(LS_ENTRIES);
  }

  async function loadSettings() {
    const db = await getDb();
    const tx = db.transaction(STORE_SETTINGS, "readonly");
    const store = tx.objectStore(STORE_SETTINGS);
    const record = await promisifyRequest(store.get(SETTINGS_KEY));
    tx.commit?.();
    return record ? record.value : null;
  }

  async function saveSettings() {
    const db = await getDb();
    const tx = db.transaction(STORE_SETTINGS, "readwrite");
    const store = tx.objectStore(STORE_SETTINGS);
    await promisifyRequest(store.put({ id: SETTINGS_KEY, value: settings }));
    tx.commit?.();
  }

  async function loadEntries() {
    const db = await getDb();
    const tx = db.transaction(STORE_ENTRIES, "readonly");
    const store = tx.objectStore(STORE_ENTRIES);
    const all = await promisifyRequest(store.getAll());
    tx.commit?.();
    return all || [];
  }

  async function saveEntries() {
    const db = await getDb();
    const tx = db.transaction(STORE_ENTRIES, "readwrite");
    const store = tx.objectStore(STORE_ENTRIES);
    await promisifyRequest(store.clear());
    for (const entry of entries) {
      await promisifyRequest(store.put(entry));
    }
    tx.commit?.();
  }

  async function clearAllData() {
    const existing = await getDb();
    existing.close();
    dbPromise = undefined;
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = req.onblocked = () => resolve();
      req.onerror = () => reject(req.error);
    });
    await initStorage();
  }

  async function snapshotSettings() {
    const db = await getDb();
    const tx = db.transaction(STORE_SETTINGS, "readonly");
    const store = tx.objectStore(STORE_SETTINGS);
    const record = await promisifyRequest(store.get(SETTINGS_KEY));
    tx.commit?.();
    return record ? deepClone(record.value) : null;
  }

  async function snapshotEntries() {
    const db = await getDb();
    const tx = db.transaction(STORE_ENTRIES, "readonly");
    const store = tx.objectStore(STORE_ENTRIES);
    const all = await promisifyRequest(store.getAll());
    tx.commit?.();
    return all ? all.map(entry => ({ ...entry })) : [];
  }

  function showModal(message) {
    if (!message) return;

    // Remove existing modal if present
    const existingModal = document.querySelector(".modal-overlay");
    if (existingModal) {
      existingModal.remove();
      document.body.style.overflow = "";
    }

    // Prevent body scrolling when modal is open
    document.body.style.overflow = "hidden";

    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    // Create modal content
    const modal = document.createElement("div");
    modal.className = "modal";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.textContent = message;

    const closeButton = document.createElement("button");
    closeButton.className = "modal-close";
    closeButton.textContent = "Close";

    const closeModal = () => {
      overlay.classList.remove("visible");
      document.body.style.overflow = "";
      setTimeout(() => {
        overlay.remove();
      }, 250);
    };

    closeButton.addEventListener("click", closeModal);

    modal.appendChild(modalContent);
    modal.appendChild(closeButton);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Show modal with animation
    requestAnimationFrame(() => {
      overlay.classList.add("visible");
    });

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);
  }

  function sanitizeBackupEntry(raw) {
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
      tipOuts: Number(raw.tipOuts) || 0
    };
  }

  // ---------- App State ----------
  let settings = getDefaultSettings();
  let entries = [];
  let currentMonthFilter = "all";

  function applyTheme(theme) {
    document.body.classList.remove("theme-dark", "theme-light");
    const applied = theme === "light" ? "theme-light" : "theme-dark";
    document.body.classList.add(applied);
  }

  const monthNames = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

  function monthLabelFromKey(key) {
    const date = new Date(`${key}-01T00:00:00`);
    return monthNames.format(date);
  }

  function syncYtdLabels() {
    const labelMap = {
      "stat-gross": "Year-to-Date Gross:",
      "avg-gross": "Average Weekly Gross:",
      "stat-tax": "Year-to-Date Tax:",
      "avg-tax": "Average Weekly Tax:",
      "stat-retire": "Year-to-Date Retirement:",
      "avg-retire": "Average Weekly Retirement:",
      "stat-net": "Year-to-Date Net:",
      "avg-net": "Average Weekly Net:",
      "stat-tipouts": "Year-to-Date Tip-Outs:",
      "avg-tipouts": "Average Weekly Tip-Outs:",
      "stat-takehome": "Year-to-Date Take-Home:",
      "avg-takehome": "Average Weekly Take-Home:"
    };

    Object.entries(labelMap).forEach(([id, text]) => {
      const valueEl = document.getElementById(id);
      const labelEl = valueEl?.previousElementSibling;
      if (labelEl && labelEl.tagName === "STRONG") {
        labelEl.textContent = text;
      }
    });
  }

  function refreshMonthFilterOptions(weeks) {
    const select = document.getElementById("month-filter");
    if (!select) return;

    const monthSet = new Set();
    for (const wk of weeks) {
      wk.monthKeys.forEach(key => monthSet.add(key));
    }

    const months = Array.from(monthSet).sort().reverse();
    const previous = currentMonthFilter;

    select.innerHTML = `<option value="all">All months</option>` + months.map(key => `<option value="${key}">${monthLabelFromKey(key)}</option>`).join("");

    if (previous !== "all" && !months.includes(previous)) {
      currentMonthFilter = "all";
    }

    select.value = currentMonthFilter;
  }

  // ---------- Utility Helpers ----------
  const fmtMoney = n => `$${(Number(n) || 0).toFixed(2)}`;
  const toISO = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const fmtDate = iso => new Date(iso + "T00:00:00")
    .toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const dayName = iso => new Date(iso + "T00:00:00")
    .toLocaleDateString(undefined, { weekday: "short" });

  const startOfWeekMonday = d => {
    const date = new Date(d + "T00:00:00");
    const day = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - day);
    return toISO(date);
  };
  const endOfWeekSunday = d => {
    const mon = new Date(startOfWeekMonday(d));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return toISO(sun);
  };
  function calcPayDate(wkEndISO) {
    const d = new Date(wkEndISO + "T00:00:00");
    d.setDate(d.getDate() + 3); // next Wednesday
    return toISO(d);
  }

  // ---------- Role Manager ----------
  function refreshRoleSelect() {
    const sel = document.getElementById("entry-role");
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
  function renderRolesTable() {
    const tbody = document.querySelector("#roles-table tbody");
    tbody.innerHTML = "";
    for (const [name, rate] of Object.entries(settings.roles)) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${name}</td>
      <td class="num">${fmtMoney(rate)}</td>
      <td>
        <button class="btn-ghost" data-edit-role="${name}" data-edit-rate="${rate}">Edit</button>
        <button class="btn-danger" data-role="${name}">Delete</button>
      </td>`;
      tbody.appendChild(tr);
    }
    tbody.querySelectorAll("button[data-role]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const r = btn.getAttribute("data-role");
        if (confirm(`Delete role "${r}"?`)) {
          delete settings.roles[r];
          await saveSettings();
          renderSettings();
        }
      });
    });
    tbody.querySelectorAll("button[data-edit-role]").forEach(btn => {
      btn.addEventListener("click", () => {
        const roleName = btn.getAttribute("data-edit-role");
        const roleRate = btn.getAttribute("data-edit-rate");
        document.getElementById("role-name").value = roleName;
        document.getElementById("role-rate").value = roleRate;
        document.getElementById("role-name").focus();
        // Scroll to the form if needed
        document.getElementById("role-name").scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });
  }
  function renderSettings() {
    document.getElementById("set-tax").value = settings.taxRate;
    document.getElementById("set-k401").value = settings.k401Rate;
    document.getElementById("set-roth401k").value = settings.roth401kRate || 0;
    document.getElementById("set-match").value = settings.employerMatch;
    document.getElementById("set-other").value = settings.otherDeductions;
    const themeSelect = document.getElementById("set-theme");
    if (themeSelect) themeSelect.value = settings.theme || "dark";
    renderRolesTable();
    refreshRoleSelect();
  }
  document.getElementById("add-role").addEventListener("click", async () => {
    const name = document.getElementById("role-name").value.trim();
    const rate = parseFloat(document.getElementById("role-rate").value);
    if (!name || !(rate >= 0)) return alert("Enter valid role + rate.");
    settings.roles[name] = rate;
    await saveSettings();
    document.getElementById("role-name").value = "";
    document.getElementById("role-rate").value = "";
    renderSettings();
  });
  document.getElementById("save-settings").addEventListener("click", async () => {
    settings.taxRate = parseFloat(document.getElementById("set-tax").value) || 0;
    settings.k401Rate = parseFloat(document.getElementById("set-k401").value) || 0;
    settings.roth401kRate = parseFloat(document.getElementById("set-roth401k").value) || 0;
    settings.employerMatch = parseFloat(document.getElementById("set-match").value) || 0;
    settings.otherDeductions = parseFloat(document.getElementById("set-other").value) || 0;
    settings.theme = document.getElementById("set-theme").value || "dark";
    await saveSettings();
    refreshWeekTable();
    applyTheme(settings.theme);
    alert("Settings saved.");
  });

  // ---------- Daily Entry ----------
  // Date input starts empty - user must select a date or click "Today" button
  document.getElementById("add-entry").addEventListener("click", async () => {
    const date = document.getElementById("entry-date").value;
    const role = document.getElementById("entry-role").value;
    const hours = parseFloat(document.getElementById("entry-hours").value);
    const tips = parseFloat(document.getElementById("entry-tips").value) || 0;
    const cashTips = parseFloat(document.getElementById("entry-cash").value) || 0;
    const tipOuts = parseFloat(document.getElementById("entry-tipouts").value) || 0;

    if (!date || !role || !(hours > 0)) return alert("Complete all fields!");

    entries.push({
      id: crypto.randomUUID(),
      date, role, hours,
      tips, cashTips, tipOuts
    });
    await saveEntries();

    document.getElementById("entry-hours").value = "";
    document.getElementById("entry-tips").value = "";
    document.getElementById("entry-cash").value = "";
    document.getElementById("entry-tipouts").value = "";
    document.getElementById("entry-role").selectedIndex = 0; // Reset to placeholder
    refreshWeekTable();
  });

  // Autofocus chain
  document.getElementById("entry-date").addEventListener("change", () => document.getElementById("entry-role").focus());
  document.getElementById("entry-role").addEventListener("change", () => document.getElementById("entry-hours").focus());
  document.getElementById("entry-hours").addEventListener("keyup", (e) => { if (e.key === "Enter") document.getElementById("entry-tips").focus(); });
  document.getElementById("entry-tips").addEventListener("keyup", (e) => { if (e.key === "Enter") document.getElementById("add-entry").click(); });

  // Today shortcut
  document.getElementById("today-btn").addEventListener("click", () => {
    document.getElementById("entry-date").value = toISO(new Date());
    document.getElementById("entry-role").focus();
  });

  // ---------- Aggregation ----------
  function aggregateWeeks(all) {
    const map = new Map();
    for (const e of all) {
      const wk = startOfWeekMonday(e.date);
      if (!map.has(wk)) map.set(wk, []);
      map.get(wk).push(e);
    }

    const weeks = [];
    for (const [wkStart, list] of map.entries()) {
      const wkEnd = endOfWeekSunday(wkStart);

      let hrs = 0, pay = 0, ccTips = 0, cashTips = 0, tipOuts = 0;
      for (const d of list) {
        const rate = settings.roles[d.role] || 0;
        hrs += d.hours;
        pay += d.hours * rate;
        ccTips += d.tips || 0;
        cashTips += d.cashTips || 0;
        tipOuts += d.tipOuts || 0;
      }

      const gross = pay + ccTips; // taxable only
      const k401 = gross * (settings.k401Rate / 100);
      const roth401k = gross * ((settings.roth401kRate || 0) / 100);
      const taxable = gross - k401; // Roth 401k doesn't reduce taxable income
      const tax = taxable * (settings.taxRate / 100);
      const other = gross * (settings.otherDeductions / 100);
      const net = gross - (tax + k401 + roth401k + other);
      const match = gross * (settings.employerMatch / 100);
      const retirement = k401 + roth401k + match;

      const takeHome = net + cashTips - tipOuts;
      const payDateISO = calcPayDate(wkEnd);

      const monthsInPeriod = new Set();
      const start = new Date(wkStart + "T00:00:00");
      const end = new Date(wkEnd + "T00:00:00");
      const cursor = new Date(start);
      while (cursor <= end) {
        monthsInPeriod.add(cursor.toISOString().slice(0, 7));
        cursor.setDate(cursor.getDate() + 1);
      }

      // also ensure pay date month is included
      monthsInPeriod.add(payDateISO.slice(0, 7));

      weeks.push({
        key: `${wkStart}_${wkEnd}`,
        weekStart: wkStart,
        weekEnd: wkEnd,
        payDateISO,
        monthKeys: [...monthsInPeriod],
        days: list,
        totals: { hours: hrs, hourlyPay: pay, tips: ccTips, cashTips, tipOuts, gross, taxableIncome: taxable, tax, net, takeHome, retirement, match }
      });
    }

    return weeks.sort((a, b) => b.weekEnd.localeCompare(a.weekEnd));
  }

  // ---------- Details Table ----------
  function weekDetailsHTML(wk) {
    const rows = wk.days.map(d => {
      const rate = settings.roles[d.role] || 0;
      const wage = d.hours * rate;
      const gross = wage + (d.tips || 0);
      return `
      <tr>
        <td>${dayName(d.date)}</td>
        <td>${fmtDate(d.date)}</td>
        <td>${d.role} (${fmtMoney(rate)}/hr)</td>
        <td class="num">${d.hours.toFixed(2)} h</td>
        <td class="num">${fmtMoney(wage)}</td>
        <td class="num">${fmtMoney(d.tips || 0)}</td>
        <td class="num">${fmtMoney(d.cashTips || 0)}</td>
        <td class="num">${fmtMoney(d.tipOuts || 0)}</td>
        <td class="num"><strong>${fmtMoney(gross)}</strong></td>
        <td><button class="btn-danger" data-del="${d.id}">Delete</button></td>
      </tr>`;
    }).join("");

    return `
    <table class="details-table">
      <thead>
        <tr>
          <th>Day</th>
          <th>Date</th>
          <th>Role</th>
          <th class="num">Hours</th>
          <th class="num">Hourly Pay</th>
          <th class="num">Credit Tips</th>
          <th class="num">Cash Tips</th>
          <th class="num">Tip-Outs</th>
          <th class="num">Gross</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${rows || "<tr><td colspan='10' class='muted'>No entries</td></tr>"}
      </tbody>
    </table>`;
  }

  // ---------- Weekly Summary ----------
  function refreshWeekTable() {
    const weeks = aggregateWeeks(entries);
    refreshMonthFilterOptions(weeks);

    const filterSelect = document.getElementById("month-filter");
    const activeFilter = filterSelect ? filterSelect.value || currentMonthFilter : currentMonthFilter;
    currentMonthFilter = activeFilter;

    const tbody = document.querySelector("#weekly-table tbody");
    tbody.innerHTML = "";

    let sumGross = 0, sumTax = 0, sumNet = 0, sumRet = 0, sumHours = 0, sumTakeHome = 0, sumTipOuts = 0;

    for (const wk of weeks) {
      const t = wk.totals;
      sumGross += t.gross;
      sumTax += t.tax;
      sumNet += t.net;
      sumRet += t.retirement;
      sumHours += t.hours;
      sumTakeHome += t.takeHome;
      sumTipOuts += t.tipOuts;
    }

    const filteredWeeks = activeFilter === "all"
      ? weeks
      : weeks.filter(wk => wk.monthKeys.includes(activeFilter));

    if (!filteredWeeks.length) {
      const empty = document.createElement("tr");
      empty.innerHTML = `<td colspan="15" class="muted">No data for the selected month.</td>`;
      tbody.appendChild(empty);
    } else {
      for (const wk of filteredWeeks) {
        const t = wk.totals;
        const tr = document.createElement("tr");
        tr.setAttribute("data-week-key", wk.key);
        const detailsId = `details-${wk.key}`;
        tr.innerHTML = `
      <td data-label="Pay Period" class="week-cell"><button type="button" class="week-toggle" data-summary="${wk.key}" aria-expanded="false"><span class="week-meta"><span class="week-label">Pay Period</span><strong>${fmtDate(wk.weekStart)} &ndash; ${fmtDate(wk.weekEnd)}</strong></span></button></td>
      <td class="num" data-label="Hours Worked">${t.hours.toFixed(2)} h</td>
      <td class="num mobile-extra" data-label="Hourly Wages">${fmtMoney(t.hourlyPay)}</td>
      <td class="num mobile-extra" data-label="Total Credit Card Tips">${fmtMoney(t.tips)}</td>
      <td class="num mobile-extra" data-label="Total Cash Tips">${fmtMoney(t.cashTips)}</td>
      <td class="num mobile-extra" data-label="Gross Income">${fmtMoney(t.gross)}</td>
      <td class="num mobile-extra" data-label="Taxable Income">${fmtMoney(t.taxableIncome)}</td>
      <td class="num mobile-extra" data-label="Estimated Tax Deduction">${fmtMoney(t.tax)}</td>
      <td class="paydate" data-label="Pay Date">${fmtDate(wk.payDateISO)}</td>
      <td class="num netcell" data-label="Net Income" data-sublabel="(Estimated Paycheck Amount)"><strong>${fmtMoney(t.net)}</strong></td>
      <td class="num mobile-extra takehome" data-label="Total Take-Home Amount"><strong>${fmtMoney(t.takeHome)}</strong></td>
      <td class="num mobile-extra" data-label="Total Tip-Outs">${fmtMoney(t.tipOuts)}</td>
      <td class="num mobile-extra" data-label="Retirement Contribution">${fmtMoney(t.retirement)}</td>
      <td class="num mobile-extra" data-label="Employer Match">${fmtMoney(t.match)}</td>
      <td class="mobile-actions" data-label="">
        <div class="action-stack">
          <button class="btn-ghost" data-toggle="${wk.key}" aria-expanded="false" aria-controls="${detailsId}">Details</button>
          <p class="mobile-hint">Tap the Details button to reveal breakdown by day. Scroll horizontally to see more info. Delete option appears at the end of the row.</p>
        </div>
      </td>`;
        tbody.appendChild(tr);

        const details = document.createElement("tr");
        details.className = "week-details";
        details.id = detailsId;
        details.hidden = true;
        const colCount = document.querySelector("#weekly-table thead tr").children.length;
        details.innerHTML = `<td colspan="${colCount}"><div class="details-header">Daily Breakdown</div><div class="details-table-wrapper">${weekDetailsHTML(wk)}</div></td>`;
        tbody.appendChild(details);
      }
    }

    document.getElementById("stat-weeks").textContent = weeks.length;
    document.getElementById("stat-gross").textContent = fmtMoney(sumGross);
    document.getElementById("stat-tax").textContent = fmtMoney(sumTax);
    document.getElementById("stat-net").textContent = fmtMoney(sumNet);
    document.getElementById("stat-retire").textContent = fmtMoney(sumRet);
    document.getElementById("stat-takehome").textContent = fmtMoney(sumTakeHome);
    document.getElementById("stat-tipouts").textContent = fmtMoney(sumTipOuts);

    document.getElementById("avg-gross").textContent = fmtMoney(weeks.length ? (sumGross / weeks.length) : 0);
    document.getElementById("avg-tax").textContent = fmtMoney(weeks.length ? (sumTax / weeks.length) : 0);
    document.getElementById("avg-net").textContent = fmtMoney(weeks.length ? (sumNet / weeks.length) : 0);
    document.getElementById("avg-hours").textContent = weeks.length ? (sumHours / weeks.length).toFixed(2) + " h" : "0.00 h";
    document.getElementById("avg-retire").textContent = fmtMoney(weeks.length ? (sumRet / weeks.length) : 0);
    document.getElementById("avg-takehome").textContent = fmtMoney(weeks.length ? (sumTakeHome / weeks.length) : 0);
    document.getElementById("avg-tipouts").textContent = fmtMoney(weeks.length ? (sumTipOuts / weeks.length) : 0);
  }

  // ---------- Toggle + Delete ----------
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
      }
      return;
    }

    const key = e.target?.getAttribute("data-toggle");
    if (key) {
      const row = e.target.closest("tr");
      const details = row.nextElementSibling;
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
  document.addEventListener("click", async e => {
    const id = e.target?.getAttribute("data-del");
    if (id && confirm("Delete this entry?")) {
      entries = entries.filter(x => x.id !== id);
      await saveEntries();
      refreshWeekTable();
    }
  });
  document.addEventListener("click", e => {
    const btn = e.target?.closest(".info-btn");
    if (btn) {
      const help = btn.getAttribute("data-help");
      showModal(help);
    }
  });

  // ---------- Export / Import / Reset ----------
  document.getElementById("export-data").addEventListener("click", async () => {
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
  });
  document.getElementById("export-csv").addEventListener("click", () => {
    if (!entries.length) return alert("No entries!");
    const header = [
      "Date", "Role", "Hours", "Credit Tips", "Cash Tips", "Tip-Outs", "Hourly Pay", "Gross", "401k", "Taxable Income", "Tax", "Other", "Net", "Take-Home", "Employer Match", "Retirement"
    ];
    const rows = entries.map(e => {
      const rate = settings.roles[e.role] || 0;
      const gross = (e.hours * rate) + (e.tips || 0);
      const k401 = gross * (settings.k401Rate / 100);
      const taxable = gross - k401;
      const tax = taxable * (settings.taxRate / 100);
      const other = gross * (settings.otherDeductions / 100);
      const net = gross - (tax + k401 + other);
      const match = gross * (settings.employerMatch / 100);
      const retire = k401 + match;
      const takeHome = net + (e.cashTips || 0) - (e.tipOuts || 0);
      return [
        e.date, e.role,
        e.hours.toFixed(2), (e.tips || 0).toFixed(2),
        (e.cashTips || 0).toFixed(2), (e.tipOuts || 0).toFixed(2),
        rate.toFixed(2), gross.toFixed(2),
        k401.toFixed(2), taxable.toFixed(2),
        tax.toFixed(2), other.toFixed(2), net.toFixed(2),
        takeHome.toFixed(2), match.toFixed(2), retire.toFixed(2)
      ];
    });
    const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "income_tracker_export.csv"; a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById("import-json").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
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

        settings = mergedSettings;
        entries = sanitizedEntries;

        await saveSettings();
        await saveEntries();

        applyTheme(settings.theme);
        renderSettings();
        refreshWeekTable();
        refreshRoleSelect();

        alert(`Restored ${sanitizedEntries.length} entries from backup.`);
      } catch (err) {
        console.error("Restore failed", err);
        alert("Could not restore from JSON: " + err.message);
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  });
  document.getElementById("reset-data").addEventListener("click", async () => {
    if (confirm("Reset ALL data?")) {
      try {
        await clearAllData();
        settings = getDefaultSettings();
        entries = [];
        await saveSettings();
        await saveEntries();
        applyTheme(settings.theme);
        renderSettings();
        refreshWeekTable();
        alert("All data has been reset.");
      } catch (err) {
        console.error("Failed to reset data", err);
        alert("Could not reset data. Please reload and try again.");
      }
    }
  });

  const themeSelectEl = document.getElementById("set-theme");
  if (themeSelectEl) {
    themeSelectEl.addEventListener("change", async e => {
      const theme = e.target.value;
      applyTheme(theme);
      settings.theme = theme;
      await saveSettings();
    });
  }

  const monthFilterEl = document.getElementById("month-filter");
  if (monthFilterEl) {
    monthFilterEl.addEventListener("change", () => {
      currentMonthFilter = monthFilterEl.value || "all";
      refreshWeekTable();
    });
  }

  // ---------- Init ----------
  (async () => {
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

      if (!settings.theme) settings.theme = "dark";

      syncYtdLabels();
      renderSettings();
      applyTheme(settings.theme);
      refreshWeekTable();
      refreshRoleSelect();
    } catch (err) {
      console.error("Failed to initialize storage", err);
      alert("Could not load saved data. Using defaults for this session.");
      settings = getDefaultSettings();
      entries = [];
      syncYtdLabels();
      renderSettings();
      applyTheme(settings.theme);
      refreshWeekTable();
      refreshRoleSelect();
    }
  })();

});