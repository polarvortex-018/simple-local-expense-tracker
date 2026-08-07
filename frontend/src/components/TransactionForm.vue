<template>
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
    <div class="relative w-full max-w-lg bg-[#131b2e] border border-[#31394d] rounded-t-2xl sm:rounded-lg shadow-xl overflow-hidden transform transition-all max-h-[85vh] sm:max-h-[90vh] flex flex-col">
      
      <!-- Header -->
      <div class="px-5 py-3.5 border-b border-[#31394d] flex justify-between items-center bg-[#0b1326]/60 shrink-0">
        <div>
          <h3 class="text-base font-bold text-slate-100 tracking-tight">
            {{ isEdit ? 'Edit Transaction' : 'Add Transaction' }}
          </h3>
          <p v-if="!isEdit" class="text-xs text-slate-400">
            Step {{ currentStep }} of 2: {{ currentStep === 1 ? 'Select Allocation & Storage' : 'Transaction Details' }}
          </p>
        </div>
        <button 
          @click="$emit('close')" 
          class="text-slate-400 hover:text-slate-200 transition text-base font-semibold cursor-pointer p-1"
        >
          ✕
        </button>
      </div>

      <!-- Step Indicator Bar -->
      <div v-if="!isEdit" class="w-full bg-[#0b1326] h-1 flex shrink-0">
        <div class="h-full bg-[#7c3aed] transition-all duration-300" :style="{ width: currentStep === 1 ? '50%' : '100%' }"></div>
      </div>

      <!-- Form Body (Scrollable flex container) -->
      <form id="transaction-entry-form" @submit.prevent="handleSubmit" class="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
        <!-- Error Alerts -->
        <div v-if="error" class="p-3 bg-rose-950/40 border border-rose-900/50 rounded-xl text-rose-400 text-xs">
          {{ error }}
        </div>

        <!-- STEP 1: Bucket & Account Selection -->
        <div v-if="currentStep === 1" class="space-y-4">
          <div class="p-3.5 bg-indigo-950/30 border border-indigo-900/40 rounded-2xl text-xs text-slate-300">
            <p class="font-bold text-indigo-400 mb-0.5">Where and why is this money being moved?</p>
            <p class="text-slate-400">Select the <strong>Savings Bucket</strong> (purpose) and <strong>Account</strong> (storage location).</p>
          </div>

          <!-- Savings Bucket Selection (Enlarged Cards Grid with Color Accent Line) -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. Select Savings Bucket (Purpose) — Optional
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              <div
                @click="form.bucket_id = ''"
                class="p-3 rounded-2xl border text-xs cursor-pointer transition flex flex-col justify-center space-y-2 border-t-4 border-t-amber-500 shadow-sm"
                :class="!form.bucket_id ? 'bg-amber-950/70 border-amber-500 text-white ring-2 ring-amber-500/40' : 'bg-slate-950 border-slate-800 text-slate-300'"
              >
                <p class="font-bold">Unassigned</p>
                <p class="text-[10px] text-slate-400">Account only</p>
              </div>
              <div 
                v-for="b in activeBuckets" 
                :key="b.id"
                @click="form.bucket_id = form.bucket_id === b.id ? '' : b.id"
                class="p-3 rounded-2xl border text-xs cursor-pointer transition flex flex-col justify-between space-y-2 relative overflow-hidden border-t-4 shadow-sm"
                :style="{ borderTopColor: b.color || '#6366f1' }"
                :class="form.bucket_id === b.id ? 'bg-indigo-950/90 border-indigo-500 text-slate-100 ring-2 ring-indigo-500/50' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'"
              >
                <div class="flex items-center gap-2 overflow-hidden">
                  <span class="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sm shrink-0">
                    {{ b.icon || '🪣' }}
                  </span>
                  <p class="font-bold text-slate-100 text-xs truncate">{{ b.name }}</p>
                </div>
                <p class="text-[10px] text-slate-400">Allocated: <strong class="text-indigo-400 font-semibold">₹{{ formatAmount(b.allocated_balance) }}</strong></p>
              </div>
            </div>
          </div>

          <!-- Account Selection -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              2. Select Account (Storage Location) *
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              <div 
                v-for="acc in accounts" 
                :key="acc.id"
                @click="form.account_id = acc.id"
                class="min-h-20 p-4 rounded-2xl border text-xs cursor-pointer transition flex items-center justify-between gap-4"
                :class="form.account_id === acc.id ? 'bg-indigo-950/80 border-indigo-500 text-slate-100 ring-2 ring-indigo-500/50' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'"
              >
                <div class="truncate">
                  <p class="font-bold text-slate-200 text-sm truncate">{{ acc.name }}</p>
                  <p class="text-[10px] text-slate-400 mt-0.5">{{ acc.type }}</p>
                </div>
                <span class="font-bold text-slate-200 shrink-0">₹{{ formatAmount(acc.balance) }}</span>
              </div>
            </div>
          </div>

          <!-- Footer Actions Step 1 -->
          <div class="sticky bottom-0 z-20 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 flex items-center justify-between border-t border-[#31394d] bg-[#131b2e] px-5 sm:px-6 py-3 shadow-md">
            <button 
              type="button" 
              @click="$emit('close')"
              class="px-4 py-2 text-xs font-semibold text-[#ccc3d8] hover:text-[#dae2fd] transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="button"
              @click="goToStep2"
              class="px-6 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-full shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Next: Details</span>
              <span>→</span>
            </button>
          </div>
        </div>

        <!-- STEP 2: Transaction Details -->
        <div v-else class="space-y-3">
          <!-- Summary of Step 1 Selection -->
          <div v-if="!isEdit" class="flex items-center justify-between p-2.5 bg-[#0b1326] border border-[#31394d] rounded-md text-xs">
            <div class="flex items-center gap-2">
              <span>Bucket: <strong class="text-[#d2bbff]">{{ selectedBucketName }}</strong></span>
              <span>•</span>
              <span>Account: <strong class="text-[#dae2fd]">{{ selectedAccountName }}</strong></span>
            </div>
            <button type="button" @click="currentStep = 1" class="text-xs text-[#d2bbff] hover:underline font-semibold cursor-pointer">Edit</button>
          </div>

          <!-- Transaction Type Switch -->
          <div class="grid grid-cols-3 gap-1.5 p-1 bg-[#0b1326] rounded-full border border-[#31394d]">
            <button 
              type="button"
              @click="form.transaction_type = 'expense'"
              class="py-1.5 text-xs font-bold rounded-full transition cursor-pointer flex items-center justify-center gap-1"
              :class="form.transaction_type === 'expense' ? 'bg-[#ef4444] text-white shadow-sm' : 'text-[#ccc3d8] hover:text-[#dae2fd]'"
            >
              <span>↑ Expense</span>
            </button>
            <button 
              type="button"
              @click="form.transaction_type = 'income'"
              class="py-1.5 text-xs font-bold rounded-full transition cursor-pointer flex items-center justify-center gap-1"
              :class="form.transaction_type === 'income' ? 'bg-[#10b981] text-white shadow-sm' : 'text-[#ccc3d8] hover:text-[#dae2fd]'"
            >
              <span>↓ Income</span>
            </button>
            <button
              type="button"
              @click="form.transaction_type = 'adjustment'"
              class="py-1.5 px-1 text-xs font-bold rounded-full transition cursor-pointer flex items-center justify-center"
              :class="form.transaction_type === 'adjustment' ? 'bg-amber-600 text-white shadow-sm' : 'text-[#ccc3d8] hover:text-[#dae2fd]'"
            >
              Adjust
            </button>
          </div>

          <div v-if="form.transaction_type === 'adjustment'" class="rounded-md border border-amber-900/50 bg-[#0b1326] p-2.5 space-y-2">
            <p class="text-[11px] text-amber-200">Correct selected account/bucket to match reality. Enter reason in Description.</p>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" @click="form.adjustment_direction = 'add'" class="rounded-full border py-1.5 text-xs font-bold" :class="form.adjustment_direction === 'add' ? 'border-[#10b981] bg-[#10b981]/20 text-[#4edea3]' : 'border-[#31394d] text-[#ccc3d8]'">+ Add amount</button>
              <button type="button" @click="form.adjustment_direction = 'subtract'" class="rounded-full border py-1.5 text-xs font-bold" :class="form.adjustment_direction === 'subtract' ? 'border-[#ef4444] bg-[#ef4444]/20 text-[#ffb4ab]' : 'border-[#31394d] text-[#ccc3d8]'">− Subtract amount</button>
            </div>
          </div>

          <!-- Amount and Date in a single row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Amount -->
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider block">Amount (₹) *</label>
              <input 
                v-model="form.amount"
                type="text"
                inputmode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                autocomplete="off"
                enterkeyhint="next"
                placeholder="0.00"
                required
                class="w-full px-3 py-1.5 bg-[#0b1326] border border-[#31394d] focus:border-[#7c3aed] rounded-md text-[#dae2fd] text-sm font-bold tabular-nums placeholder-slate-600 focus:outline-none transition"
              />
            </div>

            <!-- Date -->
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider block">Date *</label>
              <input 
                v-model="form.date"
                @click="$event.target.showPicker?.()"
                type="date" 
                required
                class="w-full px-3 py-1.5 bg-[#0b1326] border border-[#31394d] focus:border-[#7c3aed] rounded-md text-[#dae2fd] text-xs focus:outline-none transition cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider block">Description *</label>
            <input 
              v-model="form.description"
              type="text" 
              placeholder="e.g. Weekly Groceries"
              required
              class="w-full px-3 py-1.5 bg-[#0b1326] border border-[#31394d] focus:border-[#7c3aed] rounded-md text-[#dae2fd] text-xs placeholder-slate-600 focus:outline-none transition"
            />
          </div>

          <!-- Quick Select Categories Grid + Dropdown -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider block">Category *</label>

            <!-- Quick Select Category Cards -->
            <div v-if="quickSelectCategories.length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mb-1.5">
              <button 
                type="button"
                v-for="cat in quickSelectCategories" 
                :key="cat.id"
                @click="form.category_id = cat.id"
                class="p-2 rounded-md border text-xs font-semibold transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer relative overflow-hidden border-t-2 shadow-sm"
                :style="{ 
                  borderTopColor: cat.color || '#7c3aed',
                  borderColor: form.category_id === cat.id ? (cat.color || '#7c3aed') : undefined
                }"
                :class="form.category_id === cat.id ? 'bg-[#7c3aed]/20 text-white ring-2 ring-[#7c3aed]' : 'bg-[#0b1326] border-[#31394d] text-[#dae2fd] hover:border-slate-500'"
              >
                <span class="text-base">{{ cat.icon || '🏷️' }}</span>
                <span class="text-[10px] truncate max-w-full leading-tight font-bold">{{ cat.name }}</span>
              </button>
            </div>

            <!-- Dropdown for All Categories -->
            <select 
              v-model="form.category_id" 
              required
              class="w-full px-3 py-1.5 bg-[#0b1326] border border-[#31394d] hover:bg-[#131b2e] focus:border-[#7c3aed] rounded-md text-[#dae2fd] text-xs focus:outline-none transition cursor-pointer"
            >
              <option value="" disabled class="bg-[#0b1326] text-slate-500">Select category...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id" class="bg-[#0b1326] text-[#dae2fd]">
                {{ cat.icon || '🏷️' }} {{ cat.name }}
              </option>
            </select>
          </div>

          <!-- Notes -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider block">Notes (Optional)</label>
            <textarea 
              v-model="form.notes"
              rows="2"
              placeholder="Additional details..."
              class="w-full px-3 py-1.5 bg-[#0b1326] border border-[#31394d] focus:border-[#7c3aed] rounded-md text-[#dae2fd] text-xs placeholder-slate-600 focus:outline-none transition resize-none"
            ></textarea>
          </div>

        </div>
      </form>

      <!-- Fixed action overlay above the visible keyboard -->
      <div v-if="currentStep === 2" class="flex items-center justify-between gap-3 border-t border-[#31394d] bg-[#131b2e] px-5 sm:px-6 py-3 shadow-md">
        <button
          type="button"
          @click="isEdit ? $emit('close') : (currentStep = 1)"
          class="px-4 py-2 text-xs font-semibold text-[#ccc3d8] hover:text-[#dae2fd] transition cursor-pointer"
        >{{ isEdit ? 'Cancel' : '← Back' }}</button>
        <button
          form="transaction-entry-form"
          type="submit"
          :disabled="submitting"
          class="flex-1 max-w-64 px-6 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-full shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <span v-if="submitting" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span>{{ isEdit ? 'Update Transaction' : 'Save Transaction' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  transaction: {
    type: Object,
    default: null
  },
  accounts: {
    type: Array,
    required: true
  },
  categories: {
    type: Array,
    required: true
  },
  buckets: {
    type: Array,
    required: true
  },
  defaultBucketId: {
    type: String,
    default: ''
  },
  defaultType: {
    type: String,
    default: 'expense'
  }
});



const emit = defineEmits(['close', 'save']);

const isEdit = computed(() => !!props.transaction);
const currentStep = ref(1);
const submitting = ref(false);
const error = ref('');

const activeBuckets = computed(() => props.buckets.filter(b => !b.is_archived));
const quickSelectCategories = computed(() => props.categories.filter(c => c.is_quick_select == 1));

const form = ref({
  amount: '',
  date: new Date().toISOString().substring(0, 10),
  description: '',
  transaction_type: props.defaultType || 'expense',
  adjustment_direction: 'add',
  notes: '',
  account_id: '',
  category_id: '',
  bucket_id: props.defaultBucketId || ''
});

// Helper labels
const selectedBucketName = computed(() => {
  const b = props.buckets.find(b => b.id === form.value.bucket_id);
  return b ? `${b.icon || '🪣'} ${b.name}` : 'Unassigned';
});

const selectedAccountName = computed(() => {
  const acc = props.accounts.find(a => a.id === form.value.account_id);
  return acc ? acc.name : 'Not Selected';
});

const formatAmount = (val) => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const viewportHeight = ref(window.visualViewport?.height || window.innerHeight);
const viewportTop = ref(window.visualViewport?.offsetTop || 0);
const viewportStyle = computed(() => ({
  height: `${viewportHeight.value}px`,
  transform: `translateY(${viewportTop.value}px)`
}));

const updateVisualViewport = () => {
  viewportHeight.value = window.visualViewport?.height || window.innerHeight;
  viewportTop.value = window.visualViewport?.offsetTop || 0;
};

// Load edit values or defaults
onMounted(() => {
  window.visualViewport?.addEventListener('resize', updateVisualViewport);
  window.visualViewport?.addEventListener('scroll', updateVisualViewport);
  window.addEventListener('resize', updateVisualViewport);
  updateVisualViewport();
  if (isEdit.value && props.transaction) {
    currentStep.value = 2; // Jump directly to details in edit mode
    form.value = {
      amount: Number(props.transaction.amount),
      date: props.transaction.date,
      description: props.transaction.description,
      transaction_type: props.transaction.transaction_type,
      adjustment_direction: props.transaction.adjustment_direction || 'add',
      notes: props.transaction.notes || '',
      account_id: props.transaction.account_id,
      category_id: props.transaction.category_id,
      bucket_id: props.transaction.bucket_id || ''
    };
  } else {
    // Set default account, category, and bucket
    if (props.accounts.length > 0) form.value.account_id = props.accounts[0].id;
    if (props.categories.length > 0) form.value.category_id = props.categories[0].id;
    if (props.defaultBucketId) {
      form.value.bucket_id = props.defaultBucketId;
    } else if (activeBuckets.value.length > 0) {
      form.value.bucket_id = activeBuckets.value[0].id;
    }
  }
});

onBeforeUnmount(() => {
  window.visualViewport?.removeEventListener('resize', updateVisualViewport);
  window.visualViewport?.removeEventListener('scroll', updateVisualViewport);
  window.removeEventListener('resize', updateVisualViewport);
});

const goToStep2 = () => {
  error.value = '';
  if (!form.value.account_id) {
    error.value = 'Please select an Account.';
    return;
  }
  currentStep.value = 2;
};

const handleSubmit = async () => {
  error.value = '';

  if (currentStep.value === 1 && !isEdit.value) {
    goToStep2();
    return;
  }
  
  // Validation checks
  if (!form.value.account_id) {
    error.value = 'Please select a valid account.';
    return;
  }
  const normalizedAmount = String(form.value.amount).replace(',', '.');
  if (Number(normalizedAmount) <= 0 || !Number.isFinite(Number(normalizedAmount))) {
    error.value = 'Amount must be greater than zero.';
    return;
  }
  if (!form.value.description || !form.value.description.trim()) {
    error.value = 'Description cannot be empty.';
    return;
  }
  if (!form.value.category_id) {
    error.value = 'Please select a category.';
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      ...form.value,
      amount: Number(normalizedAmount),
      description: form.value.description.trim(),
      notes: form.value.notes ? form.value.notes.trim() : null
    };
    emit('save', payload);
  } catch (err) {
    error.value = err.message || 'An error occurred while saving the transaction.';
    submitting.value = false;
  }
};
</script>
