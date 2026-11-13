# Settings Calculator Implementation Plan

> **For agentic workers:** Execute inline on the existing `dev` branch. The user explicitly requested direct execution. Steps use checkbox syntax for tracking.

**Goal:** Add an offline Settings calculator with labeled operands, a revolving savings-bucket dial, an available-after-plan amount, and named snapshots stored in each vault.

**Architecture:** A small pure utility evaluates calculator terms. `CalculatorView.vue` owns the expression, labels, starting amount, and snapshot list; `BucketDial.vue` handles the animated circular selector. Snapshot CRUD uses the existing local SQLite API and active vault database.

**Tech Stack:** Vue 3, Tailwind CSS v4, SQL.js/SQLite, existing Material Symbols font, Node/Vite production build.

**Spec:** `docs/superpowers/specs/2026-11-13-calculator-design.md`

## Global Constraints

- No new dependencies or shadcn installation.
- Keep all calculations local; never write calculator actions to financial ledger balances or transactions.
- Snapshot storage is per active vault and included in that vault's database backup.
- Preserve mobile safe areas, minimum 44px touch targets, keyboard access, and reduced-motion behavior.
- Update `VERSION_HISTORY.md` for the feature.

---

### Task 1: Arithmetic utility and bucket dial

**Files:**
- Create `frontend/src/utils/calculatorMath.js` for finite-number validation, precedence-aware evaluation, and expression display.
- Create `frontend/src/components/BucketDial.vue` for the animated, rotatable bucket selector.

- [x] Implement arithmetic evaluation without `eval`, handling operator precedence, negative operands, invalid values, and division by zero.
- [x] Render every active bucket around a circular track with selected-item details and explicit Add, Previous, and Next controls.
- [x] Add touch/pointer rotation, arrow-key navigation, accessible labels, and reduced-motion-aware transitions.

### Task 2: Vault-local snapshot storage

**Files:**
- Modify `frontend/src/services/db/schema.js` to create the snapshot table for new and existing vaults.
- Modify `frontend/src/services/api.js` with list, save, and delete snapshot methods.

- [x] Store a title, immutable JSON calculation state, numeric result, and timestamp.
- [x] Return snapshots newest-first; reject empty titles or invalid payloads; return saved snapshots with parsed state.

### Task 3: Settings calculator screen

**Files:**
- Create `frontend/src/components/CalculatorView.vue`.
- Modify `frontend/src/components/SettingsView.vue` to add the Settings entry and mount the calculator sheet.

- [x] Add arithmetic keypad, editable labeled/icon calculation history, one-step undo, optional manual/bucket starting balance, and a signed **Available after plan** result.
- [x] Add the bucket dial so selected bucket balances add to the starting-balance total, separately from the calculator expression, without touching ledger balances.
- [x] Add explicit save, list, restore-as-working-copy, and delete snapshot actions with inline errors.
- [x] Ensure Settings and Android Back close the calculator like other Settings subpages.

### Task 4: Version history and build verification

**Files:**
- Modify `VERSION_HISTORY.md`.

- [x] Record the calculator release under version `v0.08.00`.
- [x] Run `npm run build` in `frontend/` and confirm the production bundle compiles.
