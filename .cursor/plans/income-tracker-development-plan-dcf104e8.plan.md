<!-- dcf104e8-8383-476d-ae50-1a898eb3f915 ad85ef9b-3f7a-4c64-99c2-09a31605c2af -->
# Income Tracker Development Plan

## Current Implementation

The app currently uses manual user input for tax calculations:

- Settings page (`index.html` lines 31-33) has a "Tax Rate (%)" input field
- Tax calculation in `script.js` (line 454) uses: `tax = taxable * (settings.taxRate / 100)`
- Default tax rate is 12% (line 18)

## Future Features

### Onboarding Experience for New Users

**Feature: Interactive Onboarding Flow**

- Detect first-time users (check if settings exist or entries are empty)
- Multi-step onboarding wizard that guides users through app setup
- Collect tax information needed for accurate calculations
- Introduce app capabilities and features

**Onboarding Steps:**

1. **Welcome Screen**

- App introduction and value proposition
- Brief overview of what the app does
- "Get Started" button to begin setup

2. **Tax Information Collection**

- Federal tax filing status:
- Single
- Married Filing Jointly
- Married Filing Separately
- Head of Household
- Qualifying Widow(er) with Dependent Child
- State selection (for future state tax calculations)
- Number of dependents
- Additional income sources (optional, for more accurate tax estimates)
- Store in settings as `taxFilingStatus`, `state`, `dependents`, etc.

3. **Role Setup**

- Guide users to add their first role (instead of using defaults)
- Explain what roles are and how they're used
- Allow adding multiple roles during onboarding
- Remove or update default roles based on user input

4. **Settings Configuration**

- Walk through key settings:
- 401(k) contribution percentage
- Employer match percentage
- Other deductions
- Theme preference
- Explain what each setting does with helpful tooltips

5. **Feature Tour**

- Highlight key pages: Daily Entry, Weekly Summary, Year-to-Date
- Show how to add first entry with guided example
- Explain tip tracking (credit vs cash)
- Show where to find weekly summaries and pay dates

6. **First Entry Tutorial**

- Optional interactive tutorial for adding first daily entry
- Step-by-step guidance with highlights/overlays
- "Skip tutorial" option for experienced users

**Implementation Details:**

- Create onboarding modal/overlay component in `index.html`
- Add `hasCompletedOnboarding` flag to settings
- Check on app initialization (`script.js` line 817-851)
- Store onboarding state in IndexedDB
- Allow users to restart onboarding from Settings page
- Make onboarding dismissible but encourage completion
- Files to modify:
- `index.html`: Add onboarding modal structure
- `script.js`: Add onboarding logic, state management, and tax info storage
- `style.css`: Style onboarding modals and overlays

### Automatic Tax and Deduction Calculations

**Feature 1: Progressive Tax Bracket Calculation**

- Implement tax bracket logic based on weekly taxable income
- Use current year federal tax brackets to calculate expected tax deductions
- Calculate tax based on progressive brackets rather than flat percentage
- Location: `script.js` - new function `calculateFederalTax(weeklyTaxableIncome)`

**Feature 2: Social Security and Medicare Deductions**

- Add Social Security tax calculation (6.2% on wages up to wage base limit)
- Add Medicare tax calculation (1.45% on all wages, 0.9% additional for high earners)
- Include wage base limits that reset annually
- Location: `script.js` - new functions `calculateSocialSecurity(grossIncome)` and `calculateMedicare(grossIncome)`

**Feature 3: Replace Manual Tax Input with Automatic Calculations**

- Remove or deprecate the "Tax Rate (%)" input field from Settings page
- Update `aggregateWeeks()` function to use automatic tax calculations instead of `settings.taxRate`
- Update CSV export to reflect new calculation method
- Maintain backward compatibility during transition period
- Files to modify:
- `index.html` (lines 30-33): Update or remove tax rate input
- `script.js` (line 454, 711): Replace tax calculation logic
- `script.js` (line 18): Remove default taxRate from settings

**Feature 4: Settings Page Updates**

- Add toggle or option to use automatic vs manual tax calculations (for transition)
- Display calculated tax breakdown (federal, social security, medicare) in weekly summary
- Update UI to show individual deduction components
- Files to modify:
- `index.html`: Update settings section
- `script.js`: Add settings flag for calculation method

**Implementation Notes:**

- Tax brackets should be configurable or updated annually
- Consider state tax calculations as future enhancement
- Social Security wage base limit for 2024: $168,600 (needs annual update)
- Medicare additional tax threshold: $200,000 single / $250,000 married
- Weekly calculations should account for annual limits (pro-rated or cumulative tracking)

### To-dos

- [ ] Implement progressive federal tax bracket calculation function based on weekly taxable income
- [ ] Implement Social Security (6.2% up to wage base) and Medicare (1.45% base, 0.9% additional for high earners) calculation functions
- [ ] Update aggregateWeeks() and CSV export to use automatic tax/deduction calculations instead of settings.taxRate
- [ ] Remove or deprecate manual Tax Rate input field from Settings page and add toggle for automatic calculations
- [ ] Update weekly summary table to display individual deduction components (federal tax, social security, medicare)