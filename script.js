document.addEventListener("DOMContentLoaded", () => {

  // ---------- Storage Keys ----------
  const LS_SETTINGS = "it_settings_v2";
  const LS_ENTRIES = "it_entries_v2";

  // ---------- App State ----------
  let settings = loadSettings() || {
    taxRate: 12,
    k401Rate: 5,
    employerMatch: 3,
    otherDeductions: 0,
    theme: "dark",
    roles: { "Server": 10.00, "Host": 18.00 }
  };
  let entries = loadEntries() || [];
  let currentMonthFilter = "all";

  if (!settings.theme) settings.theme = "dark";

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

  // ---------- Storage ----------
  function saveSettings() { localStorage.setItem(LS_SETTINGS, JSON.stringify(settings)); }
  function loadSettings() { try { return JSON.parse(localStorage.getItem(LS_SETTINGS)); } catch { return null; } }
  function saveEntries() { localStorage.setItem(LS_ENTRIES, JSON.stringify(entries)); }
  function loadEntries() { try { return JSON.parse(localStorage.getItem(LS_ENTRIES)); } catch { return null; } }

  // ---------- Role Manager ----------
  function refreshRoleSelect() {
    const sel = document.getElementById("entry-role");
    sel.innerHTML = "";
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
      <td><button class="btn-danger" data-role="${name}">Delete</button></td>`;
      tbody.appendChild(tr);
    }
    tbody.querySelectorAll("button[data-role]").forEach(btn => {
      btn.addEventListener("click", () => {
        const r = btn.getAttribute("data-role");
        if (confirm(`Delete role "${r}"?`)) {
          delete settings.roles[r];
          saveSettings();
          renderSettings();
        }
      });
    });
  }
  function renderSettings() {
    document.getElementById("set-tax").value = settings.taxRate;
    document.getElementById("set-k401").value = settings.k401Rate;
    document.getElementById("set-match").value = settings.employerMatch;
    document.getElementById("set-other").value = settings.otherDeductions;
    const themeSelect = document.getElementById("set-theme");
    if (themeSelect) themeSelect.value = settings.theme || "dark";
    renderRolesTable();
    refreshRoleSelect();
  }
  document.getElementById("add-role").addEventListener("click", () => {
    const name = document.getElementById("role-name").value.trim();
    const rate = parseFloat(document.getElementById("role-rate").value);
    if (!name || !(rate >= 0)) return alert("Enter valid role + rate.");
    settings.roles[name] = rate;
    saveSettings();
    document.getElementById("role-name").value = "";
    document.getElementById("role-rate").value = "";
    renderSettings();
  });
  document.getElementById("save-settings").addEventListener("click", () => {
    settings.taxRate = parseFloat(document.getElementById("set-tax").value) || 0;
    settings.k401Rate = parseFloat(document.getElementById("set-k401").value) || 0;
    settings.employerMatch = parseFloat(document.getElementById("set-match").value) || 0;
    settings.otherDeductions = parseFloat(document.getElementById("set-other").value) || 0;
    settings.theme = document.getElementById("set-theme").value || "dark";
    saveSettings();
    refreshWeekTable();
    applyTheme(settings.theme);
    alert("Settings saved.");
  });

  // ---------- Daily Entry ----------
  document.getElementById("entry-date").value = toISO(new Date());
  document.getElementById("add-entry").addEventListener("click", () => {
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
    saveEntries();

    document.getElementById("entry-hours").value = "";
    document.getElementById("entry-tips").value = "";
    document.getElementById("entry-cash").value = "";
    document.getElementById("entry-tipouts").value = "";
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
      const taxable = gross - k401;
      const tax = taxable * (settings.taxRate / 100);
      const other = gross * (settings.otherDeductions / 100);
      const net = gross - (tax + k401 + other);
      const match = gross * (settings.employerMatch / 100);
      const retirement = k401 + match;

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
        tr.innerHTML = `
      <td data-label="Pay Period" class="week-cell"><button type="button" class="week-toggle" data-summary="${wk.key}" aria-expanded="false"><span class="week-meta"><span class="week-label">Pay Period</span><strong>${fmtDate(wk.weekStart)}–${fmtDate(wk.weekEnd)}</strong></span></button></td>
      <td class="num mobile-extra" data-label="Hours Worked">${t.hours.toFixed(2)} h</td>
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
          <button class="btn-ghost" data-toggle="${wk.key}">Daily Breakdown</button>
          <p class="mobile-hint">Scroll horizontally for more info. Delete options appear inside the daily breakdown.</p>
        </div>
      </td>`;
        tbody.appendChild(tr);

        const details = document.createElement("tr");
        details.className = "week-details";
        details.style.display = "none";
        const colCount = document.querySelector("#weekly-table thead tr").children.length;
        details.innerHTML = `<td colspan="${colCount}"><div class="details-header">Daily Breakdown</div>${weekDetailsHTML(wk)}</td>`;
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
    const summaryKey = e.target?.getAttribute("data-summary");
    if (summaryKey) {
      const row = e.target.closest("tr");
      if (!row) return;
      const open = row.classList.toggle("mobile-summary-open");
      if (e.target instanceof HTMLElement) {
        e.target.setAttribute("aria-expanded", open ? "true" : "false");
        e.target.classList.toggle("expanded", open);
      }
      return;
    }

    const key = e.target?.getAttribute("data-toggle");
    if (key) {
      const row = e.target.closest("tr");
      const details = row.nextElementSibling;
      if (!details || !details.classList.contains("week-details")) return;

      const isMobile = window.innerWidth <= 768;
      const open = details.style.display !== "none" && details.style.display !== "";

      if (open) {
        details.style.display = "none";
        details.classList.remove("details-expanded");
        e.target.textContent = "Daily Breakdown";
      } else {
        details.style.display = isMobile ? "block" : "table-row";
        details.classList.add("details-expanded");
        e.target.textContent = "Hide Daily Breakdown";
      }
    }
  });
  document.addEventListener("click", e => {
    const id = e.target?.getAttribute("data-del");
    if (id && confirm("Delete this entry?")) {
      entries = entries.filter(x => x.id !== id);
      saveEntries();
      refreshWeekTable();
    }
  });

  // ---------- Export / Import / Reset ----------
  document.getElementById("export-data").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ settings, entries }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "income_tracker_backup.json"; a.click();
    URL.revokeObjectURL(url);
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
  document.getElementById("import-csv").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const lines = ev.target.result.trim().split("\n").slice(1);
        let imported = 0;
        for (const line of lines) {
          const parts = line.split(",");
          const [date, role, hours, tips, cashTips, tipOuts] = parts;
          const newEntry = { id: crypto.randomUUID(), date, role, hours: parseFloat(hours), tips: parseFloat(tips), cashTips: parseFloat(cashTips), tipOuts: parseFloat(tipOuts) };
          if (!entries.some(x => x.date === date && x.role === role && Math.abs(x.hours - newEntry.hours) < .01)) {
            entries.push(newEntry); imported++;
          }
        }
        saveEntries(); refreshWeekTable();
        alert(`Imported ${imported} entries`);
      } catch (err) { alert("Bad CSV: " + err.message); }
    };
    reader.readAsText(file);
  });
  document.getElementById("reset-data").addEventListener("click", () => {
    if (confirm("Reset ALL data?")) {
      localStorage.clear();
      location.reload();
    }
  });

  const themeSelectEl = document.getElementById("set-theme");
  if (themeSelectEl) {
    themeSelectEl.addEventListener("change", e => {
      const theme = e.target.value;
      applyTheme(theme);
      settings.theme = theme;
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
  renderSettings();
  applyTheme(settings.theme);
  refreshWeekTable();
  refreshRoleSelect();

});