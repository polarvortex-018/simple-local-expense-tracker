# Cash Buddy — Complete Release & Version History

This document tracks the complete versioning roadmap for Cash Buddy, mapped directly from project git commits and development milestones.

**Versioning Schema**: `v0.xx.yy`
- `xx` = Major Feature Milestones & Architectural Shifts
- `yy` = Minor Refinements, Bug Fixes & UX Polish

---

## Current Version: **`v0.05.05`** (or `v0.5.5`)

---

## Version History Log

### **v0.05 — Multi-Currency System & Native Drag-and-Drop Polish**
- **`v0.05.05`** *(Current)*
  - Polished Manage Accounts UI layout: responsive flex-wrapping title, zero text truncation for `Unallocated Funds`, compact `Shown`/`Hidden` dashboard toggle button.
  - Re-synced and assembled Android debug APK.
- **`v0.05.04`**
  - Integrated `@capacitor/haptics` plugin for native Android vibration on card long-press pickup (180ms threshold).
  - Implemented hardware-accelerated CSS `translateY` transforms for smooth, non-glitchy card drag and drop.
  - Fixed pointer capture and text selection prevention (`window.getSelection().removeAllRanges()`).
- **`v0.05.03`**
  - Added persistent custom account order utility (`src/utils/accountSorter.js`).
  - Synced account sorting across Dashboard, AccountGrid, and SettingsView.
- **`v0.05.02`**
  - Protected `acc_unallocated_funds` system default account from accidental editing/deletion.
  - Added Dashboard visibility toggle preference (`cashbuddy_hide_unallocated_dashboard`).
- **`v0.05.01`**
  - Audited codebase for fallback default names; renamed all secret/unbucketed fallback pools to **"Unassigned"** (`Unassigned Pool`, `Unassigned / No Bucket`).
- **`v0.05.00`** *(Git `5434467`)*
  - Added offline multi-currency engine (30+ currencies: INR `₹`, SAR `﷼`, USD `$`, EUR `€`, AED `AED`, etc., custom ISO code and symbol support).
  - Added Currency & Region setup as Step 1 in Onboarding wizard.
  - Fixed floating-point precision errors in balance adjustments module.

---

### **v0.04 — Unallocated Funds Engine, Tutorials & Audit Logging**
- **`v0.04.03`** *(Git `3e6af7f`)*
  - Revamped app intro and onboarding stage transitions.
- **`v0.04.02`** *(Git `63b06d7`)*
  - Salary allocation auditing, balance adjustments history log, and native Android back-button handling in More Hub.
  - Date filtering (`All`, `This Month`, `Last Month`, custom year/month picker) in audit log.
- **`v0.04.01`** *(Git `cbe6226`)*
  - Implemented End-to-End Unallocated Funds pool logic (`acc_unallocated_funds`).
  - Added automatic seed fund allocation for newly created storage accounts.
- **`v0.04.00`** *(Git `149e3d8`, `18c1cfd`)*
  - Created interactive 6-step setup & 5-step tutorial onboarding wizard (`OnboardingModal.vue`).
  - Added splash screen launcher.

---

### **v0.03 — Native Android App & Hairline Grid Motion System**
- **`v0.03.03`** *(Git `52c31d8`, `27ceb1a`, `c9af0e6`)*
  - Redesigned Settings into compact 2-column Hairline Directory ("More Hub").
  - Animated SVG donut chart with orbit particles and active segment scaling.
- **`v0.03.02`** *(Git `6c20668`, `21e82c5`)*
  - Major UI redesign featuring dark hairline grid lines (`#1f202e`) and smooth spring motion transitions.
  - Streamlined transaction entry form with category & bucket quick pickers.
- **`v0.03.01`** *(Git `11eff3e`, `a0f2fb1`)*
  - Updated app splash screen to lavender theme (`#D4BFFF`) with Cash Buddy branding.
- **`v0.03.00`** *(Git `fc5d16e`, `37fa06b`, `4c6c3fe`)*
  - Built first working native Android Capacitor app (`frontend/android`).
  - Extended hybrid mobile plugins (`@capacitor/filesystem`, `@capacitor/share`, `@capacitor/status-bar`).

---

### **v0.02 — UI Standardization, Presets & Quick Actions**
- **`v0.02.03`** *(Git `f85ed37`)*
  - Restored complete offline WebAssembly SQLite capabilities and fixed offline fallback logic.
- **`v0.02.02`** *(Git `e3dee5c`, `8076d20`)*
  - Added Quick Actions module: Account-to-Account Transfers and Bulk Salary Allocation presets.
- **`v0.02.01`** *(Git `945efc9`, `45c3ba3`)*
  - Modernized visual style with pastel accent tokens and updated transaction category filters.
- **`v0.02.00`** *(Git `cbce8d2`, `8b54c1d`)*
  - Standardized compact dark theme components across Dashboard, Transactions, Debts, and Settings.

---

### **v0.01 — Foundation & Initial Working Prototypes**
- **`v0.01.03`** *(Git `c2f2cca`, `4fcbb06`)*
  - Offline database backup export & import system.
- **`v0.01.02`** *(Git `42868a1`, `a5626a6`)*
  - First mobile PWA build working completely offline on mobile web browsers.
- **`v0.01.01`** *(Git `824bc33`, `a79897e`)*
  - Refactored core engine to support multi-vault SQLite switching.
- **`v0.01.00`** *(Git `1e9c364`, `81a66de`)*
  - Initial commit of Cash Buddy personal finance tracker: SQLite engine, buckets, accounts, categories, and debt tracking.
