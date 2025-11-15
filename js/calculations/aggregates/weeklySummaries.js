// Group entries by week and calculate per-week totals

import { startOfWeekMonday, endOfWeekSunday, calcPayDate } from "../dateUtils.js";
import { calculatePaycheck } from "../paycheck/paycheckEngine.js";

export function aggregateWeeks(entries, settings) {
  const map = new Map();
  
  // Group entries by week
  for (const e of entries) {
    const wk = startOfWeekMonday(e.date);
    if (!map.has(wk)) map.set(wk, []);
    map.get(wk).push(e);
  }

  const weeks = [];
  
  for (const [wkStart, list] of map.entries()) {
    const wkEnd = endOfWeekSunday(wkStart);
    
    // Aggregate raw values
    let hours = 0;
    let hourlyPay = 0;
    let tips = 0;
    let cashTips = 0;
    let tipOuts = 0;
    
    // Calculate totals using paycheck engine for each entry
    let gross = 0;
    let taxableIncome = 0;
    let tax = 0;
    let net = 0;
    let takeHome = 0;
    let k401 = 0;
    let roth401k = 0;
    let totalContributions = 0;
    let employerMatch = 0;
    let totalRetirement = 0;
    
    for (const entry of list) {
      const calc = calculatePaycheck(entry, settings);
      
      hours += entry.hours;
      hourlyPay += calc.hourlyPay;
      tips += calc.tips;
      cashTips += entry.cashTips || 0;
      tipOuts += entry.tipOuts || 0;
      
      gross += calc.gross;
      taxableIncome += calc.taxableIncome;
      tax += calc.federalTax; // For now, federalTax includes all tax
      net += calc.netIncome;
      takeHome += calc.takeHome;
      k401 += calc.k401;
      roth401k += calc.roth401k;
      totalContributions += calc.totalContributions;
      employerMatch += calc.employerMatch;
      totalRetirement += calc.totalRetirement;
    }

    const payDateISO = calcPayDate(wkEnd);

    // Calculate month keys for filtering
    const monthsInPeriod = new Set();
    const start = new Date(wkStart + "T00:00:00");
    const end = new Date(wkEnd + "T00:00:00");
    const cursor = new Date(start);
    while (cursor <= end) {
      monthsInPeriod.add(cursor.toISOString().slice(0, 7));
      cursor.setDate(cursor.getDate() + 1);
    }
    // Also ensure pay date month is included
    monthsInPeriod.add(payDateISO.slice(0, 7));

    weeks.push({
      key: `${wkStart}_${wkEnd}`,
      weekStart: wkStart,
      weekEnd: wkEnd,
      payDateISO,
      monthKeys: [...monthsInPeriod],
      days: list,
      totals: {
        hours,
        hourlyPay,
        tips,
        cashTips,
        tipOuts,
        gross,
        taxableIncome,
        tax, // For now, this is federalTax (includes all tax)
        net,
        takeHome,
        retirement: totalRetirement,
        match: employerMatch,
        k401,
        roth401k,
        totalContributions,
        employerMatch,
        totalRetirement
      }
    });
  }

  return weeks.sort((a, b) => b.weekEnd.localeCompare(a.weekEnd));
}

