<template>
  <div class="fixed inset-0 z-50 flex items-start justify-center p-3 pt-[max(2.5rem,env(safe-area-inset-top))] sm:pt-10 safe-area-modal-pt bg-[#0c0d14]/90 backdrop-blur-sm overflow-y-auto">
    <div class="relative w-full max-w-md bg-[#0c0d14] border border-[#1f202e] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh] my-0 sm:my-auto">
      
      <!-- Header -->
      <div class="px-4 py-2.5 border-b border-[#1f202e] flex justify-between items-center bg-[#0c0d14] shrink-0">
        <div class="flex items-center gap-2">
          <button 
            v-if="currentStep === 2 && !isEdit"
            type="button" 
            @click="goToStep1"
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
          <h3 class="text-xs font-bold text-[#D4BFFF] tracking-tight">
            {{ isEdit ? 'Edit Transaction' : 'Add Transaction' }}
          </h3>
          <p v-if="!isEdit" class="text-[9px] font-semibold text-[#9e9cae]">
            Step {{ currentStep }} of 2
          </p>
        </div>
        <div class="w-8"></div> <!-- Centering layout placeholder -->
      </div>

      <!-- Form Body (Scrollable container with autofill prevention) -->
      <form 
        id="transaction-entry-form" 
        @submit.prevent="handleSubmit" 
        autocomplete="off" 
        autocorrect="off" 
        autocapitalize="off" 
        spellcheck="false" 
        data-form-type="other" 
        data-lpignore="true" 
        class="p-3 sm:p-4 space-y-2.5 overflow-y-auto flex-1 overscroll-contain"
      >
        <!-- Error Alerts -->
        <div v-if="error" class="p-2.5 bg-rose-950/30 border border-rose-900/40 rounded-xl text-[#ffb4ab] text-xs font-semibold">
          {{ error }}
        </div>

        <!-- Smooth Step Slide Container -->
        <Transition :name="slideDirection === 'next' ? 'step-next' : 'step-prev'" mode="out-in">
          <!-- STEP 1: Bucket & Account Selection -->
          <div v-if="currentStep === 1" key="step-1" class="space-y-3">
            
            <!-- 1. Select Bucket Section (2-Column Mobile Grid) -->
            <div class="space-y-1.5">
              <h4 class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">1. Select Savings Bucket</h4>
              
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <!-- Unassigned Option -->
                <button
                  type="button"
                  @click="selectBucket('')"
                  class="flex items-center gap-2 p-2.5 rounded-xl border text-left transition cursor-pointer active:scale-[0.98] min-h-[46px]"
                  :class="!form.bucket_id
                    ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] ring-1 ring-[#D4BFFF]/40'
                    : 'bg-[#0f1019] border-[#1f202e] hover:bg-[#141520] hover:border-[#D4BFFF]/40'"
                >
                  <div class="w-7 h-7 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-sm leading-none text-[#FFD1B3]">savings</span>
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
                  @click="selectBucket(b.id)"
                  class="flex items-center gap-2 p-2.5 rounded-xl border text-left transition cursor-pointer active:scale-[0.98] min-h-[46px]"
                  :class="form.bucket_id === b.id
                    ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] ring-1 ring-[#D4BFFF]/40'
                    : 'bg-[#0f1019] border-[#1f202e] hover:bg-[#141520] hover:border-[#D4BFFF]/40'"
                >
                  <div class="w-7 h-7 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-sm leading-none" :style="{ color: b.color || '#D4BFFF' }">{{ resolveIcon(b.icon, 'savings') }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-[#f1f0f5] truncate">{{ b.name }}</p>
                    <p class="text-[10px] font-bold text-[#9e9cae] truncate mt-0.5 tabular-nums">₹{{ formatAmount(b.allocated_balance) }}</p>
                  </div>
                </button>
              </div>
            </div>

            <!-- 2. From Account Section (2-Column Mobile Grid) -->
            <div ref="accountSectionRef" class="space-y-1.5 pt-1 border-t border-[#1f202e]/60">
              <h4 class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider">2. Select Account (Optional)</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <!-- No Account / Unassigned Option -->
                <button
                  type="button"
                  @click="selectAccountAndAutoAdvance('acc_unassigned_pool')"
                  class="flex items-center gap-2 p-2.5 rounded-xl border text-left transition cursor-pointer active:scale-[0.98] min-h-[46px]"
                  :class="form.account_id === 'acc_unassigned_pool' || (!form.account_id && currentStep === 2)
                    ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] ring-1 ring-[#D4BFFF]/40'
                    : 'bg-[#0f1019] border-[#1f202e] hover:bg-[#141520] hover:border-[#D4BFFF]/40'"
                >
                  <div class="w-7 h-7 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-sm leading-none text-[#9e9cae]">credit_card_off</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-[#f1f0f5] truncate">No Account</p>
                    <p class="text-[10px] text-[#9e9cae] truncate mt-0.5">Unassigned</p>
                  </div>
                </button>

                <!-- Physical User Accounts -->
                <button
                  v-for="acc in userAccounts" 
                  :key="acc.id"
                  type="button"
                  @click="selectAccountAndAutoAdvance(acc.id)"
                  class="flex items-center gap-2 p-2.5 rounded-xl border text-left transition cursor-pointer active:scale-[0.98] min-h-[46px]"
                  :class="form.account_id === acc.id
                    ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] ring-1 ring-[#D4BFFF]/40'
                    : 'bg-[#0f1019] border-[#1f202e] hover:bg-[#141520] hover:border-[#D4BFFF]/40'"
                >
                  <div class="w-7 h-7 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-sm leading-none text-[#D4BFFF]">account_balance</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-[#f1f0f5] truncate">{{ acc.name }}</p>
                    <p class="text-[10px] font-bold text-[#9e9cae] truncate mt-0.5 tabular-nums">₹{{ formatAmount(acc.balance) }}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- STEP 2: Details (Category -> Amount -> Description -> Submit) -->
          <div v-else key="step-2" class="space-y-3.5 pb-2">
            
            <!-- Selected Allocation Badges Bar -->
            <div v-if="!isEdit" class="flex items-center justify-between gap-2 p-2 px-3 bg-[#0f1019] border border-[#1f202e] rounded-xl text-xs">
              <div class="flex flex-wrap items-center gap-1.5 min-w-0">
                <span class="px-2 py-0.5 rounded-md bg-[#D4BFFF]/15 text-[#D4BFFF] font-semibold text-[10px] truncate">{{ selectedBucketName }}</span>
                <span class="text-[#9e9cae] shrink-0 text-[10px]">•</span>
                <span class="px-2 py-0.5 rounded-md bg-[#141520] border border-[#1f202e] text-[#f1f0f5] font-semibold text-[10px] truncate">{{ selectedAccountName }}</span>
              </div>
              <button type="button" @click="goToStep1" class="text-[10px] text-[#D4BFFF] hover:underline font-semibold cursor-pointer shrink-0 ml-auto">Change</button>
            </div>

            <!-- Transaction Type Switcher -->
            <div class="grid grid-cols-3 gap-1 p-1 bg-[#0f1019] rounded-xl border border-[#1f202e]">
              <button 
                type="button"
                @click="form.transaction_type = 'expense'"
                class="py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                :class="form.transaction_type === 'expense' ? 'bg-[#FFD1B3] text-[#0f0f15] font-bold shadow-sm' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
              >
                <span class="material-symbols-outlined text-sm">trending_down</span>
                <span>Expense</span>
              </button>
              <button 
                type="button"
                @click="form.transaction_type = 'income'"
                class="py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                :class="form.transaction_type === 'income' ? 'bg-[#B3F5E1] text-[#0f0f15] font-bold shadow-sm' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
              >
                <span class="material-symbols-outlined text-sm">trending_up</span>
                <span>Income</span>
              </button>
              <button 
                type="button"
                @click="form.transaction_type = 'adjustment'"
                class="py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                :class="form.transaction_type === 'adjustment' ? 'bg-[#D4BFFF] text-[#0f0f15] font-bold shadow-sm' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
              >
                <span class="material-symbols-outlined text-sm">tune</span>
                <span>Adjust</span>
              </button>
            </div>

            <!-- Adjustment Target & Direction logic (Reconcile Just Account, Just Bucket, or Both) -->
            <div v-if="form.transaction_type === 'adjustment'" class="rounded-xl border border-amber-900/40 bg-[#0f1019] p-3 space-y-2">
              <p class="text-[10px] text-amber-200 font-semibold">Reconciliation Target (Correct mistakes in tallying):</p>
              
              <!-- 3-Way Target Selector -->
              <div class="grid grid-cols-3 gap-1 p-0.5 bg-[#141520] rounded-lg border border-[#1f202e] text-[10px] font-bold">
                <button 
                  type="button" 
                  @click="form.adjustment_target = 'both'" 
                  class="py-1 px-1 rounded transition cursor-pointer text-center" 
                  :class="form.adjustment_target === 'both' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
                >
                  ⚖️ Both
                </button>
                <button 
                  type="button" 
                  @click="form.adjustment_target = 'account_only'" 
                  class="py-1 px-1 rounded transition cursor-pointer text-center" 
                  :class="form.adjustment_target === 'account_only' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
                >
                  🏦 Account Only
                </button>
                <button 
                  type="button" 
                  @click="form.adjustment_target = 'bucket_only'" 
                  class="py-1 px-1 rounded transition cursor-pointer text-center" 
                  :class="form.adjustment_target === 'bucket_only' ? 'bg-[#D4BFFF] text-[#0f0f15]' : 'text-[#9e9cae] hover:text-[#f1f0f5]'"
                >
                  🪣 Bucket Only
                </button>
              </div>

              <!-- Direction (+ Add / - Subtract) -->
              <div class="grid grid-cols-2 gap-2 pt-0.5">
                <button type="button" @click="form.adjustment_direction = 'add'" class="rounded-lg border py-1.5 text-xs font-semibold cursor-pointer" :class="form.adjustment_direction === 'add' ? 'border-[#B3F5E1] bg-[#B3F5E1]/20 text-[#B3F5E1]' : 'border-[#1f202e] text-[#9e9cae]'">+ Add amount</button>
                <button type="button" @click="form.adjustment_direction = 'subtract'" class="rounded-lg border py-1.5 text-xs font-semibold cursor-pointer" :class="form.adjustment_direction === 'subtract' ? 'border-[#FFD1B3] bg-[#FFD1B3]/20 text-[#FFD1B3]' : 'border-[#1f202e] text-[#9e9cae]'">− Subtract amount</button>
              </div>
            </div>

            <!-- 1. CATEGORY SELECTION FIRST (3-Column Grid) -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">SELECT CATEGORY *</label>

              <!-- 3-Column Spacious Quick Category Grid -->
              <div class="grid grid-cols-3 gap-2">
                <button 
                  type="button"
                  v-for="cat in displayedQuickCategories" 
                  :key="cat.id"
                  @click="selectCategoryAndFocusAmount(cat.id)"
                  class="p-2 rounded-xl border text-xs transition flex items-center justify-start gap-2 text-left cursor-pointer min-h-[46px] active:scale-[0.98]"
                  :class="form.category_id === cat.id ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] text-[#f1f0f5] ring-1 ring-[#D4BFFF]/40' : 'bg-[#0f1019] border-[#1f202e] text-[#9e9cae] hover:border-[#D4BFFF]/30'"
                >
                  <div class="w-7 h-7 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-sm shrink-0" :style="{ color: cat.color || '#D4BFFF' }">{{ resolveIcon(cat.icon, 'category') }}</span>
                  </div>
                  <span class="text-[11px] font-bold truncate max-w-full leading-tight text-[#f1f0f5]">{{ cat.name }}</span>
                </button>

                <!-- More Categories Picker Trigger Card -->
                <button
                  type="button"
                  @click="categoryPickerRef?.open()"
                  class="p-2 rounded-xl border text-xs transition flex items-center justify-start gap-2 text-left cursor-pointer min-h-[46px] w-full active:scale-[0.98]"
                  :class="selectedCategoryIsNonQuick ? 'bg-[#D4BFFF]/15 border-[#D4BFFF] text-[#D4BFFF] ring-1 ring-[#D4BFFF]/40' : 'bg-[#0f1019] border-[#1f202e] text-[#9e9cae] hover:border-[#D4BFFF]/30'"
                >
                  <div class="w-7 h-7 rounded-lg bg-[#141520] border border-[#1f202e] flex items-center justify-center shrink-0">
                    <span 
                      v-if="selectedCategoryIsNonQuick"
                      class="material-symbols-outlined text-sm shrink-0"
                      :style="{ color: categories.find(c => c.id === form.category_id)?.color || '#D4BFFF' }"
                    >
                      {{ resolveIcon(categories.find(c => c.id === form.category_id)?.icon, 'category') }}
                    </span>
                    <span v-else class="material-symbols-outlined text-sm text-[#D4BFFF]">more_horiz</span>
                  </div>
                  <span class="text-[11px] font-bold truncate max-w-full leading-tight">
                    {{ selectedCategoryIsNonQuick ? categories.find(c => c.id === form.category_id)?.name : 'More' }}
                  </span>
                </button>
              </div>

              <!-- Reusable Category Picker Modal (Hidden inline trigger) -->
              <CategoryPicker 
                ref="categoryPickerRef"
                :categories="categories" 
                v-model="form.category_id" 
                :hide-trigger="true"
                @change="focusAmountInput"
                title="Select Category" 
                placeholder="Choose Category"
              />
            </div>

            <!-- 2. AMOUNT & DATE SECOND -->
            <div class="grid grid-cols-2 gap-3 items-end">
              <!-- Amount Input (Left) -->
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">AMOUNT *</label>
                <div class="flex items-center gap-1.5 border-b border-[#1f202e] focus-within:border-[#D4BFFF] pb-1">
                  <span class="text-base font-bold text-[#9e9cae]">₹</span>
                  <input 
                    ref="amountInputRef"
                    v-model="form.amount"
                    type="text"
                    name="tx_amount"
                    inputmode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    data-form-type="other"
                    data-lpignore="true"
                    placeholder="0.00"
                    required
                    @keydown.enter.prevent="focusDescriptionInput"
                    class="w-full text-lg font-bold text-[#f1f0f5] tabular-nums bg-transparent focus:outline-none transition"
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
                  class="w-full h-8.5 px-2.5 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs font-semibold focus:outline-none transition cursor-pointer [color-scheme:dark]"
                />
              </div>
            </div>

            <!-- 3. DESCRIPTION THIRD -->
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">DESCRIPTION (OPTIONAL)</label>
              <input 
                ref="descriptionInputRef"
                v-model="form.description"
                type="text" 
                name="tx_description"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                data-lpignore="true"
                placeholder="e.g. Lunch with friends"
                @keydown.enter.prevent="handleSubmit"
                class="w-full h-8.5 px-3 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs placeholder-[#9e9cae]/50 focus:outline-none transition"
              />
            </div>

            <!-- Note Field -->
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#9e9cae] uppercase tracking-wider block">NOTE (OPTIONAL)</label>
              <textarea 
                v-model="form.notes"
                rows="1"
                name="tx_notes"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-form-type="other"
                data-lpignore="true"
                placeholder="Optional note"
                @keydown.enter.prevent="handleSubmit"
                class="w-full h-8 px-3 py-1.5 bg-[#0f1019] border border-[#1f202e] focus:border-[#D4BFFF] rounded-xl text-[#f1f0f5] text-xs placeholder-[#9e9cae]/50 focus:outline-none transition resize-none"
              ></textarea>
            </div>
          </div>
        </Transition>
      </form>

      <!-- Fixed Modal Footer -->
      <div class="px-4 py-2.5 border-t border-[#1f202e] bg-[#0c0d14] shrink-0">
        <button
          v-if="currentStep === 1 && !isEdit"
          type="button"
          @click="goToStep2"
          class="w-full py-2 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>Next</span>
          <span>→</span>
        </button>
        <button
          v-else
          form="transaction-entry-form"
          type="submit"
          :disabled="submitting"
          class="w-full py-2 bg-[#D4BFFF] hover:bg-[#c099fb] text-[#0f0f15] font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <span v-if="submitting" class="w-3.5 h-3.5 border-2 border-[#0f0f15] border-t-transparent rounded-full animate-spin"></span>
          <span>{{ isEdit ? 'Update Transaction' : 'Save Transaction' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
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
const slideDirection = ref('next');
const submitting = ref(false);
const error = ref('');

const activeBuckets = computed(() => props.buckets.filter(b => !b.is_archived));
const userAccounts = computed(() => props.accounts.filter(a => a.type !== 'Unassigned' && a.id !== 'acc_unassigned_pool'));
const quickSelectCategories = computed(() => props.categories.filter(c => c.is_quick_select == 1));
const displayedQuickCategories = computed(() => {
  const pinned = quickSelectCategories.value;
  return pinned.length > 0 ? pinned : props.categories.slice(0, 5);
});

// Category grid picker ref, amount ref, description ref & account section ref
const accountSectionRef = ref(null);
const categoryPickerRef = ref(null);
const amountInputRef = ref(null);
const descriptionInputRef = ref(null);

const goToStep1 = () => {
  slideDirection.value = 'prev';
  currentStep.value = 1;
};

const goToStep2 = () => {
  error.value = '';
  if (!form.value.account_id) {
    form.value.account_id = 'acc_unassigned_pool';
  }
  slideDirection.value = 'next';
  currentStep.value = 2;
  focusAmountInput();
};

const selectBucket = (bId) => {
  form.value.bucket_id = bId;
  nextTick(() => {
    accountSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
};

const selectAccountAndAutoAdvance = (accId) => {
  form.value.account_id = accId || 'acc_unassigned_pool';
  goToStep2();
};

const selectCategoryAndFocusAmount = (catId) => {
  form.value.category_id = catId;
  focusAmountInput();
};

const focusAmountInput = () => {
  nextTick(() => {
    amountInputRef.value?.focus();
    amountInputRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
};

const focusDescriptionInput = () => {
  nextTick(() => {
    descriptionInputRef.value?.focus();
    descriptionInputRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
};

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
  adjustment_target: 'both',
  notes: '',
  account_id: '',
  category_id: '',
  bucket_id: props.defaultBucketId || ''
});

watch(() => form.value.bucket_id, (newVal) => {
  if (newVal === '') {
    form.value.category_id = '';
  }
}, { immediate: true });

// Helper labels
const selectedBucketName = computed(() => {
  const b = props.buckets.find(b => b.id === form.value.bucket_id);
  return b ? `${b.icon || '🪣'} ${b.name}` : 'Unassigned';
});

const selectedAccountName = computed(() => {
  if (!form.value.account_id || form.value.account_id === 'acc_unassigned_pool') {
    return 'No Account';
  }
  const acc = props.accounts.find(a => a.id === form.value.account_id);
  return acc ? acc.name : 'No Account';
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
      adjustment_target: props.transaction.adjustment_target || 'both',
      notes: props.transaction.notes || '',
      account_id: props.transaction.account_id || 'acc_unassigned_pool',
      category_id: props.transaction.category_id,
      bucket_id: props.transaction.bucket_id || ''
    };
    focusAmountInput();
  } else {
    // Reset account_id and category_id
    form.value.account_id = '';
    form.value.category_id = '';

    if (props.defaultBucketId) {
      form.value.bucket_id = props.defaultBucketId;
    }
  }
});

const handleSubmit = async () => {
  error.value = '';

  if (currentStep.value === 1 && !isEdit.value) {
    goToStep2();
    return;
  }
  
  // Validation checks
  const accountId = form.value.account_id || 'acc_unassigned_pool';
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
      account_id: accountId,
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

<style scoped>
/* Step Slide Animations (Step 1 -> Step 2 / Editing Part) */
.step-next-enter-active,
.step-next-leave-active,
.step-prev-enter-active,
.step-prev-leave-active {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}

/* Going Next: Old slide moves LEFT (-100%), new editing slide enters from RIGHT (100%) */
.step-next-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.step-next-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* Going Prev: Old slide moves RIGHT (100%), new slide enters from LEFT (-100%) */
.step-prev-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}
.step-prev-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
