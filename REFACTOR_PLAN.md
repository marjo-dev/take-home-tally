# Modular ES6 Refactor Plan

## Overview
Refactor `script.js` into a clean, modular ES6 structure organized by functionality. All app behavior, tax calculations, and UI outputs remain identical. This refactor sets up a foundation for a more robust paycheck calculation engine with accurate tax calculations.

## Directory Structure
```
js/
  ├── storage.js                  # IndexedDB operations, migration, persistence
  ├── settings.js                 # Default settings, settings management, role operations
  ├── calculations/
  │   ├── dateUtils.js            # Date utilities (startOfWeekMonday, endOfWeekSunday, calcPayDate)
  │   ├── aggregates/
  │   │   ├── weeklySummaries.js  # Group entries by week, calculate per-week totals
  │   │   └── ytdInsights.js      # Aggregate weekly summaries into YTD totals & averages
  │   └── paycheck/
  │       ├── paycheckEngine.js   # Orchestrates the calculation pipeline
  │       └── calculators/
  │           ├── gross.js         # Calculate gross income (hourly pay + credit tips)
  │           ├── retirement.js   # Calculate retirement (returns: k401, roth401k, contributionTotals, employerMatch, retirementTotal)
  │           ├── taxableIncome.js # Calculate taxable income (gross - pre-tax retirement)
  │           ├── fica.js         # Calculate FICA (Social Security + Medicare)
  │           ├── federal.js      # Calculate federal tax withholding
  │           ├── state.js        # Calculate state tax withholding
  │           ├── netIncome.js    # Calculate net income (gross - all deductions)
  │           ├── cashNet.js      # Calculate cash tips - tip-outs (allows negative)
  │           └── takeHome.js    # Calculate take-home (net + cashNet)
  ├── utils.js                     # General utilities (deepClone, promisifyRequest)
  ├── ui/
  │   ├── renderers.js            # Week table, role table, details table rendering
  │   ├── modal.js                # Modal display functionality
  │   ├── theme.js                # Theme management
  │   ├── navigation.js           # Navigation bar functionality
  │   └── toggles.js              # App/settings description toggles
  ├── export.js                   # Backup/restore, CSV export, data import
  └── app.js                      # Main entry point, event handlers, initialization
```

## Module Breakdown

### `js/storage.js`
- IndexedDB setup (`getDb`, `initStorage`)
- Migration from localStorage (`migrateLocalStorageIfNeeded`)
- Settings persistence (`loadSettings`, `saveSettings`, `snapshotSettings`)
- Entries persistence (`loadEntries`, `saveEntries`, `snapshotEntries`)
- Data clearing (`clearAllData`)
- Exports: storage functions

### `js/settings.js`
- Default settings (`getDefaultSettings`)
- Settings state management
- Role management functions (`refreshRoleSelect`, `renderRolesTable`)
- Settings rendering (`renderSettings`)
- Exports: settings functions and default settings

### `js/utils.js`
- Deep clone utility (`deepClone`)
- Promisify request utility (`promisifyRequest`)
- Money formatting (`fmtMoney`)
- Date formatting (`toISO`, `fmtDate`, `dayName`)
- Exports: utility functions

### `js/calculations/dateUtils.js`
- Week start calculation (`startOfWeekMonday`)
- Week end calculation (`endOfWeekSunday`)
- Pay date calculation (`calcPayDate`)
- Exports: date utility functions

### `js/calculations/paycheck/paycheckEngine.js`
- Orchestrates the calculation pipeline
- Takes entry data and settings, returns complete paycheck calculation
- Pipeline: gross → retirement → taxableIncome → fica → federal → state → netIncome → cashNet → takeHome
- Exports: `calculatePaycheck(entry, settings)` function

### `js/calculations/paycheck/calculators/gross.js`
- Calculate gross income (hourly pay + credit card tips)
- Input: entry (hours, role, tips), settings (roles)
- Output: { gross, hourlyPay, tips }
- Exports: `calculateGross(entry, settings)`

### `js/calculations/paycheck/calculators/retirement.js`
- Calculate retirement contributions
- Input: gross, settings (k401Rate, roth401kRate, employerMatch)
- Output: { k401, roth401k, contributionTotals, employerMatch, retirementTotal }
- Exports: `calculateRetirement(gross, settings)`

### `js/calculations/paycheck/calculators/taxableIncome.js`
- Calculate taxable income (gross - pre-tax retirement deductions)
- Input: gross, retirement (k401)
- Output: { taxableIncome }
- Exports: `calculateTaxableIncome(gross, retirement)`

### `js/calculations/paycheck/calculators/fica.js`
- Calculate FICA (Social Security + Medicare)
- Input: taxableIncome, settings
- Output: { socialSecurity, medicare, ficaTotal }
- Exports: `calculateFICA(taxableIncome, settings)`

### `js/calculations/paycheck/calculators/federal.js`
- Calculate federal tax withholding
- Input: taxableIncome, settings (filing status, allowances, etc.)
- Output: { federalTax }
- Exports: `calculateFederal(taxableIncome, settings)`

### `js/calculations/paycheck/calculators/state.js`
- Calculate state tax withholding
- Input: taxableIncome, settings (state, state allowances, etc.)
- Output: { stateTax }
- Exports: `calculateState(taxableIncome, settings)`

### `js/calculations/paycheck/calculators/netIncome.js`
- Calculate net income (gross - all deductions)
- Input: gross, retirement, fica, federal, state
- Output: { netIncome }
- Exports: `calculateNetIncome(gross, deductions)`

### `js/calculations/paycheck/calculators/cashNet.js`
- Calculate cash tips - tip-outs (allows negative values)
- Input: entry (cashTips, tipOuts)
- Output: { cashNet }
- Exports: `calculateCashNet(entry)`

### `js/calculations/paycheck/calculators/takeHome.js`
- Calculate take-home amount (net + cashNet)
- Input: netIncome, cashNet
- Output: { takeHome }
- Exports: `calculateTakeHome(netIncome, cashNet)`

### `js/calculations/aggregates/weeklySummaries.js`
- Group entries by week using dateUtils
- Calculate per-week totals using paycheckEngine
- Handle month filtering logic
- Return array of week objects with totals
- Exports: `aggregateWeeks(entries, settings)`

### `js/calculations/aggregates/ytdInsights.js`
- Take array of weekly summaries
- Calculate cumulative totals (sumGross, sumTax, sumNet, etc.)
- Calculate averages (avgGross, avgTax, avgNet, etc.)
- Return YTD summary object
- Exports: `calculateYTD(weeklySummaries)`

### `js/ui/renderers.js`
- Week table rendering (`refreshWeekTable`)
- Week details HTML (`weekDetailsHTML`)
- Month filter options (`refreshMonthFilterOptions`)
- YTD labels sync (`syncYtdLabels`)
- Role table rendering
- Exports: rendering functions

### `js/ui/modal.js`
- Modal display (`showModal`)
- Exports: modal function

### `js/ui/theme.js`
- Theme application (`applyTheme`)
- Exports: theme function

### `js/ui/navigation.js`
- Navigation bar functionality (page switching, active state management)
- Handles `.top-nav button` clicks and page activation
- Exports: `initNavigation()` function

### `js/ui/toggles.js`
- App description toggle functionality
- Settings description toggle functionality
- Exports: `initToggles()` function

### `js/export.js`
- JSON backup export
- CSV export
- JSON import/restore
- Entry sanitization (`sanitizeBackupEntry`)
- Exports: export/import functions

### `js/app.js`
- App state (settings, entries, currentMonthFilter)
- Event handlers (entry form, settings form, role management, delete, toggle, export/import)
- Initialization logic
- DOMContentLoaded setup
- Imports all modules and wires everything together
- Initializes navigation and UI toggles

## Implementation Details

1. **ES6 Modules**: All files use `export`/`import` syntax
2. **State Management**: App state (settings, entries) managed in `app.js` and passed to modules as needed
3. **Calculation Engine**: Paycheck calculations are modular and pipeline-based, ready for accurate tax logic
4. **Dependencies**: Modules import only what they need
5. **HTML Update**: Update `index.html` to load `js/app.js` as module: `<script type="module" src="js/app.js"></script>`
6. **Remove Inline Scripts**: Remove navigation and toggle scripts from `index.html` (they'll be in modules)
7. **Settings Snapshots**: Each entry stores a snapshot of relevant settings at creation time for historical accuracy
8. **Entry Structure**: Entries include `settingsSnapshot` field with: `{ roleRate, k401Rate, roth401kRate, employerMatch, taxRate }`
9. **Calculation Behavior**: Use snapshot settings for role rates (historical accuracy), snapshot or current settings for tax/retirement (configurable)
10. **Migration Strategy**: Backfill existing entries with current settings as snapshot on first load after refactor
11. **No Behavior Changes**: All calculations, tax logic, and UI rendering remain identical during refactor

## Files to Modify
- `script.js` → Keep as backup (not deleted, but not referenced in index.html)
- `index.html` → Remove `<script src="script.js"></script>`, add `<script type="module" src="js/app.js"></script>`, remove inline navigation/toggle scripts
- Create new `js/` directory with all module files

## Testing Checklist
- [ ] Settings save/load correctly
- [ ] Entries add/delete correctly
- [ ] Week aggregation calculations unchanged
- [ ] Tax calculations produce same results (during refactor)
- [ ] UI rendering matches original
- [ ] Export/import works
- [ ] Theme switching works
- [ ] Navigation between pages works
- [ ] Toggle buttons work (app description, settings description)
- [ ] All event handlers function correctly
- [ ] Retirement components tracked separately (k401, roth401k, contributionTotals, employerMatch, retirementTotal)
- [ ] Settings snapshots stored with entries
- [ ] Historical calculations use snapshot settings
- [ ] Migration backfills existing entries with settings snapshots

## Performance Optimizations (Future)
- [ ] Fix forced reflow warnings (40ms+ layout thrashing)
  - Optimize `scrollIntoView()` in `handleEditRole()`
  - Batch DOM reads/writes in `refreshWeekTable()`
  - Optimize `renderRolesTable()` DOM operations
  - Consider using `requestAnimationFrame` for visual updates

