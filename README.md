# 🧾 TakeHome Tally

A progressive web app (PWA) for tracking variable income (tips, hourly wages, tipouts, taxes, 401k, etc.) to calculate and visualize estimated take-home pay over time.

---

## ✨ Features

### 💰 Income & Shift Tracking

- **Daily Logs** – Record shifts with date, hours worked, and role.
- **Multiple Roles** – Support for different hourly rates across job types.
- **Tip Entries** – Separate fields for cash and credit card tips for tax calculation.
- **Tipouts** – Track amounts tipped out to support staff.

### 🧮 Calculations & Deductions

- **Gross Pay Estimation** – Calculate estimated gross income from hourly wages and tips.
- **Tax Deductions** _(work in progress)_ – Preliminary logic for estimating withheld taxes (federal, state, FICA).
- **Retirement Tracking** – Log employee contributions and employer match amounts.

### 📊 Summaries & Insights

- **Take-Home Overview** – View calculated post-deduction income.
- **Weekly Reports and Monthly Filters** – Review earnings trends over time.
- **Averages & YTD Insights** – Calculate average weekly hours, average weekly pay, and year-to-date totals for gross, tax, net income, etc.
- **Role-Based Insights** – Compare income performance by position.

### 🌗 Interface

- **Dark Mode Toggle** – Built-in light/dark mode switch.
- **Offline Support** – Data stored locally using IndexedDB for persistence.
- **Data Export** – Export or back up logs as JSON or CSV.

---

### 🔮 Planned Enhancements (Details)

#### 🧮 Tax Calculation

- Replace manual “Tax Rate (%)” field with automatic deductions based on user-selected location.
- Current app implementation of this logic uses **manual user input** for tax calculations.
  - Users can enter a **“Tax Rate (%)”** in the **Settings** page.
  - This tax rate is applied to the user’s taxable income to provide basic deduction estimates.

#### 🧭 Onboarding Experience

- Detect first-time users (missing settings or empty entries).
- Step-by-step onboarding to collect tax preferences and introduce core features.
- Optional tooltips or guided popups for ongoing app discovery.

#### 📊 Earnings Insights, Reports & Visualization

- Future comparison mode for analyzing pay trends over time.
- Generate and export summaries as CSV or PDF for recordkeeping.
- Add charts for clearer visualization of income breakdowns and trends.

#### ☁️ Cloud Sync & Backend

- Introduce optional cloud backup and account login.
- Lightweight backend planned (e.g., Firebase, Supabase, or Node-based API) for:
  - Authentication
  - Data sync between devices
  - Encrypted backups and restores

#### 💻 Code Refactor and Tech Stack Upgrade

- Plans for a full code refactor focused on performance, scalability, and easier long-term maintenance and feature development. This will include reorganizing the current HTML/CSS/JS codebase, introducing Sass for cleaner and more maintainable styling, adding TypeScript for stronger type safety and reliability, and preparing the app for a future migration to a more robust framework like React.

---

## 🧱 Tech Stack

| Layer              | Technology                | Purpose                                              |
| :----------------- | :------------------------ | :--------------------------------------------------- |
| **Frontend**       | HTML, CSS, JavaScript     | Core structure and logic.                            |
| **Storage**        | IndexedDB                 | Local data persistence for offline-first experience. |
| **App Type**       | Progressive Web App (PWA) | Cross-platform installability and offline access.    |
| **Export Formats** | JSON, CSV                 | Data backup and import/export support.               |
| **UI Features**    | Custom CSS + JS           | Responsive layout with dark-mode toggle.             |
