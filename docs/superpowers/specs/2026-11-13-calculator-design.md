# Settings Calculator Design

## Goal

Add an offline calculator under Settings for scratch calculations and spending plans, with a revolving bucket dial and vault-local calculation snapshots.

## User experience

- The Settings hub opens a dedicated Calculator subpage using its existing full-page sheet and Android Back behavior.
- The calculator supports digits, decimals, addition, subtraction, multiplication, division, percentage, sign toggle, clear, backspace, equals, and one-step undo.
- Each entered amount can have a small editable label displayed beside it. Bucket amounts receive the bucket name as their default label.
- A compact savings icon beside the starting balance opens an animated circular dial in an overlay, keeping the calculator layout stable. The dial contains all active savings buckets and their current allocated balances. Users can swipe or drag to rotate, use previous/next controls or keyboard arrows, and include multiple selected bucket balances in the starting balance. Included buckets can be removed individually.
- A manual starting amount can be combined with any number of included bucket balances. These sources remain separate from the spending expression. The calculator shows **Available after plan** as total starting balance plus the signed calculated result, so negative amounts reduce the balance.
- Keep the keypad and current calculation in the primary column. Put the growing calculation history and saved snapshots in a secondary sidebar; on narrow screens they follow the keypad. Labels are edited directly in each history row, and each amount can have an icon selected or changed there.
- Users explicitly save named snapshots. Each snapshot preserves the calculation terms, labels and icons, selected starting-balance bucket names and captured values, manual starting amount, result, and save time. Opening a snapshot restores an editable working copy; saved data itself remains unchanged. Users can delete snapshots.
- Calculations and bucket selections never modify transactions, accounts, or bucket balances; bucket values are captured as scratchpad inputs.

## Storage and boundaries

- Store snapshots in a `calculator_snapshots` table in the active vault's SQLite database so they follow the vault and are included in its existing database exports and backups.
- Use the existing Vue, Tailwind, Material Symbols, SQL.js, and local SQLite patterns. Do not add a component library or calculator dependency.
- Keep arithmetic evaluation in a small pure utility and the dial in a focused Vue component.
- Respect reduced-motion preferences and provide non-drag controls for bucket navigation.

## Error behavior

- Ignore malformed keypad input and show an inline calculation error for division by zero or invalid restored snapshot data.
- Snapshot save/delete failures show the existing inline error pattern and preserve the current calculation.
