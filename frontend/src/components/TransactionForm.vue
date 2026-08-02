<template>
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm overscroll-behavior-none">
    <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden transform transition-all max-h-[88vh] sm:max-h-[90vh] flex flex-col overscroll-contain safe-area-pb">
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20 shrink-0">
        <div>
          <h3 class="text-lg font-bold text-slate-100">
            {{ isEdit ? 'Edit Transaction' : 'Add Transaction' }}
          </h3>
          <p v-if="!isEdit" class="text-xs text-slate-400">
            Step {{ currentStep }} of 2: {{ currentStep === 1 ? 'Select Allocation & Storage' : 'Transaction Details' }}
          </p>
        </div>
        <button 
          @click="$emit('close')" 
          class="text-slate-400 hover:text-slate-200 transition text-lg font-semibold cursor-pointer p-1"
        >
          ✕
        </button>
      </div>

      <!-- Step Indicator Bar -->
      <div v-if="!isEdit" class="w-full bg-slate-950 h-1 flex shrink-0">
        <div class="h-full bg-indigo-600 transition-all duration-300" :style="{ width: currentStep === 1 ? '50%' : '100%' }"></div>
      </div>

      <!-- Form Body (Scrollable container without bounce-back bug) -->
      <form @submit.prevent="handleSubmit" class="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
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
              1. Select Savings Bucket (Purpose) *
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              <div 
                v-for="b in activeBuckets" 
                :key="b.id"
                @click="form.bucket_id = b.id"
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
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
              <div 
                v-for="acc in accounts" 
                :key="acc.id"
                @click="form.account_id = acc.id"
                class="p-3.5 rounded-2xl border text-xs cursor-pointer transition flex items-center justify-between"
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
          <div class="flex justify-between items-center pt-4 border-t border-slate-800">
            <button 
              type="button" 
              @click="$emit('close')"
              class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="button"
              @click="goToStep2"
              class="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Next: Details</span>
              <span>→</span>
            </button>
          </div>
        </div>

        <!-- STEP 2: Transaction Details -->
        <div v-else class="space-y-4">
          <!-- Summary of Step 1 Selection -->
          <div v-if="!isEdit" class="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs">
            <div class="flex items-center gap-3">
              <span>Bucket: <strong class="text-indigo-400">{{ selectedBucketName }}</strong></span>
              <span>•</span>
              <span>Account: <strong class="text-slate-200">{{ selectedAccountName }}</strong></span>
            </div>
            <button type="button" @click="currentStep = 1" class="text-xs text-indigo-400 hover:underline cursor-pointer">Edit</button>
          </div>

          <!-- Transaction Type Switch (Styled Green for Income, Red for Expense) -->
          <div class="grid grid-cols-2 gap-2.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button 
              type="button"
              @click="form.transaction_type = 'expense'"
              class="py-2.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              :class="form.transaction_type === 'expense' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-500' : 'text-slate-400 hover:text-slate-200'"
            >
              <span>↑ Expense</span>
            </button>
            <button 
              type="button"
              @click="form.transaction_type = 'income'"
              class="py-2.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              :class="form.transaction_type === 'income' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-500' : 'text-slate-400 hover:text-slate-200'"
            >
              <span>↓ Income</span>
            </button>
          </div>

          <!-- Amount and Date in a single row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Amount -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider block">Amount (₹) *</label>
              <input 
                v-model.number="form.amount"
                type="number" 
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
                class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-xl text-slate-100 text-base sm:text-sm font-bold placeholder-slate-600 focus:outline-none transition"
              />
            </div>

            <!-- Date -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider block">Date *</label>
              <input 
                v-model="form.date"
                @click="$event.target.showPicker?.()"
                type="date" 
                required
                class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-xl text-slate-100 text-base sm:text-sm focus:outline-none transition cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300 uppercase tracking-wider block">Description *</label>
            <input 
              v-model="form.description"
              type="text" 
              placeholder="e.g. Weekly Groceries"
              required
              class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-xl text-slate-100 text-base sm:text-sm placeholder-slate-600 focus:outline-none transition"
            />
          </div>

          <!-- Quick Select Categories Grid + Dropdown -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-300 uppercase tracking-wider block">Category *</label>

            <!-- Quick Select Category Cards -->
            <div v-if="quickSelectCategories.length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
              <button 
                type="button"
                v-for="cat in quickSelectCategories" 
                :key="cat.id"
                @click="form.category_id = cat.id"
                class="p-2.5 rounded-xl border text-xs font-semibold transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer relative overflow-hidden border-t-2 shadow-sm"
                :style="{ 
                  borderTopColor: cat.color || '#6366f1',
                  borderColor: form.category_id === cat.id ? (cat.color || '#6366f1') : undefined
                }"
                :class="form.category_id === cat.id ? 'bg-indigo-950/90 text-white ring-2 ring-indigo-500/50 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'"
              >
                <span class="text-lg">{{ cat.icon || '🏷️' }}</span>
                <span class="text-[11px] truncate max-w-full leading-tight font-bold">{{ cat.name }}</span>
              </button>
            </div>

            <!-- Dropdown for All Categories -->
            <select 
              v-model="form.category_id" 
              required
              class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 focus:bg-slate-950 focus:border-indigo-600 rounded-xl text-slate-200 text-xs focus:outline-none transition cursor-pointer"
            >
              <option value="" disabled class="bg-slate-950 text-slate-500">Select or change category...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id" class="bg-slate-950 text-slate-200">
                {{ cat.icon || '🏷️' }} {{ cat.name }}
              </option>
            </select>
          </div>

          <!-- Notes -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300 uppercase tracking-wider block">Notes (Optional)</label>
            <textarea 
              v-model="form.notes"
              rows="2"
              placeholder="Additional details..."
              class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-xl text-slate-100 text-xs placeholder-slate-600 focus:outline-none transition resize-none"
            ></textarea>
          </div>

          <!-- Footer Actions Step 2 -->
          <div class="flex justify-between items-center pt-4 border-t border-slate-800">
            <button 
              type="button" 
              @click="isEdit ? $emit('close') : (currentStep = 1)"
              class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              {{ isEdit ? 'Cancel' : '← Back' }}
            </button>

            <button 
              type="submit"
              :disabled="submitting"
              class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <span v-if="submitting" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isEdit ? 'Update Transaction' : 'Save Transaction' }}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

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
  notes: '',
  account_id: '',
  category_id: '',
  bucket_id: props.defaultBucketId || ''
});

// Helper labels
const selectedBucketName = computed(() => {
  const b = props.buckets.find(b => b.id === form.value.bucket_id);
  return b ? `${b.icon || '🪣'} ${b.name}` : 'Not Selected';
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

const goToStep2 = () => {
  error.value = '';
  if (!form.value.bucket_id) {
    error.value = 'Please select a Savings Bucket.';
    return;
  }
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
  if (!form.value.bucket_id) {
    error.value = 'Please select a Savings Bucket.';
    return;
  }
  if (!form.value.account_id) {
    error.value = 'Please select a valid account.';
    return;
  }
  if (form.value.amount <= 0 || isNaN(form.value.amount)) {
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
      amount: Number(form.value.amount),
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
