document.addEventListener("DOMContentLoaded", () => {

  // ---------- Storage Keys ----------
  const LS_SETTINGS = "it_settings_v1";
  const LS_ENTRIES = "it_entries_v1";

  // ---------- App State ----------
  let settings = loadSettings() || {
    taxRate: 19,
    k401Rate: 5,
    employerMatch: 4,
    otherDeductions: 0,
    roles: { "Server": 10.35, "Host": 15.50 }
  };
  let entries = loadEntries() || [];

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

  // ---------- Storage Handlers ----------
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
      <td>${fmtMoney(rate)}</td>
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
    saveSettings();
    refreshWeekTable();
    alert("Settings saved.");
  });

  // ---------- Daily Entry ----------
  document.getElementById("entry-date").value = toISO(new Date());

  document.getElementById("add-entry").addEventListener("click", () => {
    const date = document.getElementById("entry-date").value;
    const role = document.getElementById("entry-role").value;
    const hours = parseFloat(document.getElementById("entry-hours").value);
    const tips = parseFloat(document.getElementById("entry-tips").value) || 0;

    if (!date || !role || !(hours > 0)) return alert("Complete all fields!");
    entries.push({ id: crypto.randomUUID(), date, role, hours, tips });
    saveEntries();

    document.getElementById("entry-hours").value = "";
    document.getElementById("entry-tips").value = "";
    refreshWeekTable();
  });

  // Autofocus flow
  document.getElementById("entry-date").addEventListener("change", () => document.getElementById("entry-role").focus());
  document.getElementById("entry-role").addEventListener("change", () => document.getElementById("entry-hours").focus());
  document.getElementById("entry-hours").addEventListener("keyup", (e) => { if (e.key === "Enter") document.getElementById("entry-tips").focus(); });
  document.getElementById("entry-tips").addEventListener("keyup", (e) => { if (e.key === "Enter") document.getElementById("add-entry").click(); });

  // Today button
  document.getElementById("today-btn").addEventListener("click", () => {
    document.getElementById("entry-date").value = toISO(new Date());
    document.getElementById("entry-role").focus();
  });

  // ---------- Weekly Summary ----------
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
      let hrs = 0, pay = 0, tips = 0;
      for (const d of list) {
        const rate = settings.roles[d.role] || 0;
        hrs += d.hours; pay += d.hours * rate; tips += d.tips;
      }
      const gross = pay + tips;
      const k401 = gross * (settings.k401Rate / 100);
      const taxable = gross - k401;
      const tax = taxable * (settings.taxRate / 100);
      const other = gross * (settings.otherDeductions / 100);
      const net = gross - (tax + k401 + other);
      const match = gross * (settings.employerMatch / 100);
      const retirement = k401 + match;

      weeks.push({
        key: `${wkStart}_${wkEnd}`,
        weekStart: wkStart,
        weekEnd: wkEnd,
        days: list,
        totals: { hours: hrs, hourlyPay: pay, tips, gross, taxableIncome: taxable, tax, net, retirement, match }
      });
    }
    return weeks.sort((a, b) => b.weekEnd.localeCompare(a.weekEnd));
  }

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
        <td class="num">${fmtMoney(d.tips)}</td>
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
          <th class="num">Tips</th>
          <th class="num">Gross</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${rows || "<tr><td colspan='8' class='muted'>No entries</td></tr>"}
      </tbody>
    </table>`;
  }

  function refreshWeekTable() {

    // Optional: Add highlight animation when values change
    document.querySelectorAll('.stats-paired span, .stats-paired strong').forEach(el => {
      el.classList.add('data-updated');
      setTimeout(() => el.classList.remove('data-updated'), 350);
    });


    const weeks = aggregateWeeks(entries);
    const tbody = document.querySelector("#weekly-table tbody");
    tbody.innerHTML = "";

    let sumGross = 0, sumTax = 0, sumNet = 0, sumRet = 0, sumHours = 0;

    for (const wk of weeks) {
      const t = wk.totals;
      sumGross += t.gross; sumTax += t.tax; sumNet += t.net; sumRet += t.retirement; sumHours += t.hours;

      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td><strong>${fmtDate(wk.weekStart)}–${fmtDate(wk.weekEnd)}</strong></td>
      <td>${t.hours.toFixed(2)} h</td>
      <td>${fmtMoney(t.hourlyPay)}</td>
      <td>${fmtMoney(t.tips)}</td>
      <td>${fmtMoney(t.gross)}</td>
      <td>${fmtMoney(t.taxableIncome)}</td>
      <td>${fmtMoney(t.tax)}</td>
      <td><strong>${fmtMoney(t.net)}</strong></td>
      <td>${fmtMoney(t.retirement)}</td>
      <td>${fmtMoney(t.match)}</td>
      <td><button class="btn-ghost" data-toggle="${wk.key}">Details</button></td>`;
      tbody.appendChild(tr);

      const details = document.createElement("tr");
      details.style.display = "none";
      details.innerHTML = `<td colspan="11">${weekDetailsHTML(wk)}</td>`;
      tbody.appendChild(details);
    }

    document.getElementById("stat-weeks").textContent = weeks.length;
    document.getElementById("stat-gross").textContent = fmtMoney(sumGross);
    document.getElementById("stat-tax").textContent = fmtMoney(sumTax);
    document.getElementById("stat-net").textContent = fmtMoney(sumNet);
    document.getElementById("stat-retire").textContent = fmtMoney(sumRet);

    document.getElementById("avg-gross").textContent = fmtMoney(weeks.length ? (sumGross / weeks.length) : 0);
    document.getElementById("avg-tax").textContent = fmtMoney(weeks.length ? (sumTax / weeks.length) : 0);
    document.getElementById("avg-net").textContent = fmtMoney(weeks.length ? (sumNet / weeks.length) : 0);
    document.getElementById("avg-hours").textContent = weeks.length ? (sumHours / weeks.length).toFixed(2) + " h" : "0.0 h";
    document.getElementById("avg-retire").textContent =
      weeks.length ? fmtMoney(sumRet / weeks.length) : "$0.00";
  }

  // Toggle Details
  document.addEventListener("click", e => {
    const key = e.target?.getAttribute("data-toggle");
    if (key) {
      const row = e.target.closest("tr");
      const details = row.nextElementSibling;
      const open = details.style.display === "table-row";
      details.style.display = open ? "none" : "table-row";
      e.target.textContent = open ? "Details" : "Hide Details";
    }
  });

  // Delete Entry
  document.addEventListener("click", e => {
    const id = e.target?.getAttribute("data-del");
    if (id && confirm("Delete this entry?")) {
      entries = entries.filter(x => x.id !== id);
      saveEntries();
      refreshWeekTable();
    }
  });

  // ---------- EXPORT JSON ----------
  document.getElementById("export-data").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ settings, entries }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "income_tracker_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  // ---------- EXPORT CSV ----------
  document.getElementById("export-csv").addEventListener("click", () => {
    if (!entries.length) return alert("No entries!");
    const header = [
      "Date", "Role", "Hours", "Tips", "Hourly Pay", "Gross", "401k", "Taxable Income", "Tax", "Other", "Net", "Employer Match", "Retirement"
    ];
    const rows = entries.map(e => {
      const rate = settings.roles[e.role] || 0;
      const gross = e.hours * rate + (e.tips || 0);
      const k401 = gross * (settings.k401Rate / 100);
      const taxable = gross - k401;
      const tax = taxable * (settings.taxRate / 100);
      const other = gross * (settings.otherDeductions / 100);
      const net = gross - (tax + k401 + other);
      const match = gross * (settings.employerMatch / 100);
      const retire = k401 + match;
      return [
        e.date, e.role,
        e.hours.toFixed(2), e.tips.toFixed(2), rate.toFixed(2),
        gross.toFixed(2), k401.toFixed(2), taxable.toFixed(2),
        tax.toFixed(2), other.toFixed(2), net.toFixed(2),
        match.toFixed(2), retire.toFixed(2)
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
  });

  // ---------- IMPORT CSV ----------
  document.getElementById("import-csv").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const lines = ev.target.result.trim().split("\n").slice(1);
        let imported = 0;
        for (const line of lines) {
          const [date, role, hours, tips] = line.split(",");
          const newEntry = { id: crypto.randomUUID(), date, role, hours: parseFloat(hours), tips: parseFloat(tips) };
          if (!entries.some(x => x.date === date && x.role === role && Math.abs(x.hours - newEntry.hours) < .01 && Math.abs(x.tips - newEntry.tips) < .01)) {
            entries.push(newEntry); imported++;
          }
        }
        saveEntries();
        refreshWeekTable();
        alert(`Imported ${imported} entries`);
      } catch (err) {
        alert("Bad CSV: " + err.message);
      }
    };
    reader.readAsText(file);
  });

  // ---------- RESET ----------
  document.getElementById("reset-data").addEventListener("click", () => {
    if (confirm("Reset ALL data?")) {
      localStorage.clear();
      location.reload();
    }
  });

  // ---------- Startup ----------
  renderSettings();
  refreshWeekTable();
  refreshRoleSelect();

});