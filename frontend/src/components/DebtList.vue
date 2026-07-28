<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-100 tracking-tight">Debt Tracker</h2>
        <p class="text-sm text-slate-400">Keep track of money lent to people and money borrowed from others.</p>
      </div>
      <button 
        @click="openAddModal"
        class="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition duration-150 shadow-lg shadow-indigo-600/20 cursor-pointer shrink-0"
      >
        <span class="text-base font-bold leading-none">+</span> Record New Debt
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Owed to You -->
      <div class="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-emerald-400">Owed To You</p>
          <div class="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center text-xs font-bold">
            ↙
          </div>
        </div>
        <p class="mt-3 text-3xl font-bold text-slate-100 tracking-tight">
          ₹{{ formatAmount(totalOwedToYou) }}
        </p>
        <p class="mt-1 text-xs text-slate-400">Money you have lent to others (Unsettled)</p>
      </div>

      <!-- You Owe -->
      <div class="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-rose-400">You Owe</p>
          <div class="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-400 flex items-center justify-center text-xs font-bold">
            ↗
          </div>
        </div>
        <p class="mt-3 text-3xl font-bold text-slate-100 tracking-tight">
          ₹{{ formatAmount(totalYouOwe) }}
        </p>
        <p class="mt-1 text-xs text-slate-400">Money you borrowed from others (Unsettled)</p>
      </div>

      <!-- Net Debt Position -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-900/30 p-6 shadow-xl">
        <div class="absolute right-0 top-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-indigo-600/10 blur-xl"></div>
        <p class="text-xs font-semibold uppercase tracking-wider text-indigo-400">Net Debt Position</p>
        <p class="mt-3 text-3xl font-bold tracking-tight" :class="netPosition >= 0 ? 'text-slate-100' : 'text-rose-400'">
          ₹{{ formatAmount(netPosition) }}
        </p>
        <p class="mt-1 text-xs text-slate-400">
          {{ netPosition >= 0 ? 'Net surplus (you are owed more than you owe)' : 'Net liability (you owe more than you are owed)' }}
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
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-slate-100">Record New Debt</h3>
          <button @click="showAddModal = false" class="text-slate-400 hover:text-slate-200 text-lg">✕</button>
        </div>

        <form @submit.prevent="submitAddDebt" class="space-y-4">
          <!-- Person Name -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Person Name *</label>
            <input 
              v-model="newDebt.person_name"
              type="text"
              placeholder="e.g. John Doe"
              required
              class="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-xs focus:outline-none transition"
            />
          </div>

          <!-- Type Selection -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Debt Type *</label>
            <div class="grid grid-cols-2 gap-3">
              <button 
                type="button"
                @click="newDebt.type = 'lent'"
                class="py-2.5 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer flex flex-col items-center gap-1"
                :class="newDebt.type === 'lent' ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'"
              >
                <span>Lent Money</span>
                <span class="text-[10px] font-normal opacity-80">(Deducts from account)</span>
              </button>
              <button 
                type="button"
                @click="newDebt.type = 'borrowed'"
                class="py-2.5 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer flex flex-col items-center gap-1"
                :class="newDebt.type === 'borrowed' ? 'bg-rose-950/70 border-rose-500 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'"
              >
                <span>Borrowed Money</span>
                <span class="text-[10px] font-normal opacity-80">(Adds to account)</span>
              </button>
            </div>
          </div>

          <!-- Amount -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Amount (₹) *</label>
            <input 
              v-model.number="newDebt.amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              class="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-xs focus:outline-none transition"
            />
          </div>

          <!-- Account Selection -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Source / Destination Account *</label>
            <select 
              v-model="newDebt.account_id"
              required
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-xs focus:outline-none transition cursor-pointer"
            >
              <option value="" disabled>Select Account</option>
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                {{ acc.name }} (₹{{ formatAmount(acc.balance) }})
              </option>
            </select>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Notes / Reason (Optional)</label>
            <input 
              v-model="newDebt.description"
              type="text"
              placeholder="e.g. Dinner split, Emergency cash"
              class="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-xs focus:outline-none transition"
            />
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              @click="showAddModal = false" 
              class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              :disabled="submitting"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {{ submitting ? 'Saving...' : 'Save Debt' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Settle Debt Modal -->
    <div v-if="showSettleModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-slate-100">Settle Debt</h3>
          <button @click="showSettleModal = false" class="text-slate-400 hover:text-slate-200 text-lg">✕</button>
        </div>

        <div v-if="settlingDebt" class="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
          <p class="text-xs text-slate-400">Settling debt with <strong class="text-slate-200">{{ settlingDebt.person_name }}</strong></p>
          <p class="text-lg font-bold text-emerald-400">₹{{ formatAmount(settlingDebt.amount) }}</p>
          <p class="text-[11px] text-slate-400">
            {{ settlingDebt.type === 'lent' ? 'Repayment received from person -> Deposits into selected account' : 'Repaid money back to person -> Deducts from selected account' }}
          </p>
        </div>

        <form @submit.prevent="submitSettleDebt" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Target Account *</label>
            <select 
              v-model="settleAccountId"
              required
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-xs focus:outline-none transition cursor-pointer"
            >
              <option value="" disabled>Select Account</option>
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                {{ acc.name }} (₹{{ formatAmount(acc.balance) }})
              </option>
            </select>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              @click="showSettleModal = false" 
              class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              :disabled="submitting"
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {{ submitting ? 'Settling...' : 'Confirm Settlement' }}
            </button>
          </div>
        </form>
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
    description: ''
  };
  showAddModal.value = true;
};

const submitAddDebt = async () => {
  if (!newDebt.value.person_name.trim() || !newDebt.value.amount || !newDebt.value.account_id) return;
  submitting.value = true;
  try {
    emit('create-debt', {
      person_name: newDebt.value.person_name.trim(),
      type: newDebt.value.type,
      amount: Number(newDebt.value.amount),
      account_id: newDebt.value.account_id,
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
