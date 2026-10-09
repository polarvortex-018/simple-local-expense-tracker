<template>
  <section class="space-y-5">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-lg font-bold tracking-tight text-[#f1f0f5]">Spending report</h2>
        <p class="mt-1 text-xs text-[#9e9cae]">Your data stays in this vault on this device.</p>
      </div>
      <div class="flex flex-wrap gap-2" role="group" aria-label="Report date mode">
        <button type="button" class="min-h-11 rounded-xl border px-4 text-xs font-bold transition" :class="mode === 'month' ? 'border-[#D4BFFF] bg-[#D4BFFF] text-[#0f0f15]' : 'border-[#1f202e] bg-[#141520] text-[#9e9cae]'" @click="setMode('month')">Monthly</button>
        <button type="button" class="min-h-11 rounded-xl border px-4 text-xs font-bold transition" :class="mode === 'custom' ? 'border-[#D4BFFF] bg-[#D4BFFF] text-[#0f0f15]' : 'border-[#1f202e] bg-[#141520] text-[#9e9cae]'" @click="setMode('custom')">Custom range</button>
      </div>
    </header>

    <div class="grid gap-3 rounded-2xl border border-[#1f202e] bg-[#0f1019] p-4 sm:grid-cols-2 sm:items-end">
      <label v-if="mode === 'month'" class="block text-xs font-semibold text-[#ccc3d8]">
        Report month
        <input v-model="selectedMonth" type="month" class="mt-2 min-h-11 w-full rounded-xl border border-[#29293a] bg-[#191924] px-3 text-sm text-[#f1f0f5] accent-[#D4BFFF]" />
      </label>
      <template v-else>
        <label class="block text-xs font-semibold text-[#ccc3d8]">From<input v-model="customStart" type="date" class="mt-2 min-h-11 w-full rounded-xl border border-[#29293a] bg-[#191924] px-3 text-sm text-[#f1f0f5] accent-[#D4BFFF]" /></label>
        <label class="block text-xs font-semibold text-[#ccc3d8]">To<input v-model="customEnd" type="date" class="mt-2 min-h-11 w-full rounded-xl border border-[#29293a] bg-[#191924] px-3 text-sm text-[#f1f0f5] accent-[#D4BFFF]" /></label>
      </template>
      <p v-if="mode === 'month'" class="text-xs text-[#9e9cae] sm:pb-3">Compared with {{ previousMonthLabel }}. This month’s filters apply to both months.</p>
      <p v-else class="text-xs text-[#9e9cae] sm:pb-3">Custom reports show the selected range without a comparison.</p>
    </div>

    <details class="overflow-hidden rounded-2xl border border-[#1f202e] bg-[#0f1019]">
      <summary class="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-[#f1f0f5]">
        <span>Report filters <span v-if="excludedCount" class="ml-1 text-[#D4BFFF]">({{ excludedCount }} excluded)</span></span>
        <span class="material-symbols-outlined text-[#9e9cae]">tune</span>
      </summary>
      <div class="grid gap-4 border-t border-[#1f202e] p-4 sm:grid-cols-2">
        <fieldset class="space-y-2">
          <legend class="mb-2 text-xs font-bold text-[#D4BFFF]">Exclude spending categories</legend>
          <label class="flex min-h-11 items-center gap-3 rounded-xl bg-[#141520] px-3 text-sm text-[#f1f0f5]"><input v-model="excludedCategories" type="checkbox" value="__uncategorized__" class="size-4 accent-[#D4BFFF]" @change="saveExclusions" />Uncategorized</label>
          <label v-for="category in categories" :key="category.id" class="flex min-h-11 items-center gap-3 rounded-xl bg-[#141520] px-3 text-sm text-[#f1f0f5]"><input v-model="excludedCategories" type="checkbox" :value="category.id" class="size-4 accent-[#D4BFFF]" @change="saveExclusions" /><span class="size-2.5 rounded-full" :style="{ backgroundColor: category.color || '#9e9cae' }"></span><span class="min-w-0 flex-1 truncate">{{ category.name }}</span></label>
        </fieldset>
        <fieldset class="space-y-2">
          <legend class="mb-2 text-xs font-bold text-[#D4BFFF]">Exclude savings buckets</legend>
          <label class="flex min-h-11 items-center gap-3 rounded-xl bg-[#141520] px-3 text-sm text-[#f1f0f5]"><input v-model="excludedBuckets" type="checkbox" value="__unassigned__" class="size-4 accent-[#D4BFFF]" @change="saveExclusions" />Unassigned bucket</label>
          <label v-for="bucket in buckets" :key="bucket.id" class="flex min-h-11 items-center gap-3 rounded-xl bg-[#141520] px-3 text-sm text-[#f1f0f5]"><input v-model="excludedBuckets" type="checkbox" :value="bucket.id" class="size-4 accent-[#D4BFFF]" @change="saveExclusions" /><span class="size-2.5 rounded-full" :style="{ backgroundColor: bucket.color || '#9e9cae' }"></span><span class="min-w-0 flex-1 truncate">{{ bucket.name }}</span></label>
        </fieldset>
        <button type="button" class="min-h-11 justify-self-start rounded-xl border border-[#29293a] bg-[#141520] px-4 text-xs font-bold text-[#D4BFFF]" @click="clearFilters">Clear filters</button>
        <p v-if="mode === 'month'" class="self-center text-xs text-[#9e9cae]">Saved for {{ selectedMonth }} in this vault.</p>
        <p v-else class="self-center text-xs text-[#9e9cae]">Custom range filters are temporary.</p>
      </div>
    </details>

    <div v-if="rangeError" class="rounded-xl border border-rose-400/30 bg-rose-950/30 p-4 text-sm text-rose-200">{{ mode === 'month' ? 'Choose a valid report month.' : 'Choose a valid start and end date.' }}</div>
    <div v-else-if="error" class="rounded-xl border border-rose-400/30 bg-rose-950/30 p-4 text-sm text-rose-200">{{ error }}</div>
    <div v-else-if="loading" class="rounded-2xl border border-[#1f202e] bg-[#0f1019] p-8 text-center text-sm text-[#9e9cae]" aria-live="polite">Loading report…</div>
    <template v-else>
      <div class="grid gap-3 sm:grid-cols-3">
        <article class="rounded-2xl border border-[#FFD1B3]/20 bg-[#FFD1B3]/5 p-4">
          <p class="text-xs text-[#9e9cae]">Total spent</p>
          <p class="mt-2 break-words text-2xl font-bold tracking-tight text-[#FFD1B3] tabular-nums">{{ currencySymbol }}{{ formatAmount(report.totalSpent) }}</p>
          <p class="mt-1 text-xs text-[#9e9cae]">{{ report.expenseCount }} expense{{ report.expenseCount === 1 ? '' : 's' }}</p>
          <p v-if="mode === 'month'" class="mt-2 text-xs" :class="deltaClass(report.totalSpent - previousReport.totalSpent)">{{ deltaText(report.totalSpent, previousReport.totalSpent) }} vs {{ previousMonthLabel }}</p>
        </article>
        <article class="rounded-2xl border border-[#1f202e] bg-[#0f1019] p-4">
          <p class="text-xs text-[#9e9cae]">Most spent on</p>
          <p class="mt-2 truncate text-lg font-bold text-[#f1f0f5]">{{ report.topCategory?.name || 'No category spending' }}</p>
          <p v-if="report.topCategory" class="mt-1 text-sm text-[#FFD1B3] tabular-nums">{{ currencySymbol }}{{ formatAmount(report.topCategory.amount) }}</p>
          <p v-else class="mt-1 text-xs text-[#9e9cae]">No expenses in this period</p>
        </article>
        <article class="rounded-2xl border border-[#1f202e] bg-[#0f1019] p-4">
          <p class="text-xs text-[#9e9cae]">Transaction types</p>
          <p class="mt-2 text-sm font-bold text-[#f1f0f5]">Most frequent: <span class="text-[#D4BFFF]">{{ report.mostFrequentType?.name || '—' }}</span></p>
          <p class="mt-1 text-sm font-bold text-[#f1f0f5]">Largest total: <span class="text-[#D4BFFF]">{{ report.largestType?.name || '—' }}</span></p>
          <p class="mt-2 text-xs text-[#9e9cae]">{{ report.incomeCount }} income transaction{{ report.incomeCount === 1 ? '' : 's' }} · {{ currencySymbol }}{{ formatAmount(report.totalIncome) }} received</p>
        </article>
      </div>

      <section class="rounded-2xl border border-[#1f202e] bg-[#0f1019] p-4 sm:p-5">
        <div class="mb-4 flex items-center justify-between gap-3"><div><h3 class="text-sm font-bold text-[#f1f0f5]">Spending categories</h3><p class="mt-1 text-xs text-[#9e9cae]">Expenses grouped by category</p></div><span class="material-symbols-outlined text-[#D4BFFF]">category</span></div>
        <div v-if="categoryRows.length" class="space-y-3">
          <div v-for="item in categoryRows" :key="item.id" class="space-y-1.5">
            <div class="flex items-start justify-between gap-3 text-xs"><span class="min-w-0 truncate text-[#f1f0f5]">{{ item.name }}</span><span class="shrink-0 text-right font-bold text-[#f1f0f5] tabular-nums">{{ currencySymbol }}{{ formatAmount(item.amount) }}<small v-if="mode === 'month'" class="ml-2 font-medium" :class="deltaClass(item.amount - item.previousAmount)">{{ compactDelta(item.amount, item.previousAmount) }}</small></span></div>
            <div class="h-1.5 overflow-hidden rounded-full bg-[#191924]"><div class="h-full rounded-full bg-[#D4BFFF]" :style="{ width: barWidth(item.amount, report.totalSpent) }"></div></div>
          </div>
        </div>
        <p v-else class="py-5 text-center text-sm text-[#9e9cae]">No spending categories in this period.</p>
      </section>

      <section class="rounded-2xl border border-[#1f202e] bg-[#0f1019] p-4 sm:p-5">
        <div class="mb-4 flex items-center justify-between gap-3"><div><h3 class="text-sm font-bold text-[#f1f0f5]">Savings buckets</h3><p class="mt-1 text-xs text-[#9e9cae]">Spending assigned to each bucket; allocations and transfers are excluded</p></div><span class="material-symbols-outlined text-[#D4BFFF]">savings</span></div>
        <div v-if="bucketRows.length" class="space-y-3">
          <div v-for="item in bucketRows" :key="item.id" class="space-y-1.5">
            <div class="flex items-start justify-between gap-3 text-xs"><span class="min-w-0 truncate text-[#f1f0f5]">{{ item.name }}</span><span class="shrink-0 text-right font-bold text-[#f1f0f5] tabular-nums">{{ currencySymbol }}{{ formatAmount(item.amount) }}<small v-if="mode === 'month'" class="ml-2 font-medium" :class="deltaClass(item.amount - item.previousAmount)">{{ compactDelta(item.amount, item.previousAmount) }}</small></span></div>
            <div class="h-1.5 overflow-hidden rounded-full bg-[#191924]"><div class="h-full rounded-full bg-[#B3F5E1]" :style="{ width: barWidth(item.amount, report.totalSpent) }"></div></div>
          </div>
        </div>
        <p v-else class="py-5 text-center text-sm text-[#9e9cae]">No bucket-assigned spending in this period.</p>
      </section>

      <section class="rounded-2xl border border-[#1f202e] bg-[#0f1019] p-4 sm:p-5">
        <h3 class="text-sm font-bold text-[#f1f0f5]">Transaction type totals</h3>
        <div class="mt-3 divide-y divide-[#1f202e]">
          <div v-for="type in report.types" :key="type.name" class="flex min-h-12 items-center justify-between gap-3 py-2 text-xs">
            <span class="text-[#f1f0f5]">{{ type.name }} <span class="text-[#9e9cae]">· {{ type.count }} transaction{{ type.count === 1 ? '' : 's' }}</span></span>
            <span class="shrink-0 font-bold tabular-nums" :class="type.name === 'Income' ? 'text-[#B3F5E1]' : 'text-[#FFD1B3]'">{{ currencySymbol }}{{ formatAmount(type.amount) }}</span>
          </div>
          <p v-if="!report.types.length" class="py-5 text-center text-sm text-[#9e9cae]">No income or expense transactions in this period.</p>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { api } from '../services/api.js';
import { currencySymbol } from '../utils/currency.js';

const props = defineProps({
  categories: { type: Array, default: () => [] },
  buckets: { type: Array, default: () => [] },
  activeVault: { type: String, default: '' }
});

const SETTING_KEY = 'report_exclusions_by_month';
const mode = ref('month');
const selectedMonth = ref(monthKey(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)));
const today = localDate(new Date());
const customStart = ref(today.slice(0, 8) + '01');
const customEnd = ref(today);
const excludedCategories = ref([]);
const excludedBuckets = ref([]);
const exclusionStore = ref({});
const rangeTransactions = ref([]);
const loading = ref(true);
const error = ref('');

const rangeError = computed(() => mode.value === 'month'
  ? !/^\d{4}-\d{2}$/.test(selectedMonth.value)
  : (!customStart.value || !customEnd.value || customStart.value > customEnd.value));
const previousMonthKey = computed(() => shiftMonth(selectedMonth.value, -1));
const previousMonthLabel = computed(() => monthLabel(previousMonthKey.value));
const excludedCount = computed(() => excludedCategories.value.length + excludedBuckets.value.length);

function localDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(key, delta) {
  const [year, month] = String(key || '').split('-').map(Number);
  return monthKey(new Date(year, month - 1 + delta, 1));
}

function monthLabel(key) {
  if (!key) return '';
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function monthBounds(key) {
  const [year, month] = key.split('-').map(Number);
  return { start: localDate(new Date(year, month - 1, 1)), end: localDate(new Date(year, month, 0)) };
}

function parseSetting(raw) {
  try {
    const value = JSON.parse(raw || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

async function loadExclusions(key) {
  const stored = await api.getAppSetting(SETTING_KEY, '{}');
  exclusionStore.value = parseSetting(stored);
  const setting = exclusionStore.value[key] || {};
  excludedCategories.value = Array.isArray(setting.categories) ? setting.categories : [];
  excludedBuckets.value = Array.isArray(setting.buckets) ? setting.buckets : [];
}

async function saveExclusions() {
  if (mode.value !== 'month' || !selectedMonth.value) return;
  exclusionStore.value = {
    ...exclusionStore.value,
    [selectedMonth.value]: { categories: [...excludedCategories.value], buckets: [...excludedBuckets.value] }
  };
  try {
    await api.updateAppSetting(SETTING_KEY, JSON.stringify(exclusionStore.value));
  } catch (err) {
    error.value = err?.message || 'Could not save report filters.';
  }
}

function clearFilters() {
  excludedCategories.value = [];
  excludedBuckets.value = [];
  saveExclusions();
}

function setMode(value) {
  mode.value = value;
  error.value = '';
}

function isInternal(tx) {
  const description = String(tx.description || '').trim().toLowerCase();
  return tx.transaction_type === 'transfer'
    || tx.transaction_type === 'adjustment'
    || tx.account_id === 'acc_unallocated_funds'
    || description.startsWith('salary allocation');
}

function isExcluded(tx) {
  const categoryId = tx.category_id || '__uncategorized__';
  const bucketId = tx.bucket_id || '__unassigned__';
  return excludedCategories.value.includes(categoryId) || excludedBuckets.value.includes(bucketId);
}

function buildReport(rows) {
  const expenses = rows.filter(tx => tx.transaction_type === 'expense');
  const incomes = rows.filter(tx => tx.transaction_type === 'income');
  const categoriesMap = new Map();
  const bucketsMap = new Map();
  const types = [
    { name: 'Expense', count: expenses.length, amount: expenses.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) },
    { name: 'Income', count: incomes.length, amount: incomes.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) }
  ].filter(type => type.count);

  for (const tx of expenses) {
    const amount = Number(tx.amount) || 0;
    const categoryId = tx.category_id || '__uncategorized__';
    const categoryName = tx.category?.name || 'Uncategorized';
    const categoryColor = tx.category?.color || '#9e9cae';
    const category = categoriesMap.get(categoryId) || { id: categoryId, name: categoryName, color: categoryColor, amount: 0 };
    category.amount += amount;
    categoriesMap.set(categoryId, category);

    const bucketId = tx.bucket_id || '__unassigned__';
    const bucket = bucketsMap.get(bucketId) || { id: bucketId, name: tx.bucket?.name || 'Unassigned', color: tx.bucket?.color || '#9e9cae', amount: 0 };
    bucket.amount += amount;
    bucketsMap.set(bucketId, bucket);
  }

  const categoryAmounts = Object.fromEntries([...categoriesMap].map(([id, item]) => [id, item.amount]));
  const bucketAmounts = Object.fromEntries([...bucketsMap].map(([id, item]) => [id, item.amount]));
  const totalSpent = types.find(type => type.name === 'Expense')?.amount || 0;
  return {
    totalSpent,
    expenseCount: expenses.length,
    totalIncome: types.find(type => type.name === 'Income')?.amount || 0,
    incomeCount: incomes.length,
    categories: [...categoriesMap.values()].sort((a, b) => b.amount - a.amount),
    buckets: [...bucketsMap.values()].sort((a, b) => b.amount - a.amount),
    categoryAmounts,
    bucketAmounts,
    types,
    topCategory: [...categoriesMap.values()].sort((a, b) => b.amount - a.amount)[0] || null,
    mostFrequentType: [...types].sort((a, b) => b.count - a.count)[0] || null,
    largestType: [...types].sort((a, b) => b.amount - a.amount)[0] || null
  };
}

const periodRows = computed(() => {
  const validRows = rangeTransactions.value.filter(tx => !isInternal(tx) && !isExcluded(tx));
  return mode.value === 'month'
    ? validRows.filter(tx => String(tx.date || '').startsWith(selectedMonth.value))
    : validRows;
});

const previousRows = computed(() => rangeTransactions.value.filter(tx =>
  String(tx.date || '').startsWith(previousMonthKey.value) && !isInternal(tx) && !isExcluded(tx)
));
const report = computed(() => buildReport(periodRows.value));
const previousReport = computed(() => buildReport(previousRows.value));

function combinePeriods(current, previous) {
  const previousById = new Map(previous.map(item => [item.id, item]));
  const rows = current.map(item => ({ ...item, previousAmount: previousById.get(item.id)?.amount || 0 }));
  const currentIds = new Set(current.map(item => item.id));
  for (const item of previous) {
    if (!currentIds.has(item.id)) rows.push({ ...item, amount: 0, previousAmount: item.amount });
  }
  return rows.sort((a, b) => b.amount - a.amount || b.previousAmount - a.previousAmount);
}

const categoryRows = computed(() => combinePeriods(report.value.categories, mode.value === 'month' ? previousReport.value.categories : []));
const bucketRows = computed(() => combinePeriods(report.value.buckets, mode.value === 'month' ? previousReport.value.buckets : []));

function deltaText(current, previous) {
  const delta = current - previous;
  if (!previous && current) return `Up ${currencySymbol.value}${formatAmount(current)} (new spending)`;
  if (!previous) return 'No spend in either month';
  return `${delta > 0 ? 'Up' : delta < 0 ? 'Down' : 'Unchanged'} ${currencySymbol.value}${formatAmount(Math.abs(delta))} (${Math.abs((delta / previous) * 100).toFixed(0)}%)`;
}

function compactDelta(current, previous) {
  if (!previous && !current) return '—';
  if (!previous) return `↑ ${currencySymbol.value}${formatAmount(current)}`;
  const delta = current - previous;
  if (!delta) return '—';
  return `${delta > 0 ? '↑' : '↓'} ${currencySymbol.value}${formatAmount(Math.abs(delta))}`;
}

function deltaClass(delta) {
  return delta > 0 ? 'text-[#FFD1B3]' : delta < 0 ? 'text-[#B3F5E1]' : 'text-[#9e9cae]';
}

function barWidth(amount, total) {
  return `${total > 0 ? Math.max(2, Math.min(100, (amount / total) * 100)) : 0}%`;
}

function formatAmount(value) {
  return (Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

let loadSequence = 0;
async function loadReport() {
  const sequence = ++loadSequence;
  error.value = '';
  if (rangeError.value) {
    loading.value = false;
    rangeTransactions.value = [];
    return;
  }
  loading.value = true;
  try {
    if (mode.value === 'month') {
      await loadExclusions(selectedMonth.value);
      if (sequence !== loadSequence) return;
      const current = monthBounds(selectedMonth.value);
      const previous = monthBounds(previousMonthKey.value);
      const rows = await api.getTransactions({ start_date: previous.start, end_date: current.end });
      if (sequence === loadSequence) rangeTransactions.value = rows;
    } else {
      const rows = await api.getTransactions({ start_date: customStart.value, end_date: customEnd.value });
      if (sequence === loadSequence) rangeTransactions.value = rows;
    }
  } catch (err) {
    if (sequence === loadSequence) error.value = err?.message || 'Could not load this report.';
  } finally {
    if (sequence === loadSequence) loading.value = false;
  }
}

watch([mode, selectedMonth, customStart, customEnd, () => props.activeVault], loadReport, { immediate: true });
</script>
