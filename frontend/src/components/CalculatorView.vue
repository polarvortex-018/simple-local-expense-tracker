<template>
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,.9fr)]">
    <section
      class="min-w-0 space-y-3"
      tabindex="0"
      aria-label="Calculator"
      @keydown="handleKeyboard"
    >
      <div class="rounded-2xl border border-[#29293a] bg-[#14141d] p-4 sm:p-5">
        <div class="mb-3 flex items-center justify-between gap-2">
          <span class="text-xs font-semibold text-[#9e9cae]">Calculation</span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="min-h-11 rounded-lg px-3 text-xs font-semibold text-[#D4BFFF] hover:bg-[#D4BFFF]/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4BFFF]"
              :disabled="!undoStack.length"
              aria-label="Undo last calculator step"
              @click="undoLastStep"
            >Undo</button>
            <button type="button" class="min-h-11 rounded-lg px-3 text-xs font-semibold text-[#D4BFFF] hover:bg-[#D4BFFF]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4BFFF]" @click="clearAll">
              Clear
            </button>
          </div>
        </div>
        <p class="min-h-5 break-all text-right text-xs text-[#9e9cae] tabular-nums">{{ displayExpression || ' ' }}</p>
        <p class="min-h-12 break-all text-right text-3xl font-bold tracking-tight text-[#f1f0f5] tabular-nums" aria-live="polite">
          {{ result === null ? '—' : currencySymbol + formatAmount(result) }}
        </p>
        <p v-if="calculationError" class="mt-1 text-right text-xs text-[#ffb4ab]" role="alert">{{ calculationError }}</p>
        <div v-if="hasStartingBalance && !startingBalanceInvalid && result !== null" class="mt-3 space-y-2 rounded-xl border border-[#B3F5E1]/20 bg-[#B3F5E1]/5 px-3 py-2.5">
          <div class="flex items-center justify-between gap-3">
            <span class="text-xs text-[#9e9cae]">Starting balance</span>
            <span class="text-xs font-semibold text-[#B3F5E1] tabular-nums">{{ currencySymbol }}{{ formatAmount(startingBalanceTotal) }}</span>
          </div>
          <div class="flex items-center justify-between gap-3 border-t border-[#B3F5E1]/10 pt-2">
            <span class="text-xs text-[#9e9cae]">Available after plan</span>
            <span class="text-sm font-bold text-[#B3F5E1] tabular-nums">{{ currencySymbol }}{{ formatAmount(startingBalanceTotal + result) }}</span>
          </div>
        </div>
      </div>

      <section class="rounded-xl border border-[#29293a] bg-[#14141d] p-3">
        <div class="mb-2 flex items-center justify-between gap-2">
          <span class="text-[10px] font-semibold uppercase tracking-wide text-[#9e9cae]">Starting balance</span>
          <BucketDial ref="bucketDialRef" :buckets="buckets" :included-buckets="startingBuckets" @add-to-starting-balance="addStartingBucket" @remove-from-starting-balance="removeStartingBucket" />
        </div>
        <div class="flex min-h-11 items-center gap-2 rounded-lg border border-[#29293a] bg-[#0f1019] px-3">
          <span class="text-sm text-[#B3F5E1]">{{ currencySymbol }}</span>
          <input
            v-model="startingBalance"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="Manual starting amount"
            aria-label="Manual starting amount"
            class="min-h-10 min-w-0 w-full bg-transparent text-right text-sm font-bold text-[#B3F5E1] outline-none placeholder:text-[#686777]"
            @beforeinput="rememberUndoState"
          />
        </div>
        <div class="mt-2 flex min-h-5 items-center justify-between gap-2 text-[10px] text-[#9e9cae]">
          <span v-if="startingBuckets.length">{{ startingBuckets.length }} bucket{{ startingBuckets.length === 1 ? '' : 's' }} included · captured balances</span>
          <span v-else>Optional bucket balances can be included</span>
          <span v-if="startingBuckets.length" class="shrink-0 tabular-nums text-[#B3F5E1]">{{ currencySymbol }}{{ formatAmount(startingBucketTotal) }}</span>
        </div>
        <p v-if="startingBalanceInvalid" class="mt-1 text-xs text-[#ffb4ab]" role="alert">Enter a non-negative starting amount.</p>
      </section>

      <div class="grid grid-cols-4 gap-2" aria-label="Calculator keypad">
        <button v-for="key in keypad" :key="key.value" type="button" class="calc-key" :class="key.kind || ''" @click="pressKey(key.value)">
          {{ key.label }}
        </button>
      </div>
      <p class="text-center text-[10px] text-[#777685]">Keyboard input works while this calculator area is focused.</p>
    </section>

    <aside class="min-w-0 space-y-4">
      <section class="rounded-2xl border border-[#29293a] bg-[#14141d] p-3 sm:p-4" aria-labelledby="calculation-history-heading">
        <div class="mb-2 flex items-center justify-between">
          <h4 id="calculation-history-heading" class="text-sm font-bold text-[#f1f0f5]">Calculation history</h4>
          <span class="text-[10px] text-[#9e9cae]">{{ historyCount }} {{ historyCount === 1 ? 'amount' : 'amounts' }}</span>
        </div>
        <div v-if="historyCount" class="max-h-[35dvh] space-y-1 overflow-y-auto rounded-xl border border-[#29293a] bg-[#0f1019] p-2">
          <div v-for="(term, index) in terms" :key="term.id" class="border-b border-[#29293a]/70 px-1 py-2 last:border-0">
            <div class="flex min-w-0 items-center gap-2">
              <span class="shrink-0 text-sm font-semibold text-[#f1f0f5] tabular-nums"><span v-if="index > 0" class="mr-1 text-[#D4BFFF]">{{ operatorBefore(index) }}</span>{{ currencySymbol }}{{ formatAmount(term.amount) }}</span>
              <button type="button" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#D4BFFF] hover:bg-[#D4BFFF]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4BFFF]" :aria-label="'Change icon for ' + (term.label || formatAmount(term.amount))" @click="toggleIconPicker(term.id)"><span class="material-symbols-outlined">{{ term.icon || 'label' }}</span></button>
              <input v-model="term.label" type="text" maxlength="48" placeholder="Add label" :aria-label="'Label for ' + formatAmount(term.amount)" class="min-h-10 min-w-0 flex-1 rounded-lg bg-[#14141d] px-2 text-xs text-[#f1f0f5] outline-none placeholder:text-[#777685] focus-visible:ring-2 focus-visible:ring-[#D4BFFF]" @beforeinput="rememberUndoState" />
              <span v-if="term.source_bucket_name" class="hidden shrink-0 rounded-full bg-[#D4BFFF]/10 px-2 py-1 text-[9px] text-[#D4BFFF] sm:inline">{{ term.source_bucket_name }}</span>
            </div>
            <IconPicker v-if="iconPickerTarget === term.id" class="mt-2" :model-value="term.icon || 'label'" @update:model-value="setTermIcon(term.id, $event)" />
          </div>
          <div v-if="currentAmount !== ''" class="border-t border-[#29293a]/70 px-1 py-2">
            <div class="flex min-w-0 items-center gap-2">
              <span class="shrink-0 text-sm font-semibold text-[#D4BFFF] tabular-nums"><span v-if="terms.length" class="mr-1">{{ terms[terms.length - 1]?.operatorAfter || '+' }}</span>{{ currencySymbol }}{{ formatAmount(Number(currentAmount) || 0) }}</span>
              <button type="button" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#D4BFFF] hover:bg-[#D4BFFF]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4BFFF]" aria-label="Choose icon for current amount" @click="toggleIconPicker('current')"><span class="material-symbols-outlined">{{ currentIcon || 'label' }}</span></button>
              <input v-model="currentLabel" type="text" maxlength="48" placeholder="Add label" aria-label="Label for current amount" class="min-h-10 min-w-0 flex-1 rounded-lg bg-[#14141d] px-2 text-xs text-[#f1f0f5] outline-none placeholder:text-[#777685] focus-visible:ring-2 focus-visible:ring-[#D4BFFF]" @beforeinput="rememberUndoState" />
            </div>
            <IconPicker v-if="iconPickerTarget === 'current'" class="mt-2" :model-value="currentIcon" @update:model-value="setCurrentIcon" />
          </div>
        </div>
        <p v-else class="rounded-xl border border-dashed border-[#29293a] p-3 text-center text-xs text-[#9e9cae]">Entered amounts and their labels will appear here.</p>
      </section>

      <section class="space-y-3 rounded-2xl border border-[#29293a] bg-[#14141d] p-3 sm:p-4" aria-labelledby="snapshot-heading">
        <div class="flex items-center justify-between gap-2">
          <div>
            <h4 id="snapshot-heading" class="text-sm font-bold text-[#f1f0f5]">Calculation snapshots</h4>
            <p class="mt-0.5 text-[10px] text-[#9e9cae]">Saved in this vault</p>
          </div>
          <span class="material-symbols-outlined text-[#D4BFFF]">bookmark</span>
        </div>
        <label class="block">
          <span class="mb-1 block text-[10px] font-semibold text-[#9e9cae]">Snapshot name</span>
          <input v-model="snapshotName" type="text" maxlength="60" placeholder="e.g. November plan" class="min-h-11 w-full rounded-xl border border-[#29293a] bg-[#0f1019] px-3 text-sm text-[#f1f0f5] outline-none focus:border-[#D4BFFF]" />
        </label>
          <button type="button" class="min-h-11 w-full rounded-xl bg-[#D4BFFF] px-3 text-xs font-bold text-[#0f0f15] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" :disabled="!canSaveSnapshot || savingSnapshot" @click="saveSnapshot">
          {{ savingSnapshot ? 'Saving…' : 'Save snapshot' }}
        </button>

        <p v-if="notice" class="text-xs text-[#B3F5E1]" role="status">{{ notice }}</p>
        <p v-if="errorMessage" class="text-xs text-[#ffb4ab]" role="alert">{{ errorMessage }}</p>

        <div v-if="snapshots.length" class="max-h-72 space-y-2 overflow-y-auto">
          <article v-for="snapshot in snapshots" :key="snapshot.id" class="rounded-xl border border-[#29293a] bg-[#0f1019] p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate text-xs font-bold text-[#f1f0f5]">{{ snapshot.title }}</p>
                <p class="mt-1 text-[10px] text-[#9e9cae]">{{ formatDate(snapshot.created_at) }}</p>
                <p class="mt-1 text-xs font-semibold text-[#D4BFFF] tabular-nums">{{ currencySymbol }}{{ formatAmount(snapshot.result) }}</p>
              </div>
              <div class="flex shrink-0 gap-1">
                <button type="button" class="min-h-11 rounded-lg px-2 text-[10px] font-semibold text-[#D4BFFF] hover:bg-[#D4BFFF]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4BFFF]" @click="restoreSnapshot(snapshot)">Open</button>
                <button type="button" class="min-h-11 rounded-lg px-2 text-[10px] font-semibold text-[#ffb4ab] hover:bg-[#ffb4ab]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb4ab]" :aria-label="'Delete ' + snapshot.title" @click="deleteSnapshot(snapshot)">Delete</button>
              </div>
            </div>
          </article>
        </div>
        <p v-else class="rounded-xl border border-dashed border-[#29293a] p-4 text-center text-xs text-[#9e9cae]">Your saved calculations will appear here.</p>
      </section>
    </aside>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import BucketDial from './BucketDial.vue';
import IconPicker from './IconPicker.vue';
import { api } from '../services/api.js';
import { currencySymbol } from '../utils/currency.js';
import { calculatorExpression, evaluateCalculatorTerms } from '../utils/calculatorMath.js';

const props = defineProps({
  buckets: { type: Array, default: () => [] },
  activeVault: { type: String, default: '' }
});

const keypad = [
  { label: 'C', value: 'clear', kind: 'calc-key-muted' },
  { label: '⌫', value: 'backspace', kind: 'calc-key-muted' },
  { label: '±', value: 'sign', kind: 'calc-key-muted' },
  { label: '÷', value: '/', kind: 'calc-key-op' },
  { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' }, { label: '×', value: '*', kind: 'calc-key-op' },
  { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' }, { label: '−', value: '-', kind: 'calc-key-op' },
  { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '+', value: '+', kind: 'calc-key-op' },
  { label: '%', value: 'percent', kind: 'calc-key-muted' }, { label: '0', value: '0' }, { label: '.', value: '.' }, { label: '=', value: 'equals', kind: 'calc-key-equals' }
];

const terms = ref([]);
const currentAmount = ref('');
const currentLabel = ref('');
const currentIcon = ref('label');
const iconPickerTarget = ref(null);
const currentBucket = ref(null);
const startingBalance = ref('');
const startingBuckets = ref([]);
const resultOverride = ref(null);
const snapshots = ref([]);
const bucketDialRef = ref(null);
const snapshotName = ref('');
const savingSnapshot = ref(false);
const errorMessage = ref('');
const notice = ref('');
const undoStack = ref([]);

const calculationTerms = computed(() => {
  if (!currentAmount.value || !Number.isFinite(Number(currentAmount.value))) return terms.value;
  return [...terms.value, {
    amount: Number(currentAmount.value),
    operatorAfter: null,
    label: currentLabel.value.trim() || currentBucket.value?.name || '',
    icon: currentIcon.value || 'label',
    source_bucket_id: currentBucket.value?.id || null,
    source_bucket_name: currentBucket.value?.name || null
  }];
});

const evaluation = computed(() => {
  try {
    return { value: evaluateCalculatorTerms(calculationTerms.value), error: '' };
  } catch (error) {
    return { value: null, error: error.message || 'Invalid calculation.' };
  }
});

const result = computed(() => resultOverride.value !== null ? resultOverride.value : evaluation.value.value);
const calculationError = computed(() => evaluation.value.error);
const displayExpression = computed(() => calculatorExpression(calculationTerms.value));
const startingBalanceInvalid = computed(() => startingBalance.value !== '' && (!Number.isFinite(Number(startingBalance.value)) || Number(startingBalance.value) < 0));
const startingBucketTotal = computed(() => startingBuckets.value.reduce((sum, bucket) => sum + (Number(bucket.amount) || 0), 0));
const startingBalanceTotal = computed(() => (Number(startingBalance.value) || 0) + startingBucketTotal.value);
const hasStartingBalance = computed(() => startingBalance.value !== '' || startingBuckets.value.length > 0);
const canSaveSnapshot = computed(() => result.value !== null && !startingBalanceInvalid.value && (terms.value.length > 0 || currentAmount.value !== '' || hasStartingBalance.value));
const historyCount = computed(() => terms.value.length + (currentAmount.value !== '' ? 1 : 0));

watch(() => props.activeVault, () => {
  resetCalculation();
  loadSnapshots();
});

onMounted(loadSnapshots);

defineExpose({
  closeBucketDial: () => bucketDialRef.value?.closeIfOpen() || false
});

function formatAmount(value) {
  return (Number(value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function operatorBefore(index) {
  return terms.value[index - 1]?.operatorAfter || '+';
}

function resetCalculation(clearUndo = true) {
  terms.value = [];
  currentAmount.value = '';
  currentLabel.value = '';
  currentIcon.value = 'label';
  iconPickerTarget.value = null;
  currentBucket.value = null;
  startingBalance.value = '';
  startingBuckets.value = [];
  resultOverride.value = null;
  snapshotName.value = '';
  notice.value = '';
  errorMessage.value = '';
  if (clearUndo) undoStack.value = [];
}

function rememberUndoState() {
  const state = JSON.parse(JSON.stringify({
    terms: terms.value,
    currentAmount: currentAmount.value,
    currentLabel: currentLabel.value,
    currentIcon: currentIcon.value,
    currentBucket: currentBucket.value,
    startingBalance: startingBalance.value,
    startingBuckets: startingBuckets.value,
    resultOverride: resultOverride.value
  }));
  undoStack.value = [...undoStack.value.slice(-99), state];
}

function undoLastStep() {
  const state = undoStack.value.pop();
  if (!state) return;
  terms.value = state.terms;
  currentAmount.value = state.currentAmount;
  currentLabel.value = state.currentLabel;
  currentIcon.value = state.currentIcon || 'label';
  currentBucket.value = state.currentBucket;
  startingBalance.value = state.startingBalance;
  startingBuckets.value = state.startingBuckets;
  resultOverride.value = state.resultOverride;
  notice.value = 'Undid the last calculator step.';
  errorMessage.value = '';
}

function clearAll(recordUndo = true) {
  if (recordUndo) rememberUndoState();
  resetCalculation(false);
  notice.value = '';
  errorMessage.value = '';
}

function startFresh() {
  terms.value = [];
  currentAmount.value = '';
  currentLabel.value = '';
  currentIcon.value = 'label';
  currentBucket.value = null;
  resultOverride.value = null;
}

function enterDigit(value) {
  if (resultOverride.value !== null) startFresh();
  if (value === '.') {
    if (!currentAmount.value) currentAmount.value = '0.';
    else if (!currentAmount.value.includes('.')) currentAmount.value += '.';
    return;
  }
  currentAmount.value = currentAmount.value === '0' ? value : currentAmount.value + value;
  currentBucket.value = null;
}

function applyOperator(operator) {
  if (resultOverride.value !== null) {
    terms.value = [{ id: makeId(), amount: resultOverride.value, operatorAfter: operator, label: 'Total', icon: 'functions' }];
    currentAmount.value = '';
    currentLabel.value = '';
    currentBucket.value = null;
    resultOverride.value = null;
    return;
  }
  if (currentAmount.value && Number.isFinite(Number(currentAmount.value))) {
    terms.value.push({
      id: makeId(),
      amount: Number(currentAmount.value),
      operatorAfter: operator,
      label: currentLabel.value.trim() || currentBucket.value?.name || '',
      icon: currentIcon.value || 'label',
      source_bucket_id: currentBucket.value?.id || null,
      source_bucket_name: currentBucket.value?.name || null
    });
    currentAmount.value = '';
    currentLabel.value = '';
    currentIcon.value = 'label';
    currentBucket.value = null;
  } else if (terms.value.length) {
    terms.value[terms.value.length - 1].operatorAfter = operator;
  }
}

function equals() {
  if (currentAmount.value && Number.isFinite(Number(currentAmount.value))) {
    terms.value.push({
      id: makeId(),
      amount: Number(currentAmount.value),
      operatorAfter: null,
      label: currentLabel.value.trim() || currentBucket.value?.name || '',
      icon: currentIcon.value || 'label',
      source_bucket_id: currentBucket.value?.id || null,
      source_bucket_name: currentBucket.value?.name || null
    });
    currentAmount.value = '';
    currentLabel.value = '';
    currentIcon.value = 'label';
    currentBucket.value = null;
  } else if (terms.value.length) {
    terms.value[terms.value.length - 1].operatorAfter = null;
  }
  try { resultOverride.value = evaluateCalculatorTerms(terms.value); }
  catch { resultOverride.value = null; }
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function toggleIconPicker(target) {
  iconPickerTarget.value = iconPickerTarget.value === target ? null : target;
}

function setCurrentIcon(icon) {
  rememberUndoState();
  currentIcon.value = icon;
  iconPickerTarget.value = null;
}

function setTermIcon(id, icon) {
  rememberUndoState();
  const term = terms.value.find(item => item.id === id);
  if (term) term.icon = icon;
  iconPickerTarget.value = null;
}

function pressKey(key) {
  notice.value = '';
  errorMessage.value = '';
  if (/^[0-9.]$/.test(key) || ['+', '-', '*', '/', 'equals', 'clear', 'backspace', 'sign', 'percent'].includes(key)) {
    rememberUndoState();
  }
  if (/^[0-9]$/.test(key)) return enterDigit(key);
  if (key === '.') return enterDigit('.');
  if (['+', '-', '*', '/'].includes(key)) return applyOperator(key);
  if (key === 'equals') return equals();
  if (key === 'clear') return clearAll(false);
  if (key === 'backspace') {
    if (resultOverride.value !== null) return clearAll(false);
    currentAmount.value = currentAmount.value.slice(0, -1);
    if (!currentAmount.value) currentBucket.value = null;
    return;
  }
  if (key === 'sign' && currentAmount.value) {
    currentAmount.value = String(-Number(currentAmount.value));
    return;
  }
  if (key === 'percent' && currentAmount.value) {
    currentAmount.value = String(Number(currentAmount.value) / 100);
  }
}

function addStartingBucket(bucket) {
  const amount = Number(bucket?.allocated_balance);
  if (!Number.isFinite(amount)) return;
  if (startingBuckets.value.some(item => item.id === bucket.id)) {
    notice.value = bucket.name + ' is already included in the starting balance.';
    return;
  }
  rememberUndoState();
  startingBuckets.value.push({
    id: bucket.id,
    name: bucket.name,
    amount
  });
  notice.value = bucket.name + ' added to the starting balance.';
}

function removeStartingBucket(bucketId) {
  rememberUndoState();
  startingBuckets.value = startingBuckets.value.filter(bucket => bucket.id !== bucketId);
}

function handleKeyboard(event) {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
  if (/^[0-9.]$/.test(event.key)) pressKey(event.key);
  else if (['+', '-', '*', '/'].includes(event.key)) pressKey(event.key);
  else if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); equals(); }
  else if (event.key === 'Backspace') { event.preventDefault(); pressKey('backspace'); }
  else if (event.key === 'Escape') clearAll();
}

async function loadSnapshots() {
  errorMessage.value = '';
  try {
    snapshots.value = await api.getCalculatorSnapshots();
  } catch (error) {
    errorMessage.value = error.message || 'Could not load snapshots.';
  }
}

async function saveSnapshot() {
  if (!canSaveSnapshot.value || savingSnapshot.value) return;
  savingSnapshot.value = true;
  errorMessage.value = '';
  notice.value = '';
  const snapshot = {
    terms: JSON.parse(JSON.stringify(terms.value)),
    starting_balance: startingBalance.value === '' ? null : Number(startingBalance.value),
    starting_balance_buckets: JSON.parse(JSON.stringify(startingBuckets.value)),
    current_amount: currentAmount.value,
    current_label: currentLabel.value,
    current_icon: currentIcon.value,
    current_bucket: currentBucket.value ? { ...currentBucket.value } : null,
    result: result.value
  };
  const title = snapshotName.value.trim() || 'Calculation ' + new Date().toLocaleString();
  try {
    const saved = await api.saveCalculatorSnapshot({ title, snapshot, result: result.value });
    snapshots.value = [saved, ...snapshots.value];
    snapshotName.value = '';
    notice.value = 'Snapshot saved in this vault.';
  } catch (error) {
    errorMessage.value = error.message || 'Could not save the snapshot.';
  } finally {
    savingSnapshot.value = false;
  }
}

function restoreSnapshot(saved) {
  if (!saved.snapshot || !Array.isArray(saved.snapshot.terms)) {
    errorMessage.value = 'This snapshot could not be opened.';
    return;
  }
  const copy = JSON.parse(JSON.stringify(saved.snapshot));
  if (copy.terms.some(term => !Number.isFinite(Number(term.amount)))) {
    errorMessage.value = 'This snapshot contains an invalid amount.';
    return;
  }
  rememberUndoState();
  terms.value = copy.terms.map(term => ({ ...term, id: term.id || makeId() }));
  startingBalance.value = copy.starting_balance === null || copy.starting_balance === undefined ? '' : String(copy.starting_balance);
  startingBuckets.value = Array.isArray(copy.starting_balance_buckets)
    ? copy.starting_balance_buckets.filter(bucket => bucket && Number.isFinite(Number(bucket.amount))).map(bucket => ({ ...bucket, amount: Number(bucket.amount) }))
    : [];
  currentAmount.value = copy.current_amount || '';
  currentLabel.value = copy.current_label || '';
  currentIcon.value = copy.current_icon || 'label';
  iconPickerTarget.value = null;
  currentBucket.value = copy.current_bucket || null;
  resultOverride.value = null;
  notice.value = 'Opened as a working copy. The saved snapshot is unchanged.';
  errorMessage.value = '';
}

async function deleteSnapshot(snapshot) {
  if (!window.confirm('Delete the snapshot "' + snapshot.title + '"?')) return;
  errorMessage.value = '';
  try {
    await api.deleteCalculatorSnapshot(snapshot.id);
    snapshots.value = snapshots.value.filter(item => item.id !== snapshot.id);
    notice.value = 'Snapshot deleted.';
  } catch (error) {
    errorMessage.value = error.message || 'Could not delete the snapshot.';
  }
}
</script>

<style scoped>
.calc-key {
  min-height: 52px;
  border: 1px solid #29293a;
  border-radius: 14px;
  background: #14141d;
  color: #f1f0f5;
  font-size: 17px;
  font-weight: 600;
  transition: background 120ms ease, transform 120ms ease;
}
.calc-key:focus-visible { outline: 2px solid #D4BFFF; outline-offset: 2px; }
.calc-key:active { transform: scale(.96); background: #232332; }
.calc-key-muted { color: #9e9cae; }
.calc-key-op { border-color: rgba(212, 191, 255, .3); color: #D4BFFF; }
.calc-key-equals { background: #D4BFFF; color: #0f0f15; }
@media (prefers-reduced-motion: reduce) { .calc-key { transition-duration: 0.01ms; } }
</style>
