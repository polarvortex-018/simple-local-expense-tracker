<template>
  <div class="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 safe-area-modal-pt sm:pt-10 bg-[#0f0f15]/85 backdrop-blur-sm">
    <div class="relative w-full max-w-md bg-[#14141d] border border-[#29293a] rounded-2xl shadow-2xl overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
      
      <!-- Header -->
      <div class="px-5 py-3.5 border-b border-[#29293a] flex justify-between items-center bg-[#14141d] shrink-0">
        <div class="flex items-center gap-3">
          <button 
            v-if="currentStep === 2 && !isEdit"
            type="button" 
            @click="currentStep = 1"
            class="text-[#9e9cae] hover:text-[#f1f0f5] transition text-sm font-bold cursor-pointer p-1"
            title="Back to Step 1"
          >
            ←
          </button>
          <button 
            @click="$emit('close')" 
            class="text-[#9e9cae] hover:text-[#f1f0f5] transition text-base font-bold cursor-pointer p-1"
            title="Close"
          >
            ✕
          </button>
        </div>
        <div class="text-center">
          <h3 class="text-base font-bold text-[#D4BFFF] tracking-tight">
            {{ isEdit ? 'Edit Transaction' : 'Add Transaction' }}
          </h3>
          <p v-if="!isEdit" class="text-[11px] font-semibold text-[#9e9cae]">
            Step {{ currentStep }} of 2
          </p>
        </div>
        <div class="w-10"></div> <!-- Centering layout placeholder -->
      </div>

      <!-- Form Body (Scrollable container) -->
      <form id="transaction-entry-form" @submit.prevent="handleSubmit" class="p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
        <!-- Error Alerts -->
        <div v-if="error" class="p-3 bg-rose-950/40 border border-rose-900/50 rounded-xl text-[#ffb4ab] text-xs font-semibold">
          {{ error }}
        </div>

        <!-- STEP 1: Bucket & Account Selection (Matching Image 1) -->
        <div v-if="currentStep === 1" class="space-y-5">
          
          <!-- 1. Select Bucket Section -->
          <div class="space-y-2">
            <h4 class="text-sm font-bold text-[#f1f0f5] tracking-tight">Select Bucket</h4>
            <div class="bg-[#0f0f15] border border-[#29293a] rounded-xl overflow-hidden divide-y divide-[#29293a] shadow-sm">
              
              <!-- Unassigned Row -->
              <div 
                @click="form.bucket_id = ''"
                class="p-3.5 flex items-center justify-between transition cursor-pointer min-h-[48px]"
                :class="!form.bucket_id ? 'bg-[#D4BFFF]/20 text-[#D4BFFF] font-bold' : 'hover:bg-[#191924] text-[#f1f0f5]'"
              >
                <div class="flex items-center gap-3">
                  <span class="w-1 h-5 rounded-full bg-[#FFD1B3] shrink-0"></span>
                  <span class="text-lg">🪣</span>
                  <span class="text-xs font-semibold">Unassigned (Account Only)</span>
                </div>
                <span class="text-xs font-bold tabular-nums text-[#FFD1B3]">₹{{ formatAmount(unassignedAmount) }}</span>
              </div>

              <!-- Active Buckets Rows -->
              <div 
                v-for="b in activeBuckets" 
                :key="b.id"
                @click="form.bucket_id = b.id"
                class="p-3.5 flex items-center justify-between transition cursor-pointer min-h-[48px]"
                :class="form.bucket_id === b.id ? 'bg-[#D4BFFF]/20 text-[#D4BFFF] font-bold' : 'hover:bg-[#191924] text-[#f1f0f5]'"
              >
                <div class="flex items-center gap-3 overflow-hidden">
                  <span class="w-1 h-5 rounded-full shrink-0" :style="{ backgroundColor: b.color || '#D4BFFF' }"></span>
                  <span class="text-lg shrink-0">{{ b.icon || '🪣' }}</span>
                  <span class="text-xs font-semibold truncate">{{ b.name }}</span>
                </div>
                <span class="text-xs font-bold tabular-nums shrink-0" :class="b.allocated_balance >= 0 ? 'text-[#B3F5E1]' : 'text-[#FFD1B3]'">
                  ₹{{ formatAmount(b.allocated_balance) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 2. From Account Section -->
          <div v-if="form.bucket_id !== ''" class="space-y-2">
            <h4 class="text-sm font-bold text-[#f1f0f5] tracking-tight">From Account</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div 
                v-for="acc in userAccounts" 
                :key="acc.id"
                @click="form.account_id = acc.id"
                class="p-3 rounded-xl border text-xs cursor-pointer transition flex flex-col justify-between space-y-2 relative min-h-[64px]"
                :class="form.account_id === acc.id ? 'bg-[#D4BFFF]/20 border-[#D4BFFF] text-[#f1f0f5] ring-1 ring-[#D4BFFF]' : 'bg-[#0f0f15] border-[#29293a] text-[#9e9cae] hover:border-[#29293a]'"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-[11px] uppercase tracking-wider truncate pr-1 text-[#f1f0f5]">{{ acc.name }}</span>
                  <span v-if="form.account_id === acc.id" class="w-4 h-4 rounded-full bg-[#D4BFFF] text-[#0f0f15] flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                </div>
                <span class="text-xs font-bold tabular-nums tracking-tight" :class="acc.balance >= 0 ? 'text-[#B3F5E1]' : 'text-[#FFD1B3]'">
                  ₹{{ formatAmount(acc.balance) }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="p-3 bg-[#0f0f15] border border-[#29293a] rounded-xl text-xs text-[#9e9cae] flex items-center justify-between">
            <span>Account Assignment:</span>
            <span class="font-bold text-[#FFD1B3]">Unassigned General Pool</span>
          </div>
        </div>

        <!-- STEP 2: Details, Hero Amount, Type Switcher & Category Grid (Matching Image 2) -->
        <div v-else class="space-y-4">
          
          <!-- Selected Allocation Badges Bar (Fully Visible, No Truncation) -->
          <div v-if="!isEdit" class="flex items-center justify-between gap-2 p-2.5 bg-[#0f0f15] border border-[#29293a] rounded-lg text-xs">
            <div class="flex flex-wrap items-center gap-1.5 min-w-0">
              <span class="px-2 py-0.5 rounded bg-[#D4BFFF]/15 text-[#D4BFFF] font-bold uppercase text-[10px] tracking-wider break-words">{{ selectedBucketName }}</span>
              <span class="text-[#9e9cae] shrink-0">•</span>
              <span class="px-2 py-0.5 rounded bg-[#14141d] border border-[#29293a] text-[#f1f0f5] font-bold uppercase text-[10px] tracking-wider break-words">{{ selectedAccountName }}</span>
            </div>
            <button type="button" @click="currentStep = 1" class="text-xs text-[#D4BFFF] hover:underline font-semibold cursor-pointer shrink-0 ml-auto">Edit</button>
          </div>

          <!-- Transaction Type Switcher -->
          <div class="grid grid-cols-3 gap-1.5 p-1 bg-[#0f0f15] rounded-full border border-[#29293a]">
            <button 
              type="button"
              @click="form.transaction_type = 'expense'"
              class="py-2 text-xs font-bold rounded-full transition cursor-pointer flex items-center justify-center gap-1"
              :class="form.transaction_type === 'expense' ? 'bg-[#ef4444] text-white shadow-sm' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
            >
              <span>↓ Expense</span>
            </button>
            <button 
              type="button"
              @click="form.transaction_type = 'income'"
              class="py-2 text-xs font-bold rounded-full transition cursor-pointer flex items-center justify-center gap-1"
              :class="form.transaction_type === 'income' ? 'bg-[#10b981] text-white shadow-sm' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
            >
              <span>↑ Income</span>
            </button>
            <button
              type="button"
              @click="form.transaction_type = 'adjustment'"
              class="py-2 px-1 text-xs font-bold rounded-full transition cursor-pointer flex items-center justify-center gap-1"
              :class="form.transaction_type === 'adjustment' ? 'bg-amber-600 text-white shadow-sm' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
            >
              <span>⇄ Adjust</span>
            </button>
          </div>

          <!-- Adjustment direction logic if adjustment type selected -->
          <div v-if="form.transaction_type === 'adjustment'" class="rounded-lg border border-amber-900/50 bg-[#0f0f15] p-2.5 space-y-2">
            <p class="text-[11px] text-amber-200">Reconcile account balance to match reality. Enter reason in Description.</p>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" @click="form.adjustment_direction = 'add'" class="rounded-full border py-1.5 text-xs font-bold cursor-pointer" :class="form.adjustment_direction === 'add' ? 'border-[#10b981] bg-[#10b981]/20 text-[#4edea3]' : 'border-[#29293a] text-[#9e9cae]'">+ Add amount</button>
              <button type="button" @click="form.adjustment_direction = 'subtract'" class="rounded-full border py-1.5 text-xs font-bold cursor-pointer" :class="form.adjustment_direction === 'subtract' ? 'border-[#ef4444] bg-[#ef4444]/20 text-[#ffb4ab]' : 'border-[#29293a] text-[#9e9cae]'">− Subtract amount</button>
            </div>
          </div>

          <!-- Amount and Date Side-by-Side in 2 Columns (Matching Screenshot Exactly) -->
          <div class="grid grid-cols-2 gap-4 items-end">
            <!-- Amount Input (Left) -->
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">AMOUNT</label>
              <div class="flex items-center gap-1 border-b border-[#29293a] focus-within:border-[#D4BFFF] pb-1">
                <span class="text-base font-bold text-[#9e9cae]">₹</span>
                <input 
                  v-model="form.amount"
                  type="text"
                  inputmode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  autocomplete="off"
                  placeholder="124.50"
                  required
                  class="w-full text-base sm:text-lg font-bold text-[#f1f0f5] tabular-nums bg-transparent focus:outline-none transition"
                />
              </div>
            </div>

            <!-- Date Selector (Right) -->
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">DATE</label>
              <input 
                v-model="form.date"
                @click="$event.target.showPicker?.()"
                type="date" 
                required
                class="w-full px-3 py-2 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-lg text-[#f1f0f5] text-xs font-semibold focus:outline-none transition cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>

          <!-- Category Selection Grid -->
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">CATEGORY</label>
            </div>

            <!-- Quick Category Grid (Only shown if a specific bucket is selected) -->
            <div v-if="form.bucket_id !== ''" class="grid grid-cols-3 gap-2">
              <button 
                type="button"
                v-for="cat in displayedQuickCategories" 
                :key="cat.id"
                @click="form.category_id = cat.id"
                class="p-2.5 rounded-xl border text-xs font-semibold transition flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer min-h-[72px]"
                :class="form.category_id === cat.id ? 'bg-[#D4BFFF]/20 border-[#D4BFFF] text-[#f1f0f5] ring-1 ring-[#D4BFFF]' : 'bg-[#0f0f15] border-[#29293a] text-[#9e9cae] hover:border-[#D4BFFF]/40'"
              >
                <span class="w-8 h-8 rounded-lg bg-[#14141d] border border-[#29293a] flex items-center justify-center text-base">{{ cat.icon || '🏷️' }}</span>
                <span class="text-xs font-bold truncate max-w-full leading-tight">{{ cat.name }}</span>
              </button>

              <!-- All Categories Grid Modal Trigger -->
              <button
                type="button"
                @click="showCategoryModal = true"
                class="p-2.5 rounded-xl border text-xs font-semibold transition flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer min-h-[72px] w-full"
                :class="selectedCategoryIsNonQuick ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] text-[#D4BFFF] ring-1 ring-[#D4BFFF]/40' : 'bg-[#0f0f15] border-[#29293a] text-[#9e9cae] hover:border-[#D4BFFF]/40'"
              >
                <span class="w-8 h-8 rounded-lg bg-[#14141d] border border-[#29293a] flex items-center justify-center text-base">
                  {{ selectedCategoryIsNonQuick ? (categories.find(c => c.id === form.category_id)?.icon || '🏷️') : '•••' }}
                </span>
                <span class="text-xs font-bold truncate max-w-full leading-tight">
                  {{ selectedCategoryIsNonQuick ? categories.find(c => c.id === form.category_id)?.name : 'More' }}
                </span>
              </button>
            </div>

            <!-- Unassigned Category Banner -->
            <div v-else class="p-3 bg-[#0f0f15] border border-[#29293a] rounded-xl text-xs text-[#9e9cae] flex items-center justify-between">
              <span>Category Assignment:</span>
              <span class="font-bold text-[#FFD1B3]">Unassigned (No Category)</span>
            </div>
          </div>

          <!-- Description Field -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">DESCRIPTION</label>
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-[#9e9cae] text-xs">≡</span>
              <input 
                v-model="form.description"
                type="text" 
                placeholder="Optional description"
                required
                class="w-full pl-8 pr-3 py-2 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-lg text-[#f1f0f5] text-xs placeholder-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          <!-- Note Field -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">NOTE</label>
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-[#9e9cae] text-xs">≡</span>
              <textarea 
                v-model="form.notes"
                rows="2"
                placeholder="Optional note"
                class="w-full pl-8 pr-3 py-2 bg-[#0f0f15] border border-[#29293a] focus:border-[#D4BFFF] rounded-lg text-[#f1f0f5] text-xs placeholder-slate-600 focus:outline-none transition resize-none"
              ></textarea>
            </div>
          </div>
        </div>
      </form>

      <!-- Fixed Modal Footer (Outside scroll container so content is never cut off) -->
      <div class="px-5 py-3.5 border-t border-[#29293a] bg-[#14141d] shrink-0">
        <button
          v-if="currentStep === 1 && !isEdit"
          type="button"
          @click="goToStep2"
          class="w-full py-3 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-full shadow-md transition cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Next</span>
          <span>→</span>
        </button>
        <button
          v-else
          form="transaction-entry-form"
          type="submit"
          :disabled="submitting"
          class="w-full py-3 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-full shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span v-if="submitting" class="w-4 h-4 border-2 border-[#0f0f15] border-t-transparent rounded-full animate-spin"></span>
          <span v-else class="w-4 h-4 rounded-full border border-[#0f0f15] flex items-center justify-center text-[10px] font-bold">✓</span>
          <span>{{ isEdit ? 'Update Transaction' : 'Save Transaction' }}</span>
        </button>
      </div>
    </div>

    <!-- Category Grid Modal -->
    <div
      v-if="showCategoryModal"
      class="fixed inset-0 z-[60] flex items-end justify-center bg-[#0f0f15]/85 backdrop-blur-sm"
      @click.self="showCategoryModal = false"
    >
      <div class="w-full max-w-md bg-[#14141d] border-t border-[#29293a] rounded-t-2xl shadow-2xl flex flex-col max-h-[80vh]">
        <!-- Handle bar -->
        <div class="flex justify-center pt-2.5 pb-1 shrink-0">
          <div class="w-10 h-1 rounded-full bg-[#29293a]"></div>
        </div>
        <!-- Header -->
        <div class="px-5 pb-3 pt-1 flex justify-between items-center shrink-0">
          <h3 class="text-sm font-bold text-[#f1f0f5]">Select Category</h3>
          <button @click="showCategoryModal = false" class="text-[#9e9cae] hover:text-[#f1f0f5] text-base cursor-pointer p-1">✕</button>
        </div>
        <!-- Grid -->
        <div class="overflow-y-auto flex-1 px-4 pb-6">
          <div class="grid grid-cols-3 gap-2.5">
            <button
              v-for="cat in categories"
              :key="cat.id"
              type="button"
              @click="form.category_id = cat.id; showCategoryModal = false"
              class="p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition min-h-[80px]"
              :class="form.category_id === cat.id
                ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] ring-1 ring-[#D4BFFF]/40'
                : 'bg-[#0f0f15] border-[#29293a] hover:border-[#D4BFFF]/30'"
            >
              <span
                class="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition"
                :class="form.category_id === cat.id ? 'bg-[#D4BFFF]/20' : 'bg-[#191924]'"
              >{{ cat.icon || '🏷️' }}</span>
              <span
                class="text-[11px] font-bold leading-tight truncate w-full"
                :class="form.category_id === cat.id ? 'text-[#D4BFFF]' : 'text-[#ccc3d8]'"
              >{{ cat.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

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

// Category grid modal
const showCategoryModal = ref(false);
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
  if (!form.value.description || !form.value.description.trim()) {
    error.value = 'Description cannot be empty.';
    return;
  }
  if (form.value.bucket_id !== '' && !form.value.category_id) {
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
