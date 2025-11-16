// UI rendering functions for week table, role table, details table, etc.

import { fmtMoney, fmtDate, dayName } from "../utils.js";
import { aggregateWeeks } from "../calculations/aggregates/weeklySummaries.js";
import { calculateYTD } from "../calculations/aggregates/ytdInsights.js";

const monthNames = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

function monthLabelFromKey(key) {
  const date = new Date(`${key}-01T00:00:00`);
  return monthNames.format(date);
}

export function syncYtdLabels() {
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

export function refreshMonthFilterOptions(weeks, currentMonthFilter) {
  const select = document.getElementById("month-filter");
  if (!select) return currentMonthFilter;

  const monthSet = new Set();
  for (const wk of weeks) {
    wk.monthKeys.forEach(key => monthSet.add(key));
  }

  const months = Array.from(monthSet).sort().reverse();
  const previous = currentMonthFilter;

  select.innerHTML = `<option value="all">All months</option>` + months.map(key => `<option value="${key}">${monthLabelFromKey(key)}</option>`).join("");

  let newFilter = currentMonthFilter;
  if (previous !== "all" && !months.includes(previous)) {
    newFilter = "all";
  }

  select.value = newFilter;
  return newFilter;
}

export function weekDetailsHTML(wk, settings) {
  const rows = wk.days.map(d => {
    const rate = d.settingsSnapshot?.roleRate ?? settings.roles[d.role] ?? 0;
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

export function refreshWeekTable(entries, settings, currentMonthFilter) {
  const weeks = aggregateWeeks(entries, settings);
  const newFilter = refreshMonthFilterOptions(weeks, currentMonthFilter);

  const filterSelect = document.getElementById("month-filter");
  const activeFilter = filterSelect ? filterSelect.value || newFilter : newFilter;

  const tbody = document.querySelector("#weekly-table tbody");
  if (!tbody) return activeFilter;

  tbody.innerHTML = "";

  // Calculate YTD totals
  const ytd = calculateYTD(weeks);

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

      // Helper function to create label with info button
      const createLabelWithInfo = (labelText, helpText, className = "") => {
        return `<span class="metric-label ${className}">${labelText}<button type="button" class="info-btn" data-help="${helpText}">ⓘ</button></span>`;
      };

      tr.innerHTML = `
      <td class="week-cell"><button type="button" class="week-toggle" data-summary="${wk.key}" aria-expanded="false"><span class="week-meta"><span class="week-label">Pay Period</span><strong>${fmtDate(wk.weekStart)} &ndash; ${fmtDate(wk.weekEnd)}</strong></span><span class="toggle-hint muted">tap to expand</span></button></td>
      <td class="num metric-hours">${createLabelWithInfo("Hours Worked", "Total hours worked during the pay period", "label-hours")}<span class="metric-value">${t.hours.toFixed(2)} h</span></td>
      <td class="num mobile-extra metric-hourly-wages">${createLabelWithInfo("Hourly Wages", "Total hourly pay calculated as hours worked × hourly rate for your role(s)", "label-hourly-wages")}<span class="metric-value">${fmtMoney(t.hourlyPay)}</span></td>
      <td class="num mobile-extra metric-cc-tips">${createLabelWithInfo("Total Credit Card Tips", "Tips received via credit card payments. These are included in your taxable income.", "label-cc-tips")}<span class="metric-value">${fmtMoney(t.tips)}</span></td>
      <td class="num mobile-extra metric-cash-tips">${createLabelWithInfo("Total Cash Tips", "Cash tips received before tip-outs. These are added to your take-home amount and does not affect your taxable income.", "label-cash-tips")}<span class="metric-value">${fmtMoney(t.cashTips)}</span></td>
      <td class="num mobile-extra metric-gross">${createLabelWithInfo("Gross Income", "Hourly wages + credit card tips. This is your income before any deductions are applied. If you don't contribute to a 401(k), this should be the same as your taxable income.", "label-gross")}<span class="metric-value">${fmtMoney(t.gross)}</span></td>
      <td class="num mobile-extra metric-taxable">${createLabelWithInfo("Taxable Income", "Gross income minus 401(k) contributions. This is the amount your taxes are calculated on. If you don't contribute to a 401(k), this should be the same as your gross income.", "label-taxable")}<span class="metric-value">${fmtMoney(t.taxableIncome)}</span></td>
      <td class="num mobile-extra metric-tax">${createLabelWithInfo("Estimated Tax Deduction", "Tax amount calculated from taxable income using your tax rate setting. This is an estimate and may differ from your actual paycheck.", "label-tax")}<span class="metric-value">${fmtMoney(t.tax)}</span></td>
      <td class="paydate metric-paydate">${createLabelWithInfo("Pay Date", "The date you will receive your paycheck (typically 3 days after the week ends)", "label-paydate")}<span class="metric-value">${fmtDate(wk.payDateISO)}</span></td>
      <td class="num netcell metric-net">${createLabelWithInfo("Net Income", "Gross income minus all deductions (tax, 401k, Roth 401k, other). This is your estimated paycheck amount that gets deposited into your bank account.", "label-net")}<span class="metric-sublabel">(Estimated Paycheck Amount)</span><span class="metric-value"><strong>${fmtMoney(t.net)}</strong></span></td>
      <td class="num mobile-extra takehome metric-takehome">${createLabelWithInfo("Total Take-Home Amount", "This is what you actually take home for the week. It's the total of your paycheck amount and cash tips minus tip-outs.", "label-takehome")}<span class="metric-value"><strong>${fmtMoney(t.takeHome)}</strong></span></td>
      <td class="num mobile-extra metric-tipouts">${createLabelWithInfo("Total Tip-Outs", "Total amount you tipped out to co-workers (hosts, expo, bartenders, etc.) during this pay period.", "label-tipouts")}<span class="metric-value">${fmtMoney(t.tipOuts)}</span></td>
      <td class="num mobile-extra metric-retirement">${createLabelWithInfo("Retirement Contribution", "Sum of your 401(k), Roth 401(k), and employer match contributions for this pay period.", "label-retirement")}<span class="metric-value">${fmtMoney(t.retirement)}</span></td>
      <td class="num mobile-extra metric-match">${createLabelWithInfo("Employer Match", "Your employer's matching contribution to your retirement account. Free money!", "label-match")}<span class="metric-value">${fmtMoney(t.match)}</span></td>
      <td class="mobile-actions">
        <div class="action-stack">
          <button class="btn-ghost" data-toggle="${wk.key}" aria-expanded="false" aria-controls="${detailsId}">Details</button>
          <p class="mobile-hint">Tap the Details button above ⬆️ to reveal income breakdowns by day.<br> Scroll ⬅️ horizontally ➡️ to see more info.<br> <strong>Delete</strong> option appears at the end of each row.</p>
        </div>
      </td>`;
      tbody.appendChild(tr);

      const details = document.createElement("tr");
      details.className = "week-details";
      details.id = detailsId;
      details.hidden = true;
      const colCount = 15;
      details.innerHTML = `<td colspan="${colCount}"><div class="details-header">Daily Breakdown</div><div class="details-table-wrapper">${weekDetailsHTML(wk, settings)}</div></td>`;
      tbody.appendChild(details);
    }
  }

  // Update YTD stats
  const statWeeksEl = document.getElementById("stat-weeks");
  const statGrossEl = document.getElementById("stat-gross");
  const statTaxEl = document.getElementById("stat-tax");
  const statNetEl = document.getElementById("stat-net");
  const statRetireEl = document.getElementById("stat-retire");
  const statTakehomeEl = document.getElementById("stat-takehome");
  const statTipoutsEl = document.getElementById("stat-tipouts");
  const avgGrossEl = document.getElementById("avg-gross");
  const avgTaxEl = document.getElementById("avg-tax");
  const avgNetEl = document.getElementById("avg-net");
  const avgHoursEl = document.getElementById("avg-hours");
  const avgRetireEl = document.getElementById("avg-retire");
  const avgTakehomeEl = document.getElementById("avg-takehome");
  const avgTipoutsEl = document.getElementById("avg-tipouts");

  if (statWeeksEl) statWeeksEl.textContent = ytd.totalWeeks;
  if (statGrossEl) statGrossEl.textContent = fmtMoney(ytd.totals.gross);
  if (statTaxEl) statTaxEl.textContent = fmtMoney(ytd.totals.tax);
  if (statNetEl) statNetEl.textContent = fmtMoney(ytd.totals.net);
  if (statRetireEl) statRetireEl.textContent = fmtMoney(ytd.totals.retirement);
  if (statTakehomeEl) statTakehomeEl.textContent = fmtMoney(ytd.totals.takeHome);
  if (statTipoutsEl) statTipoutsEl.textContent = fmtMoney(ytd.totals.tipOuts);

  if (avgGrossEl) avgGrossEl.textContent = fmtMoney(ytd.averages.gross);
  if (avgTaxEl) avgTaxEl.textContent = fmtMoney(ytd.averages.tax);
  if (avgNetEl) avgNetEl.textContent = fmtMoney(ytd.averages.net);
  if (avgHoursEl) avgHoursEl.textContent = ytd.averages.hours.toFixed(2) + " h";
  if (avgRetireEl) avgRetireEl.textContent = fmtMoney(ytd.averages.retirement);
  if (avgTakehomeEl) avgTakehomeEl.textContent = fmtMoney(ytd.averages.takeHome);
  if (avgTipoutsEl) avgTipoutsEl.textContent = fmtMoney(ytd.averages.tipOuts);

  return activeFilter;
}

