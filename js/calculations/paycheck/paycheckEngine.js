// Paycheck calculation engine - orchestrates the calculation pipeline

import { calculateGross } from "./calculators/gross.js";
import { calculatePreTax } from "./calculators/preTax.js";
import { calculateRetirement } from "./calculators/retirement.js";
import { calculateTaxableIncome } from "./calculators/taxableIncome.js";
import { calculateFICA } from "./calculators/fica.js";
import { calculateFederal } from "./calculators/federal.js";
import { calculateState } from "./calculators/state.js";
import { calculateNetIncome } from "./calculators/netIncome.js";
import { calculateCashNet } from "./calculators/cashNet.js";
import { calculateTakeHome } from "./calculators/takeHome.js";

/**
 * Calculate complete paycheck breakdown for a single entry
 * @param {Object} entry - Entry with date, role, hours, tips, cashTips, tipOuts, settingsSnapshot
 * @param {Object} settings - Current settings (used as fallback if entry has no snapshot)
 * @returns {Object} Complete paycheck calculation
 */
export function calculatePaycheck(entry, settings) {
  // Use snapshot settings if available, otherwise use current settings
  const effectiveSettings = entry.settingsSnapshot
    ? { ...settings, roles: { ...settings.roles, [entry.role]: entry.settingsSnapshot.roleRate } }
    : settings;

  // For tax/retirement calculations, use snapshot if available, otherwise current
  const taxSettings = entry.settingsSnapshot
    ? { ...settings, ...entry.settingsSnapshot }
    : settings;

  // Pipeline: gross → preTax → taxableIncome → taxes → retirement → netIncome → cashNet → takeHome
  const gross = calculateGross(entry, effectiveSettings);
  const preTax = calculatePreTax(gross.gross, taxSettings);
  const taxableIncome = calculateTaxableIncome(gross.gross, preTax);
  const fica = calculateFICA(taxableIncome.taxableIncome, taxSettings);
  const federal = calculateFederal(taxableIncome.taxableIncome, taxSettings);
  const state = calculateState(taxableIncome.taxableIncome, taxSettings);
  const retirement = calculateRetirement(gross.gross, preTax, taxSettings);
  const netIncome = calculateNetIncome(gross.gross, preTax, retirement, fica, federal, state);
  const cashNet = calculateCashNet(entry);
  const takeHome = calculateTakeHome(netIncome.netIncome, cashNet);

  return {
    ...gross,
    ...preTax,
    ...retirement,
    ...taxableIncome,
    ...fica,
    ...federal,
    ...state,
    ...netIncome,
    ...cashNet,
    ...takeHome
  };
}

