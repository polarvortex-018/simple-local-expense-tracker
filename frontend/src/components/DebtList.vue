<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
      <div>
        <h2 class="text-xl font-bold text-[#dae2fd] tracking-tight">Debt Tracker</h2>
        <p class="text-xs text-[#ccc3d8]">Track money lent to people and money borrowed from others.</p>
      </div>
      <button 
        @click="openAddModal"
        class="flex items-center gap-1.5 px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-full transition shadow-sm cursor-pointer shrink-0"
      >
        <span class="text-base font-bold leading-none">+</span> Record New Debt
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <!-- Owed to You -->
      <div class="rounded-lg bg-[#131b2e] border border-[#31394d] p-4 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold uppercase tracking-wider text-[#4edea3]">Owed To You</p>
          <div class="w-7 h-7 rounded-md bg-[#00a572]/20 border border-[#00a572]/30 text-[#4edea3] flex items-center justify-center text-xs font-bold">
            ↙
          </div>
        </div>
        <p class="mt-2 text-2xl font-bold text-[#dae2fd] tabular-nums tracking-tight">
          ₹{{ formatAmount(totalOwedToYou) }}
        </p>
        <p class="mt-0.5 text-[10px] text-[#ccc3d8]">Money you lent to others (Unsettled)</p>
      </div>

      <!-- You Owe -->
      <div class="rounded-lg bg-[#131b2e] border border-[#31394d] p-4 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold uppercase tracking-wider text-[#ffb4ab]">You Owe</p>
          <div class="w-7 h-7 rounded-md bg-[#93000a]/40 border border-[#ffb4ab]/30 text-[#ffb4ab] flex items-center justify-center text-xs font-bold">
            ↗
          </div>
        </div>
        <p class="mt-2 text-2xl font-bold text-[#dae2fd] tabular-nums tracking-tight">
          ₹{{ formatAmount(totalYouOwe) }}
        </p>
        <p class="mt-0.5 text-[10px] text-[#ccc3d8]">Money borrowed from others (Unsettled)</p>
      </div>

      <!-- Net Debt Position -->
      <div class="rounded-lg bg-[#131b2e] border border-[#31394d] p-4 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold uppercase tracking-wider text-[#d2bbff]">Net Debt Position</p>
        </div>
        <p class="mt-2 text-2xl font-bold tabular-nums tracking-tight" :class="netPosition >= 0 ? 'text-[#dae2fd]' : 'text-[#ffb4ab]'">
          ₹{{ formatAmount(netPosition) }}
        </p>
        <p class="mt-0.5 text-[10px] text-[#ccc3d8]">
          {{ netPosition >= 0 ? 'Net surplus' : 'Net liability' }}
        </p>
      </div>
    </div>

    <!-- Debt Controls (Tabs & Search) -->
    <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-4">
      <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <!-- Tabs -->
        <div class="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
          <button 
            @click="activeTab = 'active'"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer"
            :class="activeTab === 'active' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
          >
            Active (Unsettled)
          </button>
          <button 
            @click="activeTab = 'settled'"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer"
            :class="activeTab === 'settled' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
          >
            Settled
          </button>
          <button 
            @click="activeTab = 'all'"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer"
            :class="activeTab === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
          >
            All
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative flex-grow sm:max-w-xs">
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Search person or description..."
            class="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:outline-none transition"
          />
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- Debt Records List -->
      <div v-if="filteredDebts.length > 0" class="divide-y divide-slate-800/80 border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/20">
        <div 
          v-for="debt in filteredDebts" 
          :key="debt.id"
          class="p-4 hover:bg-slate-950/40 transition duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div class="flex items-start gap-3.5">
            <!-- Icon -->
            <div 
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
              :class="debt.type === 'lent' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'"
            >
              {{ debt.type === 'lent' ? '↗' : '↘' }}
            </div>

            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-bold text-slate-100">{{ debt.person_name }}</span>
                <span 
                  class="px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider"
                  :class="debt.type === 'lent' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40' : 'bg-rose-950/60 text-rose-400 border-rose-800/40'"
                >
                  {{ debt.type === 'lent' ? 'Lent (Owed to you)' : 'Borrowed (You owe)' }}
                </span>
                <span 
                  class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                  :class="debt.is_settled ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-amber-950/60 text-amber-400 border-amber-800/40'"
                >
                  {{ debt.is_settled ? '✓ Settled' : '● Unsettled' }}
                </span>
              </div>

              <div class="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                <span>Account: <strong class="text-slate-300">{{ getAccountName(debt.account_id) }}</strong></span>
                <span>Date: {{ formatDate(debt.created_at) }}</span>
                <span v-if="debt.description" class="text-slate-400 italic">"{{ debt.description }}"</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
            <div class="text-left sm:text-right">
              <p class="text-base font-bold" :class="debt.type === 'lent' ? 'text-emerald-400' : 'text-rose-400'">
                ₹{{ formatAmount(debt.amount) }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button 
                v-if="!debt.is_settled"
                @click="openSettleModal(debt)"
                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition cursor-pointer shadow-md shadow-emerald-600/20"
              >
                Settle
              </button>
              <button 
                @click="confirmDelete(debt)"
                class="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                title="Delete Debt"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500 space-y-2">
        <p class="text-sm text-slate-400 font-medium">No debts found matching your filters.</p>
        <p>Click "Record New Debt" to add a new debt entry.</p>
      </div>
    </div>

    <!-- Create Debt Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 pt-3 sm:pt-10 bg-slate-950/80 backdrop-blur-sm">
      <div class="relative w-full max-w-md bg-[#0b1326] border border-[#31394d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="px-5 py-3.5 border-b border-[#31394d] flex justify-between items-center bg-[#0b1326] shrink-0">
          <div>
            <h3 class="text-base font-bold text-[#d2bbff] tracking-tight">Record New Debt</h3>
            <p class="text-[11px] text-[#ccc3d8]">Track money lent or borrowed</p>
          </div>
          <button @click="showAddModal = false" class="text-[#ccc3d8] hover:text-[#dae2fd] text-base font-bold cursor-pointer p-1">✕</button>
        </div>

        <form @submit.prevent="submitAddDebt" class="p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          <!-- Person Name -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider block">Person Name *</label>
            <input 
              v-model="newDebt.person_name"
              type="text"
              placeholder="e.g. John Doe"
              required
              class="w-full px-3 py-2 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs placeholder-slate-600 focus:outline-none transition"
            />
          </div>

          <!-- Debt Type Switcher -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider block">Debt Type *</label>
            <div class="grid grid-cols-2 gap-2 p-1 bg-[#131b2e] rounded-full border border-[#31394d]">
              <button 
                type="button"
                @click="newDebt.type = 'lent'"
                class="py-2 text-xs font-bold rounded-full transition cursor-pointer flex flex-col items-center justify-center"
                :class="newDebt.type === 'lent' ? 'bg-[#10b981] text-white shadow-sm' : 'text-[#ccc3d8] hover:text-[#dae2fd]'"
              >
                <span>Lent Money</span>
                <span class="text-[9px] font-normal opacity-80">(Deducts from account)</span>
              </button>
              <button 
                type="button"
                @click="newDebt.type = 'borrowed'"
                class="py-2 text-xs font-bold rounded-full transition cursor-pointer flex flex-col items-center justify-center"
                :class="newDebt.type === 'borrowed' ? 'bg-[#ef4444] text-white shadow-sm' : 'text-[#ccc3d8] hover:text-[#dae2fd]'"
              >
                <span>Borrowed Money</span>
                <span class="text-[9px] font-normal opacity-80">(Adds to account)</span>
              </button>
            </div>
          </div>

          <!-- Amount and Account Side-by-Side in 2 Columns -->
          <div class="grid grid-cols-2 gap-4 items-end">
            <!-- Amount Input (Left) -->
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider block">AMOUNT *</label>
              <div class="flex items-center gap-1 border-b border-[#31394d] focus-within:border-[#7c3aed] pb-1">
                <span class="text-base font-bold text-[#ccc3d8]">₹</span>
                <input 
                  v-model="newDebt.amount"
                  type="text"
                  inputmode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  autocomplete="off"
                  placeholder="0.00"
                  required
                  class="w-full text-base sm:text-lg font-bold text-[#dae2fd] tabular-nums bg-transparent focus:outline-none transition"
                />
              </div>
            </div>

            <!-- Account Selection (Right) -->
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider block">ACCOUNT *</label>
              <select 
                v-model="newDebt.account_id"
                required
                class="w-full px-3 py-2 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs font-semibold focus:outline-none transition cursor-pointer"
              >
                <option value="" disabled class="bg-[#0b1326] text-slate-500">Select Account</option>
                <option v-for="acc in accounts" :key="acc.id" :value="acc.id" class="bg-[#0b1326] text-[#dae2fd]">
                  {{ acc.name }} (₹{{ formatAmount(acc.balance) }})
                </option>
              </select>
            </div>
          </div>

          <!-- Savings Bucket Selection -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider block">SAVINGS BUCKET *</label>
            <select
              v-model="newDebt.bucket_id"
              required
              class="w-full px-3 py-2 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs font-semibold focus:outline-none transition cursor-pointer"
            >
              <option value="" disabled class="bg-[#0b1326] text-slate-500">Select Bucket</option>
              <option v-for="bucket in activeBuckets" :key="bucket.id" :value="bucket.id" class="bg-[#0b1326] text-[#dae2fd]">
                {{ bucket.icon || '🪣' }} {{ bucket.name }} (₹{{ formatAmount(bucket.allocated_balance) }})
              </option>
            </select>
          </div>

          <!-- Notes / Description -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider block">NOTES / REASON (OPTIONAL)</label>
            <input 
              v-model="newDebt.description"
              type="text"
              placeholder="e.g. Dinner split, Emergency cash"
              class="w-full px-3 py-2 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs placeholder-slate-600 focus:outline-none transition"
            />
          </div>

          <!-- Action CTA -->
          <div class="pt-2 border-t border-[#31394d]">
            <button 
              type="submit" 
              :disabled="submitting"
              class="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-sm rounded-full shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span v-if="submitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span v-else class="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px] font-bold">✓</span>
              <span>{{ submitting ? 'Saving Debt...' : 'Save Debt' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Settle Debt Modal -->
    <div v-if="showSettleModal" class="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 pt-3 sm:pt-10 bg-slate-950/80 backdrop-blur-sm">
      <div class="relative w-full max-w-md bg-[#0b1326] border border-[#31394d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="px-5 py-3.5 border-b border-[#31394d] flex justify-between items-center bg-[#0b1326] shrink-0">
          <h3 class="text-base font-bold text-[#d2bbff] tracking-tight">Settle Debt</h3>
          <button @click="showSettleModal = false" class="text-[#ccc3d8] hover:text-[#dae2fd] text-base font-bold cursor-pointer p-1">✕</button>
        </div>

        <div class="p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          <div v-if="settlingDebt" class="p-3.5 bg-[#131b2e] border border-[#31394d] rounded-xl space-y-1">
            <p class="text-xs text-[#ccc3d8]">Settling debt with <strong class="text-[#dae2fd]">{{ settlingDebt.person_name }}</strong></p>
            <p class="text-xl font-bold text-[#4edea3] tabular-nums">₹{{ formatAmount(settlingDebt.amount) }}</p>
            <p class="text-[11px] text-[#ccc3d8] leading-tight">
              {{ settlingDebt.type === 'lent' ? 'Repayment received from person → Deposits into selected account' : 'Repaid money back to person → Deducts from selected account' }}
            </p>
          </div>

          <form @submit.prevent="submitSettleDebt" class="space-y-4">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-[#ccc3d8] uppercase tracking-wider block">Target Account *</label>
              <select 
                v-model="settleAccountId"
                required
                class="w-full px-3 py-2 bg-[#131b2e] border border-[#31394d] focus:border-[#7c3aed] rounded-lg text-[#dae2fd] text-xs font-semibold focus:outline-none transition cursor-pointer"
              >
                <option value="" disabled class="bg-[#0b1326] text-slate-500">Select Account</option>
                <option v-for="acc in accounts" :key="acc.id" :value="acc.id" class="bg-[#0b1326] text-[#dae2fd]">
                  {{ acc.name }} (₹{{ formatAmount(acc.balance) }})
                </option>
              </select>
            </div>

            <div class="pt-2 border-t border-[#31394d]">
              <button 
                type="submit" 
                :disabled="submitting"
                class="w-full py-3.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm rounded-full shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span v-if="submitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span v-else class="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>{{ submitting ? 'Settling...' : 'Confirm Settlement' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  debts: {
    type: Array,
    required: true
  },
  accounts: {
    type: Array,
    required: true
  },
  buckets: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['create-debt', 'settle-debt', 'delete-debt']);

// Filter states
const activeTab = ref('active'); // 'active', 'settled', 'all'
const searchQuery = ref('');

// Modal states
const showAddModal = ref(false);
const showSettleModal = ref(false);
const submitting = ref(false);

const newDebt = ref({
  person_name: '',
  type: 'lent',
  amount: '',
  account_id: '',
  bucket_id: '',
  description: ''
});

const settlingDebt = ref(null);
const settleAccountId = ref('');

// Formatters
import { formatDateDDMMYYYY } from '../utils/dateUtils';

const formatAmount = (val) => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (isoStr) => {
  return formatDateDDMMYYYY(isoStr);
};

const getAccountName = (accId) => {
  const acc = props.accounts.find(a => a.id === accId);
  return acc ? acc.name : 'Unknown Account';
};

// Computeds for metrics
const totalOwedToYou = computed(() => {
  return props.debts
    .filter(d => d.type === 'lent' && !d.is_settled)
    .reduce((sum, d) => sum + Number(d.amount), 0);
});

const totalYouOwe = computed(() => {
  return props.debts
    .filter(d => d.type === 'borrowed' && !d.is_settled)
    .reduce((sum, d) => sum + Number(d.amount), 0);
});

const netPosition = computed(() => {
  return totalOwedToYou.value - totalYouOwe.value;
});
const activeBuckets = computed(() => props.buckets.filter(bucket => !bucket.is_archived));

// Filtered debts list
const filteredDebts = computed(() => {
  return props.debts.filter(d => {
    // Tab filter
    if (activeTab.value === 'active' && d.is_settled) return false;
    if (activeTab.value === 'settled' && !d.is_settled) return false;

    // Search filter
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const nameMatch = d.person_name.toLowerCase().includes(q);
      const descMatch = d.description ? d.description.toLowerCase().includes(q) : false;
      if (!nameMatch && !descMatch) return false;
    }

    return true;
  });
});

// Handlers
const openAddModal = () => {
  newDebt.value = {
    person_name: '',
    type: 'lent',
    amount: '',
    account_id: props.accounts.length > 0 ? props.accounts[0].id : '',
    bucket_id: activeBuckets.value.length > 0 ? activeBuckets.value[0].id : '',
    description: ''
  };
  showAddModal.value = true;
};

const submitAddDebt = async () => {
  if (!newDebt.value.person_name.trim() || !newDebt.value.amount || !newDebt.value.account_id || !newDebt.value.bucket_id) return;
  submitting.value = true;
  try {
    emit('create-debt', {
      person_name: newDebt.value.person_name.trim(),
      type: newDebt.value.type,
      amount: Number(newDebt.value.amount),
      account_id: newDebt.value.account_id,
      bucket_id: newDebt.value.bucket_id,
      description: newDebt.value.description.trim() || null
    });
    showAddModal.value = false;
  } finally {
    submitting.value = false;
  }
};

const openSettleModal = (debt) => {
  settlingDebt.value = debt;
  settleAccountId.value = debt.account_id || (props.accounts.length > 0 ? props.accounts[0].id : '');
  showSettleModal.value = true;
};

const submitSettleDebt = async () => {
  if (!settlingDebt.value || !settleAccountId.value) return;
  submitting.value = true;
  try {
    emit('settle-debt', settlingDebt.value.id, settleAccountId.value);
    showSettleModal.value = false;
  } finally {
    submitting.value = false;
  }
};

const confirmDelete = (debt) => {
  const confirm = window.confirm(`Are you sure you want to delete the debt record for "${debt.person_name}"?`);
  if (confirm) {
    emit('delete-debt', debt.id);
  }
};
</script>
