# Multi-Theme Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a multi-theme engine supporting 5 distinct presets (Pastel Dark, OLED Pitch Black, Nordic Slate, Emerald Midnight, and Soft Pastel Light) with vault-isolated persistence in SQLite.

**Architecture:** Define semantic CSS variable tokens on `[data-theme="..."]` in `style.css`. Create a theme management utility (`utils/theme.js`) that updates `document.documentElement.dataset.theme`, integrates with SQLite `vault_settings` for vault isolation, and provides an interactive modal (`ThemeModal.vue`) in Settings for theme selection.

**Tech Stack:** Vue 3, Tailwind CSS v4, WebAssembly SQLite (`sql.js`), Material Symbols.

---

## Global Constraints

- **Theme Presets**: Must support `pastel-dark` (default), `oled-black`, `nordic-slate`, `emerald-midnight`, `pastel-light`.
- **Vault Isolation**: Theme preferences must be saved to SQLite `vault_settings` (`vault_theme`).
- **Performance**: Zero-latency DOM updates without forcing app reloads.

---

### Task 1: Create Theme Catalog & Tokens in `theme.js` & `style.css`

**Files:**
- Create: `frontend/src/utils/theme.js`
- Modify: `frontend/src/style.css`

- [ ] **Step 1: Create `frontend/src/utils/theme.js`**

Define the 5 theme presets, metadata, and DOM mutation helper:

```javascript
export const THEMES = [
  {
    id: 'pastel-dark',
    name: 'Pastel Dark',
    desc: 'Material 3 dark pastel aesthetic (Default)',
    icon: 'dark_mode',
    bg: '#0c0d14',
    card: '#141520',
    border: '#1f202e',
    primary: '#D4BFFF',
    isDark: true
  },
  {
    id: 'oled-black',
    name: 'OLED Pitch Black',
    desc: 'Pure #000000 background for battery savings',
    icon: 'contrast',
    bg: '#000000',
    card: '#0d0d0d',
    border: '#1a1a1a',
    primary: '#D4BFFF',
    isDark: true
  },
  {
    id: 'nordic-slate',
    name: 'Nordic Slate',
    desc: 'Deep arctic slate blue & cyan accent',
    icon: 'ac_unit',
    bg: '#161b22',
    card: '#1c2128',
    border: '#2d333b',
    primary: '#88c0d0',
    isDark: true
  },
  {
    id: 'emerald-midnight',
    name: 'Emerald Midnight',
    desc: 'Deep forest green & mint accent',
    icon: 'forest',
    bg: '#091510',
    card: '#0f2019',
    border: '#1b3328',
    primary: '#6ee7b7',
    isDark: true
  },
  {
    id: 'pastel-light',
    name: 'Pastel Light',
    desc: 'Soft warm light theme',
    icon: 'light_mode',
    bg: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    primary: '#7c3aed',
    isDark: false
  }
];

export function applyTheme(themeId) {
  const targetTheme = THEMES.find(t => t.id === themeId) || THEMES[0];
  document.documentElement.setAttribute('data-theme', targetTheme.id);
  
  // Update browser status bar meta tag
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', targetTheme.bg);
  }
}
```

- [ ] **Step 2: Add Theme Token Variables to `frontend/src/style.css`**

Add CSS custom properties for each `[data-theme="..."]`:

```css
[data-theme="pastel-dark"] {
  --bg-surface: #0c0d14;
  --bg-container-low: #0f1019;
  --bg-container: #141520;
  --bg-container-high: #1a1b28;
  --color-border: #1f202e;
  --color-primary: #D4BFFF;
  --color-on-surface: #f1f0f5;
  --color-on-surface-variant: #9e9cae;
}

[data-theme="oled-black"] {
  --bg-surface: #000000;
  --bg-container-low: #080808;
  --bg-container: #0d0d0d;
  --bg-container-high: #141414;
  --color-border: #1f1f1f;
  --color-primary: #D4BFFF;
  --color-on-surface: #ffffff;
  --color-on-surface-variant: #888888;
}

[data-theme="nordic-slate"] {
  --bg-surface: #161b22;
  --bg-container-low: #1c2128;
  --bg-container: #22272e;
  --bg-container-high: #2d333b;
  --color-border: #373e47;
  --color-primary: #88c0d0;
  --color-on-surface: #adbac7;
  --color-on-surface-variant: #768390;
}

[data-theme="emerald-midnight"] {
  --bg-surface: #091510;
  --bg-container-low: #0f2019;
  --bg-container: #152b22;
  --bg-container-high: #1b382c;
  --color-border: #234738;
  --color-primary: #6ee7b7;
  --color-on-surface: #ecfdf5;
  --color-on-surface-variant: #6ee7b7/70;
}

[data-theme="pastel-light"] {
  --bg-surface: #f8fafc;
  --bg-container-low: #f1f5f9;
  --bg-container: #ffffff;
  --bg-container-high: #e2e8f0;
  --color-border: #cbd5e1;
  --color-primary: #7c3aed;
  --color-on-surface: #0f172a;
  --color-on-surface-variant: #64748b;
}
```

- [ ] **Step 3: Commit Task 1**

---

### Task 2: Implement Database Persistence in `api.js`

**Files:**
- Modify: `frontend/src/services/api.js`
- Modify: `frontend/src/App.vue`

- [ ] **Step 1: Add SQLite Theme Getters and Setters in `api.js`**

```javascript
export async function getVaultTheme() {
  const res = await getSetting('vault_theme');
  return res || 'pastel-dark';
}

export async function setVaultTheme(themeId) {
  await saveSetting('vault_theme', themeId);
  applyTheme(themeId);
}
```

- [ ] **Step 2: Sync Theme on App Load and Vault Switch in `App.vue`**

Invoke `getVaultTheme()` and `applyTheme()` inside `refreshAll()` or `onMounted()` in `App.vue`.

- [ ] **Step 3: Commit Task 2**

---

### Task 3: Build `ThemeModal.vue` & Settings View Integration

**Files:**
- Create: `frontend/src/components/ThemeModal.vue`
- Modify: `frontend/src/components/SettingsView.vue`

- [ ] **Step 1: Create `ThemeModal.vue`**

Modal with grid of theme cards displaying color chips, active checkmark ring, and live application on click.

- [ ] **Step 2: Add Entry Card in `SettingsView.vue`**

Add an "App Theme & Appearance" directory entry inside `SettingsView.vue` under the FAQ & Guides section.

- [ ] **Step 3: Test Theme Switching & Build Check**

Run `npm run build` in `frontend/` to verify 0 build errors.

- [ ] **Step 4: Commit Task 3**
