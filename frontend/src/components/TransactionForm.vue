<template>
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 safe-area-modal-pt bg-[#0c0d14]/90 backdrop-blur-sm pb-16 sm:pb-0">
    <div class="relative w-full max-w-md bg-[#0c0d14] border-t sm:border border-[#1f202e] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden transform transition-all max-h-[85vh] sm:max-h-[90vh] flex flex-col my-0 sm:my-auto">
      
      <!-- Header -->
      <div class="px-5 py-3.5 border-b border-[#1f202e] flex justify-between items-center bg-[#0c0d14] shrink-0">
        <div class="flex items-center gap-2">
          <button 
            v-if="currentStep === 2 && !isEdit"
            type="button" 
            @click="currentStep = 1"
            class="text-[#9e9cae] hover:text-[#f1f0f5] transition text-sm font-semibold cursor-pointer p-1"
            title="Back to Step 1"
          >
            ←
          </button>
          <button 
            @click="$emit('close')" 
            class="text-[#9e9cae] hover:text-[#f1f0f5] transition text-base font-semibold cursor-pointer p-1"
            title="Close"
          >
            ✕
          </button>
        </div>
        <div class="text-center">
          <h3 class="text-sm font-bold text-[#D4BFFF] tracking-tight">
            {{ isEdit ? 'Edit Transaction' : 'Add Transaction' }}
          </h3>
          <p v-if="!isEdit" class="text-[10px] font-semibold text-[#9e9cae]">
            Step {{ currentStep }} of 2
          </p>
        </div>
        <div class="w-8"></div> <!-- Centering layout placeholder -->
      </div>

      <!-- Form Body (Scrollable container) -->
      <form id="transaction-entry-form" @submit.prevent="handleSubmit" class="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
        <!-- Error Alerts -->
        <div v-if="error" class="p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl text-[#ffb4ab] text-xs font-semibold">
          {{ error }}
        </div>

        <!-- STEP 1: Bucket & Account Selection -->
        <div v-if="currentStep === 1" class="space-y-4">
          
          <!-- 1. Select Bucket Section (2-Column Mobile Grid) -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-[#9e9cae] uppercase tracking-wider">Select Bucket</h4>
            
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <!-- Unassigned Option -->
              <button
                type="button"
                @click="form.bucket_id = ''"
                class="flex items-center gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer active:scale-[0.98] min-h-[50px]"
                :class="!form.bucket_id
                  ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] ring-1 ring-[#D4BFFF]/40'
                  : 'bg-[#0f1019] border-[#1f202e] hover:bg-[#141520] hover:border-[#D4BFFF]/40'"
              >
                <div class="w-8 h-8 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-base leading-none text-[#FFD1B3]">savings</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-bold text-[#f1f0f5] truncate">Unassigned</p>
                  <p class="text-[10px] text-[#9e9cae] truncate mt-0.5 tabular-nums">₹{{ formatAmount(unassignedAmount) }}</p>
                </div>
              </button>

              <!-- Active Buckets -->
              <button
                v-for="b in activeBuckets"
                :key="b.id"
                type="button"
                @click="form.bucket_id = b.id"
                class="flex items-center gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer active:scale-[0.98] min-h-[50px]"
                :class="form.bucket_id === b.id
                  ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] ring-1 ring-[#D4BFFF]/40'
                  : 'bg-[#0f1019] border-[#1f202e] hover:bg-[#141520] hover:border-[#D4BFFF]/40'"
              >
                <div class="w-8 h-8 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-base leading-none" :style="{ color: b.color || '#D4BFFF' }">{{ resolveIcon(b.icon, 'savings') }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-bold text-[#f1f0f5] truncate">{{ b.name }}</p>
                  <p class="text-[10px] font-bold text-[#9e9cae] truncate mt-0.5 tabular-nums">₹{{ formatAmount(b.allocated_balance) }}</p>
                </div>
              </button>
            </div>
          </div>

          <!-- 2. From Account Section (2-Column Mobile Grid) -->
          <div v-if="form.bucket_id !== ''" class="space-y-2">
            <h4 class="text-xs font-bold text-[#9e9cae] uppercase tracking-wider">From Account</h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                v-for="acc in userAccounts" 
                :key="acc.id"
                type="button"
                @click="form.account_id = acc.id"
                class="flex items-center gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer active:scale-[0.98] min-h-[50px]"
                :class="form.account_id === acc.id
                  ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] ring-1 ring-[#D4BFFF]/40'
                  : 'bg-[#0f1019] border-[#1f202e] hover:bg-[#141520] hover:border-[#D4BFFF]/40'"
              >
                <div class="w-8 h-8 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-base leading-none text-[#D4BFFF]">account_balance</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-bold text-[#f1f0f5] truncate">{{ acc.name }}</p>
                  <p class="text-[10px] font-bold text-[#9e9cae] truncate mt-0.5 tabular-nums">₹{{ formatAmount(acc.balance) }}</p>
                </div>
              </button>
            </div>
          </div>
          <div v-else class="p-3 bg-[#0f1019] border border-[#1f202e] rounded-xl text-xs text-[#9e9cae] flex items-center justify-between">
            <span>Account Assignment:</span>
            <span class="font-bold text-[#FFD1B3]">Unassigned General Pool</span>
          </div>
        </div>

        <!-- STEP 2: Details, Hero Amount, Type Switcher & Category Grid -->
        <div v-else class="space-y-4">
          
          <!-- Selected Allocation Badges Bar -->
          <div v-if="!isEdit" class="flex items-center justify-between gap-2 p-2.5 bg-[#0f1019] border border-[#1f202e] rounded-xl text-xs">
            <div class="flex flex-wrap items-center gap-1.5 min-w-0">
              <span class="px-2 py-0.5 rounded bg-[#D4BFFF]/15 text-[#D4BFFF] font-semibold text-[11px] truncate">{{ selectedBucketName }}</span>
              <span class="text-[#9e9cae] shrink-0">•</span>
              <span class="px-2 py-0.5 rounded bg-[#141520] border border-[#1f202e] text-[#f1f0f5] font-semibold text-[11px] truncate">{{ selectedAccountName }}</span>
            </div>
            <button type="button" @click="currentStep = 1" class="text-xs text-[#D4BFFF] hover:underline font-semibold cursor-pointer shrink-0 ml-auto">Edit</button>
          </div>

          <!-- Transaction Type Switcher -->
          <div class="grid grid-cols-3 gap-1 p-1 bg-[#0f1019] rounded-xl border border-[#1f202e]">
            <button 
              type="button"
              @click="form.transaction_type = 'expense'"
              class="py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
              :class="form.transaction_type === 'expense' ? 'bg-[#FFD1B3] text-[#0f0f15] font-bold' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
            >
              <span class="material-symbols-outlined text-base">trending_down</span>
              <span>Expense</span>
            </button>
            <button 
              type="button"
              @click="form.transaction_type = 'income'"
              class="py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
              :class="form.transaction_type === 'income' ? 'bg-[#B3F5E1] text-[#0f0f15] font-bold' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
            >
              <span class="material-symbols-outlined text-base">trending_up</span>
              <span>Income</span>
            </button>
            <button 
              type="button"
              @click="form.transaction_type = 'adjustment'"
              class="py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
              :class="form.transaction_type === 'adjustment' ? 'bg-[#D4BFFF] text-[#0f0f15] font-bold' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
            >
              <span class="material-symbols-outlined text-base">tune</span>
              <span>Adjust</span>
            </button>
          </div>

          <!-- Adjustment direction logic -->
          <div v-if="form.transaction_type === 'adjustment'" class="rounded-xl border border-amber-900/40 bg-[#0f1019] p-2.5 space-y-2">
            <p class="text-[11px] text-amber-200">Reconcile account balance to match reality. Enter reason in Description.</p>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" @click="form.adjustment_direction = 'add'" class="rounded-lg border py-1.5 text-xs font-semibold cursor-pointer" :class="form.adjustment_direction === 'add' ? 'border-[#B3F5E1] bg-[#B3F5E1]/20 text-[#B3F5E1]' : 'border-[#1f202e] text-[#9e9cae]'">+ Add amount</button>
              <button type="button" @click="form.adjustment_direction = 'subtract'" class="rounded-lg border py-1.5 text-xs font-semibold cursor-pointer" :class="form.adjustment_direction === 'subtract' ? 'border-[#FFD1B3] bg-[#FFD1B3]/20 text-[#FFD1B3]' : 'border-[#1f202e] text-[#9e9cae]'">− Subtract amount</button>
            </div>
          </div>

          <!-- Amount and Date Side-by-Side in 2 Columns -->
          <div class="grid grid-cols-2 gap-3 items-end">
            <!-- Amount Input (Left) -->
            <div class="space-y-1">
              <label class="text-[10px] font-semibold text-[#9e9cae] uppercase tracking-wider block">AMOUNT</label>
              <div class="flex items-center gap-1 border-b border-[#1f202e] focus-within:border-[#D4BFFF] pb-1">
                <span class="text-base font-bold text-[#9e9cae]">₹</span>
                <input 
                  v-model="form.amount"
                  type="text"
                  inputmode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  autocomplete="off"
                  placeholder="0.00"
                  required
                  class="w-full text-base sm:text-lg font-bold text-[#f1f0f5] tabular-nums bg-transparent focus:outline-none transition"
                />
              </div>
            </div>

            <!-- Date Selector (Right) -->
            <div class="space-y-1">
              <label class="text-[10px] font-semibold text-[#9e9cae] uppercase tracking-wider block">DATE</label>
              <input 
                v-model="form.date"
                @click="$event.target.showPicker?.()"
                type="date" 
                required
                class="w-full px-3 py-1.5 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-lg text-[#f1f0f5] text-xs font-semibold focus:outline-none transition cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>

          <!-- Category Selection Section -->
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label class="text-[10px] font-semibold text-[#9e9cae] uppercase tracking-wider block">CATEGORY *</label>
            </div>

            <!-- 3-Column Quick Category Grid -->
            <div v-if="form.bucket_id !== ''" class="grid grid-cols-3 gap-2">
              <button 
                type="button"
                v-for="cat in displayedQuickCategories" 
                :key="cat.id"
                @click="form.category_id = cat.id"
                class="p-2.5 rounded-xl border text-xs transition flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer min-h-[68px] active:scale-[0.98]"
                :class="form.category_id === cat.id ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] text-[#f1f0f5] ring-1 ring-[#D4BFFF]/40' : 'bg-[#0f1019] border-[#1f202e] text-[#9e9cae] hover:border-[#D4BFFF]/30'"
              >
                <div class="w-7 h-7 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-base shrink-0" :style="{ color: cat.color || '#D4BFFF' }">{{ resolveIcon(cat.icon, 'category') }}</span>
                </div>
                <span class="text-[11px] font-semibold truncate max-w-full leading-tight text-[#f1f0f5]">{{ cat.name }}</span>
              </button>

              <!-- More Categories Picker Trigger Card -->
              <button
                type="button"
                @click="categoryPickerRef?.open()"
                class="p-2.5 rounded-xl border text-xs transition flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer min-h-[68px] w-full active:scale-[0.98]"
                :class="selectedCategoryIsNonQuick ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] text-[#D4BFFF] ring-1 ring-[#D4BFFF]/40' : 'bg-[#0f1019] border-[#1f202e] text-[#9e9cae] hover:border-[#D4BFFF]/30'"
              >
                <div class="w-7 h-7 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
                  <span 
                    v-if="selectedCategoryIsNonQuick"
                    class="material-symbols-outlined text-base shrink-0"
                    :style="{ color: categories.find(c => c.id === form.category_id)?.color || '#D4BFFF' }"
                  >
                    {{ resolveIcon(categories.find(c => c.id === form.category_id)?.icon, 'category') }}
                  </span>
                  <span v-else class="material-symbols-outlined text-base text-[#D4BFFF]">more_horiz</span>
                </div>
                <span class="text-[11px] font-semibold truncate max-w-full leading-tight">
                  {{ selectedCategoryIsNonQuick ? categories.find(c => c.id === form.category_id)?.name : 'More' }}
                </span>
              </button>
            </div>

            <!-- Unassigned Category Banner -->
            <div v-else class="p-3 bg-[#0f1019] border border-[#1f202e] rounded-xl text-xs text-[#9e9cae] flex items-center justify-between">
              <span>Category Assignment:</span>
              <span class="font-semibold text-[#FFD1B3]">Unassigned (No Category)</span>
            </div>

            <!-- Reusable Category Picker Modal -->
            <CategoryPicker 
              ref="categoryPickerRef"
              :categories="categories" 
              v-model="form.category_id" 
              title="Select Category" 
              placeholder="Choose Category"
            />
          </div>

          <!-- Description Field -->
          <div class="space-y-1">
            <label class="text-[10px] font-semibold text-[#9e9cae] uppercase tracking-wider block">DESCRIPTION (OPTIONAL)</label>
            <input 
              v-model="form.description"
              type="text" 
              placeholder="e.g. Lunch with friends"
              class="w-full px-3 py-2 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs placeholder-slate-600 focus:outline-none transition"
            />
          </div>

          <!-- Note Field -->
          <div class="space-y-1">
            <label class="text-[10px] font-semibold text-[#9e9cae] uppercase tracking-wider block">NOTE</label>
            <textarea 
              v-model="form.notes"
              rows="2"
              placeholder="Optional note"
              class="w-full px-3 py-2 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs placeholder-slate-600 focus:outline-none transition resize-none"
            ></textarea>
          </div>
        </div>
      </form>

      <!-- Fixed Modal Footer -->
      <div class="px-5 py-3.5 border-t border-[#1f202e] bg-[#0c0d14] shrink-0">
        <button
          v-if="currentStep === 1 && !isEdit"
          type="button"
          @click="goToStep2"
          class="w-full py-2.5 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>Next</span>
          <span>→</span>
        </button>
        <button
          v-else
          form="transaction-entry-form"
          type="submit"
          :disabled="submitting"
          class="w-full py-2.5 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <span v-if="submitting" class="w-3.5 h-3.5 border-2 border-[#0f0f15] border-t-transparent rounded-full animate-spin"></span>
          <span>{{ isEdit ? 'Update Transaction' : 'Save Transaction' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import CategoryPicker from './CategoryPicker.vue';
import { resolveIcon } from '../utils/iconResolver.js';

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
const userAccounts = computed(() => props.accounts.filter(a => a.type !== 'Unassigned' && a.id !== 'acc_unassigned_pool'));
const quickSelectCategories = computed(() => props.categories.filter(c => c.is_quick_select == 1));
const displayedQuickCategories = computed(() => {
  const pinned = quickSelectCategories.value;
  return pinned.length > 0 ? pinned : props.categories.slice(0, 5);
});

// Category grid picker ref
const categoryPickerRef = ref(null);
const selectedCategoryIsNonQuick = computed(() => {
  if (!form.value.category_id) return false;
  return !displayedQuickCategories.value.some(c => c.id === form.value.category_id);
});

const netWorth = computed(() => {
  return props.accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
});

const totalAllocated = computed(() => {
  return props.buckets.reduce((sum, bucket) => {
    if (bucket.is_archived) return sum;
    return sum + (Number(bucket.allocated_balance) || 0);
  }, 0);
});

const unassignedAmount = computed(() => {
  return Math.round((netWorth.value - totalAllocated.value) * 100) / 100;
});

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

watch(() => form.value.bucket_id, (newVal) => {
  if (newVal === '') {
    form.value.category_id = '';
    form.value.account_id = 'acc_unassigned_pool';
  }
}, { immediate: true });

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

// Load edit values or defaults
onMounted(() => {
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
    if (props.defaultBucketId !== undefined) {
      form.value.bucket_id = props.defaultBucketId;
    }
    if (form.value.bucket_id === '') {
      form.value.account_id = 'acc_unassigned_pool';
      form.value.category_id = '';
    } else {
      if (props.accounts.length > 0 && !form.value.account_id) {
        form.value.account_id = props.accounts.filter(a => a.id !== 'acc_unassigned_pool')[0]?.id || props.accounts[0].id;
      }
      if (props.categories.length > 0 && !form.value.category_id) {
        form.value.category_id = props.categories[0].id;
      }
    }
  }
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
  if (form.value.bucket_id !== '' && !form.value.category_id) {
    error.value = 'Please select a category.';
    return;
  }

  submitting.value = true;
  try {
    const selectedCat = props.categories.find(c => c.id === form.value.category_id);
    const finalDesc = form.value.description && form.value.description.trim() 
      ? form.value.description.trim() 
      : (selectedCat ? selectedCat.name : 'Transaction');

    const payload = {
      ...form.value,
      amount: Number(normalizedAmount),
      description: finalDesc,
      notes: form.value.notes ? form.value.notes.trim() : null
    };
    emit('save', payload);
  } catch (err) {
    error.value = err.message || 'An error occurred while saving the transaction.';
    submitting.value = false;
  }
};
</script>
